<template>
  <side-logo border-b="1px solid light_border dark:dark_border" />
  <side-menu class="cus-scroll-y mt-4 h-0 flex-1" />
  <div class="my-12 flex items-center justify-around px-12">
    <user-avatar v-if="!appStore.collapsed" />
    <menu-collapse />
  </div>
</template>

<script setup>
import { MenuCollapse, SideLogo, SideMenu, UserAvatar } from '@/layouts/components'
import { useAppStore } from '@/store'

const appStore = useAppStore()
</script>
