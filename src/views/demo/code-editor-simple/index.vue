<template>
  <common-page class="code-editor-demo" show-footer>
    <!-- 直接使用全局组件，无需 import -->
    <code-editor
      v-model="code"
      :language="language"
      height="100%"
      placeholder="尝试编辑代码..."
    />
  </common-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getFileMeta, getFileRawCode } from '@/hooks/useGitFileCode'

const code = ref('')
const language = ref('plaintext')
const targetFile = '/src/views/demo/upload/index.vue'

async function viewSource() {
  const meta = getFileMeta(targetFile)

  if (!meta) {
    console.warn(`[CodeEditorDemo] 未能解析文件: ${targetFile}`)
    return
  }

  language.value = meta.language

  const rawContent = await getFileRawCode(targetFile, meta.normalizedPath)

  if (!rawContent) {
    console.warn(`[CodeEditorDemo] 未能读取文件: ${targetFile}`)
    return
  }

  code.value = rawContent

  const jsonData = {
    fileName: meta.fileName,
    extension: meta.extension,
    language: meta.language,
    content: rawContent,
    timestamp: Date.now(),
  }

  console.warn('JSON 数据:', jsonData)
}

onMounted(() => {
  viewSource()
})
</script>

<style scoped>
.code-editor-demo {
  height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
}

.code-editor-demo :deep(.editor-container.is-percent-height) {
  flex: 1;
}
</style>
