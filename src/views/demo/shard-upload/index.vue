<template>
  <common-page :show-footer="false" title="分片上传">
    <template #action>
      <n-space :size="16" align="center" class="justify-between">
        <n-space :size="16" align="center">
          <n-upload
            :key="uploadKey"
            :show-file-list="false"
            multiple
            @change="handleUploadChange"
          >
            <n-button type="primary" size="large">
              <template #icon>
                <i class="i-mdi:cloud-upload text-20" />
              </template>
              选择文件
            </n-button>
          </n-upload>

          <n-divider vertical />

          <div class="flex items-center gap-8">
            <span class="text-14 text-gray-600">切片大小</span>
            <n-input-number
              v-model:value="chunkSizeMB"
              :min="1"
              :max="16"
              :show-button="true"
              size="small"
              class="w-100px"
            >
              <template #suffix>
                MB
              </template>
            </n-input-number>
          </div>

          <div class="flex items-center gap-8">
            <span class="text-14 text-gray-600">并发数</span>
            <n-input-number
              v-model:value="maxGlobalConcurrency"
              :min="1"
              :max="12"
              :show-button="true"
              size="small"
              class="w-80px"
            />
          </div>
        </n-space>

        <!-- Mock 调试工具 -->
        <n-space :size="8">
          <n-button size="small" secondary @click="handleClearMockData">
            <template #icon>
              <i class="i-mdi:delete-sweep text-16" />
            </template>
            清空Mock
          </n-button>
          <n-button size="small" secondary @click="handleClearTasks">
            <template #icon>
              <i class="i-mdi:refresh text-16" />
            </template>
            清空任务
          </n-button>
        </n-space>
      </n-space>
    </template>

    <me-crud
      ref="$table"
      :columns="columns"
      :get-data="getTableData"
      :show-search="false"
      :pagination="false"
    />
  </common-page>
</template>

<script setup>
import { NButton, NDivider, NInputNumber, NProgress, NSpace, NTag, NUpload } from 'naive-ui'
import { uploadChunk as apiUploadChunk, checkFile, clearMockData, mergeChunk } from '@/api/shard-upload'
import { MeCrud } from '@/components'
import { ConcurrencyLimiter } from '@/composables/useLimiter'

// 配置参数
const DEFAULT_CHUNK_SIZE_MB = 1 // 默认切片大小1MB
const DEFAULT_MAX_CONCURRENCY = 6 // 默认并发数6

const chunkSizeMB = ref(DEFAULT_CHUNK_SIZE_MB)
const maxGlobalConcurrency = ref(DEFAULT_MAX_CONCURRENCY)

// Upload 组件的 key，用于重置组件状态
const uploadKey = ref(0)

