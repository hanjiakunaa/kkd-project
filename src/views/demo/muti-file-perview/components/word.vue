<template>
  <div class="word-viewer light-theme">
    <n-spin :show="loading" class="h-full">
      <!-- 顶部工具栏 -->
      <div class="viewer-toolbar">
        <div class="toolbar-left">
          <n-button size="small" quaternary :focusable="false" @click="toggleThumbnails">
            <template #icon>
              <h-icon name="bi-layout-text-sidebar-reverse" />
            </template>
          </n-button>
          <div class="toolbar-divider" />
          <n-button quaternary :focusable="false" :disabled="scale <= 0.5" @click="zoomOut">
            <template #icon>
              <h-icon name="la-search-minus-solid" />
            </template>
          </n-button>
          <n-button quaternary :focusable="false" :disabled="scale >= 3" @click="zoomIn">
            <template #icon>
              <h-icon name="la-search-plus-solid" />
            </template>
          </n-button>
          <div class="toolbar-divider" />
          <n-dropdown :options="zoomOptions" trigger="click" @select="handleZoomModeChange">
            <n-button size="small" quaternary :focusable="false" class="zoom-mode-btn">
              {{ getZoomModeLabel(currentZoomMode) }}
            </n-button>
          </n-dropdown>
          <span class="zoom-percent">{{ Math.round(scale * 100) }}%</span>
        </div>

        <div class="toolbar-right">
          <n-button size="small" quaternary :focusable="false" @click="handleDownload">
            <template #icon>
              <h-icon name="bi-download" />
            </template>
          </n-button>
          <div class="toolbar-divider" />
          <n-button size="small" quaternary :focusable="false" @click="handleClose">
            <template #icon>
              <h-icon name="fa-compress" />
            </template>
          </n-button>
        </div>
      </div>

      <div class="viewer-body" :class="{ 'hide-sider': !showThumbnails }">
        <!-- 侧边缩略图 -->
        <div v-show="showThumbnails && thumbnails.length" class="sidebar">
          <div class="sider-header">
            <span class="sider-title">缩略图</span>
          </div>
          <div ref="siderScrollRef" class="sider-scroll">
            <div
              v-for="(thumb, idx) in thumbnails"
              :key="idx"
              class="thumb-item"
              :class="{ active: currentPage === idx + 1 }"
              @click="goToPage(idx + 1)"
            >
              <div class="thumb-canvas-wrap" :style="{ width: `${thumbWidth}px`, height: `${Math.round(thumbHeight(idx))}px` }">
                <div :ref="el => setThumbRef(el, idx)" class="thumb-content" />
                <div class="thumb-index">
                  {{ idx + 1 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 主内容区 -->
        <div ref="viewerContentRef" class="viewer-content" @scroll="onScrollUpdate">
          <div ref="containerRef" class="docx-container" />
          <n-empty v-if="!loading && !error && !hasContent" description="文档内容为空或暂不支持预览" />
        </div>
      </div>
    </n-spin>

    <n-alert v-if="error" type="error" class="mb-12">
      {{ error }}
    </n-alert>
  </div>
</template>

<script setup>
import { renderAsync } from 'docx-preview'
import { onBeforeUnmount } from 'vue'

const route = useRoute()
const router = useRouter()
const containerRef = ref(null)
const viewerContentRef = ref(null)
const siderScrollRef = ref(null)
const loading = ref(false)
const error = ref('')
const hasContent = ref(false)
const currentPage = ref(1)
const pageEls = ref([])
const thumbnails = ref([])
const thumbRefs = ref({})
const thumbWidth = 140
const showThumbnails = ref(false)
const scale = ref(1)
const MIN_SCALE = 0.5
const MAX_SCALE = 3
const ZOOM_STEP = 0.1
const ZOOM_MODE = {
  FIT_PAGE: 'fit_page',
  FIT_WIDTH: 'fit_width',
  ACTUAL_SIZE: 'actual_size',
}
const zoomOptions = [
  { label: '适合页面', key: ZOOM_MODE.FIT_PAGE },
  { label: '适合页宽', key: ZOOM_MODE.FIT_WIDTH },
  { label: '实际大小', key: ZOOM_MODE.ACTUAL_SIZE },
]
const zoomMode = ref(ZOOM_MODE.ACTUAL_SIZE)
const currentZoomMode = computed(() => zoomMode.value)

// 路由进入（从文件列表点击预览）时，尝试使用 objectUrl 加载
watch(
  () => route.query.file,
  async (val) => {
    if (!val) {
      reset()
      return
    }
    try {
      const data = JSON.parse(val)
      if (data?.objectUrl) {
        await renderDocxFromUrl(data.objectUrl)
      }
      else {
        reset()
      }
    }
    catch (e) {
      console.warn('解析路由文件失败', e)
      reset()
    }
  },
  { immediate: true },
)

async function renderDocx(file) {
  loading.value = true
  error.value = ''
  hasContent.value = false
  try {
    const buffer = await file.arrayBuffer()
    if (containerRef.value) {
      containerRef.value.innerHTML = ''
    }
    await renderAsync(buffer, containerRef.value, null, {
      className: 'docxjs',
      inWrapper: true,
      breakPages: true,
      ignoreWidth: false,
      ignoreHeight: false,
      experimental: true,
      useBase64URL: true,
      ignoreLastRenderedPageBreak: false,
      renderChanges: false,
      renderHeaders: true, // enables headers rendering
      renderFooters: true, // enables footers rendering
      renderFootnotes: true, // enables footnotes rendering
      renderEndnotes: true, // enables endnotes rendering
      renderComments: false, // enables experimental comments rendering
      renderAltChunks: true, // enables altChunks (html parts) rendering
    })
    hasContent.value = !!containerRef.value?.innerHTML
    await nextTick()
    collectPages()
    buildThumbnails()
    applyZoom()
  }
  catch (err) {
    console.error(err)
    error.value = 'Word 预览失败，请确认文件为 docx 格式'
  }
  finally {
    loading.value = false
  }
}

async function renderDocxFromUrl(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    await renderDocx(blob)
  }
  catch (e) {
    console.error(e)
  }
}

// 已改为顶层包引入 renderAsync（无 CDN 动态加载）

function reset() {
  loading.value = false
  error.value = ''
  hasContent.value = false
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }
  pageEls.value = []
  thumbnails.value = []
  currentPage.value = 1
}

