<template>
  <n-float-button v-if="!hideLayoutTools" position="fixed" right="20" top="90%" type="primary" menu-trigger="hover">
    <h-icon name="hi-solid-view-list" class="text-20 text-white" />
    <template #menu>
      <n-float-button v-if="layoutSettingVisible " shape="square" type="primary">
        <layout-setting />
      </n-float-button>
      <n-float-button v-if="layoutViewSourceCodeVisible" shape="square" type="primary">
        <layout-view-source-code />
      </n-float-button>
    </template>
  </n-float-button>
</template>

<script setup>
import { LayoutSetting, LayoutViewSourceCode } from '@/components'
import { layoutSettingVisible, layoutViewSourceCodeVisible } from '@/settings'

const route = useRoute()

// 需要隐藏布局工具的页面列表（可以是路径或路由名称）
const hiddenPages = ['/', '/404', '/403', '/login', '/demo/muti-file-perview/pdf-preview', '/demo/muti-file-perview/word-preview', '/demo/muti-file-perview/excel-preview']

// 判断是否隐藏布局工具
const hideLayoutTools = computed(() => {
  // 检查路径是否在隐藏列表中
  if (hiddenPages.includes(route.path)) {
    return true
  }
  // 检查路由名称是否在隐藏列表中
  if (route.name && hiddenPages.includes(route.name)) {
    return true
  }
  return false
})
</script>

<style scoped>
.n-float-button :deep(.n-float-button__body) {
  padding: 0 !important;
}
</style>
