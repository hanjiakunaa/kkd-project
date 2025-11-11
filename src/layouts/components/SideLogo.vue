<template>
  <router-link
    class="side-logo" :class="[{ 'is-collapsed': appStore.collapsed }]"
    to="/"
  >
    <the-logo />
    <h2
      v-show="!appStore.collapsed"
      class="ml-10 max-w-140 flex-shrink-0 text-16 color-primary font-bold"
    >
      {{ title }}
    </h2>
  </router-link>
</template>

<script setup>
import { useAppStore } from '@/store'

const title = import.meta.env.VITE_TITLE

const appStore = useAppStore()
</script>

<style lang="scss" scoped>
.side-logo {
  height: 60px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  transition: all 0.3s ease;

  .the-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }

  h2 {
    margin-left: 10px;
  }
}

.side-logo.is-collapsed {
  padding: 0;
}
</style>
