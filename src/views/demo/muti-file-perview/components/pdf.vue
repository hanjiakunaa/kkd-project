<template>
  <div class="h-full flex flex-col">
    <n-spin :show="loading">
      <div class="h-full flex flex-col bg-#f5f5f5">
        <!-- 工具栏 -->
        <div class="min-w-0 flex shrink-0 items-center justify-between overflow-hidden border-b border-#e0e0e0 border-solid bg-white px-4 py-3 shadow-sm">
          <!-- 左侧：翻页控制 -->
          <div class="min-w-0 flex flex-1 items-center gap-3">
            <n-button-group>
              <n-button
                :disabled="currentPage <= 1"
                @click="goToPage(currentPage - 1)"
              >
                <template #icon>
                  <i class="i-mdi:chevron-left" />
                </template>
              </n-button>
              <n-button
                :disabled="currentPage >= totalPages"
                @click="goToPage(currentPage + 1)"
              >
                <template #icon>
                  <i class="i-mdi:chevron-right" />
                </template>
              </n-button>
            </n-button-group>

            <div class="flex items-center gap-2">
              <n-input-number
                v-model:value="currentPage"
                :min="1"
                :max="totalPages"
                :show-button="false"
                size="small"
                class="w-16"
                @update:value="handlePageChange"
              />
              <span class="text-#999">/</span>
              <span class="text-#666">{{ totalPages }}</span>
            </div>
          </div>

          <!-- 中间：缩放控制 -->
          <div class="flex items-center gap-2">
            <n-button-group>
              <n-button
                size="small"
                :disabled="scale <= 0.5"
                @click="zoomOut"
              >
                <template #icon>
                  <i class="i-mdi:minus" />
                </template>
              </n-button>
              <n-button
                size="small"
                @click="resetZoom"
              >
                {{ Math.round(scale * 100) }}%
              </n-button>
              <n-button
                size="small"
                :disabled="scale >= 3"
                @click="zoomIn"
              >
                <template #icon>
                  <i class="i-mdi:plus" />
                </template>
              </n-button>
            </n-button-group>

            <n-divider vertical />

            <n-button
              size="small"
              @click="fitToWidth"
            >
              <template #icon>
                <i class="i-mdi:arrow-expand-horizontal" />
              </template>
              适应宽度
            </n-button>

            <n-button
              size="small"
              @click="fitToPage"
            >
              <template #icon>
                <i class="i-mdi:fit-to-page-outline" />
              </template>
              适应页面
            </n-button>
          </div>

          <!-- 右侧：功能按钮 -->
          <div class="flex shrink-0 items-center gap-2">
            <n-button
              size="small"
              @click="toggleThumbnails"
            >
              <template #icon>
                <i :class="showThumbnails ? 'i-mdi:view-grid' : 'i-mdi:view-grid-outline'" />
              </template>
              {{ showThumbnails ? '隐藏' : '显示' }}缩略图
            </n-button>

            <n-button
              type="primary"
              size="small"
              @click="handleDownload"
            >
              <template #icon>
                <i class="i-mdi:download" />
              </template>
              下载
            </n-button>
          </div>
        </div>

        <!-- 主内容区 - 关键：使用 flex 布局，固定高度，防止内容溢出 -->
        <div class="relative flex flex-1 overflow-hidden" style="min-height: 0;">
          <!-- 缩略图侧边栏 - 关键：flex 布局 + overflow-hidden 限制高度 -->
          <transition name="slide">
            <div
              v-if="showThumbnails"
              class="thumbnail-sidebar flex flex-col shrink-0 border-r border-#e0e0e0 border-solid bg-white"
              style="width: 200px; min-height: 0; max-height: 100%;"
            >
              <!-- 标题栏 - 固定不滚动 -->
              <div class="shrink-0 border-b border-#e0e0e0 border-solid bg-#fafafa px-3 py-2">
                <n-text strong class="text-13px">
                  缩略图 ({{ totalPages }})
                </n-text>
              </div>

              <!-- 缩略图列表 - 可滚动区域，关键：flex-1 + overflow-y-auto -->
              <div
                class="thumbnail-list flex flex-col flex-1 gap-2 overflow-y-auto p-2.5"
                style="min-height: 0;"
              >
                <div
                  v-for="pageNum in totalPages"
                  :key="pageNum"
                  class="thumbnail-item relative shrink-0 cursor-pointer border-2 border-transparent rounded-1 border-solid bg-#fafafa p-1.5 transition-all duration-200ms hover:shadow-sm"
                  :class="{
                    'border-#18a058! bg-#e6f7ff! shadow-sm': pageNum === currentPage,
                    'hover:border-#d4d4d8 hover:bg-#f5f5f5': pageNum !== currentPage,
                  }"
                  @click="goToPage(pageNum)"
                >
                  <div class="relative">
                    <canvas
                      :ref="el => setThumbnailRef(el, pageNum)"
                      class="block h-auto max-w-full w-full rounded-[2px] bg-white"
                    />
                    <!-- 页码标签 -->
                    <div
                      class="absolute bottom-1 right-1 rounded-[2px] px-1.5 py-0.5 text-11px"
                      :class="pageNum === currentPage ? 'bg-#18a058 text-white font-500' : 'bg-[rgba(0,0,0,0.6)] text-white'"
                    >
                      {{ pageNum }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>

          <!-- PDF 渲染区域 - 关键：flex-1 自动填充剩余空间 -->
          <div
            ref="pdfViewer"
            class="pdf-viewer flex flex-1 items-center justify-center overflow-auto bg-#525659"
            style="min-width: 0; min-height: 0;"
          >
            <div
              ref="pdfContainer"
              class="pdf-container flex items-center justify-center p-4"
              style="min-width: 0; width: 100%;"
            >
              <canvas
                ref="pdfCanvas"
                class="pdf-canvas block h-auto max-w-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
              />
            </div>
          </div>
        </div>
      </div>

      <n-empty
        v-if="!loading && !pdfDoc"
        description="无法加载 PDF 文件"
        class="mt-20"
      />
    </n-spin>
  </div>
</template>

<script setup>
import * as pdfjsLib from 'pdfjs-dist'
import * as PdfWorker from 'pdfjs-dist/build/pdf.worker.js'
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
})

