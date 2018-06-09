import {
  Actions,
  SET_BALANCE,
  SetBalanceAction
} from '../actions/balance.actions'
import { BalanceState } from '../states'

export const reducer = (state: BalanceState, action: Actions): BalanceState => {
  switch (action.type) {
    case SET_BALANCE:
      // TODO: why is this needed
      return (action as SetBalanceAction).payload
  }

  return state
}
