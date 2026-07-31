<script setup lang="ts">
import { ref } from 'vue'
import { useGroupData } from '../composables/useGroupData'

const { members, addMember, renameMember, removeMember } = useGroupData()

const newName = ref('')
const editingId = ref<string | null>(null)
const editingName = ref('')
const error = ref('')

function handleAdd() {
  if (!newName.value.trim()) return
  addMember(newName.value)
  newName.value = ''
}

function startEdit(id: string, name: string) {
  editingId.value = id
  editingName.value = name
}

function commitEdit() {
  if (editingId.value) renameMember(editingId.value, editingName.value)
  editingId.value = null
}

function handleRemove(id: string) {
  error.value = ''
  try {
    removeMember(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not remove member.'
  }
}
</script>

<template>
  <section class="panel">
    <h2>People</h2>
    <form class="add-row" @submit.prevent="handleAdd">
      <input v-model="newName" type="text" placeholder="Add a person's name" />
      <button type="submit">Add</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>

    <ul v-if="members.length" class="member-list">
      <li v-for="member in members" :key="member.id" class="member-row">
        <template v-if="editingId === member.id">
          <input
            v-model="editingName"
            type="text"
            class="edit-input"
            @keyup.enter="commitEdit"
            @blur="commitEdit"
            autofocus
          />
        </template>
        <template v-else>
          <span class="member-name" @click="startEdit(member.id, member.name)">{{ member.name }}</span>
          <button class="icon-btn danger" title="Remove" @click="handleRemove(member.id)">✕</button>
        </template>
      </li>
    </ul>
    <p v-else class="empty">Add everyone who's part of the group.</p>
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

.add-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.add-row input {
  flex: 1;
}

.member-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--surface-alt);
  border-radius: 8px;
}

.member-name {
  cursor: text;
  flex: 1;
}

.edit-input {
  flex: 1;
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

.error {
  color: var(--danger);
  font-size: 0.85rem;
  margin: -0.5rem 0 1rem;
}
</style>
