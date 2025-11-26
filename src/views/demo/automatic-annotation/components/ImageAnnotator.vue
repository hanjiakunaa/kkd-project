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
        <!-- 标注工具下拉选择 -->
        <n-dropdown
          trigger="click"
          :options="annotationToolOptions"
          @select="handleToolSelect"
        >
          <n-button
            :type="drawMode ? 'primary' : 'default'"
            size="small"
            :disabled="!imageLoaded"
          >
            <i :class="currentToolIcon" class="text-16" />
            {{ currentToolLabel }}
            <i class="i-mdi:chevron-down ml-4 text-14" />
          </n-button>
        </n-dropdown>

        <!-- 多边形绘制提示 -->
        <n-tag v-if="drawMode === 'polygon' && polygonPoints.length > 0" size="small" type="info">
          已添加 {{ polygonPoints.length }} 个顶点
        </n-tag>

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
          @dblclick.prevent="handleDoubleClick('canvas', $event)"
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
          @dblclick.prevent="handleDoubleClick('svg', $event)"
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
            <!-- 矩形标注 -->
            <template v-for="item in currentAnnotations" :key="item.id">
              <rect
                v-if="item.type === 'rect' || !item.type"
                :x="item.x"
                :y="item.y"
                :width="item.width"
                :height="item.height"
                class="svg-rect"
                :class="{ active: item.id === selectedObject?.id }"
                :style="{ strokeWidth }"
                @mousedown.stop.prevent="selectObject(item.id)"
              />
              <!-- 多边形标注 -->
              <polygon
                v-else-if="item.type === 'polygon'"
                :points="formatPolygonPoints(item.points)"
                class="svg-polygon"
                :class="{ active: item.id === selectedObject?.id }"
                :style="{ strokeWidth }"
                @mousedown.stop.prevent="selectObject(item.id)"
              />
              <!-- 圆形标注 -->
              <ellipse
                v-else-if="item.type === 'ellipse'"
                :cx="item.cx"
                :cy="item.cy"
                :rx="item.rx"
                :ry="item.ry"
                class="svg-ellipse"
                :class="{ active: item.id === selectedObject?.id }"
                :style="{ strokeWidth }"
                @mousedown.stop.prevent="selectObject(item.id)"
              />
            </template>

            <!-- 标签文字 -->
            <text
              v-for="item in currentAnnotations"
              :key="`${item.id}-label`"
              class="svg-label"
              :x="getAnnotationLabelPosition(item).x"
              :y="getAnnotationLabelPosition(item).y"
              :style="{ fontSize: `${Math.max(10, Math.min(14, 12 * visualScale))}px` }"
            >
              {{ item.label }}
            </text>

            <!-- 矩形绘制草稿 -->
            <rect
              v-if="draftRectNormalized && drawMode === 'rect'"
              class="svg-draft"
              :x="draftRectNormalized.x"
              :y="draftRectNormalized.y"
              :width="draftRectNormalized.width"
              :height="draftRectNormalized.height"
              :style="{ strokeWidth }"
            />

            <!-- 多边形绘制草稿 -->
            <g v-if="drawMode === 'polygon' && polygonPoints.length > 0">
              <polyline
                :points="formatPolygonPoints(polygonPoints)"
                class="svg-polygon-draft"
                :style="{ strokeWidth }"
              />
              <!-- 预览线到鼠标位置 -->
              <line
                v-if="polygonPreviewPointClamped"
                :x1="polygonPoints[polygonPoints.length - 1].x"
                :y1="polygonPoints[polygonPoints.length - 1].y"
                :x2="polygonPreviewPointClamped.x"
                :y2="polygonPreviewPointClamped.y"
                class="svg-polygon-preview-line"
                :style="{ strokeWidth: Math.max(1, strokeWidth * 0.5) }"
              />
              <!-- 顶点圆点 -->
              <circle
                v-for="(pt, idx) in polygonPoints"
                :key="`polygon-pt-${idx}`"
                :cx="pt.x"
                :cy="pt.y"
                :r="vertexRadius"
                class="svg-polygon-vertex"
                :class="{ 'is-first': idx === 0 }"
                :style="{ strokeWidth }"
              />
            </g>

            <!-- 椭圆绘制草稿 -->
            <ellipse
              v-if="draftEllipseNormalized && drawMode === 'ellipse'"
              class="svg-ellipse-draft"
              :cx="draftEllipseNormalized.cx"
              :cy="draftEllipseNormalized.cy"
              :rx="draftEllipseNormalized.rx"
              :ry="draftEllipseNormalized.ry"
              :style="{ strokeWidth }"
            />
          </g>
        </svg>

        <!-- SVG 模式下的光标指示器 (改用SVG绘制) -->
        <svg
          v-if="cursorIndicator && useSvg"
          class="cursor-indicator-svg"
          :width="svgWidth"
          :height="svgHeight"
        >
          <rect
            :x="cursorIndicator.x"
            :y="cursorIndicator.y"
            :width="cursorIndicator.width"
            :height="cursorIndicator.height"
            class="svg-cursor-indicator"
            :style="{ strokeWidth: Math.max(1, Math.min(2, 1 * visualScale)) }"
          />
        </svg>

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
        <div v-if="imageLoaded && drawMode" class="draw-hint">
          <n-tag type="success" size="small" round>
            <i class="i-mdi:cursor-pointer text-14" />
            {{ drawModeHint }}
          </n-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

