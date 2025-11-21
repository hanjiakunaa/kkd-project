<template>
  <n-float-button
    v-if="!hideLayoutTools"
    ref="floatButtonRef"
    position="fixed"
    :left="`${position.left}px`"
    :top="`${position.top}px`"
    type="primary"
    menu-trigger="hover"
    :class="{ 'is-dragging': isDragging }"
    :style="{ cursor: isDragging ? 'grabbing' : 'grab', zIndex: 9999 }"
    @mousedown="handleMouseDown"
  >
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
import { lStorage } from '@/utils/storage'

const route = useRoute()
const floatButtonRef = ref(null)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const position = ref({ left: 0, top: 0 })

// 存储键名
const STORAGE_KEY = 'layoutFloatMenuPosition'

// 鼠标移动事件
function handleMouseMove(e) {
  if (!isDragging.value)
    return

  const newLeft = e.clientX - dragStart.value.x
  const newTop = e.clientY - dragStart.value.y

  // 限制在可视区域内
  const maxLeft = window.innerWidth - 56 // 按钮宽度
  const maxTop = window.innerHeight - 56 // 按钮高度
  const minTop = window.innerHeight * 0.18 // 最小距离顶部18%

  position.value = {
    left: Math.max(0, Math.min(newLeft, maxLeft)),
    top: Math.max(minTop, Math.min(newTop, maxTop)),
  }
}

// 鼠标释放事件
function handleMouseUp() {
  if (isDragging.value) {
    isDragging.value = false
    savePosition()
  }

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 保存位置到本地存储
function savePosition() {
  lStorage.set(STORAGE_KEY, position.value)
}

// 初始化位置：从本地存储读取或使用默认值
function initPosition() {
  const minTop = window.innerHeight * 0.39 // 最小距离顶部39%
  const saved = lStorage.get(STORAGE_KEY)
  if (saved && saved.left !== undefined && saved.top !== undefined) {
    // 如果保存的位置超过了限制，调整到最小位置
    position.value = {
      left: saved.left,
      top: Math.max(minTop, saved.top),
    }
  }
  else {
    // 默认位置：右侧20px，距离顶部90%
    const defaultTop = window.innerHeight * 0.9
    const defaultLeft = window.innerWidth - 20 - 56 // 56是按钮宽度（假设）
    position.value = { left: defaultLeft, top: defaultTop }
  }
}

// 鼠标按下事件
function handleMouseDown(e) {
  // 如果点击的是菜单项，不触发拖拽
  if (e.target.closest('.n-float-button-menu'))
    return

  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.left,
    y: e.clientY - position.value.top,
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  e.preventDefault()
}

// 窗口大小改变时，调整位置确保按钮在可视区域内
function handleResize() {
  const maxLeft = window.innerWidth - 56
  const maxTop = window.innerHeight - 56
  const minTop = window.innerHeight * 0.39 // 最小距离顶部39%

  position.value = {
    left: Math.min(position.value.left, maxLeft),
    top: Math.max(minTop, Math.min(position.value.top, maxTop)),
  }
  savePosition()
}

// 需要隐藏布局工具的页面列表（可以是路径或路由名称）
const hiddenPages = ['/', '/404', '/403', '/login', '/demo/muti-file-perview/pdf-preview', '/demo/muti-file-perview/word-preview', '/demo/muti-file-perview/excel-preview']

// 判断是否隐藏布局工具
const hideLayoutTools = computed(() => {
  // 检查路径是否在隐藏列表中
  if (hiddenPages.includes(route.path))
    return true
  // 检查路由名称是否在隐藏列表中
  if (route.name && hiddenPages.includes(route.name))
    return true
  return false
})

// 组件挂载时初始化位置
onMounted(() => {
  initPosition()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.n-float-button :deep(.n-float-button__body) {
  padding: 0 !important;
}

.n-float-button.is-dragging {
  z-index: 9999 !important;
}

.n-float-button.is-dragging :deep(.n-float-button) {
  z-index: 9999 !important;
}
</style>
