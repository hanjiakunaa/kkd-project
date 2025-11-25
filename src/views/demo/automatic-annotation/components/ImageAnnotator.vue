<template>
  <div class="annotator">
    <div class="toolbar">
      <!-- 左侧：上传区 + 模式切换 -->
      <n-space :size="8" align="center">
        <n-upload
          :show-file-list="false"
          accept=".png,.jpg,.jpeg,.webp"
          :on-change="handleUploadChange"
        >
          <n-button type="primary" ghost>
            <i class="i-mdi:upload text-16" />
            上传图片
          </n-button>
        </n-upload>

        <!-- 修改点：将 @change 改为 @update:value -->
        <n-switch
          v-model:value="useSvg"
          label="SVG 模式"
          size="small"
          @update:value="switchRenderMode"
        />

        <n-tag v-if="imageLoaded && fileMeta.name" size="small" bordered>
          <i class="i-mdi:file-image-outline mr-6 text-14" />
          {{ fileMeta.name }}
          <span v-if="fileMeta.width && fileMeta.height"> · {{ fileMeta.width }}×{{ fileMeta.height }}</span>
        </n-tag>

        <n-button
          v-if="imageLoaded"
          secondary
          circle
          size="small"
          title="适配画布"
          @click="zoomToFit"
        >
          <i class="i-mdi:fit-to-page-outline text-16" />
        </n-button>
      </n-space>

      <!-- 中间：标签区 -->
      <n-space :size="8" align="center">
        <n-select
          v-model:value="currentLabel"
          :options="labelOptions"
          placeholder="选择标签"
          style="width: 160px"
          size="small"
        />
        <n-input
          v-model:value="newLabel"
          placeholder="新增标签"
          style="width: 140px"
          size="small"
          @keyup.enter="addLabel"
        />
        <n-button secondary size="small" @click="addLabel">
          添加
        </n-button>
      </n-space>

      <!-- 右侧：操作区 -->
      <n-space :size="6" align="center">
        <n-button
          type="primary"
          size="small"
          :disabled="!imageLoaded"
          @click="setDrawMode('rect')"
        >
          <i class="i-mdi:rectangle-outline text-16" />
          矩形标注
        </n-button>
        <n-button
          secondary
          size="small"
          :disabled="!selectedObject"
          @click="deleteSelected"
        >
          <i class="i-mdi:delete-outline text-16" />
          删除
        </n-button>
        <n-button
          secondary
          size="small"
          :disabled="!imageLoaded"
          @click="clearCurrentAnnotations"
        >
          <i class="i-mdi:broom text-16" />
          清空
        </n-button>
        <n-divider vertical />
        <n-button
          secondary
          size="small"
          :disabled="!imageLoaded"
          :type="panMode ? 'primary' : 'default'"
          @click="togglePan"
        >
          <i class="i-mdi:hand-back-right text-16" />
          {{ panMode ? '拖拽中' : '拖拽' }}
        </n-button>
        <n-dropdown trigger="click" :options="exportOptions" @select="handleExport">
          <n-button secondary size="small" :disabled="!imageLoaded">
            <i class="i-mdi:export-variant text-16" />
            导出
          </n-button>
        </n-dropdown>
      </n-space>
    </div>

    <!-- 主要内容区：左侧缩略图 + 右侧画布/SVG -->
    <div class="main-content">
      <!-- 左侧：缩略图侧边栏 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <n-space :size="4" align="center" class="flex-1">
            <i class="i-mdi:image-multiple-outline text-16 color-gray-500" />
            <span class="sidebar-title">图片列表</span>
            <n-tag v-if="recentImages.length > 0" size="small" type="info" round>
              {{ recentImages.length }}
            </n-tag>
          </n-space>
        </div>
        <div class="thumbs-container">
          <div v-if="recentImages.length === 0" class="thumbs-empty">
            <i class="i-mdi:image-outline text-32 color-gray-300" />
            <p class="thumbs-empty-text">
              暂无图片
            </p>
          </div>
          <div v-else class="thumbs-list">
            <n-card
              v-for="(item, idx) in recentImages"
              :key="item.id"
              size="small"
              class="thumb-card"
              :class="{ active: idx === currentImageIndex }"
              @click="switchImage(idx)"
            >
              <div class="thumb-body">
                <n-image
                  :src="item.objectUrl"
                  width="100%"
                  height="120"
                  object-fit="cover"
                  preview-disabled
                />
                <div v-if="idx === currentImageIndex" class="thumb-overlay">
                  <i class="i-mdi:check-circle text-20" />
                </div>
              </div>
              <div class="thumb-footer">
                <span class="thumb-name" :title="item.name">{{ item.name }}</span>
                <n-button
                  quaternary
                  circle
                  size="tiny"
                  class="thumb-remove-btn"
                  @click.stop="removeImage(idx)"
                >
                  <i class="i-mdi:close text-14" />
                </n-button>
              </div>
            </n-card>
          </div>
        </div>
      </div>

      <!-- 右侧：渲染区域（Canvas 或 SVG） -->
      <div
        ref="renderContainer"
        class="render-container"
        :class="{ 'is-drawing': drawMode === 'rect', 'is-panning': panMode }"
      >
        <!-- Canvas 模式 -->
        <canvas
          v-if="!useSvg"
          ref="canvasRef"
          class="render-canvas"
          @pointerdown.prevent="handlePointerDown('canvas', $event)"
          @pointermove.prevent="handlePointerMove('canvas', $event)"
          @pointerup.prevent="handlePointerUp"
          @pointerleave="handlePointerLeave"
        />

        <!-- SVG 模式 -->
        <svg
          v-else
          ref="svgRef"
          class="render-svg"
          :width="svgWidth"
          :height="svgHeight"
          @pointerdown.prevent="handlePointerDown('svg', $event)"
          @pointermove.prevent="handlePointerMove('svg', $event)"
          @pointerup.prevent="handlePointerUp"
          @pointerleave="handlePointerLeave"
        >
          <image
            v-if="imageLoaded"
            :href="currentImage?.objectUrl"
            :x="svgOffsetX"
            :y="svgOffsetY"
            :width="svgImageWidth"
            :height="svgImageHeight"
            preserveAspectRatio="none"
          />
          <g v-if="imageLoaded">
            <rect
              v-for="item in currentAnnotations"
              :key="item.id"
              :x="item.x"
              :y="item.y"
              :width="item.width"
              :height="item.height"
              class="svg-rect"
              :class="{ active: item.id === selectedObject?.id }"
              @mousedown.stop.prevent="selectObject(item.id)"
            />
            <text
              v-for="item in currentAnnotations"
              :key="`${item.id}-label`"
              class="svg-label"
              :x="item.x + 6"
              :y="item.y + 16"
            >
              {{ item.label }}
            </text>
            <rect
              v-if="draftRectNormalized && drawMode === 'rect'"
              class="svg-draft"
              :x="draftRectNormalized.x"
              :y="draftRectNormalized.y"
              :width="draftRectNormalized.width"
              :height="draftRectNormalized.height"
            />
          </g>
        </svg>

        <div
          v-if="cursorIndicator"
          class="cursor-indicator"
          :style="cursorIndicatorStyle"
        />

        <!-- 空状态 -->
        <div v-if="!imageLoaded" class="empty-state">
          <div class="empty-icon">
            <i class="i-mdi:image-outline text-64 color-gray-300" />
          </div>
          <div class="empty-text color-gray-500">
            点击左上角"上传图片"开始标注
          </div>
        </div>

        <!-- 绘制提示 -->
        <div v-if="imageLoaded && drawMode === 'rect'" class="draw-hint">
          <n-tag type="success" size="small" round>
            <i class="i-mdi:cursor-pointer text-14" />
            拖拽绘制矩形，Esc 退出
          </n-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

