import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Action } from '@ngrx/store'
import { Actions, Effect, ofType } from '@ngrx/effects'
import { defer, from, Observable, of } from 'rxjs'
import {
  catchError,
  map,
  switchMap,
  switchMapTo,
  mapTo,
  tap
} from 'rxjs/operators'
import Debug = require('debug')

import { MonzoService } from '../../services/monzo.service'
import {
  accountsRequest,
  MonzoAccountsResponse
} from '../../../lib/monzo/Account'

import {
  GET_ACCOUNT,
  SetAccountAction,
  GetAccountAction,
  GetAccountFailedAction,
  LOGOUT,
  LOGOUT_FAILED
} from '../actions/account.actions'

import { CacheService } from '../../services/cache.service'
import { deletePassword } from '../../../lib/keychain'

const debug = Debug('app:effects:account')

@Injectable()
export class AccountEffects {
  constructor(
    private actions$: Actions,
    private monzo: MonzoService,
    private cache: CacheService,
    private router: Router
  ) {}

  @Effect()
  get$: Observable<Action> = this.actions$.pipe(
    ofType(GET_ACCOUNT),
    switchMapTo(this.monzo.request<MonzoAccountsResponse>(accountsRequest())),
    map(accounts => {
      const acc = accounts.accounts[0]

      return new SetAccountAction(acc)
    }),
    catchError(err => {
      console.error(err)
      return of(new GetAccountFailedAction())
    })
  )

  @Effect({ dispatch: false })
  logout$: Observable<any> = this.actions$.pipe(
    ofType(LOGOUT),
    switchMapTo(defer(() => this.cache.deleteAll())),
    switchMap(() => {
      const tokenDeletions = Promise.all([
        deletePassword({
          account: 'Monux',
          service: 'monux.monzo.access_token'
        }),
        deletePassword({
          account: 'Monux',
          service: 'monux.monzo.refresh_token'
        })
      ])

      return from(tokenDeletions).pipe(mapTo({ type: 'LOGOUT_SUCCESS' }))
    }),
    catchError(err => {
      console.error(err)
      return of({ type: LOGOUT_FAILED })
    }),
    tap(_ => {
      this.router.navigate(['/auth-request'])
    })
  )

  @Effect()
  init$: Observable<Action> = this.actions$.pipe(
    ofType('@monux/init'),
    switchMapTo(defer(() => of(new GetAccountAction())))
  )
}
