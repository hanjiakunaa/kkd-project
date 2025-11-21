import GIF from 'gif.js'

// 常量
export const DEFAULT_ROWS = 32
export const DEFAULT_COLS = 32
export const EMPTY_COLOR = '#ffffff'
export const BASE_PIXEL_SIZE = 20

// 调色板颜色
export const PALETTE_COLORS = [
  '#161D3F', // 深海蓝
  '#F1E4D3', // 奶油米
  '#FF8A65', // 珊瑚橙
  '#FFD369', // 柔光黄
  '#69C9BA', // 薄荷青
  '#4F83FF', // 湖水蓝
  '#9A6BFF', // 薰衣紫
  '#FF7BB2', // 樱花粉
  '#CB9B6F', // 焦糖棕
  '#6B7A8F', // 雾霾灰蓝
]

// 动画类型选项
export const ANIMATION_TYPE_OPTIONS = [
  { label: '闪烁效果', value: 'blink' },
  { label: '旋转动画', value: 'rotate' },
  { label: '缩放动画', value: 'scale' },
  { label: '渐变切换', value: 'fade' },
  { label: '彩虹效果', value: 'rainbow' },
  { label: '闪光发光', value: 'glow' },
  { label: '拆解动作', value: 'explode' },
  { label: '粒子漂浮', value: 'particles' },
  { label: '波浪效果', value: 'wave' },
  { label: '抖动效果', value: 'shake' },
  { label: '像素下落', value: 'fall' },
]

/**
 * 创建像素网格
 */
export function createPixelGrid(rows, cols, fill = EMPTY_COLOR) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => fill))
}

/**
 * 创建 Canvas 从像素数据
 */
export function createCanvasFromPixels(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  canvas.width = width
  canvas.height = height

  // 根据背景类型设置背景
  if (bgType === 'color') {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)
  }

  const scaleX = width / DEFAULT_COLS
  const scaleY = height / DEFAULT_ROWS

  pixelData.forEach((row, rowIndex) => {
    row.forEach((color, colIndex) => {
      // 跳过 EMPTY_COLOR 像素（在透明模式下保持透明，在颜色模式下显示背景色）
      if (color === EMPTY_COLOR) {
        return
      }

      ctx.fillStyle = color
      ctx.fillRect(colIndex * scaleX, rowIndex * scaleY, scaleX, scaleY)
    })
  })

  return canvas
}

/**
 * 导出图片
 */
