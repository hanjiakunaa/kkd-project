<template>
  <!-- 搜索触发按钮 -->
  <n-tooltip trigger="hover" placement="bottom">
    <template #trigger>
      <div
        id="layout-search"
        class="mr-16 inline-flex cursor-pointer items-center"
        @click="openSearch"
      >
        <h-icon name="ri-search-line" scale="1.2" />
      </div>
    </template>
    全局搜索 ({{ isMac ? '⌘' : 'Ctrl' }} + K)
  </n-tooltip>

  <!-- 搜索弹窗 -->
  <teleport to="body">
    <transition name="search-fade">
      <div v-if="showModal" class="search-overlay" @click.self="closeSearch">
        <div class="search-modal">
          <!-- 搜索输入框 -->
          <div class="search-header">
            <div class="search-input-wrapper">
              <h-icon name="ri-search-line" class="search-icon" />
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                class="search-input"
                placeholder="搜索页面..."
                @keydown="handleKeydown"
              >
              <div v-if="searchQuery" class="search-clear" @click="clearSearch">
                <h-icon name="ri-close-line" />
              </div>
            </div>
            <div class="search-tips">
              <kbd>↑↓</kbd>
              <span>切换</span>
              <kbd>↵</kbd>
              <span>确认</span>
              <kbd>esc</kbd>
              <span>关闭</span>
            </div>
          </div>

          <!-- 搜索结果 -->
          <div class="search-results">
            <template v-if="searchQuery && searchResults.length === 0">
              <div class="search-empty">
                <h-icon name="ri-search-eye-line" class="empty-icon" />
                <p>没有找到相关页面</p>
              </div>
            </template>

            <template v-else-if="searchResults.length > 0">
              <div class="results-list">
                <div
                  v-for="(result, index) in searchResults"
                  :key="result.item.id"
                  class="result-item"
                  :class="{ active: activeIndex === index }"
                  @click="navigateTo(result.item)"
                  @mouseenter="activeIndex = index"
                >
                  <div class="result-icon">
                    <h-icon :name="result.item.icon || 'ri-file-line'" />
                  </div>
                  <div class="result-content">
                    <div class="result-title">
                      <!-- 高亮匹配的文本 -->
                      <span v-html="highlightMatch(result.item.name, result.matches)" />
                    </div>
                    <div class="result-path">
                      <span class="breadcrumb">
                        {{ result.item.breadcrumb || result.item.path }}
                      </span>
                    </div>
                  </div>
                  <div class="result-arrow">
                    <h-icon name="ri-arrow-right-s-line" />
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="search-recent">
                <div class="recent-header">
                  <span>最近访问</span>
                </div>
                <div class="results-list">
                  <div
                    v-for="(item, index) in recentRoutes"
                    :key="item.id"
                    class="result-item"
                    :class="{ active: activeIndex === index }"
                    @click="navigateTo(item)"
                    @mouseenter="activeIndex = index"
                  >
                    <div class="result-icon">
                      <h-icon :name="item.icon || 'ri-file-line'" />
                    </div>
                    <div class="result-content">
                      <div class="result-title">
                        {{ item.name }}
                      </div>
                      <div class="result-path">
                        {{ item.breadcrumb || item.path }}
                      </div>
                    </div>
                    <div class="result-arrow">
                      <h-icon name="ri-arrow-right-s-line" />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import Fuse from 'fuse.js'
import { getPermissions } from '@/store/helper'
import { lStorage } from '@/utils/storage'

const router = useRouter()
const STORAGE_KEY = 'recent-routes'

// 状态
const showModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)
const activeIndex = ref(0)
const flatRoutes = ref([])
const recentRoutes = ref([])

// 检测是否是 Mac 系统
const isMac = computed(() => {
  return navigator.platform.toUpperCase().includes('MAC')
})

// Fuse.js 配置
const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'path', weight: 0.2 },
    { name: 'code', weight: 0.1 },
  ],
  threshold: 0.4,
  includeMatches: true,
  minMatchCharLength: 1,
}

let fuse = null