// 表格列定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center',
    render: (_, index) => index + 1,
  },
  {
    title: '文件名',
    key: 'fileName',
    width: 250,
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '文件大小',
    key: 'fileSize',
    width: 120,
    render: row => formatBytes(row.fileSize),
  },
  {
    title: '状态',
    key: 'state',
    width: 100,
    align: 'center',
    render: (row) => {
      const stateMap = {
        idle: { text: '准备中', type: 'default' },
        uploading: { text: '上传中', type: 'info' },
        paused: { text: '已暂停', type: 'warning' },
        completed: { text: '已完成', type: 'success' },
        failed: { text: '失败', type: 'error' },
      }
      const state = stateMap[row.state] || stateMap.idle
      return h(
        NTag,
        { type: state.type, size: 'small' },
        { default: () => state.text },
      )
    },
  },
  {
    title: '进度',
    key: 'percent',
    width: 250,
    render: (row) => {
      return h(
        NSpace,
        { vertical: true, size: 4 },
        {
          default: () => [
            h(
              NProgress,
              {
                type: 'line',
                percentage: row.percent,
                indicatorPlacement: 'inside',
                processing: row.state === 'uploading',
                status: row.state === 'failed' ? 'error' : row.state === 'completed' ? 'success' : 'info',
                height: 20,
              },
            ),
            h(
              'div',
              { style: 'font-size: 12px; color: #999; text-align: center;' },
              `${formatBytes(row.uploadedBytes)} / ${formatBytes(row.totalBytes)}`,
            ),
          ],
        },
      )
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    align: 'center',
    fixed: 'right',
    render: (row) => {
      return h(
        NSpace,
        { justify: 'center' },
        {
          default: () => {
            const buttons = []

            // 暂停按钮
            if (row.state !== 'paused' && row.state !== 'completed' && row.state !== 'failed') {
              buttons.push(
                h(
                  NButton,
                  {
                    size: 'small',
                    type: 'warning',
                    onClick: () => pauseFileUpload(row.fileId),
                  },
                  { default: () => '暂停' },
                ),
              )
            }

            // 恢复按钮
            if (row.state === 'paused') {
              buttons.push(
                h(
                  NButton,
                  {
                    size: 'small',
                    type: 'info',
                    onClick: () => resumeFileUpload(row.fileId),
                  },
                  { default: () => '恢复' },
                ),
              )
            }

            // 删除按钮
            if (row.state === 'completed' || row.state === 'failed') {
              buttons.push(
                h(
                  NButton,
                  {
                    size: 'small',
                    type: 'error',
                    onClick: () => removeFileTask(row.fileId),
                  },
                  { default: () => '移除' },
                ),
              )
            }

            return buttons
          },
        },
      )
    },
  },
]

// 状态管理
const $table = ref(null)
const fileTasks = ref([])
const globalProgress = reactive({
  uploadedBytes: 0,
  totalBytes: 0,
  percent: 0,
})

// 上传历史记录（持久化存储）
const HISTORY_STORAGE_KEY = 'shard-upload-history'
const uploadHistory = ref([])

// 并发控制（建议使用工厂模式动态重建）
const limiter = new ConcurrencyLimiter(maxGlobalConcurrency.value)

// 记录已处理的文件，防止重复上传
const processedFiles = new Set()

// 初始化时加载历史记录
onMounted(() => {
  loadUploadHistory()
})

// 加载上传历史
function loadUploadHistory() {
  try {
    const history = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (history) {
      uploadHistory.value = JSON.parse(history)
    }
  }
  catch (e) {
    console.error('加载上传历史失败:', e)
  }
}

// 保存上传历史
function saveToHistory(fileTask) {
  const historyItem = {
    fileName: fileTask.fileName,
    fileSize: fileTask.fileSize,
    uploadTime: new Date().toLocaleString('zh-CN'),
    fileHash: fileTask.fileHash,
  }
  uploadHistory.value.unshift(historyItem)
  // 只保留最近 50 条记录
  if (uploadHistory.value.length > 50) {
    uploadHistory.value = uploadHistory.value.slice(0, 50)
  }
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(uploadHistory.value))
  }
  catch (e) {
    console.error('保存上传历史失败:', e)
  }
}

// 清空上传历史
function _handleClearHistory() {
  uploadHistory.value = []
  localStorage.removeItem(HISTORY_STORAGE_KEY)
  window.$message?.success('上传历史已清空')
}

// 获取表格数据（MeCrud 需要的格式）
function getTableData() {
  return Promise.resolve({
    data: {
      pageData: fileTasks.value,
      total: fileTasks.value.length,
    },
  })
}

// 刷新表格
function refreshTable() {
  $table.value?.handleSearch()
}

/* 核心方法 */

/**
 * 文件选择处理（NaiveUI Upload 组件）
 */
