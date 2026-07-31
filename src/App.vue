<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import MembersPanel from './components/MembersPanel.vue'
import ExpenseForm from './components/ExpenseForm.vue'
import ExpenseList from './components/ExpenseList.vue'
import BalancesPanel from './components/BalancesPanel.vue'
import Modal from './components/Modal.vue'
import Avatar from './components/Avatar.vue'
import { useGroupData, type MergePreview } from './composables/useGroupData'
import { NEW_PERSON } from './utils/merge'
import type { Expense } from './types'

const { t } = useI18n()
const { members, currencySymbol, setCurrencySymbol, previewMerge, confirmMerge } = useGroupData()

type Tab = 'expenses' | 'people' | 'balances' | 'settings'
const tab = ref<Tab>('expenses')
const editingExpense = ref<Expense | null>(null)
const showExpenseModal = ref(false)
const linkCopied = ref(false)

const mergeInput = ref('')
const mergeMessage = ref('')
const mergeError = ref('')
const mergePreview = ref<MergePreview | null>(null)
const matchSelections = reactive<Record<string, string>>({})

function openAddExpense() {
  editingExpense.value = null
  showExpenseModal.value = true
}

function editExpense(expense: Expense) {
  editingExpense.value = expense
  showExpenseModal.value = true
}

function closeExpenseModal() {
  showExpenseModal.value = false
  editingExpense.value = null
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    linkCopied.value = true
    setTimeout(() => (linkCopied.value = false), 2000)
  } catch (e) {
    console.warn('Could not copy link automatically.', e)
    prompt(t('app.copyPromptTitle'), window.location.href)
  }
}

function describeMergeResult(addedMembers: number, addedExpenses: number): string {
  const parts: string[] = []
  if (addedMembers > 0) {
    parts.push(t(addedMembers === 1 ? 'merge.newPersonSingular' : 'merge.newPeoplePlural', { count: addedMembers }))
  }
  if (addedExpenses > 0) {
    parts.push(
      t(addedExpenses === 1 ? 'merge.newExpenseSingular' : 'merge.newExpensesPlural', { count: addedExpenses }),
    )
  }
  return parts.length > 0
    ? t('merge.mergedPrefix', { parts: parts.join(` ${t('merge.and')} `) })
    : t('merge.nothingNew')
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
      mergeMessage.value = describeMergeResult(0, addedExpenses)
      mergeInput.value = ''
      return
    }

    for (const key of Object.keys(matchSelections)) delete matchSelections[key]
    for (const match of preview.matches) {
      matchSelections[match.incomingId] = match.suggestedId ?? NEW_PERSON
    }
    mergePreview.value = preview
  } catch (e) {
    mergeError.value = e instanceof Error ? e.message : t('merge.readError')
  }
}

function confirmMergeReview() {
  if (!mergePreview.value) return
  const { addedMembers, addedExpenses } = confirmMerge(mergePreview.value.incoming, { ...matchSelections })
  mergeMessage.value = describeMergeResult(addedMembers, addedExpenses)

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
      <button type="button" class="share-btn" @click="copyShareLink">
        {{ linkCopied ? $t('app.linkCopied') : $t('app.copyLink') }}
      </button>
    </header>

    <nav class="tabs">
      <button :class="{ active: tab === 'expenses' }" @click="tab = 'expenses'">💰 {{ $t('tabs.expenses') }}</button>
      <button :class="{ active: tab === 'people' }" @click="tab = 'people'">👥 {{ $t('tabs.people') }}</button>
      <button :class="{ active: tab === 'balances' }" @click="tab = 'balances'">⚖️ {{ $t('tabs.balances') }}</button>
      <button :class="{ active: tab === 'settings' }" @click="tab = 'settings'">⚙️ {{ $t('tabs.settings') }}</button>
    </nav>

    <main class="content">
      <section v-show="tab === 'expenses'" class="expenses-tab">
        <button type="button" class="primary add-expense-btn" @click="openAddExpense">
          {{ $t('expenseList.addButton') }}
        </button>
        <ExpenseList @edit="editExpense" />
      </section>

      <section v-show="tab === 'people'">
        <MembersPanel />
      </section>

      <section v-show="tab === 'balances'">
        <BalancesPanel />
      </section>

      <section v-show="tab === 'settings'" class="settings-tab">
        <div class="panel">
          <h2>{{ $t('app.currencyLabel') }}</h2>
          <div class="currency-setting">
            <label for="currency" class="sr-only">{{ $t('app.currencyLabel') }}</label>
            <input
              id="currency"
              type="text"
              maxlength="3"
              :value="currencySymbol"
              @change="setCurrencySymbol(($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <div class="panel">
          <h2>{{ $t('settings.mergeHeading') }}</h2>
          <p class="panel-hint">{{ $t('settings.mergeHint') }}</p>

          <form v-if="!mergePreview" class="merge-form" @submit.prevent="handlePreviewMerge">
            <input v-model="mergeInput" type="text" :placeholder="$t('merge.placeholder')" />
            <button type="submit" class="primary">{{ $t('merge.review') }}</button>
          </form>

          <div v-if="mergePreview" class="merge-review">
            <p class="merge-review-title">
              {{ $t('merge.matchTitle') }}
            </p>
            <div v-for="match in mergePreview.matches" :key="match.incomingId" class="match-row">
              <span class="match-name">
                <Avatar :id="match.incomingId" :name="match.incomingName" size="sm" />
                {{ match.incomingName }}
              </span>
              <span class="match-arrow">{{ $t('merge.is') }}</span>
              <select v-model="matchSelections[match.incomingId]">
                <option :value="NEW_PERSON">{{ $t('merge.newPerson') }}</option>
                <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>
            <div class="actions">
              <button type="button" class="primary" @click="confirmMergeReview">{{ $t('merge.confirm') }}</button>
              <button type="button" @click="cancelMergeReview">{{ $t('merge.cancel') }}</button>
            </div>
          </div>

          <p v-if="mergeMessage" class="merge-feedback success">{{ mergeMessage }}</p>
          <p v-if="mergeError" class="merge-feedback error">{{ mergeError }}</p>
        </div>
      </section>
    </main>

    <Modal
      v-if="showExpenseModal"
      :title="editingExpense ? $t('expenseForm.editTitle') : $t('expenseForm.addTitle')"
      @close="closeExpenseModal"
    >
      <ExpenseForm :editing-expense="editingExpense" @done="closeExpenseModal" />
    </Modal>

    <footer class="app-footer">
      {{ $t('footer.before') }}
      <a href="https://www.goatcounter.com/" target="_blank" rel="noopener noreferrer">
        {{ $t('footer.goatcounter') }}</a>{{ $t('footer.after') }}
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

.share-btn {
  font-size: 0.8rem;
  padding: 0.4rem 0.7rem;
  min-height: 36px;
  white-space: nowrap;
}

.panel {
  background: var(--surface);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: var(--shadow);
}

.panel h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

.panel-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}

.settings-tab {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.currency-setting {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.currency-setting input {
  width: 3rem;
  text-align: center;
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
  background: var(--surface-alt);
  border-radius: 8px;
  padding: 0.85rem;
  margin-bottom: 0.75rem;
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
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  min-width: 6rem;
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
  padding: 0.55rem 0.5rem;
  min-height: 44px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-muted);
}

@media (max-width: 420px) {
  .tabs button {
    font-size: 0.78rem;
    padding: 0.5rem 0.3rem;
  }
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

.add-expense-btn {
  min-height: 44px;
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
