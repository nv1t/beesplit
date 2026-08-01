<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGroupData } from '../composables/useGroupData'
import { sumSplitAmounts, sumSplitShares } from '../utils/split'
import { formatAmount } from '../utils/format'
import Avatar from './Avatar.vue'
import type { Expense, SplitMode } from '../types'

const props = defineProps<{
  editingExpense?: Expense | null
}>()

const emit = defineEmits<{
  done: []
}>()

const { t } = useI18n()
const { members, currencySymbol, addExpense, updateExpense } = useGroupData()

const description = ref('')
const amount = ref<string>('')
const paidBy = ref('')
const participants = ref<string[]>([])
const date = ref(new Date().toISOString().slice(0, 10))
const error = ref('')

const splitMode = ref<SplitMode>('equal')
// String-keyed by member id, string-valued (like `amount`) so the inputs
// allow free typing; parsed to numbers only at validation/submit time.
const splitAmounts = reactive<Record<string, string>>({})
const splitShares = reactive<Record<string, string>>({})

// Fill in sane defaults for any participant that doesn't have one yet —
// never overwrites a value already entered (or loaded from an edit).
watch(
  participants,
  (ids) => {
    for (const id of ids) {
      if (!(id in splitAmounts)) splitAmounts[id] = ''
      if (!(id in splitShares)) splitShares[id] = '1'
    }
  },
  { immediate: true },
)

