import type { GroupState } from '../types'

export interface MergeResult {
  state: GroupState
  addedMembers: number
  addedExpenses: number
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Unions `incoming` into `local`. Members are reconciled by id first, then by
 * normalized name (so two people independently typing "Alice" on different
 * devices collapse into one person instead of duplicating). Expenses are
 * unioned by id, with paidBy/participants remapped onto the reconciled
 * member ids. `local`'s currency setting always wins.
 */
export function mergeStates(local: GroupState, incoming: GroupState): MergeResult {
  const members = local.members.map((m) => ({ ...m }))
  const idMap = new Map<string, string>()
  let addedMembers = 0

  for (const member of incoming.members) {
    const byId = members.find((m) => m.id === member.id)
    if (byId) {
      idMap.set(member.id, byId.id)
      continue
    }
    const byName = members.find((m) => normalizeName(m.name) === normalizeName(member.name))
    if (byName) {
      idMap.set(member.id, byName.id)
      continue
    }
    members.push({ ...member })
    idMap.set(member.id, member.id)
    addedMembers++
  }

  const remapId = (id: string) => idMap.get(id) ?? id

  const expenses = local.expenses.map((e) => ({ ...e }))
  const expenseIds = new Set(expenses.map((e) => e.id))
  let addedExpenses = 0

  for (const expense of incoming.expenses) {
    if (expenseIds.has(expense.id)) continue
    expenses.push({
      ...expense,
      paidBy: remapId(expense.paidBy),
      participants: expense.participants.map(remapId),
    })
    expenseIds.add(expense.id)
    addedExpenses++
  }

  return {
    state: { members, expenses, currencySymbol: local.currencySymbol },
    addedMembers,
    addedExpenses,
  }
}