const useSvg = ref(false)
const imageLoaded = ref(false)
const drawMode = ref(null)
const panMode = ref(false)

const renderContainer = ref(null)
const canvasRef = ref(null)
const svgRef = ref(null)

const svgWidth = ref(0)
const svgHeight = ref(0)
const svgOffsetX = ref(0)
const svgOffsetY = ref(0)
const svgImageWidth = ref(0)
const svgImageHeight = ref(0)

const fileMeta = reactive({
  name: '',
  width: 0,
  height: 0,
})

const recentImages = ref([])
const currentImageIndex = ref(-1)

const annotations = reactive({})

const labelOptions = ref([
  { label: '默认', value: 'default' },
])
const currentLabel = ref(labelOptions.value[0].value)
const newLabel = ref('')

const exportOptions = [
  { label: '导出 JSON', key: 'json' },
  { label: '导出 PNG', key: 'png' },
]

const canvasCtx = ref(null)
const baseImage = ref(null)
const viewport = reactive({ width: 0, height: 0 })
const imageBounds = reactive({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  scale: 1,
})

const pointerState = reactive({
  isDrawing: false,
  origin: { x: 0, y: 0 },
  surface: 'canvas',
})

const draftRect = ref(null)
const draftRectNormalized = computed(() => {
  if (!draftRect.value)
    return null
  const { x, y, width, height } = draftRect.value
  return {
    x: width < 0 ? x + width : x,
    y: height < 0 ? y + height : y,
    width: Math.abs(width),
    height: Math.abs(height),
  }
})

