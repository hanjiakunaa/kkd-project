<template>
  <div class="pdf-viewer-wrapper h-full flex flex-col bg-gray-900 text-gray-300">
    <n-spin :show="loading" class="h-full">
      <!-- 顶部工具栏区域 -->
      <div class="toolbar-area flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2.5 shadow-sm">
        <!-- 左侧: 侧边栏切换 + 页码显示 -->
        <div class="toolbar-left flex items-center gap-3">
          <n-button
            size="small"
            quaternary
            :focusable="false"
            class="sidebar-toggle-btn text-gray-300 transition-colors hover:bg-gray-800"
            @click="toggleThumbnails"
          >
            <template #icon>
              <i class="i-mdi:menu text-lg" />
            </template>
          </n-button>
          <div class="h-5 w-px bg-gray-700" />
          <div class="page-info flex items-center gap-1.5">
            <n-input-number
              v-model:value="pageInputValue"
              size="small"
              :min="1"
              :max="totalPages"
              :show-button="false"
              class="page-input w-12 border-gray-700 bg-gray-800 text-gray-300"
              @blur="handlePageInputBlur"
              @keyup.enter="handlePageInputEnter"
            />
            <span class="text-sm text-gray-400">/ {{ totalPages }}</span>
          </div>
        </div>

        <!-- 中间: 缩放控制 + 搜索 -->
        <div class="toolbar-center flex flex-1 items-center justify-center gap-3">
          <n-button-group size="small">
            <n-button
              :focusable="false"
              :disabled="scale <= 0.5"
              quaternary
              class="text-gray-300 transition-colors hover:bg-gray-800"
              @click="zoomOut"
            >
              <template #icon>
                <i class="i-mdi:minus text-lg" />
              </template>
            </n-button>
            <n-button
              :focusable="false"
              :disabled="scale >= 3"
              quaternary
              class="text-gray-300 transition-colors hover:bg-gray-800"
              @click="zoomIn"
            >
              <template #icon>
                <i class="i-mdi:plus text-lg" />
              </template>
            </n-button>
          </n-button-group>

          <n-dropdown
            :options="zoomOptions"
            trigger="click"
            @select="handleZoomModeChange"
          >
            <n-button
              size="small"
              :focusable="false"
              quaternary
              class="min-w-[120px] text-gray-300 transition-colors hover:bg-gray-800"
            >
              {{ getZoomModeLabel(currentZoomMode) }}
              <template #suffix>
                <i class="i-mdi:chevron-down text-sm" />
              </template>
            </n-button>
          </n-dropdown>

          <span class="zoom-percent text-sm text-gray-400">{{ Math.round(scale * 100) }}%</span>

          <div class="mx-2 h-5 w-px bg-gray-700" />

          <div class="search-box flex items-center gap-1">
            <n-input
              v-model:value="searchQuery"
              size="small"
              placeholder="搜索文本..."
              class="w-[200px] border-gray-700 bg-gray-800 text-gray-300"
              @input="handleSearch"
              @keyup.enter="handleSearchNext"
            />
            <n-button
              size="small"
              :focusable="false"
              quaternary
              class="text-gray-300 transition-colors hover:bg-gray-800"
              @click="handleSearchNext"
            >
              <template #icon>
                <i class="i-mdi:chevron-down text-lg" />
              </template>
            </n-button>
          </div>
        </div>

        <!-- 右侧: 功能按钮 -->
        <div class="toolbar-right flex items-center gap-2">
          <n-button
            size="small"
            :focusable="false"
            quaternary
            class="text-gray-300 transition-colors hover:bg-gray-800"
            @click="handleDownload"
          >
            <template #icon>
              <i class="i-mdi:download text-lg" />
            </template>
          </n-button>
          <n-button
            size="small"
            :focusable="false"
            quaternary
            class="text-gray-300 transition-colors hover:bg-gray-800"
            @click="handlePrint"
          >
            <template #icon>
              <i class="i-mdi:printer text-lg" />
            </template>
          </n-button>
          <div class="h-5 w-px bg-gray-700" />
          <n-button
            size="small"
            :focusable="false"
            quaternary
            class="text-gray-300 transition-colors hover:bg-gray-800"
            @click="handleClose"
          >
            <template #icon>
              <i class="i-mdi:close text-lg" />
            </template>
          </n-button>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content-area relative flex flex-1 overflow-hidden" style="min-height: 0;">
        <!-- 左侧边栏: 目录和缩略图 -->
        <transition name="slide-left">
          <div
            v-if="showThumbnails"
            class="sidebar-area flex flex-col shrink-0 border-r border-gray-800 bg-gray-800"
            style="width: 200px; min-height: 0;"
          >
            <!-- 侧边栏头部: 切换按钮 -->
            <div class="sidebar-header bg-gray-850 flex items-center justify-center gap-1 border-b border-gray-700 p-2">
              <n-button
                size="tiny"
                :type="sidebarView === 'outline' ? 'primary' : 'default'"
                quaternary
                :focusable="false"
                class="flex-1 text-xs"
                @click="sidebarView = 'outline'"
              >
                <template #icon>
                  <i class="i-mdi:format-list-bulleted text-base" />
                </template>
                目录
              </n-button>
              <n-button
                size="tiny"
                :type="sidebarView === 'thumbnails' ? 'primary' : 'default'"
                quaternary
                :focusable="false"
                class="flex-1 text-xs"
                @click="sidebarView = 'thumbnails'"
              >
                <template #icon>
                  <i class="i-mdi:image-multiple text-base" />
                </template>
                缩略图
              </n-button>
            </div>

            <!-- 目录视图 -->
            <div
              v-if="sidebarView === 'outline'"
              class="outline-view flex flex-col flex-1 overflow-y-auto"
              style="min-height: 0;"
            >
              <div v-if="outlineItems.length > 0" class="outline-list p-2">
                <div
                  v-for="(item, index) in outlineItems"
                  :key="index"
                  class="outline-item cursor-pointer rounded px-2 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700"
                  :class="{ 'bg-gray-700': item.page === currentPage }"
                  :style="{ paddingLeft: `${item.level * 12 + 8}px` }"
                  @click="goToPage(item.page)"
                >
                  {{ item.title }}
                </div>
              </div>
              <div v-else class="flex flex-1 items-center justify-center p-4">
                <span class="text-sm text-gray-500">暂无目录</span>
              </div>
            </div>

            <!-- 缩略图视图 -->
            <div
              v-else
              class="thumbnails-view flex flex-col flex-1 overflow-y-auto"
              style="min-height: 0;"
            >
              <div class="thumbnail-list flex flex-col gap-2 p-2">
                <div
                  v-for="pageNum in totalPages"
                  :key="pageNum"
                  class="thumbnail-item relative shrink-0 cursor-pointer rounded border-solid transition-all duration-150ms"
                  :class="{
                    'border-2 border-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]': pageNum === currentPage,
                    'border border-gray-700 hover:border-gray-500': pageNum !== currentPage,
                  }"
                  @click="goToPage(pageNum)"
                >
                  <div class="relative bg-white">
                    <canvas
                      :ref="el => setThumbnailRef(el, pageNum)"
                      class="block h-auto max-w-full w-full"
                    />
                    <!-- 页码标签 -->
                    <div class="absolute bottom-0 left-0 right-0 flex items-center justify-center from-[rgba(0,0,0,0.6)] to-transparent bg-gradient-to-t py-1">
                      <span class="text-xs text-white font-medium">{{ pageNum }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- 中间: PDF 内容渲染区域 -->
        <div
          ref="pdfViewer"
          class="content-area flex flex-1 overflow-auto bg-gray-800"
          style="min-width: 0; min-height: 0;"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        >
          <div
            ref="pdfContainer"
            class="pdf-container flex items-center justify-center p-6"
            style="min-width: 0; width: 100%;"
          >
            <!-- Canvas + 文本层容器 -->
            <div v-if="currentPage" class="relative">
              <canvas
                ref="pdfCanvas"
                class="pdf-canvas block h-auto max-w-full rounded bg-white shadow-xl"
                :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
              />
              <!-- 文本层容器（动态生成） -->
              <div ref="textLayerContainer" class="pointer-events-auto absolute left-0 top-0 h-full w-full" />
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <template v-if="!loading && !pdfDoc">
        <div class="h-full flex flex-col items-center justify-center">
          <n-empty description="无法加载 PDF 文件" class="text-gray-400">
            <template #icon>
              <i class="i-mdi:file-document-outline text-60px text-gray-600" />
            </template>
          </n-empty>
        </div>
      </template>
    </n-spin>
  </div>
</template>

<script setup>
import { useNotification } from 'naive-ui'
import * as pdfjsLib from 'pdfjs-dist'
import { TextLayerBuilder } from 'pdfjs-dist/web/pdf_viewer'
import { onBeforeUnmount } from 'vue'
import 'pdfjs-dist/web/pdf_viewer.css'

// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'

// 工具函数
const route = useRoute()
const router = useRouter()
const currentFile = ref(null)

// 响应式数据
const loading = ref(false)
const pdfDoc = ref(null)
const currentPage = ref(1)
const pageInputValue = ref(1)
const totalPages = ref(0)
const showThumbnails = ref(true)
const sidebarView = ref('thumbnails') // 'outline' | 'thumbnails'
const outlineItems = ref([])
const pdfCanvas = ref(null)
const textLayerContainer = ref(null)
const pdfContainer = ref(null)
const pdfViewer = ref(null)
const thumbnailRefs = ref({})
const scale = ref(1.0)
const isDragging = ref(false)
const renderTask = ref(null)
const dragStart = ref({ x: 0, y: 0 })
const scrollStart = ref({ left: 0, top: 0 })
const searchQuery = ref('')
const searchResults = ref([])
const currentSearchIndex = ref(0)

// 初始化通知实例
const notification = useNotification()
// 存储当前搜索通知的 ID（用于后续关闭）
const searchNotificationId = ref('')

// 缩放模式
const ZOOM_MODE = {
  AUTO: 'auto',
  FIT_PAGE: 'fit-page',
  FIT_WIDTH: 'fit-width',
  ACTUAL_SIZE: 'actual-size',
  CUSTOM: 'custom',
}
const zoomMode = ref(ZOOM_MODE.AUTO)

// 缩放选项
const zoomOptions = [
  { label: '自动缩放', key: ZOOM_MODE.AUTO },
  { label: '适合页面', key: ZOOM_MODE.FIT_PAGE },
  { label: '适合页宽', key: ZOOM_MODE.FIT_WIDTH },
  { label: '实际大小', key: ZOOM_MODE.ACTUAL_SIZE },
]

const currentZoomMode = computed(() => zoomMode.value)

// 获取缩放模式标签
function getZoomModeLabel(mode) {
  const option = zoomOptions.find(opt => opt.key === mode)
  return option ? option.label : '自动缩放'
}

// 处理缩放模式变化
function handleZoomModeChange(key) {
  zoomMode.value = key
  if (key === ZOOM_MODE.ACTUAL_SIZE) {
    scale.value = 1.0
  }
  renderPage(currentPage.value)
}

// 设置缩略图 ref
function setThumbnailRef(el, pageNum) {
  if (el) {
    thumbnailRefs.value[pageNum] = el
  }
}

// 关闭预览
function handleClose() {
  router.back()
}

// 加载 PDF 目录
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

    // 递归处理目录项
    function processOutlineItems(items, level = 0) {
      const result = []
      for (const item of items) {
        if (item.dest) {
          // 获取目标页面
          pdfDoc.value.getDestination(item.dest).then((dest) => {
            pdfDoc.value.getPageIndex(dest[0]).then((pageIndex) => {
              result.push({
                title: item.title,
                page: pageIndex + 1,
                level,
              })
            })
          })
        }
        else {
          result.push({
            title: item.title,
            page: 1,
            level,
          })
        }

        // 处理子项
        if (item.items && item.items.length > 0) {
          result.push(...processOutlineItems(item.items, level + 1))
        }
      }
      return result
    }

    // 简化版本：直接处理目录项
    const items = []
    async function processItems(itemsList, level = 0) {
      for (const item of itemsList) {
        let pageNum = 1
        if (item.dest) {
          try {
            const dest = await pdfDoc.value.getDestination(item.dest)
            if (dest && dest[0]) {
              const pageIndex = await pdfDoc.value.getPageIndex(dest[0])
              pageNum = pageIndex + 1
            }
          }
          catch (e) {
            console.warn('获取目录项页面失败:', e)
          }
        }
        items.push({
          title: item.title,
          page: pageNum,
          level,
        })

        if (item.items && item.items.length > 0) {
          await processItems(item.items, level + 1)
        }
      }
    }

    await processItems(outline)
    outlineItems.value = items
  }
  catch (error) {
    console.warn('加载目录失败:', error)
    outlineItems.value = []
  }
}

