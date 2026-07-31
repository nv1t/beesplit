import type { Settlement } from '../types'

const EPSILON = 0.005

/**
 * Reduces a set of net balances to a minimal-ish set of transactions
 * using a greedy largest-creditor/largest-debtor match.
 */
export function simplifyDebts(balances: Record<string, number>): Settlement[] {
  const creditors: { id: string; amount: number }[] = []
  const debtors: { id: string; amount: number }[] = []

  for (const [id, amount] of Object.entries(balances)) {
    if (amount > EPSILON) creditors.push({ id, amount })
    else if (amount < -EPSILON) debtors.push({ id, amount: -amount })
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const settlements: Settlement[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)

    if (amount > EPSILON) {
      settlements.push({ from: debtor.id, to: creditor.id, amount: Math.round(amount * 100) / 100 })
    }

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount <= EPSILON) i++
    if (creditor.amount <= EPSILON) j++
  }

  return settlements
}
