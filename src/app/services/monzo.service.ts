import { stringify } from 'querystring'
import Debug = require('debug')

import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observable, from } from 'rxjs'
import {} from 'rxjs/operators'
import { switchMap, map, pluck, tap } from 'rxjs/operators'
// TODO: remove need for compat
import 'rxjs-compat/operator/toPromise'

import {
  MonzoApi,
  MonzoRequest,
  MonzoWhoAmIResponse
} from '../../lib/monzo/api'
import { getPassword, setPassword, deletePassword } from '../../lib/keychain'

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
  private accessToken: Promise<string> = this.getSavedCode(
    'access_token'
  ).toPromise()

  constructor(private readonly http: HttpClient) {}

  request<T>(
    { path = '/ping/whoami', qs = {}, method = 'GET' }: MonzoRequest = {
      path: '/ping/whoami'
    }
  ): Observable<T> {
    const url = `${this.proto}${this.apiRoot}${path}`

    return from(this.accessToken).pipe(
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

  getSavedCode(code: MonzoSaveableCodes): Observable<string> {
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

  deleteSavedCode(code: MonzoSaveableCodes): Observable<boolean> {
    debug('deleting code =>', `${MONZO_SERVICE}.${code}`)

    return from(
      deletePassword({
        account: ACCOUNT,
        service: `${MONZO_SERVICE}.${code}`
      })
    )
  }

  getSavedMonzo(): Observable<MonzoApi> {
    return this.getSavedCode('access_token').pipe(
      map(token => new MonzoApi(token))
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
        pluck('authenticated')
      )
  }
}
