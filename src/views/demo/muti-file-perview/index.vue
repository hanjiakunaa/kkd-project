<template>
  <common-page :show-footer="false">
    <n-upload
      class="mx-auto w-[75%] p-20 text-center"
      :custom-request="handleUpload"
      :show-file-list="false"
      :accept="`${supportedExtensions.join(',')}`"
      @before-upload="onBeforeUpload"
    >
      <n-upload-dragger>
        <div class="h-150 f-c-c flex-col">
          <i class="i-mdi:upload mb-12 text-68 color-primary" />
          <n-text class="text-14 color-gray">
            点击或拖拽文件到此处上传（支持 PDF / Word / Excel 文件）
          </n-text>
        </div>
      </n-upload-dragger>
    </n-upload>

    <n-data-table
      :columns="columns"
      :data="fileList"
      class="flex-1"
      :row-key="row => row.id"
    />
  </common-page>
</template>

<script setup>
import dayjs from 'dayjs'
import { NButton } from 'naive-ui'
import { OhVueIcon } from 'oh-vue-icons'
import { pageCacheDB } from '@/utils/storage/indexedDB'

defineOptions({ name: 'MultiFilePreview' })
const router = useRouter()
const supportedExtensions = ['pdf', 'txt', 'md', 'docx', 'xls', 'xlsx']

const CACHE_KEY = 'multiFilePreviewList'
const fileList = ref([])
const currentFile = ref(null)

const columns = [
  {
    title: '序号',
    key: 'index',
    render: (_, index) => index + 1,
  },
  {
    title: '文件名',
    key: 'name',
    ellipsis: { tooltip: true },
  },
  {
    title: '类型',
    key: 'extension',
    render: row => h(
      'div',
      { class: 'flex items-center gap-8' },
      [
        h(OhVueIcon, { name: getFileIconName(row.extension), scale: 1.2, hover: true, animation: 'ring', speed: 'slow' }),
      ],
    ),
  },
  {
    title: '大小',
    key: 'sizeLabel',
  },
  {
    title: '上传时间',
    key: 'uploadedAt',
  },
  {
    title: '操作',
    key: 'actions',
    render: row => h(
      'div',
      { class: 'flex gap-12' },
      [
        h(
          NButton,
          {
            text: true,
            type: 'primary',
            size: 'small',
            onClick: () => handlePreview(row),
          },
          { default: () => '预览' },
        ),
        h(
          NButton,
          {
            text: true,
            type: 'error',
            size: 'small',
            onClick: () => removeFile(row.id),
          },
          { default: () => '移除' },
        ),
      ],
    ),
  },
]

// oh-vue-icons 图标名称映射
const fileIconNameMap = {
  pdf: 'vi-file-type-pdf2',
  docx: 'vi-file-type-word',
  xls: 'vi-file-type-excel',
  xlsx: 'vi-file-type-excel',
  cvs: 'vi-file-type-excel',
  md: 'bi-code-slash', // 使用已注册的代码图标
  txt: 'bi-code-slash', // 使用已注册的代码图标
}

const previewComponentMap = {
  pdf: '/demo/muti-file-perview/pdf-preview',
  docx: '/demo/muti-file-perview/word-preview',
  xlsx: '/demo/muti-file-perview/excel-preview',
  xls: '/demo/muti-file-perview/excel-preview',
  cvs: '/demo/muti-file-perview/excel-preview',
}

// 获取 oh-vue-icons 图标名称
function getFileIconName(extension = '') {
  return fileIconNameMap[extension] || 'bi-code-slash'
}

function getExtension(filename) {
  const match = filename?.split('.')
  if (!match || match.length < 2)
    return ''
  return match.pop().toLowerCase()
}

