<template>
  <div class="annotator">
    <div class="toolbar">
      <!-- 左侧：上传区 -->
      <n-space :size="8" align="center">
        <n-upload
          :show-file-list="false"
          accept=".png,.jpg,.jpeg,.webp"
          :default-upload="false"
          :on-before-upload="onBeforeUpload"
          :on-change="handleUploadChange"
        >
          <n-button type="primary" ghost>
            <template #icon>
              <i class="i-mdi:upload text-16" />
            </template>
            上传图片
          </n-button>
        </n-upload>
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
        <n-button
          secondary
          size="small"
          @click="addLabel"
        >
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
          <template #icon>
            <i class="i-mdi:rectangle-outline text-16" />
          </template>
          矩形标注
        </n-button>
        <n-button
          secondary
          size="small"
          :disabled="!selectedObject"
          @click="deleteSelected"
        >
          <template #icon>
            <i class="i-mdi:delete-outline text-16" />
          </template>
          删除
        </n-button>
        <n-button
          secondary
          size="small"
          :disabled="!imageLoaded"
          @click="clearAnnotations"
        >
          <template #icon>
            <i class="i-mdi:broom text-16" />
          </template>
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
          <template #icon>
            <i class="i-mdi:hand-back-right text-16" />
          </template>
          {{ panMode ? '拖拽中' : '拖拽' }}
        </n-button>
        <n-dropdown
          trigger="click"
          :options="exportOptions"
          @select="handleExport"
        >
          <n-button
            secondary
            size="small"
            :disabled="!imageLoaded"
          >
            <template #icon>
              <i class="i-mdi:export-variant text-16" />
            </template>
            导出
          </n-button>
        </n-dropdown>
        <n-upload
          v-if="imageLoaded"
          :show-file-list="false"
          accept=".json"
          :on-change="handleImportChange"
        >
          <n-button secondary size="small">
            <template #icon>
              <i class="i-mdi:import text-16" />
            </template>
            导入
          </n-button>
        </n-upload>
      </n-space>
    </div>

    <div ref="canvasWrapRef" class="canvas-wrap">
      <canvas ref="canvasRef" />
      <div v-if="!imageLoaded" class="empty-state">
        <div class="empty-icon">
          <i class="i-mdi:image-outline text-64 color-gray-300" />
        </div>
        <div class="empty-text color-gray-500">
          点击左上角“上传图片”开始标注
        </div>
      </div>
      <div v-if="imageLoaded && drawMode === 'rect'" class="draw-hint">
        <n-tag type="success" size="small" round>
          <template #icon>
            <i class="i-mdi:cursor-pointer text-14" />
          </template>
          拖拽绘制矩形，Esc 退出
        </n-tag>
      </div>
    </div>
    <!-- 缩略图列表 -->
    <div class="thumbs">
      <n-space :size="8" wrap>
        <n-card
          v-for="(item, idx) in recentImages"
          :key="item.id"
          size="small"
          class="thumb-card"
          :class="{ active: idx === currentImageIndex }"
          @click="switchImage(idx)"
        >
          <div class="thumb-body">
            <n-image :src="item.objectUrl" width="120" height="80" preview-disabled />
          </div>
          <div class="thumb-footer">
            <span class="thumb-name">{{ item.name }}</span>
            <n-button quaternary circle size="tiny" @click.stop="removeImage(idx)">
              <i class="i-mdi:close text-14" />
            </n-button>
          </div>
        </n-card>
      </n-space>
    </div>
    <!-- 已移到画布内部，此处移除旧提示 -->
  </div>
</template>

<script setup>
import { Canvas, Image, Point, Rect, Text } from 'fabric'
import { NButton, NCard, NDivider, NDropdown, NImage, NInput, NSelect, NSpace, NTag, NUpload } from 'naive-ui'

const canvasRef = ref(null)
const canvasWrapRef = ref(null)
let canvas
let bgImage

const imageLoaded = ref(false)
const drawMode = ref('none')
const panMode = ref(false)
const currentLabel = ref('')
const newLabel = ref('')
const labelOptions = ref([
  { label: 'Person', value: 'Person' },
  { label: 'Car', value: 'Car' },
  { label: 'Dog', value: 'Dog' },
])
const selectedObject = ref(null)

// 导出选项
const exportOptions = [
  { label: '导出 JSON', key: 'json' },
  { label: '导出 PNG', key: 'png' },
]

function handleExport(key) {
  if (key === 'json')
    exportJSON()
  if (key === 'png')
    exportPNG()
}

