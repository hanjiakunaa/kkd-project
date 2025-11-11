<template>
  <div>
    <n-tooltip trigger="hover" placement="left">
      <template #trigger>
        <div id="layout-view-source-code" :class="triggerClass" @click="viewCodeModalRef.open()">
          <h-icon name="bi-code-slash" class="text-20 text-white" />
        </div>
      </template>
      查看当前页面源代码
    </n-tooltip>

    <me-modal ref="viewCodeModalRef" :title="modalTitle" :show-footer="false" width="1000px">
      <div class="h-full w-full">
        <code-editor
          v-model="code"
          :language="language"
          height="50vh"
          placeholder="尝试编辑代码..."
        />
      </div>
    </me-modal>
  </div>
</template>

<script setup>
import { MeModal } from '@/components'
import { useModal } from '@/composables'
import { getFileMeta, getFileRawCode } from '@/hooks/useGitFileCode'

const triggerClass = ['f-c-c', 'rounded-full', 'bg-primary', 'shadow-lg', 'p-8', 'cursor-pointer']
const [viewCodeModalRef] = useModal()
const route = useRoute()
const code = ref('')
const language = ref('plaintext')
const modalTitle = ref('')

async function viewSource(targetFile) {
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
}

// 或者
watch(
  route,
  (to, _from) => {
    modalTitle.value = `查看${to.meta.title || ''}页面源码`
    viewSource(to.meta.componentPath)
  },
  { deep: true, immediate: true }, // 如果需要
)
</script>