async function handleUploadChange({ fileList }) {
  if (!fileList?.length)
    return

  // 过滤出未处理的新文件
  const newFiles = fileList.filter((item) => {
    // 使用文件名+大小+最后修改时间作为唯一标识
    const fileKey = `${item.file.name}-${item.file.size}-${item.file.lastModified}`
    if (processedFiles.has(fileKey)) {
      return false // 已处理过，跳过
    }
    processedFiles.add(fileKey) // 标记为已处理
    return true
  })

  if (!newFiles.length)
    return

  // 并行处理新选择的文件
  await Promise.all(
    newFiles.map(item => prepareAndStartFileTask(item.file)),
  )
}

/**
 * 移除文件任务
 */
function removeFileTask(fileId) {
  const index = fileTasks.value.findIndex(f => f.fileId === fileId)
  if (index !== -1) {
    fileTasks.value.splice(index, 1)
    updateGlobalTotals()
    updateGlobalProgress()
    refreshTable()
  }
}

/**
 * 清空 Mock 数据（用于测试秒传和断点续传）
 */
function handleClearMockData() {
  clearMockData()
  uploadKey.value++ // 重置 upload 组件
  processedFiles.clear() // 清空已处理文件记录
  window.$message?.success('Mock 数据已清空，可以重新测试秒传和断点续传功能')
}

/**
 * 清空任务列表
 */
function handleClearTasks() {
  fileTasks.value = []
  globalProgress.uploadedBytes = 0
  globalProgress.totalBytes = 0
  globalProgress.percent = 0
  processedFiles.clear() // 清空已处理文件记录
  uploadKey.value++ // 重置 upload 组件
  refreshTable()
  window.$message?.success('任务列表已清空')
}

/**
 * 文件上传预处理（核心流程）
 * 1. 创建文件任务对象
 * 2. 切片+计算hash（Worker线程）
 * 3. 检查秒传/断点续传
 * 4. 启动上传调度
 */
async function prepareAndStartFileTask(file) {
  // 生成唯一文件ID（实际项目建议使用更可靠的生成方式）
  const fileId = `${file.name}-${file.size}-${Date.now()}`
  const chunkSize = Math.max(1, chunkSizeMB.value) * 1024 * 1024

  // 初始化文件任务（响应式对象）
  const task = reactive({
    fileId,
    fileName: file.name,
    fileSize: file.size,
    fileHash: '',
    chunkSize,
    totalChunks: 0,
    chunkTasks: [],
    state: 'idle',
    isPaused: false,
    inflightChunks: new Set(),
    uploadedBytes: 0,
    totalBytes: file.size,
    percent: 0,
  })

  fileTasks.value.push(task) // 立即加入列表显示
  refreshTable() // 刷新表格显示

  try {
    // Step 1: 文件切片+计算hash（Worker线程）
    const { fileHash, chunkTasks } = await createChunksAndHashInWorker(file, chunkSize, fileId)
    task.fileHash = fileHash
    task.chunkTasks = chunkTasks.map(ct => reactive(ct)) // 转为响应式
    task.totalChunks = chunkTasks.length

    // Step 2: 秒传/断点检查
    const check = await checkFile({
      fileHash: `${fileHash}${file.name}`,
      fileName: file.name,
    })

    if (check?.code === 0) {
      const { shouldUpload, uploadedList = [] } = check.data || {}

      // 秒传处理
      if (!shouldUpload) {
        completeFileTask(task)
        return
      }

      // 断点续传：过滤已上传切片
      if (uploadedList.length > 0) {
        task.chunkTasks = task.chunkTasks.filter(ct =>
          !uploadedList.includes(ct.chunkHash),
        )

        // 所有切片已上传，尝试合并
        if (task.chunkTasks.length === 0) {
          await tryMerge(task)
          return
        }
      }
    }

    // Step 3: 启动上传
    task.state = 'uploading'
    scheduleAllChunks(task)
  }
  catch (err) {
    console.error('文件预处理失败:', file.name, err)
    task.state = 'failed'
  }
}

/**
 * Web Worker 通信封装
 * 职责：文件切片 + 计算MD5
 */