onBeforeUnmount(() => {
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }
})

function collectPages() {
  const root = containerRef.value
  if (!root) {
    return
  }
  // 兼容自定义 className 前缀（docxjs）和默认前缀（docx）
  const PAGE_SELECTORS = ['.docxjs-page', '.docx-page']
  const WRAPPER_SELECTORS = ['.docxjs-wrapper', '.docx-wrapper']
  let pages = []
  for (const sel of PAGE_SELECTORS) {
    pages = Array.from(root.querySelectorAll(sel))
    if (pages.length)
      break
  }
  if (!pages.length) {
    let wrapper = null
    for (const wsel of WRAPPER_SELECTORS) {
      wrapper = root.querySelector(wsel)
      if (wrapper)
        break
    }
    wrapper = wrapper || root
    pages = Array.from(wrapper.querySelectorAll(PAGE_SELECTORS.join(',')))
    if (!pages.length) {
      // 退化：将容器的直接子元素视为单页（不理想，但保证最少能显示）
      pages = Array.from(wrapper.children).filter(el => el instanceof HTMLElement)
      if (!pages.length && root instanceof HTMLElement) {
        pages = [root]
      }
    }
  }
  pageEls.value = pages
}

function buildThumbnails() {
  const pages = pageEls.value
  thumbnails.value = pages.map((_, i) => i + 1)
  // 生成 DOM 缩略图内容（克隆并缩放）
  nextTick(() => {
    pages.forEach((pageEl, idx) => {
      const target = thumbRefs.value[idx]
      if (!target) {
        return
      }
      target.innerHTML = ''
      const clone = pageEl.cloneNode(true)
      clone.removeAttribute('id')
      // 填充到缩略容器
      target.appendChild(clone)
      const scale = thumbWidth / (pageEl.offsetWidth || 1)
      target.style.transform = `scale(${scale})`
      target.style.transformOrigin = 'top left'
      target.style.width = `${pageEl.offsetWidth}px`
      target.style.height = `${pageEl.offsetHeight}px`
    })
  })
}

function thumbHeight(idx) {
  const pageEl = pageEls.value[idx]
  if (!pageEl) {
    return 0
  }
  const scale = thumbWidth / (pageEl.offsetWidth || 1)
  return (pageEl.offsetHeight || 0) * scale
}

function setThumbRef(el, idx) {
  if (!el) {
    return
  }
  thumbRefs.value[idx] = el
}

