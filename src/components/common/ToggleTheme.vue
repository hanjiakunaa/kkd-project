<script setup>
import { isDark, toggleDark } from '@/composables/useToggleDark.js'
</script>

<template>
  <i
    id="toggleTheme"
    class="mr-16 cursor-pointer"
    :class="isDark ? 'i-fe:moon' : 'i-fe:sun'"
    @click="(e) => toggleDark({ clientX: e.clientX || window.innerWidth / 2, clientY: e.clientY || window.innerHeight / 2 })"
  />
</template>
