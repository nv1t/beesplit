<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-panel" role="dialog" aria-modal="true" :aria-label="title">
      <div class="modal-header">
        <h2>{{ title }}</h2>
        <button type="button" class="modal-close" :aria-label="$t('modal.close')" @click="emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 100;
}

.modal-panel {
  background: var(--surface);
  border-radius: 12px;
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-close {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1rem;
  padding: 0.5rem;
  min-width: 40px;
  min-height: 40px;
  border-radius: 6px;
  -webkit-tap-highlight-color: transparent;
}

.modal-close:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
}
</style>
