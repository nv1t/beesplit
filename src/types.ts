export interface Member {
  id: string
  name: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  participants: string[]
  date: string
}

export interface Settlement {
  from: string
  to: string
  amount: number
}
