<script setup lang="ts">
import { computed } from 'vue'
import { useGroupData } from '../composables/useGroupData'
import { formatAmount } from '../utils/format'
import type { Expense } from '../types'

const emit = defineEmits<{
  edit: [expense: Expense]
}>()

const { members, expenses, removeExpense, currencySymbol } = useGroupData()

const sortedExpenses = computed(() =>
  [...expenses.value].sort((a, b) => b.date.localeCompare(a.date)),
)

function memberName(id: string): string {
  return members.value.find((m) => m.id === id)?.name ?? 'Unknown'
}

function handleRemove(id: string) {
  if (confirm('Delete this expense?')) removeExpense(id)
}
</script>

<template>
  <section class="panel">
    <h2>Expenses</h2>
    <p v-if="sortedExpenses.length === 0" class="empty">No expenses yet.</p>
    <ul v-else class="expense-list">
      <li v-for="expense in sortedExpenses" :key="expense.id" class="expense-row">
        <div class="expense-main">
          <div class="expense-title">{{ expense.description }}</div>
          <div class="expense-meta">
            {{ memberName(expense.paidBy) }} paid · split between
            {{ expense.participants.map(memberName).join(', ') }} · {{ expense.date }}
          </div>
        </div>
        <div class="expense-amount">{{ currencySymbol }}{{ formatAmount(expense.amount) }}</div>
        <div class="expense-actions">
          <button class="icon-btn" title="Edit" @click="emit('edit', expense)">✎</button>
          <button class="icon-btn danger" title="Delete" @click="handleRemove(expense.id)">✕</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.panel {
  background: var(--surface);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: var(--shadow);
}

h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

.expense-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.expense-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  background: var(--surface-alt);
  border-radius: 8px;
}

.expense-main {
  flex: 1;
  min-width: 0;
}

.expense-title {
  font-weight: 600;
}

.expense-meta {
  font-size: 0.78rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expense-amount {
  font-weight: 600;
  white-space: nowrap;
}

.expense-actions {
  display: flex;
  gap: 0.25rem;
}

.icon-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.icon-btn.danger:hover {
  color: var(--danger);
}

.empty {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
