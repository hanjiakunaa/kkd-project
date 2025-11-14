<template>
  <div class="code-editor-wrapper" :class="wrapperClass">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="editor-toolbar">
      <div class="toolbar-left">
        <n-select
          v-model:value="currentLang"
          :options="languageOptions"
          size="small"
          style="width: 120px"
          @update:value="handleLanguageChange"
        />
        <n-select
          v-model:value="currentTheme"
          :options="themeOptions"
          size="small"
          style="width: 120px; margin-left: 8px"
          @update-value="handleThemeChange"
        />

        <n-button
          size="small"
          quaternary
          @click="handleFormat"
        >
          <template #icon>
            <n-icon><i class="i-carbon-code" /></n-icon>
          </template>
          格式化
        </n-button>
        <n-button
          size="small"
          quaternary
          @click="handleCopy"
        >
          <template #icon>
            <n-icon><i class="i-carbon-copy" /></n-icon>
          </template>
          复制
        </n-button>
      </div>
    </div>

    <!-- 编辑器 -->
    <div
      ref="editorContainer"
      class="editor-container"
      :class="editorContainerClass"
    >
      <codemirror
        v-model="editorValue"
        :placeholder="placeholder"
        :style="editorStyle"
        :autofocus="autofocus"
        :disabled="disabled"
        :indent-with-tab="indentWithTab"
        :tab-size="tabSize"
        :extensions="extensions"
        @ready="handleReady"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
  </div>
</template>

<script setup>
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { sql } from '@codemirror/lang-sql'
import { vue } from '@codemirror/lang-vue'
import { xml } from '@codemirror/lang-xml'
import { oneDark } from '@codemirror/theme-one-dark'
import { basicSetup } from 'codemirror'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { isDark, toggleDark } from '@/hooks/useToggleDark.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'javascript',
    validator: (value) => {
      return [
        'javascript',
        'typescript',
        'vue',
        'html',
        'css',
        'json',
        'markdown',
        'python',
        'sql',
        'xml',
        'scss',
        'sass',
        'less',
        'plaintext',
      ].includes(value)
    },
  },
  theme: {
    type: String,
    default: 'dark',
    validator: (value) => {
      return ['light', 'dark'].includes(value)
    },
  },
  height: {
    type: String,
    default: 'auto',
  },
  minHeight: {
    type: String,
    default: '160px',
  },
  fontSize: {
    type: String,
    default: '14px',
  },
  placeholder: {
    type: String,
    default: '请输入代码...',
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  indentWithTab: {
    type: Boolean,
    default: true,
  },
  tabSize: {
    type: Number,
    default: 2,
  },
  showToolbar: {
    type: Boolean,
    default: true,
  },
  syncSystemTheme: {
    type: Boolean,
    default: true, // 是否同步系统主题
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'focus', 'blur', 'ready'])

// 编辑器值
const editorValue = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

// 当前语言和主题
const currentLang = ref(props.language)
const currentTheme = ref(props.theme)
const isFullscreen = ref(false)
const editorContainer = ref(null)
const view = shallowRef()

// 组件挂载时同步系统主题到编辑器
onMounted(() => {
  if (props.syncSystemTheme) {
    currentTheme.value = isDark.value ? 'dark' : 'light'
  }
})

// 监听系统主题变化，同步到编辑器
watch(isDark, (newVal) => {
  if (props.syncSystemTheme) {
    currentTheme.value = newVal ? 'dark' : 'light'
  }
})

const wrapperClass = computed(() => ({
  'is-fullscreen': isFullscreen.value,
}))

// 语言选项
const languageOptions = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Vue', value: 'vue' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JSON', value: 'json' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Python', value: 'python' },
  { label: 'SQL', value: 'sql' },
  { label: 'XML', value: 'xml' },
  { label: 'SCSS', value: 'scss' },
  { label: 'SASS', value: 'sass' },
  { label: 'Less', value: 'less' },
  { label: 'Plain Text', value: 'plaintext' },
]

// 主题选项
const themeOptions = [
  { label: '亮色主题', value: 'light' },
  { label: '暗色主题', value: 'dark' },
]

// 获取语言扩展
function getLanguageExtension(lang) {
  const langMap = {
    javascript: javascript({ jsx: true }),
    typescript: javascript({ jsx: true, typescript: true }),
    vue: vue(),
    html: html(),
    css: css(),
    scss: css(),
    sass: css(),
    less: css(),
    json: json(),
    markdown: markdown(),
    python: python(),
    sql: sql(),
    xml: xml(),
    plaintext: null,
  }
  return langMap[lang] || javascript()
}

// 计算编辑器扩展
const extensions = computed(() => {
  const langExtension = getLanguageExtension(currentLang.value)
  const exts = [basicSetup]

  if (langExtension)
    exts.push(langExtension)

  if (currentTheme.value === 'dark') {
    exts.push(oneDark)
  }

  return exts
})

const isAutoHeight = computed(() => !isFullscreen.value && props.height === 'auto')