const cursorIndicator = ref(null)
let cursorTimer = null

const currentImage = computed(() => recentImages.value[currentImageIndex.value] || null)

function getCurrentAnnotationBucket() {
  if (!currentImage.value)
    return null
  if (!annotations[currentImage.value.id])
    annotations[currentImage.value.id] = []
  return annotations[currentImage.value.id]
}

const currentAnnotations = computed(() => getCurrentAnnotationBucket() || [])

const selectedObjectId = ref(null)
const selectedObject = computed(() =>
  currentAnnotations.value.find(item => item.id === selectedObjectId.value) || null,
)

const cursorIndicatorStyle = computed(() => {
  if (!cursorIndicator.value)
    return {}
  return {
    width: `${cursorIndicator.value.width}px`,
    height: `${cursorIndicator.value.height}px`,
    transform: `translate(${cursorIndicator.value.x}px, ${cursorIndicator.value.y}px)`,
  }
})

let resizeObserver
let metaWorker
const pendingMeta = new Map()

function createId() {
  return `anno_${Math.random().toString(36).slice(2, 6)}${Date.now().toString(36)}`
}

function cleanupImageResource(item) {
  if (item?.objectUrl)
    URL.revokeObjectURL(item.objectUrl)
}

function handleUploadChange({ file }) {
  const raw = file?.file
  if (!raw)
    return
  const id = createId()
  const name = raw.name || file.name || '未命名图片'
  const objectUrl = URL.createObjectURL(raw)

  recentImages.value.unshift({
    id,
    name,
    objectUrl,
  })
  annotations[id] = []
  fileMeta.name = name
  fileMeta.width = 0
  fileMeta.height = 0

  if (recentImages.value.length > 8) {
    const removed = recentImages.value.pop()
    cleanupImageResource(removed)
    if (removed)
      delete annotations[removed.id]
  }

  currentImageIndex.value = 0
  requestMeta(id, raw)
}

function requestMeta(id, file) {
  if (!metaWorker)
    return
  pendingMeta.set(id, true)
  metaWorker.postMessage({ id, file })
}

function switchImage(index) {
  if (index === currentImageIndex.value)
    return
  currentImageIndex.value = index
}

function removeImage(index) {
  const removed = recentImages.value.splice(index, 1)[0]
  if (!removed)
    return
  cleanupImageResource(removed)
  delete annotations[removed.id]

  if (recentImages.value.length === 0) {
    currentImageIndex.value = -1
  }
  else if (index <= currentImageIndex.value) {
    currentImageIndex.value = Math.max(0, currentImageIndex.value - 1)
  }
}

function addLabel() {
  const label = newLabel.value.trim()
  if (!label)
    return
  if (labelOptions.value.some(option => option.value === label)) {
    currentLabel.value = label
    newLabel.value = ''
    return
  }
  labelOptions.value.push({ label, value: label })
  currentLabel.value = label
  newLabel.value = ''
}

function setDrawMode(mode) {
  if (drawMode.value === mode) {
    drawMode.value = null
    return
  }
  drawMode.value = mode
  panMode.value = false
}

function switchRenderMode(value) {
  useSvg.value = value
  nextTick(() => {
    updateViewport()
    if (!value)
      renderCanvas()
  })
}

function togglePan() {
  panMode.value = !panMode.value
  if (panMode.value)
    drawMode.value = null
}

