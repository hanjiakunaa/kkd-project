<template>
  <div>
    <n-tooltip trigger="hover" placement="left">
      <template #trigger>
        <div id="layout-view-source-code" :class="triggerClass" @click="viewSourceCode">
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
  const normalizedTarget = normalizeComponentPath(targetFile)
  if (!normalizedTarget) {
    code.value = ''
    console.warn(`[CodeEditorDemo] 无法解析文件路径: ${targetFile}`)
    return
  }

  const meta = getFileMeta(normalizedTarget)

  if (!meta) {
    console.warn(`[CodeEditorDemo] 未能解析文件: ${targetFile}`)
    return
  }

  language.value = meta.language

  const rawContent = await getFileRawCode(normalizedTarget, meta.normalizedPath)

  if (!rawContent) {
    console.warn(`[CodeEditorDemo] 未能读取文件: ${targetFile}`)
    return
  }

  code.value = rawContent
}

function viewSourceCode() {
  if (code.value !== '') {
    viewCodeModalRef.value?.open()
  }
}

watch(
  () => [route.fullPath, route.meta.componentPath],
  async () => {
    const targetFile = resolveComponentPath(route)
    if (!targetFile) {
      code.value = ''
      return
    }

    modalTitle.value = `查看${route.meta.title || ''}页面源码`
    await viewSource(targetFile)
  },
  { immediate: true },
)

function resolveComponentPath(currentRoute) {
  const fromMeta = normalizeComponentPath(currentRoute.meta?.componentPath)
  if (fromMeta)
    return fromMeta

  const matched = currentRoute.matched || []
  for (let i = matched.length - 1; i >= 0; i -= 1) {
    const record = matched[i]
    const candidate = [
      record.components?.default,
      record.components?.default?.__asyncResolved,
      record.instances?.default,
      record.instances?.default?.type,
      record.instances?.default?.$?.type,
    ]
      .map(getComponentFilePath)
      .find(Boolean)

    const normalized = normalizeComponentPath(candidate)
    if (normalized)
      return normalized
  }

  return null
}

function getComponentFilePath(component) {
  if (!component)
    return null

  if (component.__file)
    return component.__file

  if (component.type?.__file)
    return component.type.__file

  if (component.$?.type?.__file)
    return component.$.type.__file

  return null
}

function normalizeComponentPath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string')
    return null

  const replaced = rawPath.replace(/\\/g, '/').trim()

  if (replaced.startsWith('/src/views'))
    return replaced

  if (replaced.startsWith('src/views'))
    return `/${replaced}`

  if (replaced.startsWith('@/views'))
    return `/${replaced.replace(/^@\//, 'src/')}`

  const match = replaced.match(/\/src\/views\/.+/)
  if (match)
    return match[0]

  return null
}
</script>