// 渲染图标的辅助函数
function renderIcon(iconClass) {
  return () => h('i', { class: `${iconClass} text-16` })
}

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
  let normalized = {
    x: width < 0 ? x + width : x,
    y: height < 0 ? y + height : y,
    width: Math.abs(width),
    height: Math.abs(height),
  }

  // 限制在图片边界内，实时显示
  if (imageLoaded.value && imageBounds.width && imageBounds.height) {
    normalized = clampRectToBounds(normalized)
  }

  return normalized
})

// 多边形相关
const polygonPoints = ref([])
const polygonPreviewPoint = ref(null)
const polygonPreviewPointClamped = computed(() => {
  if (!polygonPreviewPoint.value)
    return null
  return clampToBounds(polygonPreviewPoint.value)
})

// 椭圆相关
const draftEllipse = ref(null)
const draftEllipseNormalized = computed(() => {
  if (!draftEllipse.value)
    return null

  // 限制在图片边界内，实时显示
  if (imageLoaded.value && imageBounds.width && imageBounds.height) {
    return clampEllipseToBounds(draftEllipse.value)
  }

  return draftEllipse.value
})

// 标注工具选项配置
const toolConfig = [
  { label: '矩形标注', key: 'rect', iconClass: 'i-mdi:rectangle-outline' },
  { label: '多边形标注', key: 'polygon', iconClass: 'i-mdi:vector-polygon' },
  { label: '椭圆标注', key: 'ellipse', iconClass: 'i-mdi:ellipse-outline' },
]

// 计算自适应的视觉元素尺寸
const visualScale = computed(() => {
  // 基于图片缩放比例计算，确保视觉元素大小合理
  // scale < 0.5 时放大元素，scale > 1 时缩小元素
  const scale = imageBounds.scale || 1
  if (scale < 0.5) {
    return 1 / scale * 0.8 // 图片很小时，适度放大元素
  }
  if (scale > 2) {
    return 1 / scale * 2 // 图片很大时，适度缩小元素
  }
  return 1
})

// 自适应的顶点大小
const vertexRadius = computed(() => Math.max(3, Math.min(6, 4 * visualScale.value)))

// 自适应的线条宽度
const strokeWidth = computed(() => Math.max(1, Math.min(3, 2 * visualScale.value)))

// 下拉菜单选项（带渲染图标）
const annotationToolOptions = toolConfig.map(item => ({
  label: item.label,
  key: item.key,
  icon: renderIcon(item.iconClass),
}))

// 当前工具图标
const currentToolIcon = computed(() => {
  const tool = toolConfig.find(t => t.key === drawMode.value)
  return tool?.iconClass || 'i-mdi:shape-outline'
})

// 当前工具名称
const currentToolLabel = computed(() => {
  const tool = toolConfig.find(t => t.key === drawMode.value)
  return tool?.label || '选择工具'
})