function zoomToFit() {
  updateViewport()
}

function clearCurrentAnnotations() {
  const bucket = getCurrentAnnotationBucket()
  if (!bucket || bucket.length === 0)
    return
  bucket.length = 0
  selectedObjectId.value = null
  cursorIndicator.value = null
  renderCanvas()
}

function deleteSelected() {
  const bucket = getCurrentAnnotationBucket()
  if (!bucket || !selectedObjectId.value)
    return
  const idx = bucket.findIndex(item => item.id === selectedObjectId.value)
  if (idx === -1)
    return
  bucket.splice(idx, 1)
  selectedObjectId.value = null
  cursorIndicator.value = null
  renderCanvas()
}

function handleExport(key) {
  if (!currentImage.value)
    return
  if (key === 'json') {
    const payload = {
      meta: { ...fileMeta },
      annotations: currentAnnotations.value,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${fileMeta.name || 'annotation'}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    return
  }
  if (key === 'png') {
    if (!canvasRef.value) {
      $message.warning('请切换至 Canvas 模式导出 PNG')
      return
    }
    const url = canvasRef.value.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileMeta.name || 'annotation'}.png`
    link.click()
  }
}

function handlePointerDown(surface, event) {
  if (!imageLoaded.value || panMode.value || (typeof event.button === 'number' && event.button !== 0))
    return
  const point = clampToBounds(getRelativePoint(surface, event))
  pointerState.surface = surface

  if (drawMode.value === 'rect') {
    pointerState.isDrawing = true
    pointerState.origin = point
    draftRect.value = {
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
    }
    event.currentTarget?.setPointerCapture?.(event.pointerId)
  }
  else {
    trySelectAt(point)
  }
}

function handlePointerMove(surface, event) {
  if (!pointerState.isDrawing || pointerState.surface !== surface)
    return
  const point = clampToBounds(getRelativePoint(surface, event))
  draftRect.value = {
    x: pointerState.origin.x,
    y: pointerState.origin.y,
    width: point.x - pointerState.origin.x,
    height: point.y - pointerState.origin.y,
  }
  if (!useSvg.value)
    renderCanvas()
}

function handlePointerUp() {
  if (!pointerState.isDrawing)
    return
  finalizeDraftRect()
}

function handlePointerLeave() {
  if (!pointerState.isDrawing)
    return
  finalizeDraftRect()
}

function finalizeDraftRect() {
  const normalized = normalizeRect(draftRect.value)
  pointerState.isDrawing = false
  draftRect.value = null
  if (!normalized)
    return
  const bucket = getCurrentAnnotationBucket()
  if (!bucket)
    return
  const annotation = {
    ...normalized,
    id: createId(),
    label: currentLabel.value,
  }
  bucket.push(annotation)
  selectedObjectId.value = annotation.id
  showCursor(annotation)
  renderCanvas()
}

function normalizeRect(rect) {
  if (!rect)
    return null
  const width = rect.width
  const height = rect.height
  const normalized = {
    x: width < 0 ? rect.x + width : rect.x,
    y: height < 0 ? rect.y + height : rect.y,
    width: Math.abs(width),
    height: Math.abs(height),
  }
  if (normalized.width < 6 || normalized.height < 6)
    return null
  return normalized
}

function trySelectAt(point) {
  const bucket = getCurrentAnnotationBucket()
  if (!bucket)
    return
  const target = [...bucket].reverse().find(item => isPointInside(item, point))
  selectedObjectId.value = target?.id || null
  if (target)
    showCursor(target)
  else
    cursorIndicator.value = null
  renderCanvas()
}

function selectObject(id) {
  const bucket = getCurrentAnnotationBucket()
  if (!bucket)
    return
  const target = bucket.find(item => item.id === id)
  if (!target)
    return
  selectedObjectId.value = target.id
  showCursor(target)
  renderCanvas()
}

function isPointInside(rect, point) {
  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height
}

function showCursor(rect) {
  cursorIndicator.value = { ...rect }
  if (cursorTimer)
    clearTimeout(cursorTimer)
  cursorTimer = setTimeout(() => {
    cursorIndicator.value = null
    cursorTimer = null
  }, 10000)
}

function getRelativePoint(surface, event) {
  const target = surface === 'canvas' ? canvasRef.value : svgRef.value
  if (!target)
    return { x: 0, y: 0 }
  const rect = target.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function clampToBounds(point) {
  if (!imageBounds.width || !imageBounds.height)
    return point
  return {
    x: Math.min(Math.max(point.x, imageBounds.x), imageBounds.x + imageBounds.width),
    y: Math.min(Math.max(point.y, imageBounds.y), imageBounds.y + imageBounds.height),
  }
}

function handleKeydown(event) {
  if (event.key !== 'Escape')
    return
  pointerState.isDrawing = false
  draftRect.value = null
  drawMode.value = null
  selectedObjectId.value = null
  cursorIndicator.value = null
  renderCanvas()
}

function updateViewport() {
  if (!renderContainer.value)
    return
  viewport.width = renderContainer.value.clientWidth
  viewport.height = renderContainer.value.clientHeight
  svgWidth.value = viewport.width
  svgHeight.value = viewport.height

  if (!viewport.width || !viewport.height)
    return

  if (!useSvg.value && canvasRef.value) {
    const ratio = window.devicePixelRatio || 1
    const canvas = canvasRef.value
    canvas.width = viewport.width * ratio
    canvas.height = viewport.height * ratio
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`
    const ctx = canvas.getContext('2d')
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    canvasCtx.value = ctx
  }

  calculateImageBounds()

  if (!useSvg.value)
    renderCanvas()
}

