<template>
  <div class="excel-preview">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" class="mb-12">
        {{ error }}
      </n-alert>
      <template v-if="sheets.length">
        <n-tabs type="line" animated>
          <n-tab-pane
            v-for="sheet in sheets"
            :key="sheet.name"
            :name="sheet.name"
            :tab="sheet.name"
          >
            <n-scrollbar x-scrollable class="sheet-scroll">
              <table class="sheet-table">
                <tbody>
                  <tr v-for="(row, rowIndex) in sheet.rows" :key="rowIndex">
                    <td
                      v-for="(cell, cellIndex) in row"
                      :key="cellIndex"
                    >
                      {{ formatCell(cell) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </n-scrollbar>
          </n-tab-pane>
        </n-tabs>
      </template>
      <n-empty v-else-if="!loading && !error" description="没有可展示的数据" />
    </n-spin>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { read, utils } from 'xlsx'

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
})

const loading = ref(false)
const error = ref('')
const sheets = ref([])

watch(
  () => props.file?.rawFile,
  (file) => {
    if (!file) {
      reset()
      return
    }
    parseWorkbook(file)
  },
  { immediate: true },
)

async function parseWorkbook(file) {
  loading.value = true
  error.value = ''
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = read(arrayBuffer, { type: 'array' })
    sheets.value = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name]
      const rows = utils.sheet_to_json(sheet, { header: 1 })
      return { name, rows }
    })
  }
  catch (err) {
    console.error(err)
    error.value = 'Excel 解析失败'
    sheets.value = []
  }
  finally {
    loading.value = false
  }
}

function formatCell(cell) {
  if (cell === null || cell === undefined)
    return ''
  if (typeof cell === 'object')
    return JSON.stringify(cell)
  return String(cell)
}

function reset() {
  loading.value = false
  error.value = ''
  sheets.value = []
}
</script>

<style scoped>
.excel-preview {
  max-height: 70vh;
}

.sheet-scroll {
  max-height: 60vh;
}

.sheet-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 480px;
  font-size: 13px;
}

.sheet-table td {
  border: 1px solid rgba(148, 163, 184, 0.4);
  padding: 6px 10px;
  white-space: nowrap;
}
</style>
