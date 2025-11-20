<template>
  <app-card class="relative flex items-center px-12" border-b="1px solid light_border dark:dark_border">
    <menu-collapse />

    <bread-crumb />

    <div class="ml-auto flex flex-shrink-0 items-center px-12 text-18">
      <n-tooltip trigger="hover">
        <template #trigger>
          <a
            href="https://kk-blog-qqkk.vercel.app/"
            target="_blank"
            class="mr-16 inline-flex cursor-pointer items-center"
          >
            <h-icon
              name="la-blogger"
              scale="1.2"
            />
          </a>
        </template>
        我的博客
      </n-tooltip>
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
import { BeginnerGuide, BreadCrumb, Fullscreen, MenuCollapse, UserAvatar } from '@/layouts/components'
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
