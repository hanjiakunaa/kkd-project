<template>
  <app-card class="relative flex items-center px-12" border-b="1px solid light_border dark:dark_border">
    <menu-collapse />

    <app-tab class="w-0 flex-1 px-12 min-w-0" />

    <span class="mx-6 opacity-20">|</span>

    <div class="flex flex-shrink-0 items-center px-12 text-18">
      <beginner-guide />

      <toggle-theme />

      <fullscreen />

      <theme-setting class="mr-16" />

      <user-avatar />
    </div>

    <daily-quote class="header-center-quote" />
  </app-card>
</template>

<script setup>
import { DailyQuote, ToggleTheme } from '@/components'
import { AppTab, BeginnerGuide, Fullscreen, MenuCollapse, UserAvatar } from '@/layouts/components'
</script>

<style scoped>
.header-center-quote {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: clamp(220px, 40vw, 560px);
  z-index: 10;
}
</style>
