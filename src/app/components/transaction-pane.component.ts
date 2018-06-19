import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core'
import { Store } from '@ngrx/store'
import { Observable, combineLatest } from 'rxjs'
import { filter, map } from 'rxjs/operators'

import { AppState } from '../store'
import { SelectTransactionAction } from '../store/actions/selectedTransaction.actions'

import { Transaction } from '../../lib/monzo/Transaction'

@Component({
  selector: 'm-transaction-pane',
  templateUrl: './transaction-pane.component.html',
  styleUrls: ['./transaction-pane.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.pane]': 'true'
  }
})
export class TransactionPaneComponent implements OnInit {
  txs$!: Observable<Transaction[]>
  selectedTxId$!: Observable<string | undefined>
  selectedTx$!: Observable<Transaction | undefined>

  constructor(private readonly store$: Store<AppState>) {}

  ngOnInit() {
    this.selectedTxId$ = this.store$.select('selectedTransaction')

    this.txs$ = this.store$
      .select('transactions')
      .pipe(map(txs => txs.map(tx => new Transaction(tx))))

    this.selectedTx$ = combineLatest(this.selectedTxId$, this.txs$).pipe(
      filter(([txId, txs]) => !!txId && !!txs.length),
      map(([txId, txs]) => txs.find(tx => tx.id === txId))
    )
  }

  selectTx(txId: string): void {
    this.store$.dispatch(new SelectTransactionAction(txId))
  }
}
