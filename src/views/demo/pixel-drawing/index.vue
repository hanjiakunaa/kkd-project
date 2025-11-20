<template>
  <common-page class="pixel-page" :show-footer="false" :show-header="false">
    <div ref="layoutRef" class="pixel-drawing">
      <header ref="toolbarRef" class="toolbar">
        <div class="toolbar__section toolbar__section--color">
          <span class="toolbar__title">颜色</span>
          <n-color-picker
            v-model:value="selectedColor"
            :modes="['hex']"
            size="small"
            class="toolbar__color-picker"
            :show-alpha="false"
          />
        </div>
        <n-divider vertical class="toolbar__divider" />
        <div class="toolbar__section toolbar__section--palette">
          <span class="toolbar__title">色板</span>
          <n-space size="small" wrap>
            <n-button
              v-for="color in paletteColors"
              :key="color"
              quaternary
              class="palette__swatch"
              :class="{ 'palette__swatch--active': color === selectedColor }"
              :style="getPaletteButtonStyle(color)"
              type="primary"
              aria-label="选择调色板颜色"
              @click="handlePaletteSelect(color)"
            />
          </n-space>
        </div>
        <n-divider vertical class="toolbar__divider" />
        <div class="toolbar__section toolbar__section--tools">
          <span class="toolbar__title">工具</span>
          <n-space size="small" wrap>
            <n-button
              size="small"
              :type="currentTool === 'brush' ? 'primary' : 'default'"
              :ghost="currentTool !== 'brush'"
              round
              @click="currentTool = 'brush'"
            >
              画笔
            </n-button>
            <n-button
              size="small"
              :type="currentTool === 'eraser' ? 'primary' : 'default'"
              :ghost="currentTool !== 'eraser'"
              round
              @click="currentTool = 'eraser'"
            >
              橡皮擦
            </n-button>
            <n-button
              size="small"
              :type="currentTool === 'eyedropper' ? 'primary' : 'default'"
              :ghost="currentTool !== 'eyedropper'"
              round
              @click="currentTool = 'eyedropper'"
            >
              取色
            </n-button>
          </n-space>
        </div>
        <n-divider vertical class="toolbar__divider" />
        <div class="toolbar__section toolbar__section--size">
          <span class="toolbar__title">像素大小</span>
          <n-select
            v-model:value="pixelSize"
            class="toolbar__select"
            size="small"
            :options="pixelSizeSelectOptions"
            :consistent-menu-width="false"
            placement="bottom-start"
          />
        </div>
        <div class="toolbar__section toolbar__section--actions">
          <n-button type="tertiary" size="small" secondary strong @click="clearCanvas">
            清空
          </n-button>
          <n-button type="primary" size="small" strong quaternary @click="openExportModal">
            导出图片
          </n-button>
          <n-button type="success" size="small" strong quaternary @click="openGifModal">
            导出GIF
          </n-button>
        </div>
      </header>

      <div class="canvas-wrapper">
        <section
          ref="canvasRef"
          class="canvas"
          :style="canvasStyle"
          @mouseleave="stopDrawing"
          @mouseup="stopDrawing"
          @touchstart.prevent="handleTouchStart"
          @touchmove.prevent="handleTouchMove"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchEnd"
        >
          <div v-for="(row, rowIndex) in pixels" :key="rowIndex" class="canvas__row">
            <div
              v-for="(color, colIndex) in row"
              :key="colIndex"
              class="canvas__pixel"
              :style="{ '--pixel-color': color }"
              :data-row="rowIndex"
              :data-col="colIndex"
              @mousedown.stop="handlePixelMouseDown(rowIndex, colIndex)"
              @mouseenter="handleHover(rowIndex, colIndex)"
            />
          </div>
        </section>
      </div>
    </div>

    <!-- PNG 导出弹窗 -->
    <me-modal
      ref="exportModalRef"
      title="导出为图片"
      width="420px"
      :show-footer="false"
    >
      <div class="export-modal">
        <n-form label-placement="top" :show-feedback="false">
          <n-form-item label="宽度（px）">
            <n-input-number
              v-model:value="exportOptions.width"
              :min="DEFAULT_COLS"
              :max="4096"
              :step="32"
              placeholder="输出宽度"
              clearable
              class="w-full"
            />
          </n-form-item>
          <n-form-item label="高度（px）">
            <n-input-number
              v-model:value="exportOptions.height"
              :min="DEFAULT_ROWS"
              :max="4096"
              :step="32"
              :disabled="exportOptions.lockRatio"
              placeholder="输出高度"
              clearable
              class="w-full"
            />
          </n-form-item>
          <n-form-item>
            <n-checkbox v-model:checked="exportOptions.lockRatio">
              锁定宽高比（1:1）
            </n-checkbox>
          </n-form-item>
          <n-form-item label="背景设置">
            <n-radio-group v-model:value="exportOptions.backgroundType">
              <n-space>
                <n-radio value="transparent">
                  透明背景
                </n-radio>
                <n-radio value="color">
                  自定义颜色
                </n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>

          <n-form-item v-if="exportOptions.backgroundType === 'color'" label="背景颜色">
            <n-color-picker
              v-model:value="exportOptions.backgroundColor"
              :modes="['hex']"
              :show-alpha="false"
            />
          </n-form-item>
        </n-form>
        <div class="export-modal__actions">
          <n-button tertiary @click="closeExportModal">
            取消
          </n-button>
          <n-button type="primary" @click="handleExportConfirm">
            导出
          </n-button>
        </div>
      </div>
    </me-modal>

    <!-- GIF 导出弹窗 -->
    <me-modal
      ref="gifModalRef"
      title="导出为 GIF 动画"
      width="480px"
      :show-footer="false"
    >
      <div class="export-modal">
        <n-form label-placement="top" :show-feedback="false">
          <n-form-item label="动画效果">
            <n-select
              v-model:value="gifOptions.animationType"
              :options="animationTypeOptions"
              placeholder="选择动画效果"
            />
          </n-form-item>
          <n-form-item label="输出宽度（px）">
            <n-input-number
              v-model:value="gifOptions.width"
              :min="DEFAULT_COLS"
              :max="1024"
              :step="32"
              placeholder="输出宽度"
              class="w-full"
            />
          </n-form-item>
          <n-form-item label="输出高度（px）">
            <n-input-number
              v-model:value="gifOptions.height"
              :min="DEFAULT_ROWS"
              :max="1024"
              :step="32"
              :disabled="gifOptions.lockRatio"
              placeholder="输出高度"
              class="w-full"
            />
          </n-form-item>
          <n-form-item>
            <n-checkbox v-model:checked="gifOptions.lockRatio">
              锁定宽高比（1:1）
            </n-checkbox>
          </n-form-item>
          <n-form-item label="背景设置">
            <n-radio-group v-model:value="gifOptions.backgroundType">
              <n-space>
                <n-radio value="transparent">
                  透明背景
                </n-radio>
                <n-radio value="color">
                  自定义颜色
                </n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>

          <n-form-item v-if="gifOptions.backgroundType === 'color'" label="背景颜色">
            <n-color-picker
              v-model:value="gifOptions.backgroundColor"
              :modes="['hex']"
              :show-alpha="false"
            />
          </n-form-item>
          <n-form-item label="帧延迟（毫秒）">
            <n-slider
              v-model:value="gifOptions.frameDelay"
              :min="50"
              :max="1000"
              :step="50"
              :marks="{ 50: '50ms', 500: '500ms', 1000: '1000ms' }"
            />
          </n-form-item>
          <n-form-item label="动画质量">
            <n-slider
              v-model:value="gifOptions.quality"
              :min="1"
              :max="20"
              :step="1"
              :marks="{ 1: '最佳', 10: '平衡', 20: '最快' }"
            />
          </n-form-item>
        </n-form>

        <div class="export-modal__actions">
          <n-button tertiary :disabled="gifProgress.isGenerating" @click="closeGifModal">
            取消
          </n-button>
          <n-button
            type="success"
            :loading="gifProgress.isGenerating"
            :disabled="gifProgress.isGenerating"
            @click="handleGifExportConfirm"
          >
            生成 GIF
          </n-button>
        </div>
      </div>
    </me-modal>
  </common-page>