watch(
  () => props.editingExpense,
  (expense) => {
    if (expense) {
      description.value = expense.description
      amount.value = String(expense.amount)
      paidBy.value = expense.paidBy
      participants.value = [...expense.participants]
      date.value = expense.date
      splitMode.value = expense.splitMode ?? 'equal'

      for (const key of Object.keys(splitAmounts)) delete splitAmounts[key]
      for (const key of Object.keys(splitShares)) delete splitShares[key]
      for (const [id, value] of Object.entries(expense.splitAmounts ?? {})) splitAmounts[id] = String(value)
      for (const [id, value] of Object.entries(expense.splitShares ?? {})) splitShares[id] = String(value)
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

const allSelected = computed(
  () => members.value.length > 0 && participants.value.length === members.value.length,
)

function toggleAll() {
  participants.value = allSelected.value ? [] : members.value.map((m) => m.id)
}

const allocatedAmount = computed(() => {
  const amounts: Record<string, number> = {}
  for (const id of participants.value) amounts[id] = parseFloat(splitAmounts[id]) || 0
  return sumSplitAmounts(amounts, participants.value)
})

function shareResultDisplay(id: string): string {
  const totalShares = sumSplitShares(
    Object.fromEntries(participants.value.map((pid) => [pid, parseFloat(splitShares[pid]) || 0])),
    participants.value,
  )
  if (totalShares <= 0) return '—'
  const myShares = parseFloat(splitShares[id]) || 0
  const parsedAmount = parseFloat(amount.value) || 0
  return currencySymbol.value + formatAmount(Math.round(((parsedAmount * myShares) / totalShares) * 100) / 100)
}

function resetForm() {
  description.value = ''
  amount.value = ''
  paidBy.value = members.value[0]?.id ?? ''
  participants.value = members.value.map((m) => m.id)
  date.value = new Date().toISOString().slice(0, 10)
  splitMode.value = 'equal'
  for (const key of Object.keys(splitAmounts)) delete splitAmounts[key]
  for (const key of Object.keys(splitShares)) delete splitShares[key]
  error.value = ''
}

function handleSubmit() {
  error.value = ''
  const parsedAmount = parseFloat(amount.value)
  const roundedAmount = Math.round(parsedAmount * 100) / 100

  if (!description.value.trim()) {
    error.value = t('expenseForm.errorDescription')
    return
  }
  if (!parsedAmount || parsedAmount <= 0) {
    error.value = t('expenseForm.errorAmount')
    return
  }
  if (!paidBy.value) {
    error.value = t('expenseForm.errorPaidBy')
    return
  }
  if (participants.value.length === 0) {
    error.value = t('expenseForm.errorParticipants')
    return
  }

  let payloadSplitAmounts: Record<string, number> | undefined
  let payloadSplitShares: Record<string, number> | undefined

  if (splitMode.value === 'amount') {
    const amounts: Record<string, number> = {}
    for (const id of participants.value) amounts[id] = Math.round((parseFloat(splitAmounts[id]) || 0) * 100) / 100
    const allocated = sumSplitAmounts(amounts, participants.value)
    if (Math.abs(allocated - roundedAmount) > 0.01) {
      error.value = t('expenseForm.errorSplitAmounts', {
        allocated: currencySymbol.value + formatAmount(allocated),
        total: currencySymbol.value + formatAmount(roundedAmount),
      })
      return
    }
    payloadSplitAmounts = amounts
  } else if (splitMode.value === 'shares') {
    const shares: Record<string, number> = {}
    for (const id of participants.value) shares[id] = parseFloat(splitShares[id]) || 0
    if (sumSplitShares(shares, participants.value) <= 0) {
      error.value = t('expenseForm.errorSplitShares')
      return
    }
    payloadSplitShares = shares
  }

  const payload = {
    description: description.value.trim(),
    amount: roundedAmount,
    paidBy: paidBy.value,
    participants: participants.value,
    date: date.value,
    splitMode: splitMode.value,
    splitAmounts: payloadSplitAmounts,
    splitShares: payloadSplitShares,
  }

  if (props.editingExpense) {
    updateExpense(props.editingExpense.id, payload)
  } else {
    addExpense(payload)
  }

  resetForm()
  emit('done')
}

function handleCancel() {
  resetForm()
  emit('done')
}
</script>

<template>
  <form class="expense-form" @submit.prevent="handleSubmit">
    <p v-if="members.length === 0" class="empty">{{ $t('expenseForm.needPeople') }}</p>

    <template v-else>
      <div class="field">
        <label>{{ $t('expenseForm.description') }}</label>
        <input v-model="description" type="text" :placeholder="$t('expenseForm.descriptionPlaceholder')" />
      </div>

      <div class="row">
        <div class="field">
          <label>{{ $t('expenseForm.amount') }}</label>
          <input v-model="amount" type="number" step="0.01" min="0" placeholder="0.00" />
        </div>
        <div class="field">
          <label>{{ $t('expenseForm.date') }}</label>
          <input v-model="date" type="date" />
        </div>
      </div>

      <div class="field">
        <label>{{ $t('expenseForm.paidBy') }}</label>
        <select v-model="paidBy">
          <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
      </div>

      <div class="field">
        <div class="split-header">
          <label>{{ $t('expenseForm.splitBetween') }}</label>
          <button type="button" class="link-btn" @click="toggleAll">
            {{ allSelected ? $t('expenseForm.clearAll') : $t('expenseForm.selectAll') }}
          </button>
        </div>

        <div class="split-mode-group">
          <label class="split-mode-option">
            <input type="radio" v-model="splitMode" value="equal" />
            {{ $t('expenseForm.splitEqual') }}
          </label>
          <label class="split-mode-option">
            <input type="radio" v-model="splitMode" value="amount" />
            {{ $t('expenseForm.splitByAmount') }}
          </label>
          <label class="split-mode-option">
            <input type="radio" v-model="splitMode" value="shares" />
            {{ $t('expenseForm.splitByShares') }}
          </label>
        </div>

        <div v-if="splitMode === 'equal'" class="participant-grid">
          <label v-for="m in members" :key="m.id" class="participant-chip">
            <input type="checkbox" v-model="participants" :value="m.id" />
            <Avatar :id="m.id" :name="m.name" size="sm" />
            {{ m.name }}
          </label>
        </div>

        <div v-else class="split-rows">
          <div v-for="m in members" :key="m.id" class="split-row">
            <label class="split-row-check">
              <input type="checkbox" v-model="participants" :value="m.id" />
              <Avatar :id="m.id" :name="m.name" size="sm" />
              <span class="split-row-name">{{ m.name }}</span>
            </label>
            <template v-if="participants.includes(m.id)">
              <input
                v-if="splitMode === 'amount'"
                v-model="splitAmounts[m.id]"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="split-row-input"
              />
              <template v-else>
                <input
                  v-model="splitShares[m.id]"
                  type="number"
                  step="1"
                  min="0"
                  class="split-row-input split-row-input-shares"
                />
                <span class="split-row-hint">{{ shareResultDisplay(m.id) }}</span>
              </template>
            </template>
          </div>
        </div>

        <p v-if="splitMode === 'amount'" class="split-total-hint">
          {{ $t('expenseForm.allocatedHint', {
            allocated: currencySymbol + formatAmount(allocatedAmount),
            total: currencySymbol + formatAmount(Math.round((parseFloat(amount) || 0) * 100) / 100),
          }) }}
        </p>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions">
        <button type="submit" class="primary">
          {{ editingExpense ? $t('expenseForm.save') : $t('expenseForm.add') }}
        </button>
        <button type="button" @click="handleCancel">{{ $t('expenseForm.cancel') }}</button>
      </div>
    </template>
  </form>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.85rem;
}

.field label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.row {
  display: flex;
  gap: 0.75rem;
}

.row .field {
  flex: 1;
  min-width: 0;
}

@media (max-width: 420px) {
  .row {
    flex-direction: column;
  }
}

.split-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.link-btn {
  border: none;
  background: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.4rem 0;
}

.split-mode-group {
  display: flex;
  gap: 0.25rem;
  margin: 0.4rem 0 0.6rem;
  background: var(--surface-alt);
  padding: 0.25rem;
  border-radius: 8px;
}

.split-mode-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  padding: 0.4rem 0.3rem;
  border-radius: 6px;
  cursor: pointer;
}

.split-mode-option:has(input:checked) {
  background: var(--surface);
  box-shadow: var(--shadow);
  font-weight: 600;
}

.split-mode-option input {
  width: auto;
}

.participant-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.participant-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--surface-alt);
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  font-size: 0.85rem;
  cursor: pointer;
}

.participant-chip input {
  width: 1.1rem;
  height: 1.1rem;
}

.split-rows {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.split-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-alt);
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  flex-wrap: wrap;
}

.split-row-check {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  min-width: 8rem;
  cursor: pointer;
}

.split-row-check input {
  width: 1.1rem;
  height: 1.1rem;
}

.split-row-name {
  font-size: 0.85rem;
}

.split-row-input {
  width: 5rem;
  flex-shrink: 0;
}

.split-row-input-shares {
  width: 3.5rem;
}

.split-row-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 3.5rem;
}

.split-total-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0.4rem 0 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.actions button {
  min-height: 44px;
}

@media (max-width: 420px) {
  .actions {
    flex-direction: column;
  }
}

.error {
  color: var(--danger);
  font-size: 0.85rem;
  margin: 0 0 0.75rem;
}

.empty {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
