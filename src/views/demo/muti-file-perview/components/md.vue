<template>
  <div class="md-preview">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" class="mb-12">
        {{ error }}
      </n-alert>
      <n-scrollbar class="preview-scroll">
        <div v-if="htmlContent" class="markdown-body" v-html="htmlContent" />
        <n-empty v-else-if="!loading && !error" description="文件内容为空" />
      </n-scrollbar>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
})

const loading = ref(false)
const error = ref('')
const htmlContent = ref('')
let markdownRenderer

watch(
  () => props.file?.rawFile,
  (file) => {
    if (!file) {
      reset()
      return
    }
    loadMarkdown(file)
  },
  { immediate: true },
)

async function loadMarkdown(file) {
  loading.value = true
  error.value = ''
  try {
    const text = await file.text()
    const renderer = await resolveMarkdownRenderer()
    htmlContent.value = renderer.render(text)
  }
  catch (err) {
    console.error(err)
    error.value = 'Markdown 解析失败'
  }
  finally {
    loading.value = false
  }
}

async function resolveMarkdownRenderer() {
  if (markdownRenderer)
    return markdownRenderer
  const { default: MarkdownIt } = await import(
    /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.esm.js'
  )
  markdownRenderer = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: true,
  })
  return markdownRenderer
}

function reset() {
  loading.value = false
  error.value = ''
  htmlContent.value = ''
}
</script>

<style scoped>
.md-preview {
  max-height: 70vh;
}

.preview-scroll {
  max-height: 65vh;
  padding-right: 8px;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5) {
  font-weight: 600;
  margin-bottom: 12px;
}

.markdown-body :deep(p) {
  line-height: 1.7;
  margin-bottom: 12px;
}

.markdown-body :deep(pre) {
  background-color: rgba(60, 60, 67, 0.08);
  padding: 12px;
  overflow-x: auto;
  border-radius: 6px;
}

.markdown-body :deep(code) {
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
}
</style>