// 从路由获取文件信息并加载
async function loadPdfFromRoute() {
  try {
    // 解析路由参数
    const fileStr = route.query.file
    if (!fileStr) {
      console.error('未找到文件数据')
      $message.error('未找到要预览的文件')
      return
    }

    const fileData = JSON.parse(fileStr)
    currentFile.value = fileData

    if (!fileData.objectUrl) {
      throw new Error('文件 URL 不存在')
    }

    loading.value = true

    // 加载 PDF
    const loadingTask = pdfjsLib.getDocument({
      url: fileData.objectUrl,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    })

    const pdf = await loadingTask.promise
    pdfDoc.value = pdf
    totalPages.value = pdf.numPages
    currentPage.value = 1
    pageInputValue.value = 1

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    // 加载目录
    await loadOutline()

    await renderPage(1)

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

  const padding = 80
  const containerWidth = pdfViewer.value.clientWidth - padding
  const containerHeight = pdfViewer.value.clientHeight - padding

  if (containerWidth <= 0 || containerHeight <= 0) {
    return 1.0
  }

  const viewport = page.getViewport({ scale: 1.0 })
  const pageWidth = viewport.width
  const pageHeight = viewport.height

  if (zoomMode.value === ZOOM_MODE.FIT_WIDTH) {
    return containerWidth / pageWidth
  }
  else if (zoomMode.value === ZOOM_MODE.FIT_PAGE) {
    const widthScale = containerWidth / pageWidth
    const heightScale = containerHeight / pageHeight
    return Math.min(widthScale, heightScale)
  }
  else if (zoomMode.value === ZOOM_MODE.AUTO) {
    const widthScale = containerWidth / pageWidth
    const heightScale = containerHeight / pageHeight
    return Math.min(widthScale, heightScale)
  }
  else if (zoomMode.value === ZOOM_MODE.ACTUAL_SIZE) {
    return 1.0
  }
  else {
    return scale.value
  }
}

// 渲染指定页面（含文本层）
async function renderPage(pageNum) {
  if (!pdfDoc.value || !pdfCanvas.value || !pdfViewer.value || !textLayerContainer.value)
    return

  if (renderTask.value) {
    renderTask.value.cancel()
  }

  // 清空之前的文本层
  textLayerContainer.value.innerHTML = ''

  try {
    const page = await pdfDoc.value.getPage(pageNum)
    const calculatedScale = calculateScale(page)

    if (zoomMode.value !== ZOOM_MODE.CUSTOM && zoomMode.value !== ZOOM_MODE.ACTUAL_SIZE) {
      scale.value = calculatedScale
    }

    const viewport = page.getViewport({ scale: calculatedScale })
    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')

    // 设置 Canvas 尺寸
    canvas.height = viewport.height
    canvas.width = viewport.width

    // 渲染 Canvas 背景
    const renderContext = {
      canvasContext: context,
      viewport,
    }
    renderTask.value = page.render(renderContext)
    await renderTask.value.promise
    renderTask.value = null

    // 渲染文本层（文字可选中）
    const textContent = await page.getTextContent()
    const textLayer = new TextLayerBuilder({
      textContent,
      container: textLayerContainer.value,
      viewport,
      textDivs: [],
    })
    textLayer.render()

    // 搜索高亮
    if (searchQuery.value) {
      highlightSearchResults(textContent, searchQuery.value)
    }

    currentPage.value = pageNum
    pageInputValue.value = pageNum
  }
  catch (error) {
    if (error.name !== 'RenderingCancelledException') {
      console.error('页面渲染失败:', error)
    }
  }
}

// 搜索文本并高亮（修改 handleSearch 函数）
function handleSearch(query) {
  // 1. 先关闭之前的搜索结果通知（避免重复显示）
  if (searchNotificationId.value) {
    notification.close(searchNotificationId.value)
    searchNotificationId.value = ''
  }

  if (!pdfDoc.value || !query.trim()) {
    searchResults.value = []
    return
  }

  searchResults.value = []
  currentSearchIndex.value = 0

  // 遍历所有页面搜索
  for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
    pdfDoc.value.getPage(pageNum).then((page) => {
      page.getTextContent().then((textContent) => {
        const text = textContent.items.map(item => item.str).join('')
        const regex = new RegExp(query.trim(), 'gi')
        const matches = [...text.matchAll(regex)]

        if (matches.length) {
          searchResults.value.push({
            page: pageNum,
            count: matches.length,
            textContent,
          })

          // 当前页搜索结果高亮
          if (pageNum === currentPage.value) {
            highlightSearchResults(textContent, query.trim())
          }
        }

        // 2. 所有页面搜索完成后，显示通知（仅当有结果时）
        if (pageNum === totalPages.value && searchResults.value.length > 0) {
          const totalCount = searchResults.value.reduce((sum, item) => sum + item.count, 0)
          // 创建通知并存储 ID
          const notificationInstance = notification.info({
            title: '搜索完成',
            content: `找到 ${totalCount} 个匹配结果`,
            duration: 3000, // 3 秒后自动关闭
            onClose: () => {
              // 通知关闭后清空 ID
              searchNotificationId.value = ''
            },
          })
          // 存储通知 ID，用于后续关闭
          searchNotificationId.value = notificationInstance.id
        }
      })
    })
  }
}

