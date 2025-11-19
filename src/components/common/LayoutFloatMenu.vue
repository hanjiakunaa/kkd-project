<template>
  <n-float-button position="fixed" right="20" top="90%" type="primary" menu-trigger="click">
    <h-icon name="hi-solid-view-list" class="text-20 text-white" />
    <template #menu>
      <n-float-button shape="square" type="primary">
        <layout-setting
          v-if="layoutSettingVisible && !hideLayoutTools"
        />
      </n-float-button>
      <n-float-button shape="square" type="primary">
        <layout-view-source-code
          v-if="layoutViewSourceCodeVisible && !hideLayoutTools"
        />
      </n-float-button>
    </template>
  </n-float-button>
</template>

<script setup>
import { LayoutSetting, LayoutViewSourceCode } from '@/components'
import { layoutSettingVisible, layoutViewSourceCodeVisible } from '@/settings'

const route = useRoute()
// 判断是否隐藏布局工具
const hideLayoutTools = computed(() => {
  if (!route.name)
    return route.path === '/login'
  return route.name === 'Login'
})
</script>

<style scoped>
</style>