</template>

<script setup>
import {
  onBeforeUnmount,
} from 'vue'
import { MeModal } from '@/components'
import {
  ANIMATION_TYPE_OPTIONS,
  BASE_PIXEL_SIZE,
  createPixelGrid,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  EMPTY_COLOR,
  exportGif,
  exportImage,
  PALETTE_COLORS,
  useModal,
} from '@/composables'

const pixels = ref(createPixelGrid(DEFAULT_ROWS, DEFAULT_COLS))
const paletteColors = PALETTE_COLORS
const selectedColor = ref('#ff7f50')
const currentTool = ref('brush')
const isDrawing = ref(false)
const pixelSizeOptions = [10, 15, 20, 25, 30]
const pixelSize = ref(BASE_PIXEL_SIZE)
const canvasRef = ref(null)
const toolbarRef = ref(null)
const layoutRef = ref(null)
const lastTouchPixel = ref({ row: null, col: null })

const [exportModalRef] = useModal()
const [gifModalRef] = useModal()

const exportOptions = reactive({
  width: 512,
  height: 512,
  lockRatio: true,
  backgroundType: 'color', // 'transparent' 或 'color'
  backgroundColor: '#ffffff', // 默认白色
})

const gifOptions = reactive({
  animationType: 'blink',
  width: 512,
  height: 512,
  lockRatio: true,
  frameDelay: 200,
  quality: 10,
  backgroundType: 'color', // 'transparent' 或 'color'
  backgroundColor: '#ffffff', // 默认白色
})

