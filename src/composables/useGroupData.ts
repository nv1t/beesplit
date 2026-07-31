import { reactive, computed, watch } from 'vue'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { GroupState, Expense } from '../types'
import { simplifyDebts } from '../utils/settle'
import { mergeStates, type MergeResult } from '../utils/merge'

const STORAGE_KEY = 'beesplit.data.v1'

function defaultState(): GroupState {
  return { members: [], expenses: [], currencySymbol: '$' }
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

function readFromStorage(): GroupState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultState(), ...JSON.parse(raw) }
  } catch (e) {
    console.warn('Failed to load saved data, starting fresh.', e)
  }
  return null
}

function loadState(): GroupState {
  return readFromHash() ?? readFromStorage() ?? defaultState()
}

const state = reactive<GroupState>(loadState())

// immediate: true also persists a shared link's data to localStorage right
// away, so it survives a plain reload (i.e. once the hash is gone) on this
// same browser, and normalizes the URL hash to reflect the loaded state.
watch(
  state,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
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
    throw new Error('Cannot remove a member who is involved in existing expenses.')
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
  state.currencySymbol = symbol.trim() || '$'
}

function extractHash(pasted: string): string {
  const trimmed = pasted.trim()
  const hashIndex = trimmed.indexOf('#')
  return hashIndex !== -1 ? trimmed.slice(hashIndex + 1) : trimmed
}

/**
 * Merges a pasted BeeSplit link (or bare hash) into the current group,
 * combining people and expenses instead of overwriting what's already here.
 */
function mergeFromLink(pasted: string): MergeResult {
  const incoming = decodeHash(extractHash(pasted))
  if (!incoming) {
    throw new Error("That doesn't look like a valid BeeSplit link.")
  }

  const result = mergeStates(state, incoming)
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
    mergeFromLink,
  }
}
