import 'rxjs-compat/operator/toPromise'

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import Debug = require('debug')
import {
  MonzoAccessResponse,
  MonzoRequest,
  MonzoWhoAmIResponse
} from 'monzolib'
import { stringify } from 'querystring'
import { forkJoin, from, Observable, of, throwError } from 'rxjs'
import { catchError, map, switchMap, tap } from 'rxjs/operators'

import {
  deletePassword,
  getPassword,
  hasPassword,
  setPassword
} from '../../lib/keychain'

// TODO: remove need for compat
const debug = Debug('app:service:monzo')

const ACCOUNT = 'Monux'
const SERVICE = 'monux'
const MONZO_SERVICE = `${SERVICE}.monzo`

export type MonzoSaveableCodes =
  | 'client_id'
  | 'client_secret'
  | 'access_token'
  | 'refresh_token'

@Injectable()
export class MonzoService {
  private readonly proto: string = 'https://'
  private readonly apiRoot: string = 'api.monzo.com'

  // TODO: remove need for compat
  private getAccessToken(): Observable<string> {
    return this.getCode('access_token')
  }

  constructor(private readonly http: HttpClient) {}

  request<T>(
    { path = '/ping/whoami', qs = {}, method = 'GET' }: MonzoRequest = {
      path: '/ping/whoami'
    }
  ): Observable<T> {
    const url = `${this.proto}${this.apiRoot}${path}`

    return this.getAccessToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
        })

        const params = new HttpParams({
          fromString: stringify(qs)
        })

        if (method === 'GET') {
          return this.http.get<T>(url, {
            headers,
            params
          })
        } else if (method === 'POST') {
          return this.http.post<T>(url, params, {
            headers
          })
        } else if (method === 'PUT') {
          return this.http.put<T>(url, params, {
            headers
          })
        } else if (method === 'PATCH') {
          return this.http.patch<T>(url, params, {
            headers
          })
        } else {
          throw new Error(`Unhandled HTTP call with ${method} method.`)
        }
      })
    )
  }

  hasCode(code: MonzoSaveableCodes): Observable<boolean> {
    debug('getting code =>', `${MONZO_SERVICE}.${code}`)

    return from(
      hasPassword({
        account: ACCOUNT,
        service: `${MONZO_SERVICE}.${code}`
      })
    )
  }

  getCode(code: MonzoSaveableCodes): Observable<string> {
    debug('getting code =>', `${MONZO_SERVICE}.${code}`)

    return from(
      getPassword({
        account: ACCOUNT,
        service: `${MONZO_SERVICE}.${code}`
      })
    )
  }

  saveCode(code: MonzoSaveableCodes, value: string): Observable<void> {
    debug('saving code =>', `${MONZO_SERVICE}.${code}`)

    return from(
      setPassword({
        account: ACCOUNT,
        service: `${MONZO_SERVICE}.${code}`,
        password: value
      })
    )
  }

  deleteCode(code: MonzoSaveableCodes): Observable<boolean> {
    debug('deleting code =>', `${MONZO_SERVICE}.${code}`)

    return from(
      deletePassword({
        account: ACCOUNT,
        service: `${MONZO_SERVICE}.${code}`
      })
    )
  }

  verifyAccess(accessToken: string): Observable<boolean> {
    debug('verifying access token (whoami)')

    const path = `${this.proto}${this.apiRoot}/ping/whoami`
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    })

    return this.http
      .get<MonzoWhoAmIResponse>(path, {
        headers
      })
      .pipe(
        tap(res => debug('whoami response =>', res)),
        map(res => res.authenticated),
        catchError(err => {
          if (err.status && err.status === 401) {
            debug('access token expired')
            return of(false)
          }

          return throwError(err)
        })
      )
  }

  // returns new access token
  refreshAccess(refresh_token: string): Observable<string> {
    debug('refreshing access token')

    return forkJoin(
      this.getCode('client_id'),
      this.getCode('client_secret')
    ).pipe(
      switchMap(([client_id, client_secret]) => {
        const url = `${this.proto}${this.apiRoot}/oauth2/token`
        const params = new HttpParams({
          fromObject: {
            grant_type: 'refresh_token',
            client_id,
            client_secret,
            refresh_token
          }
        })

        return this.http.post<MonzoAccessResponse>(url, params)
      }),
      switchMap(({ access_token, refresh_token }) => {
        return forkJoin(
          this.saveCode('access_token', access_token),
          refresh_token
            ? this.saveCode('refresh_token', refresh_token)
            : of(undefined)
        )
      }),
      switchMap(() => {
        return this.getAccessToken()
      })
    )
  }
}