// 配置 worker
window.pdfjsWorker = PdfWorker
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

// 响应式数据
const loading = ref(false)
const pdfDoc = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const showThumbnails = ref(true)
const pdfCanvas = ref(null)
const pdfContainer = ref(null)
const pdfViewer = ref(null)
const thumbnailRefs = ref({})
const scale = ref(1.0)
const isDragging = ref(false)
const renderTask = ref(null)

// 缩放模式
const ZOOM_MODE = {
  CUSTOM: 'custom',
  FIT_WIDTH: 'fit-width',
  FIT_PAGE: 'fit-page',
}
const zoomMode = ref(ZOOM_MODE.FIT_PAGE)

// 设置缩略图 ref
function setThumbnailRef(el, pageNum) {
  if (el) {
    thumbnailRefs.value[pageNum] = el
  }
}

// 加载 PDF 文档
async function loadPdf(file) {
  if (!file) {
    pdfDoc.value = null
    totalPages.value = 0
    currentPage.value = 1
    return
  }

  try {
    loading.value = true
    const fileUrl = props.file.objectUrl || URL.createObjectURL(file)
    const loadingTask = pdfjsLib.getDocument({
      url: fileUrl,
      // 添加配置提高兼容性
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    })

    const pdf = await loadingTask.promise
    pdfDoc.value = pdf
    totalPages.value = pdf.numPages
    currentPage.value = 1

    // 等待 DOM 更新
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    // 渲染第一页
    await renderPage(1)

    // 如果显示缩略图，渲染缩略图
    if (showThumbnails.value) {
      renderThumbnails()
    }
  }
  catch (error) {
    console.error('PDF 加载失败:', error)
    $message.error('PDF 文件加载失败')
  }
  finally {
    loading.value = false
  }
}