// 扁平化路由数据并添加面包屑
function flattenRoutes(routes, _parentPath = '', breadcrumb = []) {
  const result = []

  for (const route of routes) {
    if (!route.enable || !route.show)
      continue

    const currentBreadcrumb = [...breadcrumb, route.name]
    const item = {
      ...route,
      breadcrumb: currentBreadcrumb.join(' / '),
    }

    // 只添加有 component 的路由（实际可跳转的页面）
    if (route.component) {
      result.push(item)
    }

    // 递归处理子路由
    if (route.children && route.children.length > 0) {
      result.push(...flattenRoutes(route.children, route.path, currentBreadcrumb))
    }
  }

  return result
}

// 初始化搜索数据
async function initSearchData() {
  const permissions = await getPermissions()
  flatRoutes.value = flattenRoutes(permissions)
  fuse = new Fuse(flatRoutes.value, fuseOptions)

  // 从 localStorage 读取最近访问记录
  const stored = lStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const ids = JSON.parse(stored)
      recentRoutes.value = ids
        .map(id => flatRoutes.value.find(r => r.id === id))
        .filter(Boolean)
        .slice(0, 5)
    }
    catch {
      recentRoutes.value = []
    }
  }
}

// 搜索结果
const searchResults = computed(() => {
  if (!searchQuery.value || !fuse) {
    return []
  }
  return fuse.search(searchQuery.value).slice(0, 10)
})

// 当前选择的列表
const currentList = computed(() => {
  if (searchQuery.value && searchResults.value.length > 0) {
    return searchResults.value.map(r => r.item)
  }
  return recentRoutes.value
})

// 高亮匹配文本
function highlightMatch(text, matches) {
  if (!matches || matches.length === 0) {
    return text
  }

  const nameMatch = matches.find(m => m.key === 'name')
  if (!nameMatch) {
    return text
  }

  let result = text
  const indices = nameMatch.indices.sort((a, b) => b[0] - a[0])

  for (const [start, end] of indices) {
    const before = result.slice(0, start)
    const match = result.slice(start, end + 1)
    const after = result.slice(end + 1)
    result = `${before}<mark>${match}</mark>${after}`
  }

  return result
}

// 打开搜索
function openSearch() {
  showModal.value = true
  activeIndex.value = 0
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

// 关闭搜索
function closeSearch() {
  showModal.value = false
  searchQuery.value = ''
  activeIndex.value = 0
}

// 清空搜索
function clearSearch() {
  searchQuery.value = ''
  activeIndex.value = 0
  searchInputRef.value?.focus()
}

// 导航到选中页面
function navigateTo(item) {
  if (!item || !item.path)
    return

  // 保存到最近访问
  saveRecentRoute(item.id)

  router.push(item.path)
  closeSearch()
}

// 保存最近访问记录
function saveRecentRoute(id) {
  const stored = lStorage.getItem(STORAGE_KEY)
  let ids = []
  try {
    ids = stored ? JSON.parse(stored) : []
  }
  catch {
    ids = []
  }

  // 移除已存在的，添加到最前面
  ids = ids.filter(i => i !== id)
  ids.unshift(id)
  ids = ids.slice(0, 10)

  lStorage.set(STORAGE_KEY, JSON.stringify(ids))

  // 更新最近访问列表
  recentRoutes.value = ids
    .map(rid => flatRoutes.value.find(r => r.id === rid))
    .filter(Boolean)
    .slice(0, 5)
}

// 键盘事件处理
function handleKeydown(e) {
  const list = currentList.value

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (list.length > 0) {
        activeIndex.value = (activeIndex.value + 1) % list.length
      }
      break
    case 'ArrowUp':
      e.preventDefault()
      if (list.length > 0) {
        activeIndex.value = (activeIndex.value - 1 + list.length) % list.length
      }
      break
    case 'Enter':
      e.preventDefault()
      if (searchQuery.value && searchResults.value.length > 0) {
        navigateTo(searchResults.value[activeIndex.value]?.item)
      }
      else if (!searchQuery.value && recentRoutes.value.length > 0) {
        navigateTo(recentRoutes.value[activeIndex.value])
      }
      break
    case 'Escape':
      closeSearch()
      break
  }
}

// 全局快捷键
function handleGlobalKeydown(e) {
  // Cmd/Ctrl + K 打开搜索
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (showModal.value) {
      closeSearch()
    }
    else {
      openSearch()
    }
  }
}

