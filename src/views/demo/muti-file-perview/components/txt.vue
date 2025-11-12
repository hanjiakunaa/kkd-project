<template>
  <div class="txt-preview">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" class="mb-12">
        {{ error }}
      </n-alert>
      <n-scrollbar class="preview-scroll">
        <pre v-if="content" class="preview-content">{{ content }}</pre>
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
const content = ref('')

watch(
  () => props.file?.rawFile,
  (file) => {
    if (!file) {
      reset()
      return
    }
    loading.value = true
    error.value = ''
    const reader = new FileReader()
    reader.onload = () => {
      content.value = reader.result
      loading.value = false
    }
    reader.onerror = () => {
      error.value = '读取文件失败，请重试'
      loading.value = false
    }
    reader.readAsText(file, 'utf-8')
  },
  { immediate: true },
)

function reset() {
  loading.value = false
  error.value = ''
  content.value = ''
}
</script>

<style scoped>
.txt-preview {
  max-height: 70vh;
}

.preview-scroll {
  max-height: 65vh;
}

.preview-content {
  white-space: pre-wrap;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 12px;
}
</style>
