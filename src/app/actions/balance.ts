import Debug = require('debug')

import { Injectable } from '@angular/core'
import { NgRedux } from '@angular-redux/store'
import { createAction } from 'redux-actions'

import { MonzoService } from '../services/monzo.service'
import { CacheService } from '../services/cache.service'
import { SpentActions } from './spent'
import { AccountActions } from './account'

import { AppState } from '../store'

import Account, {
  accountsRequest,
  MonzoAccountsResponse
} from '../../lib/monzo/Account'
import Amount, {
  AmountOpts,
  SimpleAmount,
  MonzoBalanceResponse
} from '../../lib/monzo/Amount'

const debug = Debug('app:actions:balance')

@Injectable()
export class BalanceActions {
  static readonly SET_BALANCE = 'SET_BALANCE'
  static readonly GET_BALANCE = 'GET_BALANCE'
  static readonly LOAD_BALANCE = 'LOAD_BALANCE'
  static readonly SAVE_BALANCE = 'SAVE_BALANCE'

  constructor(
    private readonly redux: NgRedux<AppState>,
    private readonly monzo: MonzoService,
    private readonly cache: CacheService,
    private readonly spentActions: SpentActions,
    private readonly accountActions: AccountActions
  ) {}

  setBalance(balance: AmountOpts) {
    return createAction<
      SetBalancePayload,
      AmountOpts
    >(BalanceActions.SET_BALANCE, balance => ({
      amount: balance
    }))(balance)
  }

  getBalance() {
    return createAction<GetBalancePromise>(BalanceActions.GET_BALANCE, () => ({
      promise: (async () => {
        try {
          const acc = new Account(
            (await this.monzo.request<MonzoAccountsResponse>(accountsRequest()))
              .accounts[0]
          )
          const bal = await this.monzo.request<MonzoBalanceResponse>(
            acc.balanceRequest()
          )

          const { balance, spent } = (() => {
            const nativeBalance: SimpleAmount = {
              amount: bal.balance,
              currency: bal.currency
            }

            const nativeSpend: SimpleAmount = {
              amount: bal.spend_today,
              currency: bal.currency
            }

            if (bal.local_currency) {
              const localBalance: SimpleAmount = {
                amount: bal.balance * bal.local_exchange_rate,
                currency: bal.local_currency
              }

              const localSpend: SimpleAmount = {
                amount:
                  bal.local_spend.length > 0
                    ? bal.local_spend[0].spend_today * bal.local_exchange_rate
                    : 0,
                currency: bal.local_currency
              }

              return {
                balance: new Amount({
                  native: nativeBalance,
                  local: localBalance
                }),
                spent: new Amount({ native: nativeSpend, local: localSpend })
              }
            } else {
              return {
                balance: new Amount({ native: nativeBalance }),
                spent: new Amount({ native: nativeSpend })
              }
            }
          })()

          debug('HTTP balance =>', balance)

          this.redux.dispatch(this.accountActions.setAccount('monzo', acc.json))
          this.redux.dispatch(this.setBalance(balance.json))
          this.redux.dispatch(this.spentActions.setSpent(spent.json))
          // this.redux.dispatch({
          //   type: 'SAVE_ACCOUNT_BALANCE',
          //   payload: updateAccountCache(acc, balance)
          // })
        } catch (err) {
          console.error(err)
        }
      })()
    }))()
  }

  loadBalance() {
    return createAction<
      LoadBalancePromise
    >(BalanceActions.LOAD_BALANCE, () => ({
      promise: (async () => {
        try {
          const { account, balance } = await this.cache.loadBalance()

          debug('cached balance =>', balance)

          this.redux.dispatch(this.accountActions.setAccount('monzo', account))
          this.redux.dispatch(this.setBalance(balance))
        } catch (err) {
          console.error(err)
        }
      })()
    }))()
  }
}

export interface GetBalancePromise {
  promise: Promise<void>
}

export interface LoadBalancePromise {
  promise: Promise<void>
}

export interface SetBalancePayload {
  amount: AmountOpts
}