function calculateImageBounds() {
  const image = baseImage.value
  if (!image) {
    imageBounds.x = 0
    imageBounds.y = 0
    imageBounds.width = viewport.width
    imageBounds.height = viewport.height
    imageBounds.scale = 1
    svgOffsetX.value = 0
    svgOffsetY.value = 0
    svgImageWidth.value = viewport.width
    svgImageHeight.value = viewport.height
    return
  }
  const naturalWidth = image.naturalWidth || image.width
  const naturalHeight = image.naturalHeight || image.height
  const ratio = Math.min(
    viewport.width / naturalWidth,
    viewport.height / naturalHeight,
  ) || 1
  const width = naturalWidth * ratio
  const height = naturalHeight * ratio
  const offsetX = (viewport.width - width) / 2
  const offsetY = (viewport.height - height) / 2

  imageBounds.x = offsetX
  imageBounds.y = offsetY
  imageBounds.width = width
  imageBounds.height = height
  imageBounds.scale = ratio

  svgOffsetX.value = offsetX
  svgOffsetY.value = offsetY
  svgImageWidth.value = width
  svgImageHeight.value = height
}

function renderCanvas() {
  if (useSvg.value || !canvasCtx.value) {
    return
  }
  const ctx = canvasCtx.value
  ctx.clearRect(0, 0, viewport.width, viewport.height)
  if (baseImage.value && imageLoaded.value) {
    ctx.drawImage(
      baseImage.value,
      imageBounds.x,
      imageBounds.y,
      imageBounds.width,
      imageBounds.height,
    )
  }
  else {
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, viewport.width, viewport.height)
  }

  currentAnnotations.value.forEach(rect => drawCanvasRect(ctx, rect))
  if (draftRectNormalized.value)
    drawDraftRect(ctx, draftRectNormalized.value)
}

function drawCanvasRect(ctx, rect) {
  ctx.save()
  const isActive = rect.id === selectedObjectId.value
  ctx.lineWidth = 2
  ctx.strokeStyle = isActive ? '#0ea5e9' : '#2563eb'
  ctx.fillStyle = isActive ? 'rgba(14,165,233,0.2)' : 'rgba(59,130,246,0.15)'
  ctx.setLineDash(isActive ? [4, 4] : [])
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  if (rect.label) {
    ctx.font = '12px/1 sans-serif'
    ctx.fillStyle = '#111827'
    ctx.fillText(rect.label, rect.x + 6, rect.y + 16)
  }
  ctx.restore()
}

function drawDraftRect(ctx, rect) {
  ctx.save()
  ctx.strokeStyle = '#10b981'
  ctx.fillStyle = 'rgba(16,185,129,0.08)'
  ctx.setLineDash([6, 4])
  ctx.lineWidth = 1.5
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  ctx.restore()
}