function goToPage(pageNum) {
  currentPage.value = pageNum
  const pageEl = pageEls.value[pageNum - 1]
  const container = viewerContentRef.value
  if (!pageEl || !container) {
    return
  }
  const top = pageEl.offsetTop - 8
  container.scrollTo({ top, behavior: 'smooth' })
}

function onScrollUpdate() {
  const container = viewerContentRef.value
  const pages = pageEls.value
  if (!container || !pages.length) {
    return
  }
  const scrollTop = container.scrollTop
  let active = 1
  for (let i = 0; i < pages.length; i++) {
    if (scrollTop >= (pages[i].offsetTop - 20)) {
      active = i + 1
    }
  }
  currentPage.value = active
}

function toggleThumbnails() {
  showThumbnails.value = !showThumbnails.value
}

function getZoomModeLabel(mode) {
  const option = zoomOptions.find(opt => opt.key === mode)
  return option ? option.label : '自动缩放'
}

function handleZoomModeChange(mode) {
  zoomMode.value = mode
  applyZoom()
}

function applyZoom() {
  const wrapper = (
    containerRef.value?.querySelector('.docxjs-wrapper')
    || containerRef.value?.querySelector('.docx-wrapper')
    || containerRef.value
  )
  if (!wrapper) {
    return
  }
  const container = viewerContentRef.value
  const firstPage = pageEls.value[0]
  const pageWidth = (firstPage?.offsetWidth || 800)
  const containerWidth = (container?.clientWidth || pageWidth)
  if (zoomMode.value === ZOOM_MODE.FIT_PAGE) {
    scale.value = Math.min(1, containerWidth / pageWidth)
  }
  else if (zoomMode.value === ZOOM_MODE.FIT_WIDTH) {
    scale.value = containerWidth / pageWidth
  }
  // ACTUAL_SIZE 模式保留当前 scale，不重置为 1
  wrapper.style.transform = `scale(${scale.value})`
  wrapper.style.transformOrigin = 'top center'
}

function zoomIn() {
  const next = Math.min(MAX_SCALE, Number((scale.value + ZOOM_STEP).toFixed(2)))
  if (next === scale.value) {
    return
  }
  scale.value = next
  zoomMode.value = ZOOM_MODE.ACTUAL_SIZE
  applyZoom()
}

function zoomOut() {
  const next = Math.max(MIN_SCALE, Number((scale.value - ZOOM_STEP).toFixed(2)))
  if (next === scale.value) {
    return
  }
  scale.value = next
  zoomMode.value = ZOOM_MODE.ACTUAL_SIZE
  applyZoom()
}

function handleDownload() {
  try {
    const q = route.query.file
    const data = q ? JSON.parse(String(q)) : null
    const url = data?.objectUrl
    if (!url) {
      return
    }
    const a = document.createElement('a')
    a.href = url
    a.download = data?.name || 'document.docx'
    a.click()
  }
  catch (e) {
    console.warn('download failed', e)
  }
}

function handleClose() {
  router.back()
}
</script>

<style scoped>
.word-viewer.light-theme {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
}
.viewer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 8px;
}
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 6px;
}
.zoom-mode-btn {
  min-width: 88px;
}
.zoom-percent {
  color: #6b7280;
  font-size: 12px;
}
.viewer-body {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 8px;
  height: calc(100vh - 56px);
}
.viewer-body.hide-sider {
  grid-template-columns: 1fr;
}
.sidebar {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.sider-header {
  padding: 8px 10px;
  border-bottom: 1px solid #eef2f7;
}
.sider-title {
  font-size: 13px;
  color: #6b7280;
}
.sider-scroll {
  overflow: auto;
  flex: 1;
  padding: 8px;
}
.thumb-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-item:hover {
  border-color: var(--primary-color);
}
.thumb-item.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}
.thumb-canvas-wrap {
  position: relative;
  background: #fff;
}
.thumb-content {
  width: 0; /* 由脚本设置实际尺寸并缩放 */
  height: 0;
}
.thumb-index {
  position: absolute;
  left: 0;
  top: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-bottom-right-radius: 6px;
}
.viewer-content {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  overflow: auto;
  min-height: 0;
  height: 100%;
}
.docx-container {
  display: block;
}
.docxjs {
  background: #fff !important;
}
.docxjs :deep(.docx-wrapper) {
  background: #fff !important;
}
.docxjs :deep(.docxjs-page),
.docxjs :deep(.docx-page) {
  margin: 0 auto;
}

:deep(.docxjs-wrapper) {
  background: transparent;
}
</style>