// 高亮搜索结果
function highlightSearchResults(textContent, query) {
  if (!textLayerContainer.value || !query)
    return

  const textElements = textLayerContainer.value.querySelectorAll('.textLayer > div')
  if (!textElements.length)
    return

  const regex = new RegExp(query, 'gi')
  const textItems = textContent.items

  textElements.forEach((el, index) => {
    const text = textItems[index]?.str || ''
    if (regex.test(text)) {
      el.classList.add('highlight')
    }
    else {
      el.classList.remove('highlight')
    }
  })
}

// 跳转到下一个搜索结果
function handleSearchNext() {
  if (!searchResults.value.length) {
    $message.warning('暂无搜索结果')
    return
  }

  currentSearchIndex.value = (currentSearchIndex.value + 1) % searchResults.value.length
  const targetPage = searchResults[currentSearchIndex.value].page
  goToPage(targetPage)
}

// 渲染所有缩略图
async function renderThumbnails() {
  if (!pdfDoc.value || !showThumbnails.value)
    return

  const priorityPages = [
    currentPage.value,
    currentPage.value - 1,
    currentPage.value + 1,
  ].filter(p => p >= 1 && p <= totalPages.value)

  // 优先渲染当前页及相邻页
  for (const pageNum of priorityPages) {
    await renderThumbnail(pageNum)
  }

  // 渲染剩余页面
  for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
    if (!priorityPages.includes(pageNum)) {
      await renderThumbnail(pageNum)
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
    const viewport = page.getViewport({ scale: 0.3 })
    const context = canvas.getContext('2d')

    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({ canvasContext: context, viewport }).promise
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

  // 缩略图滚动到可视区域
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

// 页码输入处理
function handlePageInputBlur() {
  if (pageInputValue.value && pageInputValue.value >= 1 && pageInputValue.value <= totalPages.value) {
    goToPage(pageInputValue.value)
  }
  else {
    pageInputValue.value = currentPage.value
  }
}

function handlePageInputEnter() {
  handlePageInputBlur()
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

// 切换缩略图显示
function toggleThumbnails() {
  showThumbnails.value = !showThumbnails.value

  if (showThumbnails.value && pdfDoc.value) {
    setTimeout(() => {
      renderThumbnails()
      renderPage(currentPage.value)
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

// 鼠标拖拽滚动
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

// 下载 PDF
function handleDownload() {
  if (!currentFile.value || !currentFile.value.objectUrl) {
    $message.error('无法下载文件')
    return
  }

  const link = document.createElement('a')
  link.href = currentFile.value.objectUrl
  link.download = currentFile.value.name || 'download.pdf'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  $message.success('下载已开始')
}

// 打印 PDF
function handlePrint() {
  if (!pdfDoc.value)
    return
  window.print()
}

// 键盘快捷键
function handleKeyboard(e) {
  if (!pdfDoc.value)
    return

  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      goToPage(currentPage.value - 1)
      e.preventDefault()
      break
    case 'ArrowRight':
    case 'ArrowDown':
      goToPage(currentPage.value + 1)
      e.preventDefault()
      break
    case '+':
    case '=':
      zoomIn()
      e.preventDefault()
      break
    case '-':
      zoomOut()
      e.preventDefault()
      break
    case 'F3':
      e.preventDefault()
      document.querySelector('input[placeholder="搜索文本..."]').focus()
      break
  }
}

// 窗口大小监听
let resizeObserver = null
let resizeTimer = null

onMounted(() => {
  loadPdfFromRoute()

  // 监听容器大小变化
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

  // 监听键盘事件
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

  // 释放 blob URL
  if (currentFile.value && currentFile.value.objectUrl) {
    URL.revokeObjectURL(currentFile.value.objectUrl)
  }
  if (searchNotificationId.value) {
    notification.close(searchNotificationId.value)
  }
})

// 监听路由变化
watch(() => route.query.file, () => {
  loadPdfFromRoute()
})
</script>

<style scoped>
/* 工具栏样式 */
.toolbar :deep(.n-button) {
  color: #d1d5db;
}

.toolbar :deep(.n-button:hover) {
  background-color: #374151 !important;
}

.toolbar :deep(.n-button.n-button--disabled) {
  color: #6b7280 !important;
  cursor: not-allowed;
}

/* 页码输入框样式 */
.page-input :deep(.n-input) {
  background-color: #1f2937;
  border-color: #374151;
}

.page-input :deep(.n-input__input) {
  color: #d1d5db;
  text-align: center;
  padding: 0;
}

.page-input :deep(.n-input:hover) {
  border-color: #4b5563;
}

.page-input :deep(.n-input:focus-within) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 搜索框样式 */
:deep(.n-input) {
  --n-color-text: #d1d5db;
  --n-color-text-placeholder: #9ca3af;
  --n-color-background: #1f2937;
  --n-color-border: #374151;
  --n-color-border-hover: #4b5563;
  --n-color-border-focus: #3b82f6;
}

/* 缩略图动画 */
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

/* 缩略图列表滚动条 */
.thumbnail-list::-webkit-scrollbar {
  width: 8px;
}

.thumbnail-list::-webkit-scrollbar-track {
  background: #1f2937;
}

.thumbnail-list::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 4px;
}

.thumbnail-list::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}

/* PDF 查看器滚动条 */
.pdf-viewer::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.pdf-viewer::-webkit-scrollbar-track {
  background: #1f2937;
}

.pdf-viewer::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 6px;
}

.pdf-viewer::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}

/* PDF 画布 */
.pdf-canvas {
  transition: transform 0.2s ease;
}

/* 文本层样式增强 */
:deep(.textLayer) {
  opacity: 0.9;
  z-index: 10;
}

:deep(.textLayer > div) {
  transition: background-color 0.1s ease;
}

:deep(.textLayer > div:hover) {
  background-color: rgba(59, 130, 246, 0.1);
}

:deep(.textLayer .highlight) {
  background-color: rgba(251, 191, 36, 0.3);
  color: transparent;
}

/* 防止拖拽时选中文本 */
.pdf-viewer {
  user-select: none;
}

/* 缩略图样式 */
.thumbnail-item {
  transition: all 0.2s ease;
}

.thumbnail-item:hover {
  transform: scale(1.02);
}

/* 加载状态优化 */
:deep(.n-spin__content) {
  background-color: #111827;
}
</style>
