export interface Member {
  id: string
  name: string
}

export type SplitMode = 'equal' | 'amount' | 'shares'

export interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  participants: string[]
  date: string
  /** Missing/undefined means 'equal' — keeps old shared links (encoded before
   *  this field existed) working without a migration step. */
  splitMode?: SplitMode
  /** Only used when splitMode === 'amount': exact amount owed per participant id. */
  splitAmounts?: Record<string, number>
  /** Only used when splitMode === 'shares': relative weight per participant id. */
  splitShares?: Record<string, number>
}

export interface Settlement {
  from: string
  to: string
  amount: number
}

export interface GroupState {
  members: Member[]
  expenses: Expense[]
  currencySymbol: string
}
