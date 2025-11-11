<template>
  <app-card class="flex items-center px-12" border-b="1px solid light_border dark:dark_border">
    <menu-collapse />

    <bread-crumb />

    <div class="ml-auto flex flex-shrink-0 items-center px-12 text-18">
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
import { BeginnerGuide, BreadCrumb, Fullscreen, MenuCollapse, UserAvatar } from '@/layouts/components'
</script>
