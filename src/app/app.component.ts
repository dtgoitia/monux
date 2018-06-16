import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core'
import { Store } from '@ngrx/store'
import { Observable } from 'rxjs'
import { combineLatest, filter, map } from 'rxjs/operators'

import { AppState } from './store'
import { SelectTransactionAction } from './store/actions/selectedTransaction.actions'

import { Account, MonzoAccountResponse } from '../lib/monzo/Account'
import { Amount, MonzoBalanceResponse } from '../lib/monzo/Amount'
import { Transaction } from '../lib/monzo/Transaction'

@Component({
  selector: 'monux-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  readonly name = 'Monux'

  readonly selectedTxId$: Observable<string | undefined>
  readonly accountHolder$: Observable<string>
  readonly balance$: Observable<Amount>
  readonly spent$: Observable<Amount>
  readonly txs$: Observable<Transaction[]>
  readonly selectedTx$: Observable<Transaction | undefined>

  constructor(private readonly store$: Store<AppState>) {
    this.selectedTxId$ = this.store$.select('selectedTransaction')

    this.balance$ = this.store$.select('balance').pipe(
      filter(balance => !!balance),
      map(
        ({ balance, currency }: MonzoBalanceResponse) =>
          new Amount({
            native: {
              amount: balance,
              currency: currency
            }
          })
      )
    )

    this.accountHolder$ = this.store$.select('account').pipe(
      filter(acc => !!acc),
      map((acc: MonzoAccountResponse) => new Account(acc).name)
    )

    this.spent$ = this.store$.select('balance').pipe(
      filter(balance => !!balance),
      map(
        ({ spend_today, currency }: MonzoBalanceResponse) =>
          new Amount({
            native: {
              amount: spend_today,
              currency: currency
            }
          })
      )
    )

    this.txs$ = this.store$
      .select('transactions')
      .pipe(map(txs => txs.map(tx => new Transaction(tx))))

    this.selectedTx$ = this.selectedTxId$.pipe(
      combineLatest(this.txs$),
      filter(([txId, txs]) => !!txId && !!txs.length),
      map(([txId, txs]) => txs.find(tx => tx.id === txId))
    )
  }

  ngOnInit(): void {
    console.log('monux started')

    // this.redux.dispatch(this.txActions.getNewTransactions())
    // this.redux.dispatch(this.txActions.getPendingTransactions())
  }

  ngOnDestroy(): void {
    console.log('monux stopped')
  }

  selectTx(txId: string): void {
    this.store$.dispatch(new SelectTransactionAction(txId))
  }
}