const gifProgress = reactive({
  isGenerating: false,
  message: '',
})

const animationTypeOptions = ANIMATION_TYPE_OPTIONS

const canvasStyle = computed(() => ({
  '--cols': DEFAULT_COLS,
  '--rows': DEFAULT_ROWS,
  '--pixel-scale': (pixelSize.value / BASE_PIXEL_SIZE).toFixed(2),
}))

const pixelSizeSelectOptions = computed(() =>
  pixelSizeOptions.map(size => ({
    label: `${size}px`,
    value: size,
  })),
)

function applyPaint(rowIndex, colIndex) {
  const nextColor
    = currentTool.value === 'brush' ? selectedColor.value : EMPTY_COLOR
  if (pixels.value[rowIndex][colIndex] === nextColor) {
    return
  }
  pixels.value[rowIndex][colIndex] = nextColor
}

function handleHover(rowIndex, colIndex) {
  if (!isDrawing.value || currentTool.value === 'eyedropper') {
    return
  }
  applyPaint(rowIndex, colIndex)
}

function stopDrawing() {
  isDrawing.value = false
  lastTouchPixel.value = { row: null, col: null }
}

function handlePixelMouseDown(rowIndex, colIndex) {
  if (currentTool.value === 'eyedropper') {
    pickColor(rowIndex, colIndex)
    return
  }
  isDrawing.value = true
  applyPaint(rowIndex, colIndex)
}

function clearCanvas() {
  pixels.value = createPixelGrid(DEFAULT_ROWS, DEFAULT_COLS)
}

function handlePaletteSelect(color) {
  selectedColor.value = color
}

function getPaletteButtonStyle(color) {
  const isActive = selectedColor.value === color
  return {
    backgroundColor: color,
    borderColor: 'transparent',
    boxShadow: isActive
      ? '0 0 0 3px rgba(64, 158, 255, 0.28)'
      : '0 2px 6px rgba(15, 23, 42, 0.1)',
    outline: isActive ? '1px solid rgba(64, 158, 255, 0.3)' : 'none',
    color: '#fff',
  }
}

function pickColor(rowIndex, colIndex) {
  const color = pixels.value[rowIndex][colIndex] || EMPTY_COLOR
  selectedColor.value = color
  currentTool.value = 'brush'
}

function getPixelFromTouchEvent(event) {
  const touch = event.touches[0] || event.changedTouches[0]
  if (!touch) {
    return null
  }
  const element = document.elementFromPoint(touch.clientX, touch.clientY)
  const rowAttr = element?.dataset?.row
  const colAttr = element?.dataset?.col

  if (rowAttr === undefined || colAttr === undefined) {
    return null
  }

  return {
    row: Number(rowAttr),
    col: Number(colAttr),
  }
}