function createChunksAndHashInWorker(file, chunkSize, fileId) {
  return new Promise((resolve, reject) => {
    // 这里设置 type 因为 useHashWorker.js 文件 使用 es6 import 用设置 type 为 module
    const worker = new Worker(new URL('@/composables/useHashWorker.js', import.meta.url), { type: 'module' })

    worker.postMessage({ file, chunkSize })

    worker.onmessage = (e) => {
      const { type } = e.data || {}

      if (type === 'progress') {
        // 可在此处更新hash计算进度
      }
      else if (type === 'done') {
        const { fileHash, fileChunkList } = e.data

        // 构建分片任务数组
        const chunkTasks = fileChunkList.map((c, index) => ({
          fileId,
          chunkId: `${fileId}-${index}`,
          chunkIndex: index,
          size: c.size,
          blob: c.blob,
          chunkHash: `${fileHash}-${index}`,
          uploadedBytes: 0,
          attemptCount: 0,
          maxAttempts: 3,
          abortController: new AbortController(),
          state: 'idle',
        }))

        resolve({ fileHash, chunkTasks })
        worker.terminate()
      }
      else if (type === 'error') {
        reject(new Error(e.data?.error || 'hash计算失败'))
        worker.terminate()
      }
    }
  })
}

/**
 * 调度文件的所有分片上传
 * 注意：实际项目建议使用全局交错调度（buildInterleavedChunks）
 */
function scheduleAllChunks(fileTask) {
  fileTask.chunkTasks
    .filter(ct => ct.state !== 'completed')
    .forEach(ct => enqueueChunkUpload(fileTask, ct))

  updateGlobalTotals()
}

/**
 * 分片上传任务封装
 * 1. 加入并发队列
 * 2. 处理重试逻辑
 * 3. 完成检查
 */
function enqueueChunkUpload(fileTask, chunkTask) {
  // 标记为进行中
  fileTask.inflightChunks.add(chunkTask)

  limiter.enqueue(
    async () => {
      try {
        await runWithRetry(
          () => uploadOneChunk(fileTask, chunkTask),
          chunkTask,
        )
      }
      finally {
        fileTask.inflightChunks.delete(chunkTask)
      }
    },
    fileTask.fileId,
  ).then(async () => {
    // 检查文件是否全部完成
    if (isFileUploadComplete(fileTask)) {
      await tryMerge(fileTask)
    }
  }).catch((err) => {
    console.error('分片上传失败:', chunkTask.chunkId, err)
  })
}

/**
 * 单个分片上传实现
 * 关键点：
 * - 支持取消（AbortController）
 * - 模拟进度上报（0-100% 平滑过渡）
 */
async function uploadOneChunk(fileTask, chunkTask) {
  chunkTask.state = 'uploading'
  chunkTask.uploadedBytes = 0 // 重置进度

  const formData = new FormData()
  formData.append('fileHash', `${fileTask.fileHash}${fileTask.fileName}`)
  formData.append('fileName', fileTask.fileName)
  formData.append('index', String(chunkTask.chunkIndex))
  formData.append('chunkFile', chunkTask.blob)
  formData.append('chunkHash', chunkTask.chunkHash)
  formData.append('chunkSize', String(fileTask.chunkSize))
  formData.append('chunkNumber', String(fileTask.totalChunks))

  // 模拟进度更新（平滑过渡）
  const progressInterval = setInterval(() => {
    if (chunkTask.uploadedBytes < chunkTask.size * 0.9) {
      // 上传到 90% 时停止模拟，等待真实完成
      chunkTask.uploadedBytes += chunkTask.size * 0.1
      updateFileProgress(fileTask)
      updateGlobalProgress()
      refreshTable()
    }
  }, 100)

  try {
    // 执行上传（带取消支持）
    await apiUploadChunk(formData, chunkTask.abortController.signal)

    // 清除进度模拟
    clearInterval(progressInterval)

    // 更新为完成状态
    chunkTask.uploadedBytes = chunkTask.size
    chunkTask.state = 'completed'

    // 更新进度
    updateFileProgress(fileTask)
    updateGlobalProgress()
    refreshTable()
  }
  catch (error) {
    clearInterval(progressInterval)
    throw error
  }
}

