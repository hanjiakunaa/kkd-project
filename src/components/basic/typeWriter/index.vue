<template>
  <span class="typewriter" :class="{ 'typewriter--cursor': showCursor }">
    <span class="typewriter__text">{{ displayText }}</span>
    <span v-if="showCursor" class="typewriter__cursor" :style="cursorStyle">{{ cursor }}</span>
  </span>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  // 要显示的文本，可以是字符串或字符串数组
  text: {
    type: [String, Array],
    required: true,
  },
  // 打字速度（毫秒/字符）
  typeSpeed: {
    type: Number,
    default: 100,
  },
  // 删除速度（毫秒/字符）
  deleteSpeed: {
    type: Number,
    default: 50,
  },
  // 开始延迟
  startDelay: {
    type: Number,
    default: 500,
  },
  // 打完一段后等待时间
  pauseDelay: {
    type: Number,
    default: 2000,
  },
  // 是否循环
  loop: {
    type: Boolean,
    default: true,
  },
  // 是否显示光标
  showCursor: {
    type: Boolean,
    default: true,
  },
  // 光标字符
  cursor: {
    type: String,
    default: '|',
  },
  // 光标颜色
  cursorColor: {
    type: String,
    default: 'currentColor',
  },
  // 是否在完成后删除文本（仅在有多个文本时有效）
  deleteOnComplete: {
    type: Boolean,
    default: true,
  },
  // 是否自动开始
  autoStart: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['start', 'typed', 'deleted', 'complete', 'loop'])

// state
const displayText = ref('')
const currentTextIndex = ref(0)
const isTyping = ref(false)
const isDeleting = ref(false)
const isPaused = ref(false)
let timeoutId = null

// computed
const texts = computed(() => {
  return Array.isArray(props.text) ? props.text : [props.text]
})

const cursorStyle = computed(() => ({
  color: props.cursorColor,
}))

// 获取当前要打的文本
const currentText = computed(() => {
  return texts.value[currentTextIndex.value] || ''
})

// 打字效果核心逻辑
function type() {
  if (!isTyping.value)
    return

  const fullText = currentText.value
  const currentLength = displayText.value.length

  if (isDeleting.value) {
    // 删除模式
    if (currentLength > 0) {
      displayText.value = fullText.substring(0, currentLength - 1)
      timeoutId = setTimeout(type, props.deleteSpeed)
    }
    else {
      // 删除完成
      isDeleting.value = false
      emit('deleted')

      // 移动到下一个文本
      currentTextIndex.value = (currentTextIndex.value + 1) % texts.value.length

      // 如果回到第一个文本且不循环，则停止
      if (currentTextIndex.value === 0 && !props.loop) {
        isTyping.value = false
        emit('complete')
        return
      }

      if (currentTextIndex.value === 0) {
        emit('loop')
      }

      // 延迟后开始打下一段
      timeoutId = setTimeout(type, props.startDelay)
    }
  }
  else {
    // 打字模式
    if (currentLength < fullText.length) {
      displayText.value = fullText.substring(0, currentLength + 1)
      timeoutId = setTimeout(type, props.typeSpeed)
    }
    else {
      // 打字完成
      emit('typed')

      // 判断是否需要删除
      if (texts.value.length > 1 && props.deleteOnComplete) {
        // 暂停后开始删除
        isPaused.value = true
        timeoutId = setTimeout(() => {
          isPaused.value = false
          isDeleting.value = true
          type()
        }, props.pauseDelay)
      }
      else if (texts.value.length > 1 && !props.deleteOnComplete) {
        // 不删除，直接切换到下一个
        timeoutId = setTimeout(() => {
          displayText.value = ''
          currentTextIndex.value = (currentTextIndex.value + 1) % texts.value.length
          if (currentTextIndex.value === 0 && !props.loop) {
            isTyping.value = false
            emit('complete')
            return
          }
          type()
        }, props.pauseDelay)
      }
      else if (!props.loop) {
        // 单个文本且不循环，完成
        isTyping.value = false
        emit('complete')
      }
      else {
        // 单个文本且循环，删除后重新打
        timeoutId = setTimeout(() => {
          isDeleting.value = true
          type()
        }, props.pauseDelay)
      }
    }
  }
}

// 公开方法
function start() {
  if (isTyping.value)
    return

  isTyping.value = true
  isDeleting.value = false
  displayText.value = ''
  currentTextIndex.value = 0
  emit('start')

  timeoutId = setTimeout(type, props.startDelay)
}

function stop() {
  isTyping.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

function reset() {
  stop()
  displayText.value = ''
  currentTextIndex.value = 0
  isDeleting.value = false
  isPaused.value = false
}

function restart() {
  reset()
  start()
}

defineExpose({
  start,
  stop,
  reset,
  restart,
  displayText,
  isTyping,
})

// 生命周期
onMounted(() => {
  if (props.autoStart) {
    start()
  }
})

onUnmounted(() => {
  stop()
})

// 监听 text 变化
watch(
  () => props.text,
  () => {
    restart()
  },
)
</script>

  <style scoped>
  .typewriter {
  display: inline-flex;
  align-items: center;
}

.typewriter__text {
  white-space: pre-wrap;
}

.typewriter__cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>