const fileMeta = reactive({ name: '', sizeMB: 0, width: 0, height: 0 })
const recentImages = reactive([])
const currentImageIndex = ref(-1)

async function onBeforeUpload({ file }) {
  const raw = file?.file
  if (!raw)
    return false
  if (!raw.type.startsWith('image/')) {
    $message?.error?.('只能上传图片文件')
    return false
  }
  const sizeMB = raw.size / (1024 * 1024)
  if (sizeMB > 20) {
    $message?.error?.('图片大小需 ≤ 20MB')
    return false
  }
  try {
    const objUrl = URL.createObjectURL(raw)
    fileMeta.name = file.name
    fileMeta.sizeMB = Number(sizeMB.toFixed(2))
    pushRecent({ name: file.name, objectUrl: objUrl })
    await loadImage(objUrl)
  }
  catch (e) {
    console.warn('before upload failed', e)
    $message?.error?.('图片读取失败')
  }
  return false
}

function initCanvas() {
  const el = canvasRef.value
  const wrap = canvasWrapRef.value
  if (!el || !wrap)
    return
  const { clientWidth, clientHeight } = wrap
  canvas = new Canvas(el, {
    selection: true,
    preserveObjectStacking: true,
  })
  canvas.setWidth(clientWidth)
  canvas.setHeight(clientHeight)

  canvas.on('selection:created', (e) => {
    selectedObject.value = e.selected?.[0] || null
  })
  canvas.on('selection:updated', (e) => {
    selectedObject.value = e.selected?.[0] || null
  })
  canvas.on('selection:cleared', () => {
    selectedObject.value = null
  })

  canvas.on('mouse:down', (opt) => {
    if (panMode.value) {
      const evt = opt.e
      canvas.isDragging = true
      canvas.lastPosX = evt.clientX
      canvas.lastPosY = evt.clientY
    }
  })
  canvas.on('mouse:move', (opt) => {
    if (canvas.isDragging && panMode.value) {
      const e = opt.e
      const v = new Point(e.clientX - canvas.lastPosX, e.clientY - canvas.lastPosY)
      canvas.relativePan(v)
      canvas.lastPosX = e.clientX
      canvas.lastPosY = e.clientY
    }
  })
  canvas.on('mouse:up', () => {
    canvas.isDragging = false
  })
  canvas.on('mouse:wheel', (opt) => {
    const delta = opt.e.deltaY
    let zoom = canvas.getZoom()
    zoom *= 0.999 ** delta
    zoom = Math.min(3, Math.max(0.2, zoom))
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
    opt.e.preventDefault()
    opt.e.stopPropagation()
  })

  window.addEventListener('resize', resizeCanvas)
}

function disposeCanvas() {
  window.removeEventListener('resize', resizeCanvas)
  if (canvas) {
    canvas.dispose()
    canvas = null
  }
}

function resizeCanvas() {
  if (!canvas || !canvasWrapRef.value)
    return
  const { clientWidth, clientHeight } = canvasWrapRef.value
  canvas.setWidth(clientWidth)
  canvas.setHeight(clientHeight)
  if (bgImage) {
    zoomToFit()
  }
}

