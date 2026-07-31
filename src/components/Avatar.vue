<script setup lang="ts">
import { computed } from 'vue'
import { getAvatarColor, getInitials } from '../utils/avatar'

const props = withDefaults(defineProps<{ id: string; name: string; size?: 'sm' | 'md' }>(), {
  size: 'md',
})

const initials = computed(() => getInitials(props.name))
const color = computed(() => getAvatarColor(props.id))
</script>

<template>
  <span
    class="avatar"
    :class="size === 'sm' ? 'avatar-sm' : 'avatar-md'"
    :style="{
      '--avatar-bg-light': color.bgLight,
      '--avatar-bg-dark': color.bgDark,
      '--avatar-fg-light': color.fgLight,
      '--avatar-fg-dark': color.fgDark,
    }"
    :title="name"
  >{{ initials }}</span>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  flex-shrink: 0;
  line-height: 1;
  background: var(--avatar-bg-light);
  color: var(--avatar-fg-light);
}

@media (prefers-color-scheme: dark) {
  .avatar {
    background: var(--avatar-bg-dark);
    color: var(--avatar-fg-dark);
  }
}

.avatar-sm {
  width: 22px;
  height: 22px;
  font-size: 0.6rem;
}

.avatar-md {
  width: 30px;
  height: 30px;
  font-size: 0.75rem;
}
</style>
