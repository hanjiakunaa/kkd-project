<script setup>
import { isDark, toggleDark } from '@/hooks/useToggleDark.js'
</script>

<template>
  <i
    id="toggleTheme"
    class="mr-16 cursor-pointer"
    :class="isDark ? 'i-fe:moon' : 'i-fe:sun'"
    @click="toggleDark"
  />
</template>
