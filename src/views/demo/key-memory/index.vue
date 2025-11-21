<template>
  <common-page title="按键记忆">
    <div class="key-memory-container">
      <!-- 输入框区域 -->
      <div class="input-section">
        <n-input
          v-model:value="inputValue"
          type="text"
          placeholder="在这里输入内容，下方会显示你按下的按键..."
          size="large"
          clearable
        />
      </div>

      <!-- 按键显示区域 -->
      <div class="keys-display-section">
        <div class="keys-title">
          <span>按键历史 ({{ fadeDelay / 1000 }}秒后自动消失)</span>
          <n-button
            size="small"
            type="error"
            text
            @click="clearKeys"
          >
            清空
          </n-button>
        </div>
        <div class="keys-container">
          <transition-group
            v-if="keyHistory.length > 0"
            name="key-item"
            tag="div"
            class="keys-list"
          >
            <div
              v-for="keyItem in keyHistory"
              :key="keyItem.id"
              class="key-item"
              :class="{ 'key-item-fade': keyItem.isFading }"
            >
              <div class="key-badge">
                <span class="key-text">{{ keyItem.display }}</span>
                <span class="key-time">{{ formatTime(keyItem.timestamp) }}</span>
              </div>
            </div>
          </transition-group>
          <div
            v-if="keyHistory.length === 0"
            class="empty-tip"
          >
            暂无按键记录，试试按下任意按键...
          </div>
        </div>
      </div>
    </div>
  </common-page>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const inputValue = ref('')
const keyHistory = ref([])
const fadeDelay = 10000 // 按键显示10秒后开始淡出
const removeDelay = 500 // 淡出动画持续500ms

let keyIdCounter = 0
let pressedKeys = new Set() // 记录当前按下的所有键
let keyComboTimeout = null

// 需要过滤的修饰键（单独按下时）
const modifierKeys = new Set(['Control', 'Alt', 'Shift', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock'])

// 格式化按键显示名称
function formatKeyName(key) {
  const keyMap = {
    ' ': 'Space',
    'Enter': 'Enter',
    'Escape': 'Esc',
    'Backspace': 'Backspace',
    'Tab': 'Tab',
    'Delete': 'Delete',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Meta': 'Cmd',
    'Control': 'Ctrl',
    'Alt': 'Alt',
    'Shift': 'Shift',
  }
  return keyMap[key] || key
}

// 格式化时间显示
function formatTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 1000)
    return '刚刚'
  if (diff < 60000)
    return `${Math.floor(diff / 1000)}秒前`
  return new Date(timestamp).toLocaleTimeString()
}

// 添加按键到历史记录
function addKeyToHistory(keys) {
  // 如果只有修饰键，不记录
  if (keys.length === 1 && modifierKeys.has(keys[0]))
    return

  // 组合显示按键
  const display = keys.map(formatKeyName).join(' + ')

  const keyItem = {
    id: keyIdCounter++,
    display,
    timestamp: Date.now(),
    isFading: false,
    timer: null,
  }

  keyHistory.value.push(keyItem)

  // 设置延迟淡出
  keyItem.timer = setTimeout(() => {
    keyItem.isFading = true
    // 淡出动画后移除
    setTimeout(() => {
      const index = keyHistory.value.findIndex(item => item.id === keyItem.id)
      if (index !== -1)
        keyHistory.value.splice(index, 1)
    }, removeDelay)
  }, fadeDelay)
}

// 清空所有按键记录
function clearKeys() {
  // 清除所有定时器
  keyHistory.value.forEach((item) => {
    if (item.timer)
      clearTimeout(item.timer)
  })
  keyHistory.value = []
}

// 键盘按下事件
function handleKeyDown(event) {
  const key = event.key

  // 添加到已按下的键集合
  pressedKeys.add(key)

  // 清除之前的定时器
  if (keyComboTimeout) {
    clearTimeout(keyComboTimeout)
  }

  // 设置短暂延迟，用于检测组合键
  keyComboTimeout = setTimeout(() => {
    if (pressedKeys.size > 0) {
      const keys = Array.from(pressedKeys)
      addKeyToHistory(keys)
    }
  }, 50) // 50ms内的按键认为是组合键
}

// 键盘释放事件
function handleKeyUp(event) {
  const key = event.key
  pressedKeys.delete(key)
}

onMounted(() => {
  // 监听全局键盘事件
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (keyComboTimeout) {
    clearTimeout(keyComboTimeout)
  }
  clearKeys()
})
</script>

  <style scoped>
  .key-memory-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
}

.input-section {
  flex-shrink: 0;
}

.keys-display-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.keys-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-1);
}

.keys-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

.keys-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  width: 100%;
  max-width: 600px;
}

.key-item {
  width: 100%;
  transition: all 0.5s ease;
}

.key-item-fade {
  opacity: 0.3;
  transform: scale(0.95);
}

.key-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 28px;
  backdrop-filter: blur(10px);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;

  transition: all 0.3s ease;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.key-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 242, 254, 0.3), transparent);
  transition: left 0.5s ease;
}

.key-badge:hover::before {
  left: 100%;
}

.key-badge:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 20px rgba(0, 242, 254, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-color: rgba(0, 242, 254, 0.6);
}

.key-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex: 1;
  text-shadow: 0 0 20px rgba(0, 242, 254, 0.5);
  letter-spacing: 1px;
}

.key-time {
  font-size: 13px;
  opacity: 0.7;
  font-weight: normal;
  color: var(--text-color-2);
  flex-shrink: 0;
}

.empty-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-color-3);
  font-size: 14px;
}

/* 进入和离开动画 */
.key-item-enter-active {
  transition: all 0.4s ease;
}

.key-item-leave-active {
  transition: all 0.5s ease;
}

.key-item-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.key-item-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.key-item-move {
  transition: transform 0.4s ease;
}
</style>
