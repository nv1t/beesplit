import type { Expense } from '../types'

type SplitInput = Pick<Expense, 'amount' | 'participants' | 'splitMode' | 'splitAmounts' | 'splitShares'>

/**
 * How much a given participant owes for this expense, in the expense's
 * currency. Equal split (or any expense from before per-participant splits
 * existed, since splitMode is then undefined) divides evenly; 'amount' uses
 * the explicit per-person amount; 'shares' divides proportionally by weight.
 */
export function participantShare(expense: SplitInput, participantId: string): number {
  if (expense.splitMode === 'amount') {
    return expense.splitAmounts?.[participantId] ?? 0
  }

  if (expense.splitMode === 'shares') {
    const shares = expense.splitShares ?? {}
    const totalShares = expense.participants.reduce((sum, id) => sum + (shares[id] ?? 0), 0)
    if (totalShares <= 0) return 0
    return (expense.amount * (shares[participantId] ?? 0)) / totalShares
  }

  return expense.participants.length > 0 ? expense.amount / expense.participants.length : 0
}

/** Sum of splitAmounts across the given participant ids (for 'amount' mode validation). */
export function sumSplitAmounts(splitAmounts: Record<string, number>, participants: string[]): number {
  return Math.round(participants.reduce((sum, id) => sum + (splitAmounts[id] ?? 0), 0) * 100) / 100
}

/** Sum of splitShares across the given participant ids (for 'shares' mode validation/display). */
export function sumSplitShares(splitShares: Record<string, number>, participants: string[]): number {
  return participants.reduce((sum, id) => sum + (splitShares[id] ?? 0), 0)
}
