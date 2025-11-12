<template>
  <div class="word-preview">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" class="mb-12">
        {{ error }}
      </n-alert>
      <div ref="containerRef" class="docx-container" />
      <n-empty v-if="!loading && !error && !hasContent" description="文档内容为空或暂不支持预览" />
    </n-spin>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
})

const containerRef = ref(null)
const loading = ref(false)
const error = ref('')
const hasContent = ref(false)
let docxModule

watch(
  () => props.file?.rawFile,
  (file) => {
    if (!file) {
      reset()
      return
    }
    renderDocx(file)
  },
  { immediate: true },
)

async function renderDocx(file) {
  loading.value = true
  error.value = ''
  hasContent.value = false
  try {
    const { renderAsync } = await ensureDocxModule()
    if (!renderAsync) {
      throw new Error('docx-preview 加载失败')
    }
    const buffer = await file.arrayBuffer()
    if (containerRef.value)
      containerRef.value.innerHTML = ''
    await renderAsync(buffer, containerRef.value, null, {
      className: 'docx-content',
      inWrapper: false,
      ignoreWidth: true,
      ignoreHeight: true,
      experimental: true,
    })
    hasContent.value = !!containerRef.value?.innerHTML
  }
  catch (err) {
    console.error(err)
    error.value = 'Word 预览失败，请确认文件为 docx 格式'
  }
  finally {
    loading.value = false
  }
}

async function ensureDocxModule() {
  if (docxModule)
    return docxModule
  docxModule = await import(
    /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/docx-preview@0.3.1/dist/docx-preview.es.js'
  )
  return docxModule
}

function reset() {
  loading.value = false
  error.value = ''
  hasContent.value = false
  if (containerRef.value)
    containerRef.value.innerHTML = ''
}

onBeforeUnmount(() => {
  if (containerRef.value)
    containerRef.value.innerHTML = ''
})
</script>

<style scoped>
.word-preview {
  max-height: 70vh;
}

.docx-container {
  max-height: 65vh;
  overflow: auto;
  padding-right: 12px;
}

.docx-content {
  font-family: 'Times New Roman', 'Microsoft YaHei', serif;
}
</style>