function handleTouchStart(event) {
  const pixel = getPixelFromTouchEvent(event)
  if (!pixel) {
    return
  }
  if (currentTool.value === 'eyedropper') {
    pickColor(pixel.row, pixel.col)
    return
  }
  isDrawing.value = true
  lastTouchPixel.value = pixel
  applyPaint(pixel.row, pixel.col)
}

function handleTouchMove(event) {
  if (!isDrawing.value) {
    return
  }
  const pixel = getPixelFromTouchEvent(event)
  if (!pixel) {
    return
  }
  if (currentTool.value === 'eyedropper') {
    return
  }
  const last = lastTouchPixel.value
  if (last.row === pixel.row && last.col === pixel.col) {
    return
  }
  lastTouchPixel.value = pixel
  applyPaint(pixel.row, pixel.col)
}

function handleTouchEnd() {
  stopDrawing()
}

function handleGlobalMouseUp() {
  stopDrawing()
}
window.addEventListener('mouseup', handleGlobalMouseUp)

function updateLayoutMetrics() {
  if (!layoutRef.value) {
    return
  }
  const toolbarHeight = toolbarRef.value?.offsetHeight ?? 0
  layoutRef.value.style.setProperty('--toolbar-height', `${toolbarHeight}px`)
}

function openExportModal() {
  if (
    !Number.isFinite(exportOptions.width)
    || exportOptions.width < DEFAULT_COLS
  ) {
    exportOptions.width = 512
  }
  if (exportOptions.lockRatio) {
    exportOptions.height = exportOptions.width
  }
  else if (
    !Number.isFinite(exportOptions.height)
    || exportOptions.height < DEFAULT_ROWS
  ) {
    exportOptions.height = 512
  }
  exportModalRef.value?.open({
    title: '导出为图片',
    width: '420px',
    showFooter: false,
  })
}

function closeExportModal() {
  exportModalRef.value?.close()
}

function handleExportConfirm() {
  const width = Math.round(Math.max(DEFAULT_COLS, exportOptions.width || DEFAULT_COLS))
  const height = exportOptions.lockRatio
    ? width
    : Math.round(Math.max(DEFAULT_ROWS, exportOptions.height || DEFAULT_ROWS))

  exportImage(
    pixels.value,
    width,
    height,
    exportOptions.backgroundType,
    exportOptions.backgroundColor,
  )
  closeExportModal()
}

function openGifModal() {
  if (!Number.isFinite(gifOptions.width) || gifOptions.width < DEFAULT_COLS) {
    gifOptions.width = 512
  }
  if (gifOptions.lockRatio) {
    gifOptions.height = gifOptions.width
  }

  gifModalRef.value?.open({
    title: '导出为 GIF 动画',
    width: '480px',
    showFooter: false,
  })
}

function closeGifModal() {
  gifModalRef.value?.close()
}

async function handleGifExportConfirm() {
  gifProgress.isGenerating = true
  gifProgress.message = '正在初始化...'

  try {
    const width = Math.round(Math.max(DEFAULT_COLS, gifOptions.width || 512))
    const height = gifOptions.lockRatio
      ? width
      : Math.round(Math.max(DEFAULT_ROWS, gifOptions.height || 512))

    await exportGif(
      pixels.value,
      {
        animationType: gifOptions.animationType,
        width,
        height,
        frameDelay: gifOptions.frameDelay,
        quality: gifOptions.quality,
        backgroundType: gifOptions.backgroundType,
        backgroundColor: gifOptions.backgroundColor,
      },
      (message) => {
        gifProgress.message = message
      },
    )

    gifProgress.isGenerating = false
    gifProgress.message = ''
    closeGifModal()
  }
  catch (error) {
    console.error('生成 GIF 失败:', error)
    gifProgress.isGenerating = false
    gifProgress.message = ''
  }
}

watch(
  () => exportOptions.lockRatio,
  (locked) => {
    if (locked) {
      exportOptions.height = exportOptions.width
    }
  },
)

