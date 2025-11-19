<template>
  <div class="excel-preview">
    <div class="viewer-toolbar">
      <div class="toolbar-left" />
      <div class="fileName">
        {{ fileName }}
      </div>
      <div class="toolbar-right">
        <n-button size="small" quaternary :focusable="false" @click="router.back()">
          <template #icon>
            <h-icon name="fa-compress" />
          </template>
        </n-button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button type="button" @click="retry">
        重试
      </button>
    </div>

    <div class="luckysheet-conntainer">
      <div
        v-show="!loading && !error"
        id="luckysheet"
        class="luckysheet-wrap"
      />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { read, utils } from 'xlsx'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const rendering = ref(false)
const fileName = ref('')
let lastUrl = ''

// 销毁 Luckysheet 实例
function destroyLuckysheet() {
  if (window.luckysheet) {
    try {
      window.luckysheet.destroy()
    }
    catch (e) {
      console.warn('Luckysheet destroy failed:', e)
    }
  }
}

// 将行数据转换为 Luckysheet 格式
function toLuckysheetDataFromRows(rows, name) {
  const maxCol = rows.reduce((m, r) => Math.max(m, r.length), 0)
  const celldata = []

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || []
    for (let c = 0; c < row.length; c++) {
      const raw = row[c]
      const text = raw == null ? '' : (typeof raw === 'object' ? JSON.stringify(raw) : String(raw))
      celldata.push({
        r,
        c,
        v: { v: text, m: text },
      })
    }
  }

  return {
    name: name || 'Sheet1',
    index: 0,
    status: 1,
    order: 0,
    row: rows.length,
    column: maxCol,
    celldata,
  }
}

// 获取文件 Blob
async function fetchBlob(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`获取文件失败: ${res.status} ${res.statusText}`)
    }
    return await res.blob()
  }
  catch (e) {
    console.error('Failed to fetch blob:', e)
    throw e
  }
}

// 使用 LuckyExcel 解析(如果可用)
function tryLuckyExcel(file) {
  return new Promise((resolve, reject) => {
    const LuckyExcel = window.LuckyExcel

    if (!LuckyExcel || typeof LuckyExcel.transformExcelToLucky !== 'function') {
      reject(new Error('LuckyExcel not available'))
      return
    }

    LuckyExcel.transformExcelToLucky(file, (exportJson) => {
      if (!exportJson || !exportJson.sheets || exportJson.sheets.length === 0) {
        reject(new Error('LuckyExcel 未解析到有效工作表'))
        return
      }
      resolve(exportJson)
    })
  })
}

// 使用 XLSX 库解析
async function parseWithXLSX(file) {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = read(arrayBuffer, { type: 'array' })

  const sheetsData = workbook.SheetNames.map((name, i) => {
    const ws = workbook.Sheets[name]
    const rows = utils.sheet_to_json(ws, { header: 1 })
    const ds = toLuckysheetDataFromRows(rows, name)
    ds.index = i
    ds.order = i
    return ds
  })

  return { sheets: sheetsData, info: { name: file.name } }
}

// 渲染 Excel 文件
async function renderExcel(file) {
  if (typeof window.luckysheet === 'undefined') {
    throw new TypeError('Luckysheet 未加载,请检查静态资源引入')
  }

  let exportJson = null
  const ext = (file.name || '').split('.').pop()?.toLowerCase()

  // 对于 xlsx 文件,优先尝试使用 LuckyExcel
  if (ext === 'xlsx') {
    try {
      exportJson = await tryLuckyExcel(file)
      console.log('使用 LuckyExcel 解析成功')
    }
    catch (e) {
      console.warn('LuckyExcel 解析失败,回退到 XLSX:', e.message)
    }
  }

  // 如果 LuckyExcel 失败或不可用,使用 XLSX 库
  if (!exportJson) {
    exportJson = await parseWithXLSX(file)
    console.log('使用 XLSX 库解析成功')
  }

  // 销毁旧实例
  destroyLuckysheet()

  // 创建新实例
  window.luckysheet.create({
    container: 'luckysheet',
    data: exportJson.sheets,
    title: file.name,
    userInfo: exportJson.info?.creator,
    showtoolbar: false,
    showinfobar: false,
    showstatisticBar: false,
    sheetBottomConfig: false,
    allowEdit: false,
    enableAddRow: false,
    enableAddCol: false,
    sheetFormulaBar: false,
    enableAddBackTop: false,
    showsheetbar: true,
    showsheetbarConfig: {
      add: false,
      menu: false,
    },
    lang: 'zh',
  })
}

// 从路由参数解析文件信息
function getFileInfoFromRoute() {
  // 方式1: 直接传 excelUrl
  if (route.query.excelUrl) {
    return {
      url: route.query.excelUrl,
      name: 'file.xlsx',
    }
  }

  // 方式2: 传递 file JSON 字符串
  if (route.query.file) {
    try {
      const data = JSON.parse(route.query.file)
      fileName.value = data.name || ''
      return {
        url: data.objectUrl || data.url || '',
        name: data.name || `file.${data.extension || 'xlsx'}`,
      }
    }
    catch (e) {
      console.error('解析 file 参数失败:', e)
      throw new Error('文件参数格式错误')
    }
  }

  throw new Error('未提供文件地址参数')
}

// 从路由加载并渲染
async function renderFromRoute() {
  if (rendering.value)
    return

  rendering.value = true
  loading.value = true
  error.value = ''

  try {
    const fileInfo = getFileInfoFromRoute()

    // 避免重复渲染
    if (fileInfo.url === lastUrl) {
      loading.value = false
      return
    }

    if (!fileInfo.url) {
      throw new Error('文件地址为空')
    }

    console.log('开始加载文件:', fileInfo)

    const blob = await fetchBlob(fileInfo.url)
    const file = new File([blob], fileInfo.name, {
      type: blob.type || 'application/vnd.ms-excel',
    })

    await renderExcel(file)
    lastUrl = fileInfo.url
    loading.value = false
  }
  catch (e) {
    console.error('渲染失败:', e)
    error.value = e.message || '加载文件失败'
    loading.value = false
  }
  finally {
    rendering.value = false
  }
}

// 重试
function retry() {
  lastUrl = '' // 清除缓存的 URL
  renderFromRoute()
}

// 窗口大小调整
function handleResize() {
  if (window.luckysheet) {
    try {
      window.luckysheet.resize()
    }
    catch (e) {
      console.warn('Resize failed:', e)
    }
  }
}

onMounted(() => {
  console.log('组件已挂载,路由参数:', route.query)

  if (typeof window.luckysheet === 'undefined') {
    error.value = 'Luckysheet 未加载,请检查 index.html 静态资源引入'
    loading.value = false
    return
  }

  renderFromRoute()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  destroyLuckysheet()
})
// 监听路由参数变化
watch(
  () => [route.query.file, route.query.excelUrl],
  () => {
    renderFromRoute()
  },
)
</script>

<style scoped>
.excel-preview {
  width: 100%;
  height: 100vh;
  position: relative;
}

.viewer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 8px;
}
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.luckysheet-conntainer {
  width: 100%;
  height: calc(100vh - 56px);
}
.luckysheet-wrap {
  width: 100%;
  height: 100%;
}

#luckysheet {
  width: 100%;
  height: 100%;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-state p {
  color: #e74c3c;
  margin-bottom: 16px;
  font-size: 14px;
}

.error-state button {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.error-state button:hover {
  background: #2980b9;
}
</style>
