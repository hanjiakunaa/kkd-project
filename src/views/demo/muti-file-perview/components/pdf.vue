<template>
  <div class="pdf-viewer light-theme">
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
          <div class="page-info">
            <n-input-number
              v-model:value="pageInputValue"
              size="small"
              :min="1"
              :max="totalPages"
              :show-button="false"
              class="page-input"
              @blur="handlePageInputBlur"
              @keyup.enter="handlePageInputEnter"
            />
            <span class="page-total">/ {{ totalPages }}</span>
          </div>
        </div>

        <div class="toolbar-center">
          <n-button-group size="small">
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
          </n-button-group>
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
              <h-icon name="md-close" />
            </template>
          </n-button>
        </div>
      </div>

      <!-- 主体区域 -->
      <div class="viewer-body">
        <!-- 左侧缩略栏 -->
        <transition name="slide-left">
          <div v-if="showThumbnails" class="viewer-sider">
            <div class="sider-tabs">
              <n-button size="tiny" quaternary :type="sidebarView === 'outline' ? 'primary' : 'default'" :focusable="false" class="tab-btn" @click="sidebarView = 'outline'">
                <template #icon>
                  <h-icon name="bi-card-list" />
                </template>
              </n-button>
              <n-button size="tiny" quaternary :type="sidebarView === 'thumbnails' ? 'primary' : 'default'" :focusable="false" class="tab-btn" @click="sidebarView = 'thumbnails'">
                <template #icon>
                  <h-icon name="fa-images" />
                </template>
              </n-button>
            </div>

            <div v-show="sidebarView === 'outline'" class="outline-view">
              <div v-if="outlineItems.length" class="outline-list">
                <div
                  v-for="(item, index) in outlineItems"
                  :key="index"
                  class="outline-item"
                  :class="{ active: item.page === currentPage }"
                  :style="{ paddingLeft: `${item.level * 12 + 8}px` }"
                  @click="goToPage(item.page)"
                >
                  {{ item.title }}
                </div>
              </div>
              <div v-else class="outline-empty">
                暂无目录
              </div>
            </div>

            <div v-show="sidebarView === 'thumbnails'" class="thumbs-view">
              <div class="thumbs-list">
                <div
                  v-for="pageNum in totalPages"
                  :key="pageNum"
                  class="thumb-item"
                  :class="{ active: pageNum === currentPage }"
                  @click="goToPage(pageNum)"
                >
                  <div class="thumb-canvas-wrap">
                    <canvas :ref="el => setThumbnailRef(el, pageNum)" class="thumb-canvas" />
                    <div class="thumb-index">
                      {{ pageNum }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- 内容区 -->
        <div
          ref="pdfViewer"
          class="viewer-content"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        >
          <div ref="pagesContainer" class="pages-container">
            <div
              v-for="pageNum in pageNums"
              :key="pageNum"
              :ref="el => setPageStageRef(el, pageNum)"
              class="page-stage"
              :data-page="pageNum"
            >
              <canvas :ref="el => setPageCanvasRef(el, pageNum)" class="pdf-canvas" />
              <div :ref="el => setTextLayerRef(el, pageNum)" class="text-layer textLayer" />
            </div>
          </div>
        </div>
      </div>
    </n-spin>
    <!-- 全局错误提示，保持单根节点 -->
    <n-alert v-if="errorMsg" type="error" class="error-tip">
      {{ errorMsg }}
    </n-alert>
  </div>
</template>

<script setup>
import { addIcons } from 'oh-vue-icons'
import { BiCardList, BiDownload, BiLayoutTextSidebarReverse, FaImages, LaSearchMinusSolid, LaSearchPlusSolid, MdClose } from 'oh-vue-icons/icons'
import * as pdfjsLib from 'pdfjs-dist'
import { TextLayerBuilder } from 'pdfjs-dist/web/pdf_viewer'
import { onBeforeUnmount } from 'vue'
import 'pdfjs-dist/web/pdf_viewer.css'

addIcons(BiLayoutTextSidebarReverse, BiDownload, FaImages, BiCardList, LaSearchMinusSolid, MdClose, LaSearchPlusSolid)

// 使用与项目依赖一致的 pdf.js 版本（2.9.359）
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.9.359/build/pdf.worker.min.js'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMsg = ref('')
const pdfDoc = ref(null)
const currentPage = ref(1)
const pageInputValue = ref(1)
const totalPages = ref(0)
const showThumbnails = ref(true)
const sidebarView = ref('thumbnails')
const outlineItems = ref([])
const pagesContainer = ref(null)
const pageStageRefs = ref({})
const pageCanvasRefs = ref({})
const textLayerRefs = ref({})
const pdfViewer = ref(null)
const thumbnailRefs = ref({})
const thumbnailsRendered = ref(false)
const scale = ref(1.0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const scrollStart = ref({ left: 0, top: 0 })
const renderTask = ref(null)
// 已移除搜索相关状态

const ZOOM_MODE = {
  AUTO: 'auto',
  FIT_PAGE: 'fit-page',
  FIT_WIDTH: 'fit-width',
  ACTUAL_SIZE: 'actual-size',
  CUSTOM: 'custom',
}
const zoomMode = ref(ZOOM_MODE.ACTUAL_SIZE)
const zoomOptions = [
  { label: '自动缩放', key: ZOOM_MODE.AUTO },
  { label: '适合页面', key: ZOOM_MODE.FIT_PAGE },
  { label: '适合页宽', key: ZOOM_MODE.FIT_WIDTH },
  { label: '实际大小', key: ZOOM_MODE.ACTUAL_SIZE },
]
const currentZoomMode = computed(() => zoomMode.value)
const pageNums = computed(() => Array.from({ length: totalPages.value || 0 }, (_, i) => i + 1))

function getZoomModeLabel(mode) {
  const option = zoomOptions.find(opt => opt.key === mode)
  return option ? option.label : '自动缩放'
}

function handleZoomModeChange(key) {
  zoomMode.value = key
  if (key === ZOOM_MODE.ACTUAL_SIZE)
    scale.value = 1.0
  // 切换缩放模式后重新渲染所有页面
  renderAllPages()
}

function setThumbnailRef(el, pageNum) {
  if (el)
    thumbnailRefs.value[pageNum] = el
}

function setPageStageRef(el, pageNum) {
  if (el)
    pageStageRefs.value[pageNum] = el
}

function setPageCanvasRef(el, pageNum) {
  if (el)
    pageCanvasRefs.value[pageNum] = el
}

function setTextLayerRef(el, pageNum) {
  if (el)
    textLayerRefs.value[pageNum] = el
}

function handleClose() {
  router.back()
}

async function loadOutline() {
  if (!pdfDoc.value) {
    outlineItems.value = []
    return
  }
  try {
    const outline = await pdfDoc.value.getOutline()
    if (!outline || outline.length === 0) {
      outlineItems.value = []
      return
    }
    const items = []
    async function processItems(list, level = 0) {
      for (const item of list) {
        let pageNum = 1
        if (item.dest) {
          try {
            const dest = await pdfDoc.value.getDestination(item.dest)
            if (dest && dest[0]) {
              const pageIndex = await pdfDoc.value.getPageIndex(dest[0])
              pageNum = pageIndex + 1
            }
          }
          catch (err) {
            console.warn('outline item error', err)
          }
        }
        items.push({ title: item.title, page: pageNum, level })
        if (item.items && item.items.length) {
          await processItems(item.items, level + 1)
        }
      }
    }
    await processItems(outline)
    outlineItems.value = items
  }
  catch (err) {
    console.warn('load outline error', err)
    outlineItems.value = []
  }
}

async function loadPdfFromRoute() {
  try {
    const fileStr = route.query?.file || ''
    let url = ''
    if (fileStr) {
      try {
        const fileData = JSON.parse(fileStr)
        console.log('fileData', fileData)

        // 兼容父页面传递的不同字段：objectUrl / url / src / path
        url = fileData?.objectUrl || fileData?.url || fileData?.src || fileData?.path || ''
      }
      catch {
        url = ''
      }
    }
    // 路由未传文件时，默认加载 public 下的 11.pdf
    if (!url)
      url = '/11.pdf'
    loading.value = true
    const loadingTask = pdfjsLib.getDocument({
      url,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.9.359/cmaps/',
      cMapPacked: true,
    })
    const pdf = await loadingTask.promise
    pdfDoc.value = pdf
    totalPages.value = pdf.numPages
    currentPage.value = 1
    pageInputValue.value = 1
    await nextTick()
    await new Promise(r => setTimeout(r, 50))
    await loadOutline()
    await nextTick()
    await renderAllPages()
    if (showThumbnails.value) {
      renderThumbnails()
      thumbnailsRendered.value = true
    }
  }
  catch (err) {
    console.error(err)
    errorMsg.value = 'PDF 文件加载失败'
  }
  finally {
    loading.value = false
  }
}

function calculateScale(page) {
  if (!pdfViewer.value)
    return 1.0
  const padding = 80
  const containerWidth = pdfViewer.value.clientWidth - padding
  const containerHeight = pdfViewer.value.clientHeight - padding
  const viewport = page.getViewport({ scale: 1.0 })
  const pageWidth = viewport.width
  const pageHeight = viewport.height
  if (zoomMode.value === ZOOM_MODE.FIT_WIDTH) {
    return containerWidth / pageWidth
  }
  else if ([ZOOM_MODE.FIT_PAGE, ZOOM_MODE.AUTO].includes(zoomMode.value)) {
    const w = containerWidth / pageWidth
    const h = containerHeight / pageHeight
    return Math.min(w, h)
  }
  else if (zoomMode.value === ZOOM_MODE.ACTUAL_SIZE) {
    return 1.0
  }
  return scale.value
}

async function renderAllPages() {
  if (!pdfDoc.value || !pdfViewer.value)
    return
  // 渲染所有页到各自的 canvas 和文本层
  for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
    try {
      const page = await pdfDoc.value.getPage(pageNum)
      const calculatedScale = calculateScale(page)
      if (![ZOOM_MODE.CUSTOM, ZOOM_MODE.ACTUAL_SIZE].includes(zoomMode.value))
        scale.value = calculatedScale
      const viewport = page.getViewport({ scale: calculatedScale })
      const canvas = pageCanvasRefs.value[pageNum]
      const container = textLayerRefs.value[pageNum]
      const stage = pageStageRefs.value[pageNum]
      if (!canvas || !container)
        continue
      const context = canvas.getContext('2d')
      const dpr = Math.max(window.devicePixelRatio || 1, 1)
      // 物理像素按 DPR 放大，CSS 尺寸保持视口大小，提升清晰度
      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`
      // 保证外层舞台与画布尺寸保持一致，避免缩放时布局挤压变形
      if (stage) {
        stage.style.width = `${Math.floor(viewport.width)}px`
        stage.style.height = `${Math.floor(viewport.height)}px`
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.imageSmoothingEnabled = false
      const renderContext = { canvasContext: context, viewport }
      const task = page.render(renderContext)
      await task.promise
      const textContent = await page.getTextContent()
      container.innerHTML = ''
      const textLayer = new TextLayerBuilder({
        textLayerDiv: container,
        pageIndex: pageNum - 1,
        viewport,
        enhanceTextSelection: false,
      })
      textLayer.setTextContent(textContent)
      textLayer.render()
    }
    catch (err) {
      if (err.name !== 'RenderingCancelledException')
        console.error(`页面 ${pageNum} 渲染失败:`, err)
    }
  }
}

// 搜索功能已移除

async function renderThumbnails() {
  if (!pdfDoc.value || !showThumbnails.value)
    return
  for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
    await renderThumbnail(pageNum)
    await new Promise(r => setTimeout(r, 10))
  }
}

async function renderThumbnail(pageNum) {
  if (!pdfDoc.value)
    return
  try {
    const canvas = thumbnailRefs.value[pageNum]
    if (!canvas)
      return
    const page = await pdfDoc.value.getPage(pageNum)
    const viewport = page.getViewport({ scale: 0.28 })
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width
    await page.render({ canvasContext: context, viewport }).promise
  }
  catch (err) {
    console.warn('thumbnail error', err)
  }
}

function goToPage(pageNum) {
  if (pageNum < 1 || pageNum > totalPages.value)
    return
  // 更新页码状态
  currentPage.value = pageNum
  pageInputValue.value = pageNum
  // 滚动到对应页面的位置（使用容器 scrollTop，避免滚动到窗口）
  const stage = pageStageRefs.value[pageNum]
  const container = pdfViewer.value
  if (stage && container) {
    const offsetTop = stage.offsetTop - 20
    container.scrollTo({ top: offsetTop, behavior: 'smooth' })
  }
}

function handlePageInputBlur() {
  const val = pageInputValue.value
  const valid = val && val >= 1 && val <= totalPages.value
  if (valid)
    goToPage(val)
  else
    pageInputValue.value = currentPage.value
}

function handlePageInputEnter() {
  handlePageInputBlur()
}

function zoomIn() {
  zoomMode.value = ZOOM_MODE.CUSTOM
  scale.value = Math.min(scale.value + 0.25, 3)
  renderAllPages()
}

function zoomOut() {
  zoomMode.value = ZOOM_MODE.CUSTOM
  scale.value = Math.max(scale.value - 0.25, 0.5)
  renderAllPages()
}

function toggleThumbnails() {
  showThumbnails.value = !showThumbnails.value
  if (showThumbnails.value && pdfDoc.value) {
    thumbnailsRendered.value = false
    setTimeout(async () => {
      await nextTick()
      renderThumbnails()
      thumbnailsRendered.value = true
    }, 300)
  }
}

function handleMouseDown(e) {
  if (e.button !== 0)
    return
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  scrollStart.value = {
    left: pdfViewer.value.scrollLeft,
    top: pdfViewer.value.scrollTop,
  }
}

function handleMouseMove(e) {
  if (!isDragging.value)
    return
  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  pdfViewer.value.scrollLeft = scrollStart.value.left - dx
  pdfViewer.value.scrollTop = scrollStart.value.top - dy
}

function handleMouseUp() {
  isDragging.value = false
}

function handleDownload() {
  const fileStr = route.query.file
  if (!fileStr)
    return
  const fileData = JSON.parse(fileStr)
  if (!fileData.objectUrl)
    return
  const link = document.createElement('a')
  link.href = fileData.objectUrl
  link.download = fileData.name || 'download.pdf'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

let resizeObserver = null
let resizeTimer = null
onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (resizeTimer)
    clearTimeout(resizeTimer)
  if (renderTask.value)
    renderTask.value.cancel()
  if (pdfDoc.value)
    pdfDoc.value.destroy()
})

onMounted(() => {
  loadPdfFromRoute()
  if (pdfViewer.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (pdfDoc.value && currentPage.value) {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          renderAllPages()
        }, 200)
      }
    })
    resizeObserver.observe(pdfViewer.value)
  }
})

watch(
  () => route.query.file,
  () => {
    loadPdfFromRoute()
  },
)

// 切换侧栏视图时，如果进入缩略图视图则重新渲染缩略图
watch(
  () => sidebarView.value,
  async (val) => {
    if (val === 'thumbnails' && pdfDoc.value && !thumbnailsRendered.value) {
      await nextTick()
      renderThumbnails()
      thumbnailsRendered.value = true
    }
  },
)
</script>

<style scoped>
/* 容器与主题（明亮还原） */
.pdf-viewer.light-theme {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f3f4f6;
  color: #1f2937;
  overflow: hidden; /* 让主体只在内容区滚动 */
}

/* 顶部工具栏 */
.viewer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 12px;
  position: sticky;
  top: 0;
  z-index: 10;
  height: 48px; /* 固定工具栏高度，便于侧栏计算 */
}
.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-center {
  flex: 1;
  justify-content: center;
}
.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 8px;
}
.page-info {
  display: flex;
  align-items: center;
  gap: 4px; /* 更紧凑的间距 */
}
.page-total {
  color: #6b7280;
  font-size: 11px; /* 更小的页数字号 */
}
.zoom-mode-btn {
  min-width: 120px;
}
.zoom-percent {
  color: #6b7280;
  font-size: 12px;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
}
.search-input {
  width: 200px;
}

/* 主体布局 */
.viewer-body {
  display: flex;
  flex: 1;
  min-height: 0;
  height: calc(100vh - 48px); /* 固定内容区高度，启用自身滚动 */
}
.viewer-sider {
  width: 210px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许子容器滚动 */
  height: calc(100vh - 48px); /* 固定侧栏可视高度 */
}
.sider-tabs {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}
.tab-btn {
  flex: 1;
  font-size: 12px;
}

/* 目录 */
.outline-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* 修复滚动被挤压问题 */
}
.outline-list {
  padding: 8px;
}
.outline-item {
  cursor: pointer;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  color: #374151;
  background: #f3f4ff;
  margin-bottom: 8px;
  border-left: 3px solid transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}
.outline-item:hover {
  background: #eaf1ff;
  border-left-color: #93c5fd;
}
.outline-item.active {
  background: #e0ecff;
  border-left-color: #3b82f6;
}
.outline-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 13px;
}

/* 缩略图 */
.thumbs-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* 保证缩略视图可滚动 */
  height: 100%;
}
.thumbs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}
.thumb-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
}
.thumb-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}
.thumb-item.active {
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
.thumb-canvas-wrap {
  position: relative;
  background: #fff;
}
.thumb-canvas {
  display: block;
  width: 100%;
  height: auto;
}
.thumb-index {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
  padding: 4px 0;
}

/* 内容区（居中白纸效果） */
.viewer-content {
  flex: 1;
  overflow-y: auto; /* 显示内容区滚动条 */
  background: #e5e7eb;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
  min-height: 0;
}
.pages-container {
  display: flex;
  flex-direction: column;
  align-items: center; /* 始终居中，缩小时保持不偏移 */
}
.page-stage {
  position: relative;
  margin: 40px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}
.pdf-canvas {
  display: block;
  transition: transform 0.2s ease;
}
.text-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}
.text-layer :deep(.textLayer) {
  opacity: 0.95;
  z-index: 10;
}
.text-layer :deep(.textLayer > div:hover) {
  background: rgba(59, 130, 246, 0.08);
}

/* 过渡 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}
.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* Naive UI 内嵌样式修饰 */
/* 控制输入框整体宽度 */
.page-input {
  width: 64px;
}
.page-input :deep(.n-input) {
  background: #fff;
  border-color: #e5e7eb;
  height: 26px; /* 更小高度 */
}
.page-input :deep(.n-input__input) {
  text-align: center;
  padding: 0;
  font-size: 12px; /* 更小字号 */
  line-height: 24px;
}
.page-input :deep(.n-input:hover) {
  border-color: #d1d5db;
}
.page-input :deep(.n-input:focus-within) {
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.error-tip {
  margin: 12px;
}
</style>
