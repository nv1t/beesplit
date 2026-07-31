<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGroupData } from '../composables/useGroupData'
import Avatar from './Avatar.vue'
import type { Expense } from '../types'

const props = defineProps<{
  editingExpense?: Expense | null
}>()

const emit = defineEmits<{
  done: []
}>()

const { t } = useI18n()
const { members, addExpense, updateExpense } = useGroupData()

const description = ref('')
const amount = ref<string>('')
const paidBy = ref('')
const participants = ref<string[]>([])
const date = ref(new Date().toISOString().slice(0, 10))
const error = ref('')

watch(
  () => props.editingExpense,
  (expense) => {
    if (expense) {
      description.value = expense.description
      amount.value = String(expense.amount)
      paidBy.value = expense.paidBy
      participants.value = [...expense.participants]
      date.value = expense.date
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

function resetForm() {
  description.value = ''
  amount.value = ''
  paidBy.value = members.value[0]?.id ?? ''
  participants.value = members.value.map((m) => m.id)
  date.value = new Date().toISOString().slice(0, 10)
  error.value = ''
}

function handleSubmit() {
  error.value = ''
  const parsedAmount = parseFloat(amount.value)

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

  const payload = {
    description: description.value.trim(),
    amount: Math.round(parsedAmount * 100) / 100,
    paidBy: paidBy.value,
    participants: participants.value,
    date: date.value,
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
        <div class="participant-grid">
          <label v-for="m in members" :key="m.id" class="participant-chip">
            <input type="checkbox" v-model="participants" :value="m.id" />
            <Avatar :id="m.id" :name="m.name" size="sm" />
            {{ m.name }}
          </label>
        </div>
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