async function handleUploadChange(payload) {
  try {
    const { file, fileList } = payload || {}
    let raw = file?.file
    if (!raw && Array.isArray(fileList) && fileList.length) {
      raw = fileList[fileList.length - 1]?.file
    }
    if (raw) {
      const objUrl = URL.createObjectURL(raw)
      fileMeta.name = file?.name || raw.name
      fileMeta.sizeMB = Number((raw.size / (1024 * 1024)).toFixed(2))
      pushRecent({ name: fileMeta.name, objectUrl: objUrl })
      await loadImage(objUrl)
      return
    }
    if (file?.url) {
      fileMeta.name = file.name
      fileMeta.sizeMB = 0
      pushRecent({ name: file.name, objectUrl: file.url })
      await loadImage(file.url)
    }
  }
  catch (e) {
    console.warn('load image failed', e)
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function loadImage(dataUrl) {
  if (!canvas)
    initCanvas()
  imageLoaded.value = false
  canvas.clear()
  try {
    const img = await Image.fromURL(String(dataUrl))
    bgImage = img
    img.selectable = false
    img.evented = false
    canvas.add(img)
    img.moveTo(0)
    zoomToFit()
    imageLoaded.value = true
    fileMeta.width = Math.round(img.width || 0)
    fileMeta.height = Math.round(img.height || 0)
    canvas.requestRenderAll()
    return true
  }
  catch (err) {
    console.warn('load image failed', err)
    $message?.error?.('图片读取失败')
    return false
  }
}

function pushRecent({ name, objectUrl }) {
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`
  recentImages.unshift({ id, name, objectUrl })
  if (recentImages.length > 12) {
    const removed = recentImages.pop()
    try { URL.revokeObjectURL(removed.objectUrl) }
    catch {}
  }
  currentImageIndex.value = 0
}

function switchImage(index) {
  const item = recentImages[index]
  if (!item)
    return
  currentImageIndex.value = index
  loadImage(item.objectUrl)
}

function removeImage(index) {
  const item = recentImages[index]
  if (!item)
    return
  recentImages.splice(index, 1)
  try { URL.revokeObjectURL(item.objectUrl) }
  catch {}
  if (index === currentImageIndex.value) {
    currentImageIndex.value = recentImages.length ? 0 : -1
    if (recentImages.length) {
      loadImage(recentImages[0].objectUrl)
    }
    else {
      clearAnnotations()
      canvas?.clear()
      imageLoaded.value = false
    }
  }
}

function zoomToFit() {
  if (!canvas || !bgImage)
    return
  const wrap = canvasWrapRef.value
  const fitW = wrap.clientWidth
  const fitH = wrap.clientHeight
  const imgW = bgImage.width
  const imgH = bgImage.height
  const scale = Math.min(fitW / imgW, fitH / imgH)
  bgImage.scaleX = scale
  bgImage.scaleY = scale
  bgImage.left = (fitW - imgW * scale) / 2
  bgImage.top = (fitH - imgH * scale) / 2
  canvas.setZoom(1)
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
  canvas.requestRenderAll()
}

function togglePan() {
  panMode.value = !panMode.value
}

function setDrawMode(mode) {
  drawMode.value = mode
  if (mode === 'rect') {
    startRectDraw()
  }
}

let drawRectTmp = null
function startRectDraw() {
  if (!canvas || !imageLoaded.value)
    return
  canvas.discardActiveObject()
  canvas.selection = false
  const startHandler = (opt) => {
    if (drawMode.value !== 'rect')
      return
    const p = canvas.getPointer(opt.e)
    drawRectTmp = new Rect({
      left: p.x,
      top: p.y,
      width: 0,
      height: 0,
      fill: 'rgba(0,0,0,0.05)',
      stroke: '#00d1b2',
      strokeWidth: 2,
      selectable: false,
      originX: 'left',
      originY: 'top',
    })
    canvas.add(drawRectTmp)
    drawRectTmp.__startX = p.x
    drawRectTmp.__startY = p.y
  }
  const moveHandler = (opt) => {
    if (!drawRectTmp || drawMode.value !== 'rect')
      return
    const p = canvas.getPointer(opt.e)
    const sx = drawRectTmp.__startX
    const sy = drawRectTmp.__startY
    const left = Math.min(sx, p.x)
    const top = Math.min(sy, p.y)
    const width = Math.abs(p.x - sx)
    const height = Math.abs(p.y - sy)
    drawRectTmp.set({ left, top, width, height })
    canvas.requestRenderAll()
  }
  const upHandler = () => {
    if (!drawRectTmp)
      return
    const rect = drawRectTmp
    drawRectTmp = null
    canvas.off('mouse:down', startHandler)
    canvas.off('mouse:move', moveHandler)
    canvas.off('mouse:up', upHandler)
    if ((rect.width || 0) < 2 || (rect.height || 0) < 2) {
      canvas.remove(rect)
      canvas.selection = true
      drawMode.value = 'none'
      canvas.requestRenderAll()
      return
    }
    finalizeRect(rect)
    canvas.selection = true
    drawMode.value = 'none'
  }
  canvas.on('mouse:down', startHandler)
  canvas.on('mouse:move', moveHandler)
  canvas.on('mouse:up', upHandler)
}

function finalizeRect(rect) {
  rect.set({ selectable: true })
  rect.setControlsVisibility({ mtr: false })
  rect.label = currentLabel.value || 'Unlabeled'
  const text = new Text(rect.label, {
    left: rect.left,
    top: rect.top - 18,
    fontSize: 14,
    fill: '#111827',
    backgroundColor: 'rgba(255,255,255,0.7)',
    selectable: false,
  })
  rect.on('modified', () => {
    text.set({ left: rect.left, top: rect.top - 18 })
    canvas.requestRenderAll()
  })
  rect.on('moving', () => {
    text.set({ left: rect.left, top: rect.top - 18 })
  })
  rect.on('selected', () => {
    selectedObject.value = rect
  })
  rect.on('deselected', () => {
    if (selectedObject.value === rect)
      selectedObject.value = null
  })
  canvas.add(text)
  rect.labelText = text
  canvas.bringToFront(rect)
  canvas.bringToFront(text)
  canvas.requestRenderAll()
}

function deleteSelected() {
  const obj = selectedObject.value
  if (!obj)
    return
  if (obj.labelText)
    canvas.remove(obj.labelText)
  canvas.remove(obj)
  selectedObject.value = null
  canvas.requestRenderAll()
}

function clearAnnotations() {
  if (!canvas)
    return
  const toRemove = canvas.getObjects().filter(o => o !== bgImage)
  toRemove.forEach(o => canvas.remove(o))
  selectedObject.value = null
  canvas.requestRenderAll()
}

function addLabel() {
  const v = (newLabel.value || '').trim()
  if (!v)
    return
  if (!labelOptions.value.find(o => o.value === v)) {
    labelOptions.value.push({ label: v, value: v })
  }
  currentLabel.value = v
  newLabel.value = ''
}

function getImageScale() {
  if (!bgImage)
    return { scale: 1, offsetX: 0, offsetY: 0 }
  return {
    scale: bgImage.scaleX || 1,
    offsetX: bgImage.left || 0,
    offsetY: bgImage.top || 0,
  }
}

function exportJSON() {
  const { scale, offsetX, offsetY } = getImageScale()
  const boxes = canvas.getObjects().filter(o => o.type === 'rect').map((r) => {
    const x = (r.left - offsetX) / scale
    const y = (r.top - offsetY) / scale
    const w = r.width / scale
    const h = r.height / scale
    return {
      label: r.label || 'Unlabeled',
      bbox: [Math.round(x), Math.round(y), Math.round(w), Math.round(h)],
    }
  })
  const meta = {
    image: {
      width: Math.round(bgImage?.width || 0),
      height: Math.round(bgImage?.height || 0),
    },
    annotations: boxes,
  }
  const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'annotations.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

function exportPNG() {
  const dataUrl = canvas.toDataURL({ format: 'png' })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = 'annotated.png'
  a.click()
}

async function handleImportChange({ file }) {
  try {
    const raw = file?.file
    if (!raw)
      return
    const text = await raw.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data.annotations))
      return
    // 清除现有标注
    clearAnnotations()
    const scale = bgImage?.scaleX || 1
    const offsetX = bgImage?.left || 0
    const offsetY = bgImage?.top || 0
    data.annotations.forEach((a) => {
      const [x, y, w, h] = a.bbox || []
      const rect = new Rect({
        left: x * scale + offsetX,
        top: y * scale + offsetY,
        width: w * scale,
        height: h * scale,
        fill: 'rgba(0,0,0,0.05)',
        stroke: '#00d1b2',
        strokeWidth: 2,
        selectable: true,
        originX: 'left',
        originY: 'top',
      })
      rect.label = a.label || 'Unlabeled'
      const textObj = new Text(rect.label, {
        left: rect.left,
        top: rect.top - 18,
        fontSize: 14,
        fill: '#111827',
        backgroundColor: 'rgba(255,255,255,0.7)',
        selectable: false,
      })
      rect.labelText = textObj
      canvas.add(rect)
      canvas.add(textObj)
    })
    canvas.requestRenderAll()
  }
  catch (e) {
    console.warn('import failed', e)
    $message?.error?.('导入失败：JSON格式不正确')
  }
}

onMounted(() => {
  initCanvas()
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      drawMode.value = 'none'
      canvas?.off('mouse:down')
      canvas?.off('mouse:move')
      canvas?.off('mouse:up')
      canvas && (canvas.selection = true)
    }
    if (e.key === 'Delete') {
      deleteSelected()
    }
  })
})

onBeforeUnmount(() => {
  disposeCanvas()
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
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}
.canvas-wrap {
  position: relative;
  flex: 1;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}
canvas {
  width: 100%;
  height: 100%;
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
.empty-icon {
  opacity: 0.4;
}
.empty-text {
  font-size: 14px;
  letter-spacing: 0.05em;
}
.draw-hint {
  position: absolute;
  top: 12px;
  left: 12px;
}
.thumbs {
  margin-top: 8px;
}
.thumb-card {
  width: 160px;
  cursor: pointer;
  border-radius: 10px;
}
.thumb-card.active {
  outline: 2px solid var(--n-color-target);
}
.thumb-body {
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}
.thumb-name {
  font-size: 12px;
  color: #6b7280;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
