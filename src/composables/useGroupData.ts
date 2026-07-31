import { reactive, computed, watch } from 'vue'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { GroupState, Expense } from '../types'
import { simplifyDebts } from '../utils/settle'
import { buildMatchSuggestions, applyMerge, type MatchSuggestion, type MergeResult } from '../utils/merge'
import { i18n } from '../i18n'

const t = i18n.global.t

function defaultState(): GroupState {
  return { members: [], expenses: [], currencySymbol: '€' }
}

function decodeHash(hash: string): GroupState | null {
  try {
    const json = decompressFromEncodedURIComponent(hash)
    if (!json) return null
    return { ...defaultState(), ...JSON.parse(json) }
  } catch (e) {
    console.warn('Failed to decode BeeSplit link.', e)
    return null
  }
}

function readFromHash(): GroupState | null {
  const hash = window.location.hash.slice(1)
  if (!hash) return null
  return decodeHash(hash)
}

function loadState(): GroupState {
  return readFromHash() ?? defaultState()
}

const state = reactive<GroupState>(loadState())

// immediate: true normalizes the URL hash to reflect the loaded state right
// away. The URL is the only place this data lives — nothing touches disk.
watch(
  state,
  (value) => {
    const encoded = compressToEncodedURIComponent(JSON.stringify(value))
    history.replaceState(null, '', `#${encoded}`)
  },
  { deep: true, immediate: true },
)

function makeId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

function addMember(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return
  state.members.push({ id: makeId(), name: trimmed })
}

function renameMember(id: string, name: string) {
  const trimmed = name.trim()
  if (!trimmed) return
  const member = state.members.find((m) => m.id === id)
  if (member) member.name = trimmed
}

function removeMember(id: string) {
  const usedInExpense = state.expenses.some(
    (e) => e.paidBy === id || e.participants.includes(id),
  )
  if (usedInExpense) {
    throw new Error(t('people.removeError'))
  }
  state.members = state.members.filter((m) => m.id !== id)
}

function addExpense(input: Omit<Expense, 'id'>) {
  state.expenses.push({ ...input, id: makeId() })
}

function updateExpense(id: string, input: Omit<Expense, 'id'>) {
  const idx = state.expenses.findIndex((e) => e.id === id)
  if (idx !== -1) state.expenses[idx] = { ...input, id }
}

function removeExpense(id: string) {
  state.expenses = state.expenses.filter((e) => e.id !== id)
}

function setCurrencySymbol(symbol: string) {
  state.currencySymbol = symbol.trim() || '€'
}

function extractHash(pasted: string): string {
  const trimmed = pasted.trim()
  const hashIndex = trimmed.indexOf('#')
  return hashIndex !== -1 ? trimmed.slice(hashIndex + 1) : trimmed
}

export interface MergePreview {
  incoming: GroupState
  matches: MatchSuggestion[]
}

/**
 * Decodes a pasted BeeSplit link (or bare hash) and suggests, for each
 * person in it, whether they're likely an existing person here — for the
 * caller to show as an editable review before anything is actually merged.
 */
function previewMerge(pasted: string): MergePreview {
  const incoming = decodeHash(extractHash(pasted))
  if (!incoming) {
    throw new Error(t('merge.invalidLink'))
  }
  return { incoming, matches: buildMatchSuggestions(state, incoming) }
}

/**
 * Merges a previewed link into the current group using a caller-confirmed
 * mapping of incoming member id -> existing local member id (or NEW_PERSON),
 * combining people and expenses instead of overwriting what's already here.
 */
function confirmMerge(incoming: GroupState, mapping: Record<string, string>): MergeResult {
  const result = applyMerge(state, incoming, mapping)
  state.members = result.state.members
  state.expenses = result.state.expenses
  return result
}

const balances = computed<Record<string, number>>(() => {
  const result: Record<string, number> = {}
  for (const member of state.members) result[member.id] = 0

  for (const expense of state.expenses) {
    const share = expense.amount / expense.participants.length
    if (result[expense.paidBy] !== undefined) {
      result[expense.paidBy] += expense.amount
    }
    for (const participantId of expense.participants) {
      if (result[participantId] !== undefined) {
        result[participantId] -= share
      }
    }
  }

  for (const id of Object.keys(result)) {
    result[id] = Math.round(result[id] * 100) / 100
  }

  return result
})

const settlements = computed(() => simplifyDebts(balances.value))

const totalSpent = computed(() =>
  Math.round(state.expenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100,
)

export function useGroupData() {
  return {
    members: computed(() => state.members),
    expenses: computed(() => state.expenses),
    balances,
    settlements,
    totalSpent,
    currencySymbol: computed(() => state.currencySymbol),
    addMember,
    renameMember,
    removeMember,
    addExpense,
    updateExpense,
    removeExpense,
    setCurrencySymbol,
    previewMerge,
    confirmMerge,
  }
}