/* 上传控制方法 */

// 暂停上传
function pauseFileUpload(fileId) {
  const fileTask = fileTasks.value.find(f => f.fileId === fileId)
  if (!fileTask || fileTask.state === 'completed')
    return

  fileTask.isPaused = true
  fileTask.state = 'paused'

  // 取消队列中的任务
  limiter.removePendingByFileId(fileId)

  // 中止进行中的上传
  fileTask.inflightChunks.forEach((ct) => {
    ct.abortController.abort()
  })

  refreshTable()
}

// 恢复上传
function resumeFileUpload(fileId) {
  const fileTask = fileTasks.value.find(f => f.fileId === fileId)
  if (!fileTask)
    return

  fileTask.isPaused = false
  fileTask.state = 'uploading'

  // 重置未完成切片的状态
  fileTask.chunkTasks
    .filter(ct => ct.state !== 'completed')
    .forEach((ct) => {
      ct.abortController = new AbortController()
      enqueueChunkUpload(fileTask, ct)
    })

  refreshTable()
}

/* 工具方法 */

// 带重试的执行（指数退避）
async function runWithRetry(
  taskFn,
  chunkTask,
  maxAttempts = 3,
  baseDelay = 500,
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    chunkTask.attemptCount = attempt

    try {
      return await taskFn()
    }
    catch (err) {
      // 主动取消不重试
      if (chunkTask.abortController.signal.aborted)
        throw err

      // 最后一次尝试失败
      if (attempt === maxAttempts) {
        chunkTask.state = 'failed'
        throw err
      }

      // 延迟重试
      await sleep(baseDelay * 2 ** (attempt - 1))
    }
  }
}

// 文件上传完成检查
function isFileUploadComplete(fileTask) {
  return fileTask.chunkTasks.every(c => c.state === 'completed')
    && fileTask.state !== 'paused'
}

// 合并文件请求
async function tryMerge(fileTask) {
  const res = await mergeChunk({
    fileHash: fileTask.fileHash,
    fileName: fileTask.fileName,
    chunkSize: fileTask.chunkSize,
  }).catch(() => null)

  if (res?.code === 0) {
    completeFileTask(fileTask)
  }
  else {
    fileTask.state = 'failed'
  }
}

// 更新文件进度
function updateFileProgress(fileTask) {
  const uploaded = fileTask.chunkTasks.reduce((s, c) => s + c.uploadedBytes, 0)
  fileTask.uploadedBytes = uploaded
  fileTask.percent = Math.round((uploaded / fileTask.totalBytes) * 100)
}

// 更新全局统计
function updateGlobalTotals() {
  globalProgress.totalBytes = fileTasks.value.reduce((s, f) => s + f.totalBytes, 0)
}

function updateGlobalProgress() {
  globalProgress.uploadedBytes = fileTasks.value.reduce((s, f) => s + f.uploadedBytes, 0)
  globalProgress.percent = globalProgress.totalBytes > 0
    ? Math.round((globalProgress.uploadedBytes / globalProgress.totalBytes) * 100)
    : 0
}

// 标记文件上传完成
function completeFileTask(fileTask) {
  fileTask.state = 'completed'
  fileTask.percent = 100
  fileTask.uploadedBytes = fileTask.totalBytes
  updateGlobalProgress()
  refreshTable()

  // 保存到上传历史
  saveToHistory(fileTask)
}

/* 辅助工具 */
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms))
}

function formatBytes(n) {
  if (!n)
    return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / 1024 ** i).toFixed(2)} ${units[i]}`
}
</script>
