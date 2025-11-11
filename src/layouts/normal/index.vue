<template>
  <div class="modern-layout wh-full flex">
    <aside
      class="modern-sidebar flex-col flex-shrink-0 transition-width-300"
      :class="appStore.collapsed ? 'w-64' : 'w-220'"
    >
      <side-bar />
    </aside>

    <article class="modern-content w-0 flex-col flex-1">
      <app-header class="modern-header h-60 flex-shrink-0" />
      <slot />
    </article>
  </div>
</template>

<script setup>
import { useAppStore } from '@/store'
import AppHeader from './header/index.vue'
import SideBar from './sidebar/index.vue'

const appStore = useAppStore()
</script>

<style scoped>
.modern-layout {
  position: relative;
}

/* 侧边栏毛玻璃效果 */
.modern-sidebar {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
}

.dark .modern-sidebar {
  background: rgba(20, 20, 20, 0.8);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
}

/* 顶部栏毛玻璃效果 */
.modern-header {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 9;
}

.dark .modern-header {
  background: rgba(20, 20, 20, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

/* 内容区域 */
.modern-content {
  position: relative;
  overflow: hidden;
}

.collapsed {
  width: 64px;
}
</style>