watch(
  () => exportOptions.width,
  (value) => {
    if (exportOptions.lockRatio) {
      exportOptions.height = value
    }
  },
)

watch(
  () => gifOptions.lockRatio,
  (locked) => {
    if (locked) {
      gifOptions.height = gifOptions.width
    }
  },
)

watch(
  () => gifOptions.width,
  (value) => {
    if (gifOptions.lockRatio) {
      gifOptions.height = value
    }
  },
)

onMounted(() => {
  updateLayoutMetrics()
  window.addEventListener('resize', updateLayoutMetrics)
})

onBeforeUnmount(() => {
  window.removeEventListener('mouseup', handleGlobalMouseUp)
  window.removeEventListener('resize', updateLayoutMetrics)
})
</script>

<style scoped>
.pixel-page {
  height: 100%;
}

.pixel-page :deep(.cus-scroll) {
  margin: 0;
  padding: 0;
  border-radius: 0;
  display: flex;
  flex: 1;
  min-height: 0;
}

.pixel-drawing {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  height: 100vh;
  box-sizing: border-box;
  padding: clamp(12px, 2.5vw, 24px);
  background: var(--pixel-page-bg, transparent);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: clamp(10px, 2vw, 20px);
  flex-wrap: wrap;
  background: var(--el-bg-color-page, rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(8px);
  padding: 12px clamp(16px, 2.8vw, 28px);
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
}

.toolbar__section {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
}

.toolbar__section--palette {
  gap: 12px;
}

.toolbar__section--actions {
  margin-left: auto;
  display: inline-flex;
  gap: 8px;
}

.toolbar__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #4b5563);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.toolbar__section--color {
  gap: 8px;
}

.toolbar__color-picker {
  width: 48px;
  height: 38px;
}

.toolbar__color-picker :deep(.n-color-picker-trigger) {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 1px solid #d0d5dd;
  box-shadow: none;
}

.toolbar__color-picker :deep(.n-color-picker-trigger__fill) {
  border-radius: 6px;
}

.toolbar__color-picker :deep(.n-color-picker-trigger__value) {
  display: none;
}

.toolbar__select {
  min-width: 110px;
}

.toolbar__select :deep(.n-base-selection) {
  border-radius: 8px;
  min-height: 32px;
}

.toolbar__divider {
  height: 28px;
}

.palette__swatch {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;
  border: none;
  padding: 0;
}

.palette__swatch :deep(.n-button__content) {
  display: none;
}

.palette__swatch:hover,
.palette__swatch--active {
  transform: scale(1.05);
}

.toolbar :deep(.n-button) {
  border-radius: 999px;
  transition: all 0.2s ease;
}

.toolbar :deep(.n-button--type-primary:not(.palette__swatch)) {
  box-shadow: 0 8px 16px rgba(64, 158, 255, 0.18);
}

.export-modal {
  min-width: 0;
}

.export-modal :deep(.n-form-item) {
  margin-bottom: 12px;
}

.export-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.canvas-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: clamp(12px, 3vw, 32px);
}

.canvas {
  position: relative;
  display: grid;
  width: min(90vw, max(260px, calc(100vh - var(--toolbar-height, 140px) - clamp(48px, 8vh, 160px))));
  height: min(90vw, max(260px, calc(100vh - var(--toolbar-height, 140px) - clamp(48px, 8vh, 160px))));
  aspect-ratio: 1 / 1;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: clamp(0.5px, 0.12vw, 2px);
  padding: clamp(14px, 2vw, 28px);
  background: #d9d9d9;
  border-radius: 24px;
  user-select: none;
  cursor: crosshair;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.14);
  transition:
    width 0.3s ease,
    height 0.3s ease;
  touch-action: none;
}

.canvas__row {
  display: contents;
}

.canvas__pixel {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.canvas__pixel::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--pixel-color, transparent);
  border-radius: clamp(1px, 0.4vw, 4px);
  transform: scale(var(--pixel-scale, 1));
  transform-origin: center;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.1s ease;
}

.canvas__pixel:hover::after {
  box-shadow:
    inset 0 0 0 1px rgba(64, 158, 255, 0.7),
    0 0 0 2px rgba(64, 158, 255, 0.18);
}
</style>
