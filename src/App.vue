<script setup lang="ts">
import { ref } from 'vue'
import MembersPanel from './components/MembersPanel.vue'
import ExpenseForm from './components/ExpenseForm.vue'
import ExpenseList from './components/ExpenseList.vue'
import BalancesPanel from './components/BalancesPanel.vue'
import { useGroupData } from './composables/useGroupData'
import type { Expense } from './types'

const { currencySymbol, setCurrencySymbol } = useGroupData()

type Tab = 'expenses' | 'people' | 'balances'
const tab = ref<Tab>('expenses')
const editingExpense = ref<Expense | null>(null)
const linkCopied = ref(false)

function editExpense(expense: Expense) {
  editingExpense.value = expense
  tab.value = 'expenses'
}

function stopEditing() {
  editingExpense.value = null
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    linkCopied.value = true
    setTimeout(() => (linkCopied.value = false), 2000)
  } catch (e) {
    console.warn('Could not copy link automatically.', e)
    prompt('Copy this link to save or share your data:', window.location.href)
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>🐝 BeeSplit</h1>
      <div class="header-controls">
        <div class="currency-setting">
          <label for="currency">Currency</label>
          <input
            id="currency"
            type="text"
            maxlength="3"
            :value="currencySymbol"
            @change="setCurrencySymbol(($event.target as HTMLInputElement).value)"
          />
        </div>
        <button type="button" class="share-btn" @click="copyShareLink">
          {{ linkCopied ? 'Link copied ✓' : '🔗 Copy link' }}
        </button>
      </div>
    </header>

    <nav class="tabs">
      <button :class="{ active: tab === 'expenses' }" @click="tab = 'expenses'">Expenses</button>
      <button :class="{ active: tab === 'people' }" @click="tab = 'people'">People</button>
      <button :class="{ active: tab === 'balances' }" @click="tab = 'balances'">Balances</button>
    </nav>

    <main class="content">
      <section v-show="tab === 'expenses'" class="expenses-tab">
        <ExpenseForm :editing-expense="editingExpense" @done="stopEditing" />
        <ExpenseList @edit="editExpense" />
      </section>

      <section v-show="tab === 'people'">
        <MembersPanel />
      </section>

      <section v-show="tab === 'balances'">
        <BalancesPanel />
      </section>
    </main>

    <footer class="app-footer">
      Data is stored in this browser (localStorage) and encoded into this page's URL —
      bookmark or share the link to save or continue your group from anywhere.
      Nothing is sent to a server.
    </footer>
  </div>
</template>

<style scoped>
.app {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

@media (max-width: 480px) {
  .app {
    padding: 1rem 0.75rem 2rem;
  }
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.app-header h1 {
  font-size: 1.4rem;
  margin: 0;
  color: var(--accent);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.currency-setting {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.currency-setting input {
  width: 3rem;
  text-align: center;
}

.share-btn {
  font-size: 0.8rem;
  padding: 0.4rem 0.7rem;
  min-height: 36px;
  white-space: nowrap;
}

.tabs {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  background: var(--surface-alt);
  padding: 0.3rem;
  border-radius: 10px;
}

.tabs button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.55rem 0.75rem;
  min-height: 44px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-muted);
}

.tabs button.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}

.expenses-tab {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.app-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
