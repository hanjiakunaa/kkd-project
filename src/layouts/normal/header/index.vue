<template>
  <app-card class="flex items-center px-12" border-b="1px solid light_border dark:dark_border">
    <menu-collapse />

    <app-tab class="w-0 flex-1 px-12" />

    <span class="mx-6 opacity-20">|</span>

    <div class="flex flex-shrink-0 items-center px-12 text-18">
      <beginner-guide />

      <toggle-theme />

      <fullscreen />

      <theme-setting class="mr-16" />

      <user-avatar />
    </div>
  </app-card>
</template>

<script setup>
import { ToggleTheme } from '@/components'
import { AppTab, BeginnerGuide, Fullscreen, MenuCollapse, UserAvatar } from '@/layouts/components'
</script>
