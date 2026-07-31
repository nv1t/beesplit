<script setup lang="ts">
import { ref, reactive } from 'vue'
import MembersPanel from './components/MembersPanel.vue'
import ExpenseForm from './components/ExpenseForm.vue'
import ExpenseList from './components/ExpenseList.vue'
import BalancesPanel from './components/BalancesPanel.vue'
import { useGroupData, type MergePreview } from './composables/useGroupData'
import { NEW_PERSON } from './utils/merge'
import type { Expense } from './types'

const { members, currencySymbol, setCurrencySymbol, previewMerge, confirmMerge } = useGroupData()

type Tab = 'expenses' | 'people' | 'balances'
const tab = ref<Tab>('expenses')
const editingExpense = ref<Expense | null>(null)
const linkCopied = ref(false)

const showMergeForm = ref(false)
const mergeInput = ref('')
const mergeMessage = ref('')
const mergeError = ref('')
const mergePreview = ref<MergePreview | null>(null)
const matchSelections = reactive<Record<string, string>>({})

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

function handlePreviewMerge() {
  mergeError.value = ''
  mergeMessage.value = ''
  if (!mergeInput.value.trim()) return

  try {
    const preview = previewMerge(mergeInput.value)

    // Nothing to review (e.g. an empty group) — just merge it in directly.
    if (preview.matches.length === 0) {
      const { addedExpenses } = confirmMerge(preview.incoming, {})
      mergeMessage.value =
        addedExpenses > 0 ? `Merged in ${addedExpenses} new expense(s).` : 'Nothing new to merge in.'
      mergeInput.value = ''
      return
    }

    for (const key of Object.keys(matchSelections)) delete matchSelections[key]
    for (const match of preview.matches) {
      matchSelections[match.incomingId] = match.suggestedId ?? NEW_PERSON
    }
    mergePreview.value = preview
  } catch (e) {
    mergeError.value = e instanceof Error ? e.message : 'Could not read that link.'
  }
}

function confirmMergeReview() {
  if (!mergePreview.value) return
  const { addedMembers, addedExpenses } = confirmMerge(mergePreview.value.incoming, { ...matchSelections })

  const parts = []
  if (addedMembers > 0) parts.push(`${addedMembers} new ${addedMembers === 1 ? 'person' : 'people'}`)
  if (addedExpenses > 0) parts.push(`${addedExpenses} new ${addedExpenses === 1 ? 'expense' : 'expenses'}`)
  mergeMessage.value = parts.length > 0 ? `Merged in ${parts.join(' and ')}.` : 'Nothing new to merge in.'

  mergePreview.value = null
  mergeInput.value = ''
}

function cancelMergeReview() {
  mergePreview.value = null
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
        <button type="button" class="share-btn" @click="showMergeForm = !showMergeForm">
          🔀 Merge a link
        </button>
      </div>
    </header>

    <form
      v-if="showMergeForm && !mergePreview"
      class="merge-form"
      @submit.prevent="handlePreviewMerge"
    >
      <input
        v-model="mergeInput"
        type="text"
        placeholder="Paste someone else's BeeSplit link here"
      />
      <button type="submit" class="primary">Review</button>
    </form>

    <div v-if="mergePreview" class="merge-review">
      <p class="merge-review-title">
        Match people from that link to who they already are here, or add them as new:
      </p>
      <div v-for="match in mergePreview.matches" :key="match.incomingId" class="match-row">
        <span class="match-name">{{ match.incomingName }}</span>
        <span class="match-arrow">is</span>
        <select v-model="matchSelections[match.incomingId]">
          <option :value="NEW_PERSON">➕ a new person</option>
          <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
      </div>
      <div class="actions">
        <button type="button" class="primary" @click="confirmMergeReview">Confirm merge</button>
        <button type="button" @click="cancelMergeReview">Cancel</button>
      </div>
    </div>

    <p v-if="mergeMessage" class="merge-feedback success">{{ mergeMessage }}</p>
    <p v-if="mergeError" class="merge-feedback error">{{ mergeError }}</p>

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
      All group data lives only in this page's URL — nothing is saved to this
      device or synced anywhere. Bookmark or copy the link to keep your group;
      closing this tab without saving the link will lose it. This site uses
      <a href="https://www.goatcounter.com/" target="_blank" rel="noopener noreferrer">
        GoatCounter</a>, a privacy-friendly, cookie-less analytics tool, for anonymous
      page-view counts only — never your expense data.
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

.merge-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.merge-form input {
  flex: 1;
  min-width: 0;
}

.merge-feedback {
  font-size: 0.85rem;
  margin: -0.25rem 0 0.75rem;
}

.merge-feedback.success {
  color: var(--success);
}

.merge-feedback.error {
  color: var(--danger);
}

.merge-review {
  background: var(--surface);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: var(--shadow);
}

.merge-review-title {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}

.match-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.match-name {
  font-weight: 600;
  min-width: 5rem;
}

.match-arrow {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.match-row select {
  flex: 1;
  min-width: 8rem;
}

.merge-review .actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.merge-review .actions button {
  min-height: 44px;
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

.app-footer a {
  color: var(--text-muted);
  text-decoration: underline;
}

.app-footer a:hover {
  color: var(--accent);
}
</style>