// 计算合适的缩放比例
function calculateScale(page) {
  if (!pdfViewer.value)
    return 1.0

  const padding = 40
  const containerWidth = pdfViewer.value.clientWidth - padding
  const containerHeight = pdfViewer.value.clientHeight - padding

  if (containerWidth <= 0 || containerHeight <= 0) {
    return 1.0
  }

  const viewport = page.getViewport({ scale: 1.0 })
  const pageWidth = viewport.width
  const pageHeight = viewport.height

  if (zoomMode.value === ZOOM_MODE.FIT_WIDTH) {
    // 适应宽度
    return containerWidth / pageWidth
  }
  else if (zoomMode.value === ZOOM_MODE.FIT_PAGE) {
    // 适应页面（默认）
    const widthScale = containerWidth / pageWidth
    const heightScale = containerHeight / pageHeight
    return Math.min(widthScale, heightScale)
  }
  else {
    // 自定义缩放
    return scale.value
  }
}

// 渲染指定页面
async function renderPage(pageNum) {
  if (!pdfDoc.value || !pdfCanvas.value || !pdfViewer.value)
    return

  // 取消之前的渲染任务
  if (renderTask.value) {
    renderTask.value.cancel()
  }

  try {
    const page = await pdfDoc.value.getPage(pageNum)

    // 计算缩放比例
    const calculatedScale = calculateScale(page)

    // 如果不是自定义模式，更新 scale 值
    if (zoomMode.value !== ZOOM_MODE.CUSTOM) {
      scale.value = calculatedScale
    }

    const viewport = page.getViewport({ scale: calculatedScale })
    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')

    // 设置 canvas 尺寸
    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: context,
      viewport,
    }

    // 开始渲染
    renderTask.value = page.render(renderContext)
    await renderTask.value.promise
    renderTask.value = null

    currentPage.value = pageNum
  }
  catch (error) {
    if (error.name === 'RenderingCancelledException') {
      console.log('渲染被取消')
    }
    else {
      console.error('页面渲染失败:', error)
      $message.error('页面渲染失败')
    }
  }
}

// 渲染所有缩略图（使用异步队列，避免阻塞）
async function renderThumbnails() {
  if (!pdfDoc.value || !showThumbnails.value)
    return

  // 先渲染当前页和前后各一页
  const priorityPages = [
    currentPage.value,
    currentPage.value - 1,
    currentPage.value + 1,
  ].filter(p => p >= 1 && p <= totalPages.value)

  for (const pageNum of priorityPages) {
    await renderThumbnail(pageNum)
  }

  // 然后渲染其他页面
  for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
    if (!priorityPages.includes(pageNum)) {
      await renderThumbnail(pageNum)
      // 添加小延迟，避免阻塞主线程
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }
}

// 渲染单个缩略图
async function renderThumbnail(pageNum) {
  if (!pdfDoc.value)
    return

  try {
    const canvas = thumbnailRefs.value[pageNum]
    if (!canvas)
      return

    const page = await pdfDoc.value.getPage(pageNum)
    const viewport = page.getViewport({ scale: 0.35 })
    const context = canvas.getContext('2d')

    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: context,
      viewport,
    }

    await page.render(renderContext).promise
  }
  catch (error) {
    console.error(`缩略图 ${pageNum} 渲染失败:`, error)
  }
}