const isPercentHeight = computed(() => !isFullscreen.value && typeof props.height === 'string' && props.height.endsWith('%'))

const editorContainerClass = computed(() => ({
  'is-fullscreen': isFullscreen.value,
  'is-auto-height': isAutoHeight.value,
  'is-percent-height': isPercentHeight.value,
}))

// 编辑器样式（支持自适应高度）
const editorStyle = computed(() => {
  const style = {
    fontSize: props.fontSize,
  }

  if (isFullscreen.value) {
    style.height = '100%'
  }
  else if (props.height === 'auto') {
    style.height = 'auto'
    style.minHeight = props.minHeight
  }
  else {
    style.height = props.height
    if (!isPercentHeight.value && props.minHeight)
      style.minHeight = props.minHeight
  }

  return style
})

// 处理语言切换
function handleLanguageChange(value) {
  currentLang.value = value
}

// 处理主题切换
async function handleThemeChange(value) {
  currentTheme.value = value

  // 如果开启了系统主题同步，同时切换系统主题
  if (props.syncSystemTheme) {
    const shouldBeDark = value === 'dark'
    const isCurrentlyDark = isDark.value

    // 只有当目标状态与当前状态不同时才切换
    if (shouldBeDark !== isCurrentlyDark) {
      // 获取工具栏中心位置作为动画起点
      const toolbar = editorContainer.value?.previousElementSibling
      let clientX = window.innerWidth / 2
      let clientY = window.innerHeight / 2

      if (toolbar) {
        const rect = toolbar.getBoundingClientRect()
        clientX = rect.left + rect.width / 2
        clientY = rect.top + rect.height / 2
      }

      await toggleDark({ clientX, clientY })
    }
  }
}

// 处理格式化
function handleFormat() {
  try {
    if (currentLang.value === 'json') {
      const formatted = JSON.stringify(JSON.parse(editorValue.value), null, props.tabSize)
      editorValue.value = formatted
      $message.success('格式化成功')
    }
    else {
      $message.warning('当前语言暂不支持自动格式化')
    }
  }
  catch {
    $message.error('格式化失败，请检查代码语法')
  }
}

// 处理复制
async function handleCopy() {
  try {
    await navigator.clipboard.writeText(editorValue.value)
    $message.success('复制成功')
  }
  catch {
    $message.error('复制失败')
  }
}

// 切换全屏
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
}

// 编辑器就绪
function handleReady(payload) {
  view.value = payload.view
  emit('ready', payload)
}

// 内容变化
function handleChange(value) {
  emit('change', value)
}

// 获得焦点
function handleFocus() {
  emit('focus')
}

// 失去焦点
function handleBlur() {
  emit('blur')
}

// 监听语言和主题的外部变化
watch(() => props.language, (newVal) => {
  currentLang.value = newVal
})

watch(() => props.theme, (newVal) => {
  currentTheme.value = newVal
})

// 暴露方法供外部调用
defineExpose({
  view,
  getValue: () => editorValue.value,
  setValue: (value) => { editorValue.value = value },
  focus: () => view.value?.focus(),
  toggleFullscreen,
})
</script>

<style scoped>
.code-editor-wrapper {
  position: relative;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--n-color);
}

.code-editor-wrapper.is-fullscreen {
  position: fixed;
  top: 50px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  border-radius: 0;
}

.code-editor-wrapper.is-fullscreen::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: -1;
}

.code-editor-wrapper.is-fullscreen .editor-toolbar {
  border-radius: 0;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--n-color-modal);
  border-bottom: 1px solid var(--n-border-color);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.editor-container {
  position: relative;
  height: auto;
}

.editor-container.is-fullscreen {
  position: relative;
  flex: 1;
  height: 100%;
  background-color: var(--n-color);
}

.editor-container.is-percent-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-container.is-percent-height :deep(.cm-editor) {
  height: 100%;
}

.editor-container.is-percent-height :deep(.cm-scroller) {
  flex: 1;
  height: 100%;
}

.editor-container.is-auto-height {
  height: auto;
}

.editor-container.is-auto-height :deep(.cm-editor) {
  height: auto;
}

.editor-container.is-auto-height :deep(.cm-scroller) {
  overflow: visible;
}

.editor-container.is-fullscreen::before {
  content: none;
}

:deep(.cm-editor) {
  outline: none !important;
}

:deep(.cm-scroller) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
  /* Firefox 滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
}

/* 滚动条样式 - 浅透明 */
:deep(.cm-scroller)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

:deep(.cm-scroller)::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.cm-scroller)::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  transition: background 0.2s ease;
}

:deep(.cm-scroller)::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.5);
}

:deep(.cm-content) {
  padding: 12px 0;
}

:deep(.cm-line) {
  padding: 0 12px;
}

:deep(.cm-gutters) {
  background-color: var(--n-color);
  border-right: 1px solid var(--n-border-color);
  padding-right: 4px;
}

:deep(.cm-activeLineGutter) {
  background-color: transparent;
}
</style>
