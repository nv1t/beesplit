<script setup lang="ts">
import { computed } from 'vue'
import { useGroupData } from '../composables/useGroupData'
import { formatAmount } from '../utils/format'

const { members, balances, settlements, totalSpent, currencySymbol } = useGroupData()

function memberName(id: string): string {
  return members.value.find((m) => m.id === id)?.name ?? 'Unknown'
}

const balanceRows = computed(() =>
  members.value
    .map((m) => ({ id: m.id, name: m.name, amount: balances.value[m.id] ?? 0 }))
    .sort((a, b) => b.amount - a.amount),
)
</script>

<template>
  <section class="panel">
    <h2>Balances</h2>
    <p v-if="members.length === 0" class="empty">Add people and expenses to see balances.</p>
    <template v-else>
      <div class="total">Total spent: <strong>{{ currencySymbol }}{{ formatAmount(totalSpent) }}</strong></div>

      <ul class="balance-list">
        <li v-for="row in balanceRows" :key="row.id" class="balance-row">
          <span>{{ row.name }}</span>
          <span :class="['amount', row.amount > 0.005 ? 'positive' : row.amount < -0.005 ? 'negative' : '']">
            <template v-if="row.amount > 0.005">is owed {{ currencySymbol }}{{ formatAmount(row.amount) }}</template>
            <template v-else-if="row.amount < -0.005">owes {{ currencySymbol }}{{ formatAmount(-row.amount) }}</template>
            <template v-else>settled up</template>
          </span>
        </li>
      </ul>

      <h3>Suggested settlements</h3>
      <p v-if="settlements.length === 0" class="empty">Everyone is settled up 🎉</p>
      <ul v-else class="settlement-list">
        <li v-for="(s, idx) in settlements" :key="idx" class="settlement-row">
          <strong>{{ memberName(s.from) }}</strong> pays <strong>{{ memberName(s.to) }}</strong>
          <span class="settlement-amount">{{ currencySymbol }}{{ formatAmount(s.amount) }}</span>
        </li>
      </ul>

      <a
        class="kofi-row"
        href="https://ko-fi.com/nuitg"
        target="_blank"
        rel="noopener noreferrer"
      >
        <strong>You</strong> kind of owe <strong>BeeSplit</strong> a coffee too 😄
        <span class="settlement-amount">☕</span>
      </a>
    </template>
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

h3 {
  margin: 1.25rem 0 0.5rem;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.total {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.balance-list,
.settlement-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-alt);
  border-radius: 8px;
}

.amount.positive {
  color: var(--success);
  font-weight: 600;
}

.amount.negative {
  color: var(--danger);
  font-weight: 600;
}

.settlement-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-alt);
  border-radius: 8px;
  font-size: 0.9rem;
}

.settlement-amount {
  font-weight: 600;
}

.kofi-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin-top: 0.4rem;
  padding: 0.5rem 0.75rem;
  border: 1px dashed var(--border);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-decoration: none;
}

.kofi-row:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.empty {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
