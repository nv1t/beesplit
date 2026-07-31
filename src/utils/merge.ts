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

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0))
  for (let i = 0; i < rows; i++) dp[i][0] = i
  for (let j = 0; j < cols; j++) dp[0][j] = j
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

/** 1 = identical, 0 = completely different. Tolerant of typos/nicknames like "Ali" vs "Alice". */
function nameSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

const FUZZY_MATCH_THRESHOLD = 0.5

/**
 * For each person in `incoming`, suggests the most likely existing person in
 * `local` — exact id, then exact name, then the closest name by edit
 * distance (so nicknames/typos like "Ali" vs "Alice" still get suggested) —
 * so the UI can pre-fill an editable "who is this?" review instead of
 * guessing silently or forcing a manual pick every time.
 */
export function buildMatchSuggestions(local: GroupState, incoming: GroupState): MatchSuggestion[] {
  return incoming.members.map((member) => {
    const byId = local.members.find((m) => m.id === member.id)
    if (byId) return { incomingId: member.id, incomingName: member.name, suggestedId: byId.id }

    let best: { id: string; score: number } | null = null
    for (const candidate of local.members) {
      const score = nameSimilarity(normalizeName(candidate.name), normalizeName(member.name))
      if (!best || score > best.score) best = { id: candidate.id, score }
    }

    return {
      incomingId: member.id,
      incomingName: member.name,
      suggestedId: best && best.score >= FUZZY_MATCH_THRESHOLD ? best.id : null,
    }
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