// 绘制模式提示
const drawModeHint = computed(() => {
  switch (drawMode.value) {
    case 'rect':
      return '拖拽绘制矩形，Esc 退出'
    case 'polygon':
      return '单击添加顶点，双击/Enter 完成，Esc 退出'
    case 'ellipse':
      return '拖拽绘制椭圆，Esc 退出'
    default:
      return ''
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

let resizeObserver
let metaWorker
const pendingMeta = new Map()
let animationFrameId = null

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
    clearDrawingState()
    return
  }
  drawMode.value = mode
  panMode.value = false
  clearDrawingState()
}

function handleToolSelect(key) {
  setDrawMode(key)
}

function clearDrawingState() {
  pointerState.isDrawing = false
  draftRect.value = null
  draftEllipse.value = null
  polygonPoints.value = []
  polygonPreviewPoint.value = null
}

function switchRenderMode(value) {
  useSvg.value = value

  // 切换模式时处理光标动画
  if (value) {
    // 切换到SVG模式，停止Canvas动画
    stopCursorAnimation()
  }
  else if (cursorIndicator.value) {
    // 切换到Canvas模式且有光标，启动动画
    startCursorAnimation()
  }

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
  polygonPoints.value = []
  polygonPreviewPoint.value = null
  draftRect.value = null
  draftEllipse.value = null
  stopCursorAnimation()
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
  stopCursorAnimation()
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
  else if (drawMode.value === 'polygon') {
    // 多边形模式：单击添加顶点
    addPolygonPoint(point)
  }
  else if (drawMode.value === 'ellipse') {
    // 椭圆模式：拖拽绘制
    pointerState.isDrawing = true
    pointerState.origin = point
    draftEllipse.value = {
      cx: point.x,
      cy: point.y,
      rx: 0,
      ry: 0,
    }
    event.currentTarget?.setPointerCapture?.(event.pointerId)
  }
  else {
    trySelectAt(point)
  }
}

function handlePointerMove(surface, event) {
  const point = clampToBounds(getRelativePoint(surface, event))

  // 多边形预览线
  if (drawMode.value === 'polygon' && polygonPoints.value.length > 0) {
    polygonPreviewPoint.value = point
    if (!useSvg.value)
      renderCanvas()
    return
  }

  if (!pointerState.isDrawing || pointerState.surface !== surface)
    return

  if (drawMode.value === 'rect') {
    draftRect.value = {
      x: pointerState.origin.x,
      y: pointerState.origin.y,
      width: point.x - pointerState.origin.x,
      height: point.y - pointerState.origin.y,
    }
  }
  else if (drawMode.value === 'ellipse') {
    const rx = Math.abs(point.x - pointerState.origin.x)
    const ry = Math.abs(point.y - pointerState.origin.y)
    draftEllipse.value = {
      cx: pointerState.origin.x,
      cy: pointerState.origin.y,
      rx,
      ry,
    }
  }

  if (!useSvg.value)
    renderCanvas()
}

function handlePointerUp() {
  if (!pointerState.isDrawing)
    return
  if (drawMode.value === 'rect') {
    finalizeDraftRect()
  }
  else if (drawMode.value === 'ellipse') {
    finalizeDraftEllipse()
  }
}

function handlePointerLeave() {
  if (!pointerState.isDrawing)
    return
  finalizeDraftRect()
}

function finalizeDraftRect() {
  let normalized = normalizeRect(draftRect.value)
  pointerState.isDrawing = false
  draftRect.value = null
  if (!normalized)
    return

  // 限制矩形在图片边界内
  normalized = clampRectToBounds(normalized)

  // 如果限制后矩形太小，不创建
  if (normalized.width < 6 || normalized.height < 6)
    return

  const bucket = getCurrentAnnotationBucket()
  if (!bucket)
    return
  const annotation = {
    ...normalized,
    id: createId(),
    type: 'rect',
    label: currentLabel.value,
  }
  bucket.push(annotation)
  selectedObjectId.value = annotation.id
  showCursor(annotation, 'rect')
  renderCanvas()
}

// 多边形相关函数
function addPolygonPoint(point) {
  // 确保点在图片边界内
  const clampedPoint = clampToBounds(point)
  polygonPoints.value.push({ x: clampedPoint.x, y: clampedPoint.y })
  renderCanvas()
}

function finalizePolygon() {
  if (polygonPoints.value.length < 3) {
    polygonPoints.value = []
    polygonPreviewPoint.value = null
    renderCanvas()
    return
  }

  const bucket = getCurrentAnnotationBucket()
  if (!bucket)
    return

  // 确保所有点都在边界内（双重保险）
  const points = polygonPoints.value.map(p => clampToBounds(p))
  const bounds = getPolygonBounds(points)

  // 检查多边形是否有效（面积足够大）
  if (bounds.width < 6 || bounds.height < 6) {
    polygonPoints.value = []
    polygonPreviewPoint.value = null
    renderCanvas()
    return
  }

  const annotation = {
    id: createId(),
    type: 'polygon',
    points,
    ...bounds,
    label: currentLabel.value,
  }

  bucket.push(annotation)
  selectedObjectId.value = annotation.id
  polygonPoints.value = []
  polygonPreviewPoint.value = null
  // 多边形不显示指示器
  renderCanvas()
}

function getPolygonBounds(points) {
  if (!points || points.length === 0)
    return { x: 0, y: 0, width: 0, height: 0 }

  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

function formatPolygonPoints(points) {
  if (!points || points.length === 0)
    return ''
  return points.map(p => `${p.x},${p.y}`).join(' ')
}

// 椭圆相关函数
function finalizeDraftEllipse() {
  pointerState.isDrawing = false
  let ellipse = draftEllipse.value
  draftEllipse.value = null

  if (!ellipse || ellipse.rx < 6 || ellipse.ry < 6)
    return

  // 限制椭圆在图片边界内
  ellipse = clampEllipseToBounds(ellipse)

  // 检查限制后的椭圆是否仍然有效
  if (ellipse.rx < 6 || ellipse.ry < 6)
    return

  const bucket = getCurrentAnnotationBucket()
  if (!bucket)
    return

  const annotation = {
    id: createId(),
    type: 'ellipse',
    cx: ellipse.cx,
    cy: ellipse.cy,
    rx: ellipse.rx,
    ry: ellipse.ry,
    // 边界框用于选中指示
    x: ellipse.cx - ellipse.rx,
    y: ellipse.cy - ellipse.ry,
    width: ellipse.rx * 2,
    height: ellipse.ry * 2,
    label: currentLabel.value,
  }

  bucket.push(annotation)
  selectedObjectId.value = annotation.id
  // 椭圆不显示指示器
  renderCanvas()
}

// 双击处理（完成多边形）
function handleDoubleClick(_surface, _event) {
  if (drawMode.value === 'polygon' && polygonPoints.value.length >= 3) {
    finalizePolygon()
  }
}

// 获取标注标签位置
function getAnnotationLabelPosition(item) {
  if (item.type === 'polygon' && item.points?.length > 0) {
    const bounds = getPolygonBounds(item.points)
    return { x: bounds.x + 6, y: bounds.y + 16 }
  }
  if (item.type === 'ellipse') {
    return { x: item.cx - item.rx + 6, y: item.cy - item.ry + 16 }
  }
  return { x: (item.x || 0) + 6, y: (item.y || 0) + 16 }
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
  const target = [...bucket].reverse().find(item => isPointInsideAnnotation(item, point))
  selectedObjectId.value = target?.id || null
  if (target) {
    const bounds = getAnnotationBounds(target)
    showCursor(bounds, target.type)
  }
  else {
    cursorIndicator.value = null
    stopCursorAnimation()
  }
  renderCanvas()
}

function isPointInsideAnnotation(item, point) {
  if (item.type === 'polygon') {
    return isPointInPolygon(point, item.points)
  }
  if (item.type === 'ellipse') {
    return isPointInEllipse(point, item)
  }
  return isPointInside(item, point)
}

function isPointInPolygon(point, vertices) {
  if (!vertices || vertices.length < 3)
    return false
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x
    const yi = vertices[i].y
    const xj = vertices[j].x
    const yj = vertices[j].y
    if (((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

function isPointInEllipse(point, ellipse) {
  const dx = point.x - ellipse.cx
  const dy = point.y - ellipse.cy
  return (dx * dx) / (ellipse.rx * ellipse.rx) + (dy * dy) / (ellipse.ry * ellipse.ry) <= 1
}

function getAnnotationBounds(item) {
  if (item.type === 'polygon') {
    return getPolygonBounds(item.points)
  }
  if (item.type === 'ellipse') {
    return {
      x: item.cx - item.rx,
      y: item.cy - item.ry,
      width: item.rx * 2,
      height: item.ry * 2,
    }
  }
  return item
}

function selectObject(id) {
  const bucket = getCurrentAnnotationBucket()
  if (!bucket)
    return
  const target = bucket.find(item => item.id === id)
  if (!target)
    return
  selectedObjectId.value = target.id
  const bounds = getAnnotationBounds(target)
  showCursor(bounds, target.type)
  renderCanvas()
}

function isPointInside(rect, point) {
  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height
}

function showCursor(rect, type) {
  // 只在矩形标注时显示指示器
  if (type !== 'rect')
    return

  cursorIndicator.value = { ...rect }
  if (cursorTimer)
    clearTimeout(cursorTimer)
  cursorTimer = setTimeout(() => {
    cursorIndicator.value = null
    cursorTimer = null
    stopCursorAnimation()
  }, 10000)

  // 启动光标动画
  startCursorAnimation()
}

// 启动光标指示器动画
function startCursorAnimation() {
  if (animationFrameId || !cursorIndicator.value || useSvg.value)
    return

  const animate = () => {
    if (!cursorIndicator.value || useSvg.value) {
      stopCursorAnimation()
      return
    }
    renderCanvas()
    animationFrameId = requestAnimationFrame(animate)
  }

  animationFrameId = requestAnimationFrame(animate)
}

// 停止光标指示器动画
function stopCursorAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
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
  // 如果图片未加载或边界无效，返回原始点（此时不应该绘制）
  if (!imageLoaded.value || !imageBounds.width || !imageBounds.height)
    return point

  // 限制在图片边界内
  return {
    x: Math.min(Math.max(point.x, imageBounds.x), imageBounds.x + imageBounds.width),
    y: Math.min(Math.max(point.y, imageBounds.y), imageBounds.y + imageBounds.height),
  }
}

// 限制矩形在图片边界内
function clampRectToBounds(rect) {
  if (!imageLoaded.value || !imageBounds.width || !imageBounds.height)
    return rect

  const left = Math.max(rect.x, imageBounds.x)
  const top = Math.max(rect.y, imageBounds.y)
  const right = Math.min(rect.x + rect.width, imageBounds.x + imageBounds.width)
  const bottom = Math.min(rect.y + rect.height, imageBounds.y + imageBounds.height)

  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  }
}

// 限制椭圆在图片边界内
function clampEllipseToBounds(ellipse) {
  if (!imageLoaded.value || !imageBounds.width || !imageBounds.height)
    return ellipse

  // 确保椭圆中心在图片内
  const cx = Math.min(Math.max(ellipse.cx, imageBounds.x), imageBounds.x + imageBounds.width)
  const cy = Math.min(Math.max(ellipse.cy, imageBounds.y), imageBounds.y + imageBounds.height)

  // 限制半径，使椭圆不超出边界
  const maxRx = Math.min(
    cx - imageBounds.x,
    imageBounds.x + imageBounds.width - cx,
  )
  const maxRy = Math.min(
    cy - imageBounds.y,
    imageBounds.y + imageBounds.height - cy,
  )

  return {
    cx,
    cy,
    rx: Math.min(ellipse.rx, maxRx),
    ry: Math.min(ellipse.ry, maxRy),
  }
}

function handleKeydown(event) {
  // Enter 完成多边形
  if (event.key === 'Enter' && drawMode.value === 'polygon' && polygonPoints.value.length >= 3) {
    finalizePolygon()
    return
  }

  // Esc 退出绘制
  if (event.key === 'Escape') {
    pointerState.isDrawing = false
    draftRect.value = null
    draftEllipse.value = null
    polygonPoints.value = []
    polygonPreviewPoint.value = null
    drawMode.value = null
    selectedObjectId.value = null
    cursorIndicator.value = null
    stopCursorAnimation()
    renderCanvas()
  }
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

  // 绘制所有标注
  currentAnnotations.value.forEach((item) => {
    if (item.type === 'polygon') {
      drawCanvasPolygon(ctx, item)
    }
    else if (item.type === 'ellipse') {
      drawCanvasEllipse(ctx, item)
    }
    else {
      drawCanvasRect(ctx, item)
    }
  })

  // 绘制草稿
  if (draftRectNormalized.value && drawMode.value === 'rect')
    drawDraftRect(ctx, draftRectNormalized.value)

  if (draftEllipseNormalized.value && drawMode.value === 'ellipse')
    drawDraftEllipse(ctx, draftEllipseNormalized.value)

  if (polygonPoints.value.length > 0 && drawMode.value === 'polygon')
    drawDraftPolygon(ctx)

  // 绘制光标指示器（Canvas模式）
  if (cursorIndicator.value)
    drawCursorIndicator(ctx, cursorIndicator.value)
}

function drawCanvasRect(ctx, rect) {
  ctx.save()
  const isActive = rect.id === selectedObjectId.value
  ctx.lineWidth = strokeWidth.value
  ctx.strokeStyle = isActive ? '#0ea5e9' : '#2563eb'
  ctx.fillStyle = isActive ? 'rgba(14,165,233,0.2)' : 'rgba(59,130,246,0.15)'
  ctx.setLineDash(isActive ? [4, 4] : [])
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  if (rect.label) {
    const fontSize = Math.max(10, Math.min(14, 12 * visualScale.value))
    ctx.font = `${fontSize}px/1 sans-serif`
    ctx.fillStyle = '#111827'
    ctx.fillText(rect.label, rect.x + 6, rect.y + 16)
  }
  ctx.restore()
}

function drawDraftRect(ctx, rect) {
  ctx.save()
  ctx.strokeStyle = '#10b981'
  ctx.fillStyle = 'rgba(16,185,129,0.08)'
  const dashSize = Math.max(4, 6 * visualScale.value)
  ctx.setLineDash([dashSize, dashSize * 0.66])
  ctx.lineWidth = strokeWidth.value
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  ctx.restore()
}

// 绘制多边形
function drawCanvasPolygon(ctx, item) {
  if (!item.points || item.points.length < 3)
    return
  ctx.save()
  const isActive = item.id === selectedObjectId.value
  ctx.lineWidth = strokeWidth.value
  ctx.strokeStyle = isActive ? '#0ea5e9' : '#8b5cf6'
  ctx.fillStyle = isActive ? 'rgba(14,165,233,0.2)' : 'rgba(139,92,246,0.15)'
  ctx.setLineDash(isActive ? [4, 4] : [])

  ctx.beginPath()
  ctx.moveTo(item.points[0].x, item.points[0].y)
  for (let i = 1; i < item.points.length; i++) {
    ctx.lineTo(item.points[i].x, item.points[i].y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  if (item.label) {
    const bounds = getPolygonBounds(item.points)
    const fontSize = Math.max(10, Math.min(14, 12 * visualScale.value))
    ctx.font = `${fontSize}px/1 sans-serif`
    ctx.fillStyle = '#111827'
    ctx.fillText(item.label, bounds.x + 6, bounds.y + 16)
  }
  ctx.restore()
}

// 绘制椭圆
function drawCanvasEllipse(ctx, item) {
  ctx.save()
  const isActive = item.id === selectedObjectId.value
  ctx.lineWidth = strokeWidth.value
  ctx.strokeStyle = isActive ? '#0ea5e9' : '#f59e0b'
  ctx.fillStyle = isActive ? 'rgba(14,165,233,0.2)' : 'rgba(245,158,11,0.15)'
  ctx.setLineDash(isActive ? [4, 4] : [])

  ctx.beginPath()
  ctx.ellipse(item.cx, item.cy, item.rx, item.ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  if (item.label) {
    const fontSize = Math.max(10, Math.min(14, 12 * visualScale.value))
    ctx.font = `${fontSize}px/1 sans-serif`
    ctx.fillStyle = '#111827'
    ctx.fillText(item.label, item.cx - item.rx + 6, item.cy - item.ry + 16)
  }
  ctx.restore()
}

// 绘制多边形草稿
function drawDraftPolygon(ctx) {
  const points = polygonPoints.value
  if (points.length === 0)
    return

  ctx.save()
  ctx.strokeStyle = '#10b981'
  ctx.fillStyle = 'rgba(16,185,129,0.08)'
  const dashSize = Math.max(4, 6 * visualScale.value)
  ctx.setLineDash([dashSize, dashSize * 0.66])
  ctx.lineWidth = strokeWidth.value

  // 绘制已有线段
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }

  // 预览线到鼠标位置（使用限制后的点）
  const previewPoint = polygonPreviewPointClamped.value
  if (previewPoint) {
    ctx.lineTo(previewPoint.x, previewPoint.y)
  }
  ctx.stroke()

  // 绘制顶点
  const vRadius = vertexRadius.value
  points.forEach((pt, idx) => {
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, vRadius, 0, Math.PI * 2)
    ctx.fillStyle = idx === 0 ? '#10b981' : '#fff'
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = strokeWidth.value
    ctx.setLineDash([])
    ctx.fill()
    ctx.stroke()
  })

  ctx.restore()
}

// 绘制椭圆草稿
function drawDraftEllipse(ctx, ellipse) {
  ctx.save()
  ctx.strokeStyle = '#10b981'
  ctx.fillStyle = 'rgba(16,185,129,0.08)'
  const dashSize = Math.max(4, 6 * visualScale.value)
  ctx.setLineDash([dashSize, dashSize * 0.66])
  ctx.lineWidth = strokeWidth.value

  ctx.beginPath()
  ctx.ellipse(ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

// 绘制光标指示器
function drawCursorIndicator(ctx, indicator) {
  const scale = visualScale.value
  const { x, y, width, height } = indicator

  ctx.save()

  // 背景填充
  ctx.fillStyle = 'rgba(16, 185, 129, 0.03)'
  ctx.fillRect(x, y, width, height)

  // 虚线边框
  const borderWidth = Math.max(1, Math.min(2, 1 * scale))
  const dashSize = Math.max(3, 4 * scale)
  ctx.strokeStyle = '#10b981'
  ctx.lineWidth = borderWidth
  ctx.setLineDash([dashSize, dashSize])
  ctx.strokeRect(x, y, width, height)

  // 扫描线动画效果
  const now = Date.now()
  const duration = 1200 // 动画周期 1.2秒
  const progress = (now % duration) / duration
  const caretWidth = Math.max(2, 2 * scale)
  const startOffset = Math.max(6, 6 * scale)
  const endOffset = Math.max(8, 8 * scale)
  const caretX = x + startOffset + (width - startOffset - endOffset) * progress

  // 绘制扫描竖线
  ctx.setLineDash([])
  ctx.fillStyle = '#10b981'
  ctx.fillRect(caretX, y + 1 * scale, caretWidth, height - 2 * scale)

  // 光晕效果
  const glowSize = Math.max(8, 8 * scale)
  const gradient = ctx.createRadialGradient(
    caretX + caretWidth / 2,
    y + height / 2,
    0,
    caretX + caretWidth / 2,
    y + height / 2,
    glowSize,
  )
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)')
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(
    caretX - glowSize,
    y - glowSize,
    caretWidth + glowSize * 2,
    height + glowSize * 2,
  )

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
    draftEllipse.value = null
    polygonPoints.value = []
    polygonPreviewPoint.value = null
    selectedObjectId.value = null
    cursorIndicator.value = null
    stopCursorAnimation()
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
  stopCursorAnimation()
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

.cursor-indicator-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 100;
}

.svg-cursor-indicator {
  fill: rgba(16, 185, 129, 0.03);
  stroke: #10b981;
  stroke-dasharray: 4 4;
  pointer-events: none;
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

.svg-polygon {
  fill: rgba(139, 92, 246, 0.15);
  stroke: #8b5cf6;
  stroke-width: 2;
}

.svg-polygon.active {
  fill: rgba(14, 165, 233, 0.2);
  stroke: #0ea5e9;
  stroke-dasharray: 4 4;
}

.svg-ellipse {
  fill: rgba(245, 158, 11, 0.15);
  stroke: #f59e0b;
  stroke-width: 2;
}

.svg-ellipse.active {
  fill: rgba(14, 165, 233, 0.2);
  stroke: #0ea5e9;
  stroke-dasharray: 4 4;
}

.svg-polygon-draft {
  fill: none;
  stroke: #10b981;
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
}

.svg-polygon-preview-line {
  stroke: #10b981;
  stroke-width: 1;
  stroke-dasharray: 4 2;
  opacity: 0.6;
}

.svg-polygon-vertex {
  fill: #fff;
  stroke: #10b981;
  stroke-width: 2;
}

.svg-polygon-vertex.is-first {
  fill: #10b981;
}

.svg-ellipse-draft {
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
</style>