export function exportImage(pixelData, targetWidth = DEFAULT_COLS, targetHeight = DEFAULT_ROWS, bgType = 'color', bgColor = '#ffffff') {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  const exportWidth = Number.isFinite(targetWidth) && targetWidth > 0 ? targetWidth : DEFAULT_COLS
  const exportHeight = Number.isFinite(targetHeight) && targetHeight > 0 ? targetHeight : DEFAULT_ROWS

  canvas.width = exportWidth
  canvas.height = exportHeight

  // 根据背景类型设置背景
  if (bgType === 'color') {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, exportWidth, exportHeight)
  }

  const scaleX = exportWidth / DEFAULT_COLS
  const scaleY = exportHeight / DEFAULT_ROWS

  pixelData.forEach((row, rowIndex) => {
    row.forEach((color, colIndex) => {
      // 跳过 EMPTY_COLOR 像素（在透明模式下保持透明，在颜色模式下显示背景色）
      if (color === EMPTY_COLOR) {
        return
      }

      ctx.fillStyle = color
      ctx.fillRect(colIndex * scaleX, rowIndex * scaleY, scaleX, scaleY)
    })
  })

  const link = document.createElement('a')
  link.download = `pixel-drawing-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * 生成闪烁动画帧
 */
export function generateBlinkFrames(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const frames = []

  // 原图
  frames.push(createCanvasFromPixels(pixelData, width, height, bgType, bgColor))

  // 反色图
  const invertedPixels = pixelData.map(row =>
    row.map((color) => {
      if (color === EMPTY_COLOR)
        return color
      const hex = color.replace('#', '')
      const r = 255 - Number.parseInt(hex.substr(0, 2), 16)
      const g = 255 - Number.parseInt(hex.substr(2, 2), 16)
      const b = 255 - Number.parseInt(hex.substr(4, 2), 16)
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }),
  )
  frames.push(createCanvasFromPixels(invertedPixels, width, height, bgType, bgColor))

  return frames
}

/**
 * 生成旋转动画帧
 */
export function generateRotateFrames(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const frames = []
  const angles = [0, 90, 180, 270]

  angles.forEach((angle) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = width
    canvas.height = height
    // 设置背景
    if (bgType === 'color') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    }
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.rotate((angle * Math.PI) / 180)
    ctx.translate(-width / 2, -height / 2)

    const baseCanvas = createCanvasFromPixels(pixelData, width, height, bgType, bgColor)
    ctx.drawImage(baseCanvas, 0, 0)
    ctx.restore()

    frames.push(canvas)
  })

  return frames
}

/**
 * 生成缩放动画帧
 */
export function generateScaleFrames(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const frames = []
  const scales = [0.6, 0.8, 1.0, 1.2, 1.0, 0.8]

  scales.forEach((scale) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = width
    canvas.height = height
    // 设置背景
    if (bgType === 'color') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    }

    ctx.fillStyle = EMPTY_COLOR
    ctx.fillRect(0, 0, width, height)

    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const offsetX = (width - scaledWidth) / 2
    const offsetY = (height - scaledHeight) / 2

    const baseCanvas = createCanvasFromPixels(pixelData, width, height, bgType, bgColor)
    ctx.drawImage(baseCanvas, offsetX, offsetY, scaledWidth, scaledHeight)

    frames.push(canvas)
  })

  return frames
}

/**
 * 生成渐变切换动画帧
 */
export function generateFadeFrames(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const frames = []
  const alphas = [1.0, 0.7, 0.4, 0.1, 0.4, 0.7]

  alphas.forEach((alpha) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = width
    canvas.height = height

    // 设置背景
    if (bgType === 'color') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    }
    ctx.fillStyle = EMPTY_COLOR
    ctx.fillRect(0, 0, width, height)

    ctx.globalAlpha = alpha
    const baseCanvas = createCanvasFromPixels(pixelData, width, height, bgType, bgColor)
    ctx.drawImage(baseCanvas, 0, 0)

    frames.push(canvas)
  })

  return frames
}

/**
 * 生成彩虹效果动画帧
 */
export function generateRainbowFrames(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const frames = []
  const hues = [0, 60, 120, 180, 240, 300]

  hues.forEach((hue) => {
    const rainbowPixels = pixelData.map(row =>
      row.map((color) => {
        if (color === EMPTY_COLOR)
          return color
        return `hsl(${hue}, 70%, 60%)`
      }),
    )
    frames.push(createCanvasFromPixels(rainbowPixels, width, height, bgType, bgColor))
  })

  return frames
}

/**
 * 生成闪光发光动画帧
 */
export function generateGlowFrames(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const frames = []
  const glowSteps = [0, 0.3, 0.6, 1.0, 0.6, 0.3]

  glowSteps.forEach((glowIntensity) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = width
    canvas.height = height
    // 设置背景
    if (bgType === 'color') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    }

    ctx.fillStyle = EMPTY_COLOR
    ctx.fillRect(0, 0, width, height)

    const scaleX = width / DEFAULT_COLS
    const scaleY = height / DEFAULT_ROWS

    // 先绘制基础图像
    pixelData.forEach((row, rowIndex) => {
      row.forEach((color, colIndex) => {
        ctx.fillStyle = color
        ctx.fillRect(colIndex * scaleX, rowIndex * scaleY, scaleX, scaleY)
      })
    })

    // 添加发光效果
    if (glowIntensity > 0) {
      ctx.shadowBlur = 20 * glowIntensity
      ctx.shadowColor = `rgba(255, 255, 255, ${glowIntensity})`

      pixelData.forEach((row, rowIndex) => {
        row.forEach((color, colIndex) => {
          if (color !== EMPTY_COLOR) {
            ctx.fillStyle = color
            ctx.shadowColor = color
            ctx.fillRect(colIndex * scaleX, rowIndex * scaleY, scaleX, scaleY)
          }
        })
      })
    }

    frames.push(canvas)
  })

  return frames
}

/**
 * 生成拆解动作动画帧
 */
export function generateExplodeFrames(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const frames = []
  const steps = [0, 0.2, 0.4, 0.6, 0.8, 1.0]

  steps.forEach((progress) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = width
    canvas.height = height
    // 设置背景
    if (bgType === 'color') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    }

    ctx.fillStyle = EMPTY_COLOR
    ctx.fillRect(0, 0, width, height)

    const scaleX = width / DEFAULT_COLS
    const scaleY = height / DEFAULT_ROWS
    const centerX = DEFAULT_COLS / 2
    const centerY = DEFAULT_ROWS / 2

    pixelData.forEach((row, rowIndex) => {
      row.forEach((color, colIndex) => {
        if (color === EMPTY_COLOR)
          return

        // 计算距离中心的偏移
        const dx = colIndex - centerX
        const dy = rowIndex - centerY

        const offsetX = dx * progress * 0.5
        const offsetY = dy * progress * 0.5

        const newX = (colIndex + offsetX) * scaleX
        const newY = (rowIndex + offsetY) * scaleY

        ctx.globalAlpha = 1 - progress * 0.3
        ctx.fillStyle = color
        ctx.fillRect(newX, newY, scaleX, scaleY)
      })
    })

    ctx.globalAlpha = 1
    frames.push(canvas)
  })

  return frames
}

/**
 * 生成粒子漂浮动画帧
 */
export function generateParticlesFrames(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const frames = []
  const frameCount = 10

  // 收集所有非空像素
  const particles = []
  pixelData.forEach((row, rowIndex) => {
    row.forEach((color, colIndex) => {
      if (color !== EMPTY_COLOR) {
        particles.push({
          x: colIndex,
          y: rowIndex,
          color,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -Math.random() * 0.5 - 0.2,
        })
      }
    })
  })

  for (let i = 0; i < frameCount; i++) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = width
    canvas.height = height
    // 设置背景
    if (bgType === 'color') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    }
    ctx.fillStyle = EMPTY_COLOR
    ctx.fillRect(0, 0, width, height)

    const scaleX = width / DEFAULT_COLS
    const scaleY = height / DEFAULT_ROWS

    particles.forEach((p) => {
      const px = p.x + p.vx * i
      const py = p.y + p.vy * i

      if (px >= 0 && px < DEFAULT_COLS && py >= 0 && py < DEFAULT_ROWS) {
        ctx.fillStyle = p.color
        ctx.globalAlpha = 1 - (i / frameCount) * 0.5
        ctx.fillRect(px * scaleX, py * scaleY, scaleX, scaleY)
      }
    })

    ctx.globalAlpha = 1
    frames.push(canvas)
  }

  return frames
}

/**
 * 生成波浪效果动画帧
 */
export function generateWaveFrames(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const frames = []
  const frameCount = 8

  for (let i = 0; i < frameCount; i++) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = width
    canvas.height = height
    // 设置背景
    if (bgType === 'color') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    }
    ctx.fillStyle = EMPTY_COLOR
    ctx.fillRect(0, 0, width, height)

    const scaleX = width / DEFAULT_COLS
    const scaleY = height / DEFAULT_ROWS

    pixelData.forEach((row, rowIndex) => {
      row.forEach((color, colIndex) => {
        if (color === EMPTY_COLOR)
          return

        // 波浪效果
        const wave = Math.sin((colIndex + i) * 0.5) * 2
        const newY = rowIndex + wave

        ctx.fillStyle = color
        ctx.fillRect(colIndex * scaleX, newY * scaleY, scaleX, scaleY)
      })
    })

    frames.push(canvas)
  }

  return frames
}

/**
 * 生成抖动效果动画帧
 */
export function generateShakeFrames(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const frames = []
  const offsets = [
    { x: 0, y: 0 },
    { x: 2, y: -2 },
    { x: -2, y: 2 },
    { x: 3, y: 0 },
    { x: -3, y: -1 },
    { x: 1, y: 3 },
    { x: -1, y: -3 },
    { x: 0, y: 0 },
  ]

  offsets.forEach((offset) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = width
    canvas.height = height
    // 设置背景
    if (bgType === 'color') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    }

    ctx.fillStyle = EMPTY_COLOR
    ctx.fillRect(0, 0, width, height)

    const scaleX = width / DEFAULT_COLS
    const scaleY = height / DEFAULT_ROWS

    pixelData.forEach((row, rowIndex) => {
      row.forEach((color, colIndex) => {
        ctx.fillStyle = color
        ctx.fillRect(
          (colIndex * scaleX) + offset.x,
          (rowIndex * scaleY) + offset.y,
          scaleX,
          scaleY,
        )
      })
    })

    frames.push(canvas)
  })

  return frames
}

/**
 * 生成像素下落动画帧
 */
export function generateFallFrames(pixelData, width, height, bgType = 'color', bgColor = '#ffffff') {
  const frames = []
  const frameCount = 10

  for (let i = 0; i < frameCount; i++) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = width
    canvas.height = height
    // 设置背景
    if (bgType === 'color') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    }

    ctx.fillStyle = EMPTY_COLOR
    ctx.fillRect(0, 0, width, height)

    const scaleX = width / DEFAULT_COLS
    const scaleY = height / DEFAULT_ROWS

    pixelData.forEach((row, rowIndex) => {
      row.forEach((color, colIndex) => {
        if (color === EMPTY_COLOR)
          return

        // 每个像素下落速度不同
        const fallSpeed = (colIndex % 3) + 1
        const fallOffset = (i * fallSpeed) % (DEFAULT_ROWS + 5)
        const newY = rowIndex + fallOffset

        if (newY < DEFAULT_ROWS) {
          ctx.fillStyle = color
          ctx.fillRect(colIndex * scaleX, newY * scaleY, scaleX, scaleY)
        }
      })
    })

    frames.push(canvas)
  }

  return frames
}

/**
 * 根据动画类型生成帧
 */
export function generateAnimationFrames(pixelData, animationType, width, height, bgType, bgColor) {
  switch (animationType) {
    case 'blink':
      return generateBlinkFrames(pixelData, width, height, bgType, bgColor)
    case 'rotate':
      return generateRotateFrames(pixelData, width, height, bgType, bgColor)
    case 'scale':
      return generateScaleFrames(pixelData, width, height, bgType, bgColor)
    case 'fade':
      return generateFadeFrames(pixelData, width, height, bgType, bgColor)
    case 'rainbow':
      return generateRainbowFrames(pixelData, width, height, bgType, bgColor)
    case 'glow':
      return generateGlowFrames(pixelData, width, height, bgType, bgColor)
    case 'explode':
      return generateExplodeFrames(pixelData, width, height, bgType, bgColor)
    case 'particles':
      return generateParticlesFrames(pixelData, width, height, bgType, bgColor)
    case 'wave':
      return generateWaveFrames(pixelData, width, height, bgType, bgColor)
    case 'shake':
      return generateShakeFrames(pixelData, width, height, bgType, bgColor)
    case 'fall':
      return generateFallFrames(pixelData, width, height, bgType, bgColor)
    default:
      return []
  }
}

/**
 * 导出 GIF
 */
export async function exportGif(pixelData, options, progressCallback) {
  const {
    animationType,
    width,
    height,
    frameDelay,
    quality,
    backgroundType,
    backgroundColor,
  } = options

  // 生成帧
  const frames = generateAnimationFrames(
    pixelData,
    animationType,
    width,
    height,
    backgroundType,
    backgroundColor,
  )

  // 获取 worker 脚本路径（使用本地文件）
  // 注意：需要确保 public/gifjs/gif.worker.js 文件存在
  const workerUrl = '@/lib/gif.worker.js'

  // 创建 GIF 实例
  const gif = new GIF({
    workers: 2,
    quality,
    width,
    height,
    workerScript: workerUrl,
    transparent: backgroundType === 'transparent' ? 0xFFFFFF : null,
  })

  // 添加帧到 GIF
  frames.forEach((canvas) => {
    gif.addFrame(canvas, { delay: frameDelay })
  })

  // 设置进度回调
  if (progressCallback) {
    gif.on('progress', (progress) => {
      progressCallback(`正在渲染 GIF... ${Math.round(progress * 100)}%`)
    })
  }

  // 返回 Promise
  return new Promise((resolve, reject) => {
    gif.on('finished', (blob) => {
      const link = document.createElement('a')
      link.download = `pixel-animation-${Date.now()}.gif`
      link.href = URL.createObjectURL(blob)
      link.click()
      resolve(blob)
    })

    gif.on('error', (error) => {
      reject(error)
    })

    gif.render()
  })
}
