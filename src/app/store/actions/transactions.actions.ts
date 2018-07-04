import { Action } from '@ngrx/store'

import { suffixes } from './'

import {
  Transaction,
  MonzoTransactionResponse,
  TransactionRequestOpts
} from '../../../lib/monzo/Transaction'

/*
* action type strings
*/

const actionSinglePrefix = '[Transaction]'
const actionMultiplePrefix = '[Transactions]'

export const GET_TRANSACTIONS = `${actionMultiplePrefix} Get`
export const GET_TRANSACTIONS_SUCCESS = `${GET_TRANSACTIONS} ${
  suffixes.success
}`
export const GET_TRANSACTIONS_FAILED = `${GET_TRANSACTIONS} ${suffixes.failed}`
export const SET_TRANSACTIONS = `${actionMultiplePrefix} Set`

export const SET_TRANSACTION = `${actionSinglePrefix} Set`

export const PATCH_TRANSACTION_NOTES = `${actionSinglePrefix} HTTP/Patch Note`
export const PATCH_TRANSACTION_NOTES_FAILED = `${PATCH_TRANSACTION_NOTES} ${
  suffixes.failed
}`

export const UPLOAD_ATTACHMENT = `${actionSinglePrefix} HTTP/Put Upload Attachment`
export const UPLOAD_ATTACHMENT_FAILED = `${PATCH_TRANSACTION_NOTES} ${
  suffixes.failed
}`

/*
 * action creators
 */

export class GetTransactionsAction implements Action {
  readonly type = GET_TRANSACTIONS
  constructor(public payload: TransactionRequestOpts) {}
}

export class SetTransactionsAction implements Action {
  readonly type = SET_TRANSACTIONS
  constructor(public payload: MonzoTransactionResponse[]) {}
}
export class GetTransactionsFailedAction implements Action {
  readonly type = GET_TRANSACTIONS_FAILED
}

export class SetTransactionAction implements Action {
  readonly type = SET_TRANSACTION
  constructor(public tx: MonzoTransactionResponse) {}
}

export class PatchTransactionNotesAction implements Action {
  readonly type = PATCH_TRANSACTION_NOTES
  constructor(public tx: Transaction, public notes: string) {}
}
export class PatchTransactionNotesFailedAction implements Action {
  readonly type = PATCH_TRANSACTION_NOTES_FAILED
}

export class UploadAttachmentAction implements Action {
  readonly type = UPLOAD_ATTACHMENT
  constructor(public tx: Transaction, public file: File) {}
}
export class UploadAttachmentFailedAction implements Action {
  readonly type = UPLOAD_ATTACHMENT_FAILED
}

/*
 * aggregate type
 */

export type Actions =
  | GetTransactionsAction
  | SetTransactionsAction
  | GetTransactionsFailedAction
