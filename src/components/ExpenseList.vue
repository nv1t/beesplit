<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGroupData } from '../composables/useGroupData'
import { formatAmount } from '../utils/format'
import Avatar from './Avatar.vue'
import type { Expense } from '../types'

const emit = defineEmits<{
  edit: [expense: Expense]
}>()

const { t } = useI18n()
const { members, expenses, removeExpense, currencySymbol } = useGroupData()

const sortedExpenses = computed(() =>
  [...expenses.value].sort((a, b) => b.date.localeCompare(a.date)),
)

function memberName(id: string): string {
  return members.value.find((m) => m.id === id)?.name ?? 'Unknown'
}

function handleRemove(id: string) {
  if (confirm(t('expenseList.confirmDelete'))) removeExpense(id)
}
</script>

<template>
  <section class="panel">
    <h2>{{ $t('expenseList.heading') }}</h2>
    <p v-if="sortedExpenses.length === 0" class="empty">{{ $t('expenseList.empty') }}</p>
    <ul v-else class="expense-list">
      <li v-for="expense in sortedExpenses" :key="expense.id" class="expense-row">
        <Avatar :id="expense.paidBy" :name="memberName(expense.paidBy)" />
        <div class="expense-main">
          <div class="expense-title">{{ expense.description }}</div>
          <div class="expense-meta">
            <span class="paid-by">{{ $t('expenseList.paidLabel', { name: memberName(expense.paidBy) }) }}</span>
            <span class="avatar-stack">
              <Avatar
                v-for="pid in expense.participants"
                :key="pid"
                :id="pid"
                :name="memberName(pid)"
                size="sm"
              />
            </span>
            <span class="expense-date">{{ expense.date }}</span>
          </div>
        </div>
        <div class="expense-trailing">
          <div class="expense-amount">{{ currencySymbol }}{{ formatAmount(expense.amount) }}</div>
          <div class="expense-actions">
            <button class="icon-btn" :title="$t('expenseList.editAction')" @click="emit('edit', expense)">✎</button>
            <button class="icon-btn danger" :title="$t('expenseList.deleteAction')" @click="handleRemove(expense.id)">✕</button>
          </div>
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
  flex-wrap: wrap;
  gap: 0.4rem 0.75rem;
  padding: 0.65rem 0.75rem;
  background: var(--surface-alt);
  border-radius: 8px;
}

.expense-main {
  flex: 1 1 160px;
  min-width: 0;
}

.expense-title {
  font-weight: 600;
}

.expense-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  overflow: hidden;
}

.paid-by,
.expense-date {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar-stack {
  display: flex;
  flex-shrink: 0;
}

.avatar-stack :deep(.avatar) {
  margin-left: -6px;
  border: 2px solid var(--surface-alt);
}

.avatar-stack :deep(.avatar):first-child {
  margin-left: 0;
}

.expense-trailing {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.expense-amount {
  font-weight: 600;
  white-space: nowrap;
}

.expense-actions {
  display: flex;
  gap: 0.1rem;
}

.icon-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 0.5rem;
  min-width: 40px;
  min-height: 40px;
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
