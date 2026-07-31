import type { GroupState } from '../types'

export interface MergeResult {
  state: GroupState
  addedMembers: number
  addedExpenses: number
}

export interface MatchSuggestion {
  incomingId: string
  incomingName: string
  /** An existing local member id this incoming person is likely the same as, or null for "new person". */
  suggestedId: string | null
}

/** Sentinel used in a mapping to mean "add as a new person" rather than match an existing one. */
export const NEW_PERSON = 'new'

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * For each person in `incoming`, suggests whether they're already someone in
 * `local` (matched by id, then by normalized name) so the UI can pre-fill a
 * "who is this?" review step instead of guessing silently.
 */
export function buildMatchSuggestions(local: GroupState, incoming: GroupState): MatchSuggestion[] {
  return incoming.members.map((member) => {
    const byId = local.members.find((m) => m.id === member.id)
    if (byId) return { incomingId: member.id, incomingName: member.name, suggestedId: byId.id }

    const byName = local.members.find((m) => normalizeName(m.name) === normalizeName(member.name))
    return { incomingId: member.id, incomingName: member.name, suggestedId: byName?.id ?? null }
  })
}

/**
 * Unions `incoming` into `local` using an explicit, user-confirmed mapping
 * from incoming member id to either an existing local member id or
 * NEW_PERSON. Expenses are unioned by id, with paidBy/participants remapped
 * onto the reconciled member ids. `local`'s currency setting always wins.
 */
export function applyMerge(
  local: GroupState,
  incoming: GroupState,
  mapping: Record<string, string>,
): MergeResult {
  const members = local.members.map((m) => ({ ...m }))
  const idMap = new Map<string, string>()
  let addedMembers = 0

  for (const member of incoming.members) {
    const choice = mapping[member.id]
    const target = choice && choice !== NEW_PERSON ? members.find((m) => m.id === choice) : undefined
    if (target) {
      idMap.set(member.id, target.id)
    } else {
      members.push({ ...member })
      idMap.set(member.id, member.id)
      addedMembers++
    }
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