// 跳转到指定页面
function goToPage(pageNum) {
  if (pageNum < 1 || pageNum > totalPages.value)
    return
  renderPage(pageNum)

  // 滚动缩略图到可见区域
  if (showThumbnails.value) {
    nextTick(() => {
      const thumbnailList = document.querySelector('.thumbnail-list')
      const activeThumbnail = document.querySelector(`.thumbnail-item:nth-child(${pageNum})`)
      if (thumbnailList && activeThumbnail) {
        activeThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    })
  }
}

// 处理页面输入框变化
function handlePageChange(value) {
  if (value && value >= 1 && value <= totalPages.value) {
    goToPage(value)
  }
}

// 缩放功能
function zoomIn() {
  zoomMode.value = ZOOM_MODE.CUSTOM
  scale.value = Math.min(scale.value + 0.25, 3)
  renderPage(currentPage.value)
}

function zoomOut() {
  zoomMode.value = ZOOM_MODE.CUSTOM
  scale.value = Math.max(scale.value - 0.25, 0.5)
  renderPage(currentPage.value)
}

function resetZoom() {
  zoomMode.value = ZOOM_MODE.CUSTOM
  scale.value = 1.0
  renderPage(currentPage.value)
}

function fitToWidth() {
  zoomMode.value = ZOOM_MODE.FIT_WIDTH
  renderPage(currentPage.value)
}

function fitToPage() {
  zoomMode.value = ZOOM_MODE.FIT_PAGE
  renderPage(currentPage.value)
}

// 切换缩略图显示
function toggleThumbnails() {
  showThumbnails.value = !showThumbnails.value

  if (showThumbnails.value && pdfDoc.value) {
    setTimeout(() => {
      renderThumbnails()
      if (currentPage.value) {
        renderPage(currentPage.value)
      }
    }, 300)
  }
  else {
    setTimeout(() => {
      if (currentPage.value && pdfDoc.value) {
        renderPage(currentPage.value)
      }
    }, 300)
  }
}

// 下载 PDF
function handleDownload() {
  if (!props.file?.rawFile) {
    $message.error('无法下载文件')
    return
  }

  const url = props.file.objectUrl || URL.createObjectURL(props.file.rawFile)
  const link = document.createElement('a')
  link.href = url
  link.download = props.file.name || 'download.pdf'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  if (!props.file.objectUrl) {
    URL.revokeObjectURL(url)
  }

  $message.success('下载已开始')
}

function handleKeyboard(e) {
  if (!pdfDoc.value)
    return

  switch (e.key) {
    case 'ArrowLeft':
      goToPage(currentPage.value - 1)
      break
    case 'ArrowRight':
      goToPage(currentPage.value + 1)
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
      zoomOut()
      break
    case '0':
      resetZoom()
      break
  }
}

// 监听文件变化
watch(
  () => props.file?.rawFile,
  (file) => {
    loadPdf(file)
  },
  { immediate: true },
)

// ResizeObserver 监听容器大小变化
let resizeObserver = null
let resizeTimer = null

onMounted(() => {
  if (pdfViewer.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (pdfDoc.value && currentPage.value) {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          renderPage(currentPage.value)
        }, 200)
      }
    })
    resizeObserver.observe(pdfViewer.value)
  }

  document.addEventListener('keydown', handleKeyboard)
})

onBeforeUnmount(() => {
  // 清理资源
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (resizeTimer) {
    clearTimeout(resizeTimer)
  }
  if (renderTask.value) {
    renderTask.value.cancel()
  }
  if (pdfDoc.value) {
    pdfDoc.value.destroy()
  }
  document.removeEventListener('keydown', handleKeyboard)
})
</script>

<style scoped>
/* 缩略图滑入滑出动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 缩略图列表滚动条样式 */
.thumbnail-list {
  /* 确保滚动容器正确工作 */
  overflow-y: auto;
  overflow-x: hidden;
}

.thumbnail-list::-webkit-scrollbar {
  width: 6px;
}

.thumbnail-list::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.thumbnail-list::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 3px;
}

.thumbnail-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.pdf-viewer::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.pdf-viewer::-webkit-scrollbar-track {
  background: #404040;
}

.pdf-viewer::-webkit-scrollbar-thumb {
  background: #666;
  border-radius: 5px;
}

.pdf-viewer::-webkit-scrollbar-thumb:hover {
  background: #888;
}

/* PDF 容器样式优化 */
.pdf-canvas {
  transition: transform 0.2s ease;
}
</style>