// 监听搜索词变化，重置选中索引
watch(searchQuery, () => {
  activeIndex.value = 0
})

// 生命周期
onMounted(() => {
  initSearchData()
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
/* 毛玻璃遮罩层 */
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  padding-top: 10vh;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* 过渡动画 */
.search-fade-enter-active,
.search-fade-leave-active {
  transition: all 0.25s ease;
}

.search-fade-enter-active .search-modal,
.search-fade-leave-active .search-modal {
  transition: all 0.25s ease;
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}

.search-fade-enter-from .search-modal,
.search-fade-leave-to .search-modal {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}

.search-modal {
  width: 600px;
  max-width: 90vw;
  height: fit-content;
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.search-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f3f4f6;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.search-input-wrapper:focus-within {
  background: #e5e7eb;
  box-shadow: 0 0 0 2px #2080f0;
}

.search-icon {
  color: #9ca3af;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #1f2937;
  outline: none;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-clear {
  cursor: pointer;
  color: #9ca3af;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.search-clear:hover {
  color: #1f2937;
  background: #e5e7eb;
}

.search-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.search-tips kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-family: inherit;
  font-size: 11px;
  color: #6b7280;
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.search-recent .recent-header {
  padding: 12px 20px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.results-list {
  padding: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.result-item:hover {
  background: #f3f4f6;
}

.result-item.active {
  background: #e6f4ff;
}

.result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #e5e7eb;
  border-radius: 10px;
  color: #6b7280;
  flex-shrink: 0;
}

.result-item.active .result-icon {
  background: #2080f0;
  color: #fff;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-title :deep(mark) {
  background: #fef3cd;
  color: #2080f0;
  padding: 0 2px;
  border-radius: 2px;
}

.result-path {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-arrow {
  color: #9ca3af;
  opacity: 0;
  transition: all 0.15s ease;
}

.result-item.active .result-arrow,
.result-item:hover .result-arrow {
  opacity: 1;
}

/* 滚动条样式 */
.search-results::-webkit-scrollbar {
  width: 6px;
}

.search-results::-webkit-scrollbar-track {
  background: transparent;
}

.search-results::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 3px;
}

.search-results::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* ========== 暗黑模式 ========== */
html.dark .search-overlay {
  background: rgba(0, 0, 0, 0.5);
}

html.dark .search-modal {
  background: #1e1e1e;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

html.dark .search-header {
  border-bottom-color: #363636;
}

html.dark .search-input-wrapper {
  background: #2a2a2a;
}

html.dark .search-input-wrapper:focus-within {
  background: #333;
  box-shadow: 0 0 0 2px #409eff;
}

html.dark .search-icon {
  color: #6b7280;
}

html.dark .search-input {
  color: #e5e7eb;
}

html.dark .search-input::placeholder {
  color: #6b7280;
}

html.dark .search-clear {
  color: #6b7280;
}

html.dark .search-clear:hover {
  color: #e5e7eb;
  background: #333;
}

html.dark .search-tips {
  color: #6b7280;
}

html.dark .search-tips kbd {
  background: #2a2a2a;
  border-color: #363636;
  color: #9ca3af;
}

html.dark .search-empty {
  color: #6b7280;
}

html.dark .search-recent .recent-header {
  color: #6b7280;
}

html.dark .result-item:hover {
  background: #2a2a2a;
}

html.dark .result-item.active {
  background: rgba(64, 158, 255, 0.15);
}

html.dark .result-icon {
  background: #2a2a2a;
  color: #9ca3af;
}

html.dark .result-item.active .result-icon {
  background: #409eff;
  color: #fff;
}

html.dark .result-title {
  color: #e5e7eb;
}

html.dark .result-title :deep(mark) {
  background: rgba(64, 158, 255, 0.3);
  color: #409eff;
}

html.dark .result-path {
  color: #6b7280;
}

html.dark .result-arrow {
  color: #6b7280;
}

html.dark .search-results::-webkit-scrollbar-thumb {
  background: #363636;
}

html.dark .search-results::-webkit-scrollbar-thumb:hover {
  background: #4a4a4a;
}
</style>