function setupWorker() {
  try {
    metaWorker = new Worker(
      new URL('@/lib/imageMetaWorker.js', import.meta.url),
      { type: 'module' },
    )
    metaWorker.onmessage = (event) => {
      const { id, width, height } = event.data
      const target = recentImages.value.find(item => item.id === id)
      if (target) {
        target.width = width
        target.height = height
        if (currentImage.value?.id === id) {
          fileMeta.width = width
          fileMeta.height = height
        }
      }
      pendingMeta.delete(id)
    }
  }
  catch (error) {
    console.error(error)
  }
}

watch(
  currentImage,
  (img) => {
    pointerState.isDrawing = false
    draftRect.value = null
    selectedObjectId.value = null
    cursorIndicator.value = null
    imageLoaded.value = false

    if (!img) {
      baseImage.value = null
      renderCanvas()
      return
    }

    fileMeta.name = img.name
    fileMeta.width = img.width || 0
    fileMeta.height = img.height || 0

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      baseImage.value = image
      imageLoaded.value = true
      fileMeta.width = image.naturalWidth
      fileMeta.height = image.naturalHeight
      nextTick(() => {
        updateViewport()
        renderCanvas()
      })
    }
    image.onerror = () => {
      $message.error('图片加载失败')
    }
    image.src = img.objectUrl
  },
  { immediate: true },
)

onMounted(() => {
  setupWorker()
  if (renderContainer.value) {
    resizeObserver = new ResizeObserver(() => updateViewport())
    resizeObserver.observe(renderContainer.value)
  }
  updateViewport()
  window.addEventListener('resize', updateViewport)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('pointerup', handlePointerUp)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateViewport)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('pointerup', handlePointerUp)
  if (cursorTimer)
    clearTimeout(cursorTimer)
  metaWorker?.terminate()
  recentImages.value.forEach(cleanupImageResource)
})
</script>

<style scoped>
.annotator {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.main-content {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.thumbs-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  min-height: 0;
}

.thumbs-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 13px;
}

.thumbs-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.thumb-card {
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  border: 2px solid transparent;
  overflow: hidden;
}

.thumb-card:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.thumb-card.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.thumb-body {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
}

.thumb-overlay {
  position: absolute;
  inset: 0;
  background: rgba(59, 130, 246, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.thumb-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: #374151;
}

.thumb-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 4px;
}

.thumb-remove-btn {
  color: #6b7280;
}

.render-container {
  position: relative;
  flex: 1;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  min-width: 0;
}

.render-container.is-drawing {
  cursor: crosshair;
}

.render-container.is-panning {
  cursor: grab;
}

.render-canvas,
.render-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.draw-hint {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
}

.cursor-indicator {
  position: absolute;
  top: 0;
  left: 0;
  border: 1px dashed #10b981;
  border-radius: 4px;
  pointer-events: none;
  /* 防止内容被选区遮挡 */
  background: rgba(16, 185, 129, 0.03);
}

.cursor-indicator::after {
  content: '';
  position: absolute;
  /* 竖线高度占满整个选区 */
  top: 1px; /* 稍微往上延伸一点，与边框对齐 */
  bottom: 1px;
  left: 2px; /* 距离左边框 2px，更自然 */
  width: 2px;

  background: #10b981;
  border-radius: 1px;

  /* 发光 + 半透明更柔和 */
  box-shadow: 0 0 8px 2px rgba(16, 185, 129, 0.6);

  animation: caret-scan 1.2s ease-in-out infinite;
}

.svg-rect {
  fill: rgba(59, 130, 246, 0.15);
  stroke: #2563eb;
  stroke-width: 2;
}

.svg-rect.active {
  fill: rgba(14, 165, 233, 0.2);
  stroke: #0ea5e9;
  stroke-dasharray: 4 4;
}

.svg-label {
  font-size: 12px;
  fill: #111827;
  pointer-events: none;
}

.svg-draft {
  fill: rgba(16, 185, 129, 0.08);
  stroke: #10b981;
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
}

/* 滚动条优化 */
.thumbs-container::-webkit-scrollbar {
  width: 6px;
}

.thumbs-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

@keyframes caret-scan {
  from {
    left: 6px;
  }

  to {
    left: calc(100% - 8px);
  }
}
</style>
