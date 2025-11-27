<template>
  <div ref="containerRef" class="video-background" :style="containerStyle">
    <!-- 封面图片 -->
    <div
      v-show="!videoLoaded || showPoster"
      class="video-background__poster"
      :style="posterStyle"
    />

    <!-- 视频元素 -->
    <video
      ref="videoRef"
      class="video-background__video"
      :style="videoStyle"
      :muted="muted"
      :loop="loop"
      :playsinline="true"
      :preload="preload"
      @loadeddata="onVideoLoaded"
      @canplay="onCanPlay"
      @canplaythrough="onCanPlayThrough"
      @playing="onPlaying"
      @pause="onPaused"
      @ended="onEnded"
      @error="onError"
    />

    <!-- 遮罩层 -->
    <div v-if="overlay" class="video-background__overlay" :style="overlayStyle" />

    <!-- 内容插槽 -->
    <div class="video-background__content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  // 视频源
  src: {
    type: String,
    required: true,
  },
  // 封面图片
  poster: {
    type: String,
    default: '',
  },
  // 响应式视频源配置
  // 格式: [{ src: string, res: number, autoplay: boolean, poster?: string }]
  sources: {
    type: Array,
    default: () => [],
  },
  // 是否自动播放
  autoplay: {
    type: Boolean,
    default: true,
  },
  // 遮罩层样式（支持渐变）
  overlay: {
    type: String,
    default: '',
  },
  // 是否静音
  muted: {
    type: Boolean,
    default: true,
  },
  // 是否循环播放
  loop: {
    type: Boolean,
    default: true,
  },
  // 预加载策略
  preload: {
    type: String,
    default: 'auto',
    validator: val => ['auto', 'metadata', 'none'].includes(val),
  },
  // 视频填充方式
  objectFit: {
    type: String,
    default: 'cover',
  },
  // 视频定位
  objectPosition: {
    type: String,
    default: 'center',
  },
  // 封面填充方式
  posterBgSize: {
    type: String,
    default: 'cover',
  },
  // 播放触发时机
  playsWhen: {
    type: String,
    default: 'canplay',
    validator: val => ['canplay', 'canplaythrough'].includes(val),
  },
  // 播放速率
  playbackRate: {
    type: Number,
    default: 1.0,
  },
  // 过渡动画
  transition: {
    type: String,
    default: 'fade',
  },
  // 容器高度
  height: {
    type: String,
    default: '100vh',
  },
  // 容器最大高度
  maxHeight: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['ready', 'playing', 'paused', 'error', 'loading', 'ended'])

// refs
const containerRef = ref(null)
const videoRef = ref(null)

// state
const videoLoaded = ref(false)
const showPoster = ref(true)
const currentSrc = ref(props.src)
const currentPoster = ref(props.poster)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1920)

// computed styles
const containerStyle = computed(() => ({
  height: props.height,
  maxHeight: props.maxHeight || undefined,
}))

const posterStyle = computed(() => ({
  backgroundImage: currentPoster.value ? `url(${currentPoster.value})` : 'none',
  backgroundSize: props.posterBgSize,
  backgroundPosition: props.objectPosition,
}))

const videoStyle = computed(() => ({
  objectFit: props.objectFit,
  objectPosition: props.objectPosition,
  opacity: videoLoaded.value && !showPoster.value ? 1 : 0,
  transition: props.transition ? `opacity 0.5s ease` : 'none',
}))

const overlayStyle = computed(() => ({
  background: props.overlay,
}))

// 根据窗口宽度获取合适的视频源
function getVideoSourceByWidth(width) {
  if (!props.sources || props.sources.length === 0) {
    return { src: props.src, poster: props.poster, autoplay: props.autoplay }
  }

  // 按分辨率从小到大排序
  const sortedSources = [...props.sources].sort((a, b) => a.res - b.res)

  // 找到第一个大于等于当前宽度的源
  for (const source of sortedSources) {
    if (width <= source.res) {
      return {
        src: source.src,
        poster: source.poster || props.poster,
        autoplay: source.autoplay ?? props.autoplay,
      }
    }
  }

  // 如果没有找到，返回默认源
  return { src: props.src, poster: props.poster, autoplay: props.autoplay }
}

// 更新视频分辨率
function changeVideoResolution() {
  const source = getVideoSourceByWidth(windowWidth.value)

  if (source.src !== currentSrc.value) {
    currentSrc.value = source.src
    currentPoster.value = source.poster || props.poster
    videoLoaded.value = false
    showPoster.value = true

    nextTick(() => {
      if (videoRef.value) {
        videoRef.value.src = currentSrc.value
        videoRef.value.load()
      }
    })
  }
}

// 窗口大小变化处理
function handleResize() {
  windowWidth.value = window.innerWidth
  changeVideoResolution()
}

// 视频事件处理
function onVideoLoaded() {
  videoLoaded.value = true
  emit('loading')
}

function onCanPlay() {
  if (props.playsWhen === 'canplay' && props.autoplay) {
    play()
  }
  emit('ready')
}

function onCanPlayThrough() {
  if (props.playsWhen === 'canplaythrough' && props.autoplay) {
    play()
  }
}

function onPlaying() {
  showPoster.value = false
  emit('playing')
}

function onPaused() {
  emit('paused')
}

function onEnded() {
  if (!props.loop) {
    showPoster.value = true
  }
  emit('ended')
}

function onError(e) {
  console.error('Video error:', e)
  emit('error', e)
}

// 公开的播放器控制方法
function play() {
  if (videoRef.value) {
    videoRef.value.play().catch((err) => {
      console.warn('Video play failed:', err)
    })
  }
}

function pause() {
  if (videoRef.value) {
    videoRef.value.pause()
  }
}

function show() {
  showPoster.value = false
}

function hide() {
  showPoster.value = true
}

function load() {
  if (videoRef.value) {
    videoRef.value.load()
  }
}

// 暴露播放器方法
const player = {
  play,
  pause,
  show,
  hide,
  load,
}

defineExpose({ player })

// 生命周期
onMounted(() => {
  // 初始化视频源
  const source = getVideoSourceByWidth(windowWidth.value)
  currentSrc.value = source.src
  currentPoster.value = source.poster || props.poster

  // 设置视频源
  if (videoRef.value) {
    videoRef.value.src = currentSrc.value
    videoRef.value.playbackRate = props.playbackRate
  }

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 监听播放速率变化
watch(
  () => props.playbackRate,
  (newRate) => {
    if (videoRef.value) {
      videoRef.value.playbackRate = newRate
    }
  },
)

// 监听 src 变化
watch(
  () => props.src,
  (newSrc) => {
    currentSrc.value = newSrc
    if (videoRef.value) {
      videoRef.value.src = newSrc
      videoRef.value.load()
    }
  },
)
</script>

  <style scoped>
  .video-background {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.video-background__poster {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  z-index: 1;
}

.video-background__video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.video-background__overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
}

.video-background__content {
  position: relative;
  z-index: 4;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