function formatBytes(bytes) {
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`
}

function handlePreview(row) {
  currentFile.value = row
  router.push({
    path: previewComponentMap[getExtension(row.name)],
    query: {
      // 只传递文件 ID，预览页从 IndexedDB 获取完整数据
      fileId: row.id,
    },
  })
}

function resetPreview() {
  if (currentFile.value?.objectUrl) {
    URL.revokeObjectURL(currentFile.value.objectUrl)
    currentFile.value.objectUrl = ''
  }
  currentFile.value = null
}

async function removeFile(id) {
  const index = fileList.value.findIndex(item => item.id === id)
  if (index === -1)
    return
  const [removed] = fileList.value.splice(index, 1)
  if (removed?.objectUrl)
    URL.revokeObjectURL(removed.objectUrl)
  if (currentFile.value?.id === removed?.id) {
    resetPreview()
  }
  // 同步更新 IndexedDB 缓存
  await saveCachedFiles()
  $message.success('已移除文件')
}

async function handleUpload({ file, onFinish, onError }) {
  try {
    const rawFile = file?.file
    if (!rawFile)
      throw new Error('无法读取文件内容')

    const extension = getExtension(file.name)
    if (!supportedExtensions.includes(extension)) {
      $message.error(`暂不支持 ${extension || '该'} 类型文件预览`)
      onError?.()
      return
    }
    const id = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const record = {
      id,
      name: file.name,
      extension,
      mime: rawFile.type,
      size: rawFile.size,
      sizeLabel: formatBytes(rawFile.size),
      uploadedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      rawFile,
      // 为 PDF 与 DOCX 创建 blob URL，便于预览页通过路由加载
      objectUrl: ['pdf', 'docx', 'xls', 'xlsx'].includes(extension) ? URL.createObjectURL(rawFile) : '',
    }
    fileList.value.unshift(record)
    // 保存到 IndexedDB 缓存
    await saveCachedFiles()
    $message.success('文件已添加，点击预览即可查看')
    onFinish?.()
  }
  catch (error) {
    console.error(error)
    $message.error(error.message || '文件处理失败')
    onError?.()
  }
}

function onBeforeUpload({ file }) {
  if (!supportedExtensions.includes(getExtension(file.name))) {
    $message.error(`暂不支持 ${getExtension(file.name) || '该'} 类型文件预览`)
    return false
  }
  return true
}

// 从 IndexedDB 加载缓存的文件列表
async function loadCachedFiles() {
  try {
    const cachedFiles = await pageCacheDB.get(CACHE_KEY)
    if (cachedFiles && Array.isArray(cachedFiles)) {
      // 重新创建 objectUrl（因为 blob URL 在页面刷新后会失效）
      fileList.value = cachedFiles.map((file) => {
        if (file.rawFile && ['pdf', 'docx', 'xls', 'xlsx'].includes(file.extension)) {
          return {
            ...file,
            objectUrl: URL.createObjectURL(file.rawFile),
          }
        }
        return file
      })
    }
  }
  catch (error) {
    console.error('加载缓存文件失败:', error)
  }
}

// 保存文件列表到 IndexedDB
async function saveCachedFiles() {
  try {
    // 保存时不保存 objectUrl，因为它在页面刷新后会失效
    const dataToCache = fileList.value.map(({ objectUrl, ...rest }) => rest)
    await pageCacheDB.set(CACHE_KEY, dataToCache)
  }
  catch (error) {
    console.error('保存缓存文件失败:', error)
  }
}

// 组件挂载时加载缓存
onMounted(() => {
  loadCachedFiles()
})

// 注意：不在组件卸载时清理 objectUrl
// 因为预览页面可能还需要访问这些 URL
// objectUrl 会在文件被删除时单独清理
</script>

<style scoped>
.upload-area {
  border: 1px dashed var(--n-border-color);
  border-radius: 8px;
  padding: 16px;
}

.upload-dragger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 0;
}

.upload-icon {
  font-size: 48px;
  color: var(--primary-color);
}

.upload-tip {
  color: var(--text-color-2);
}

.preview-body {
}

.flex {
  display: flex;
}

.gap-12 {
  gap: 12px;
}

.items-center {
  align-items: center;
}

.gap-8 {
  gap: 8px;
}

.file-icon {
  font-size: 18px;
}
</style>
