<template>
  <div class="dynamic-table-wrapper">
    <!-- 顶部操作栏 -->
    <n-card class="header-card" :bordered="false">
      <n-space :size="12">
        <n-button type="info" @click="toggleTableList()">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
              </svg>
            </n-icon>
          </template>
          表格信息
        </n-button>
        <n-button type="primary" @click="addNewTable()">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </n-icon>
          </template>
          添加新表格
        </n-button>
      </n-space>
    </n-card>

    <!-- 主内容区域 -->
    <div v-show="!showTableList" class="content-wrapper">
      <div class="layout-container">
        <!-- 左侧：表格名称列表区域 -->
        <n-card class="table-list-card" title="表格列表" :bordered="false" size="small">
          <div class="table-names-scroll">
            <div
              v-for="table in tableNameList"
              :key="table.id"
              :class="{ active: currentTableId === table.id }"
              class="table-item"
              @click="selectTable(table.id)"
            >
              <div class="table-name-section">
                <n-icon v-if="!table.editing" class="table-icon" size="18">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                  </svg>
                </n-icon>
                <span
                  v-if="!table.editing"
                  class="table-name"
                >
                  {{ table.tableName }}
                </span>
                <n-input
                  v-if="table.editing"
                  :ref="el => setEditInputRef(el, table.id)"
                  v-model:value="table.editName"
                  class="edit-input"
                  size="small"
                  @blur="confirmEdit(table)"
                  @keyup.enter="confirmEdit(table)"
                  @click.stop
                />
                <n-icon
                  v-if="!table.editing"
                  class="edit-icon"
                  :class="{ visible: table.showEdit }"
                  size="16"
                  @click.stop="startEdit(table)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83l3.75 3.75l1.83-1.83z" />
                  </svg>
                </n-icon>
              </div>
            </div>
          </div>
        </n-card>

        <!-- 右侧：表格操作和数据区域 -->
        <div class="table-content">
          <!-- 操作按钮区域 -->
          <n-card v-if="currentTable" class="action-card" :bordered="false" size="small">
            <n-space :size="12">
              <n-button type="success" @click="addColumn">
                <template #icon>
                  <n-icon>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8z" />
                    </svg>
                  </n-icon>
                </template>
                添加列
              </n-button>
              <n-button
                :disabled="currentTable.columnData.length === 0"
                type="success"
                @click="addRows"
              >
                <template #icon>
                  <n-icon>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8z" />
                    </svg>
                  </n-icon>
                </template>
                添加行
              </n-button>
              <n-button
                v-if="tableNameList.length > 1 && currentTableId !== tableNameList[0].id"
                type="error"
                @click="deleteTable(currentTable.id)"
              >
                <template #icon>
                  <n-icon>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </n-icon>
                </template>
                删除表格
              </n-button>
            </n-space>
          </n-card>

          <!-- 表格数据区域 -->
          <n-card class="data-card" :bordered="false">
            <n-data-table
              :columns="tableColumns"
              :data="currentTableData"
              :bordered="true"
              :single-line="false"
              :row-key="row => row.index"
              striped
            />
          </n-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { NButton, NCard, NIcon, NInput, NSpace } from 'naive-ui'
import { computed, h, nextTick, ref } from 'vue'

defineOptions({ name: 'BaseDynamicTable' })

const currentTableId = ref(1) // 当前选中的表格ID
const tableIdCounter = ref(1) // 表格ID计数器
const columnPropIndex = ref(3) // 列属性自增
const showTableList = ref(true) // 控制表格列表显示
const editInputRefs = ref({})
const editingCell = ref(null) // 当前正在编辑的单元格 {rowIndex, prop}

// 表格列表数据，每个表格包含自己的列和数据
const tableNameList = ref([
  {
    id: 1,
    tableName: '默认表格',
    editing: false,
    editName: '',
    columnData: [
      { label: '测试1', prop: 'items0' },
      { label: '测试2', prop: 'items1' },
      { label: '测试3', prop: 'items2' },
    ],
    tableData: [
      {
        items0: '666',
        items1: '666',
        items2: '666',
      },
      {
        items0: '777',
        items1: '777',
        items2: '777',
      },
      {
        items0: '888',
        items1: '888',
        items2: '888',
      },
    ],
  },
])

// 设置编辑输入框的引用
function setEditInputRef(el, tableId) {
  if (el) {
    editInputRefs.value[`editInput_${tableId}`] = el
  }
}

// 当前选中的表格对象
const currentTable = computed(() => {
  return tableNameList.value.find(table => table.id === currentTableId.value)
})

// 当前表格的列数据
const currentColumnData = computed(() => {
  return currentTable.value ? currentTable.value.columnData : []
})

// 当前表格的行数据
const currentTableData = computed(() => {
  if (!currentTable.value)
    return []
  return currentTable.value.tableData.map((row, index) => ({
    ...row,
    index: index + 1,
  }))
})

// 构建表格列配置
const tableColumns = computed(() => {
  const columns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: row => row.index,
    },
  ]

  // 添加动态列
  currentColumnData.value.forEach((item) => {
    columns.push({
      title: item.label,
      key: item.prop,
      width: item.width,
      render: (row, rowIndex) => {
        if (row[item.prop] !== null && row[item.prop] !== undefined) {
          const isEditing = editingCell.value?.rowIndex === rowIndex && editingCell.value?.prop === item.prop

          if (isEditing) {
            // 编辑状态：显示输入框
            return h(NInput, {
              value: row[item.prop],
              autofocus: true,
              onUpdateValue: (value) => {
                currentTable.value.tableData[rowIndex][item.prop] = value
              },
              onBlur: () => {
                editingCell.value = null
              },
              onKeyup: (e) => {
                if (e.key === 'Enter') {
                  editingCell.value = null
                }
              },
            })
          }
          else {
            // 非编辑状态：显示文本
            return h(
              'div',
              {
                style: 'cursor: pointer; padding: 8px; min-height: 32px; border-radius: 4px; transition: background-color 0.2s;',
                onClick: () => {
                  editingCell.value = { rowIndex, prop: item.prop }
                },
                onMouseenter: (e) => {
                  e.target.style.backgroundColor = '#f5f5f5'
                },
                onMouseleave: (e) => {
                  e.target.style.backgroundColor = 'transparent'
                },
              },
              row[item.prop] || h('span', { style: 'color: #ccc;' }, '点击编辑'),
            )
          }
        }
        else {
          return h(
            'span',
            {
              style: 'color: red; cursor: pointer',
              onClick: () => deleteColumns(item.prop),
            },
            '删除列',
          )
        }
      },
    })
  })

  // 添加操作列
  columns.push({
    title: '操作',
    key: 'actions',
    width: 100,
    fixed: 'right',
    render: (row, rowIndex) => {
      return h(
        NButton,
        {
          text: true,
          type: 'error',
          size: 'small',
          onClick: () => deleteRows(rowIndex),
        },
        { default: () => '删除行' },
      )
    },
  })

  return columns
})

/** 添加行 */
function addRows() {
  if (!currentTable.value)
    return
  const tableData = currentTable.value.tableData
  const firstRow = tableData[0]
  if (firstRow) {
    const newObj = {}
    for (const key in firstRow) {
      newObj[key] = ''
    }
    tableData.push(newObj)
  }
  else if (currentTable.value.columnData.length > 0) {
    // 如果没有数据行但有列，创建一个新行
    const newObj = {}
    currentTable.value.columnData.forEach((col) => {
      newObj[col.prop] = ''
    })
    tableData.push(newObj)
  }
}

/** 删除行 */
function deleteRows(rowIndex) {
  if (!currentTable.value)
    return
  currentTable.value.tableData.splice(rowIndex, 1)
}

/** 添加列 */
function addColumn() {
  if (!currentTable.value)
    return

  // 在外部创建 ref，这样可以在 onPositiveClick 中访问
  const inputValue = ref('')

  $dialog.create({
    title: '提示',
    content: () => {
      return h('div', [
        h('div', { style: 'margin-bottom: 12px' }, '请输入列名'),
        h(NInput, {
          value: inputValue.value,
          onUpdateValue: (value) => {
            inputValue.value = value
          },
          placeholder: '请输入列名',
        }),
      ])
    },
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      const columnLabel = inputValue.value.trim()

      if (!columnLabel) {
        $message.warning('列名不能为空')
        return false
      }

      const propStr = `items${columnPropIndex.value}`
      // 添加列到当前表格的列数据
      const columnObj = {
        prop: propStr,
        label: columnLabel,
      }
      currentTable.value.columnData.push(columnObj)
      columnPropIndex.value++

      // 为当前表格的每行数据添加新列
      currentTable.value.tableData.forEach((item, index) => {
        if (index < currentTable.value.tableData.length) {
          item[columnObj.prop] = ''
        }
        else {
          item[columnObj.prop] = null
        }
      })
    },
  })
}

/** 删除列 */
function deleteColumns(property) {
  if (!currentTable.value)
    return
  // 删除当前表格数据中的属性
  currentTable.value.tableData.forEach((item) => {
    delete item[property]
  })
  // 删除当前表格列配置中的数据
  const columnIndex = currentTable.value.columnData.findIndex(
    item => item.prop === property,
  )
  if (columnIndex !== -1) {
    currentTable.value.columnData.splice(columnIndex, 1)
  }
}

// 选择表格
function selectTable(tableId) {
  currentTableId.value = tableId
  // 清除单元格编辑状态
  editingCell.value = null
}

// 开始编辑表格名称
function startEdit(table) {
  table.editName = table.tableName
  table.editing = true
  nextTick(() => {
    const inputRef = editInputRefs.value[`editInput_${table.id}`]
    if (inputRef && inputRef.focus) {
      inputRef.focus()
    }
  })
}

// 确认编辑
function confirmEdit(table) {
  if (table.editName.trim()) {
    table.tableName = table.editName.trim()
  }
  table.editing = false
  table.editName = ''
}

// 添加新表格
function addNewTable() {
  // 清除单元格编辑状态
  editingCell.value = null
  tableIdCounter.value++
  const newTable = {
    id: tableIdCounter.value,
    tableName: `新表格${tableIdCounter.value}`,
    editing: false,
    editName: '',
    columnData: [],
    tableData: [],
  }
  tableNameList.value.push(newTable)
  currentTableId.value = newTable.id

  $message.success(`成功添加新表格: ${newTable.tableName}`)
}

// 删除表格
function deleteTable(tableId) {
  if (tableNameList.value.length <= 1) {
    $message.warning('至少需要保留一个表格')
    return
  }

  // 清除单元格编辑状态
  editingCell.value = null

  const tableIndex = tableNameList.value.findIndex(
    table => table.id === tableId,
  )
  if (tableIndex !== -1) {
    const tableName = tableNameList.value[tableIndex].tableName
    tableNameList.value.splice(tableIndex, 1)
    // 如果删除的是当前表格，切换到第一个表格
    if (currentTableId.value === tableId) {
      currentTableId.value = tableNameList.value[0].id
    }
    $message.success(`成功删除表格: ${tableName}`)
  }
}

// 切换表格列表显示/隐藏
function toggleTableList() {
  showTableList.value = !showTableList.value
}
</script>

<style scoped>
.dynamic-table-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  overflow: auto;
}

.header-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-container {
  display: flex;
  gap: 16px;
  height: 100%;
}

/* 左侧表格列表 */
.table-list-card {
  width: 280px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.table-list-card :deep(.n-card__content) {
  padding: 8px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-names-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.table-names-scroll::-webkit-scrollbar {
  width: 6px;
}

.table-names-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.table-names-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.table-item {
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: #fff;
  border: 2px solid transparent;
}

.table-item:hover {
  background: #f0f9ff;
  border-color: #e3f2fd;
  transform: translateX(4px);
}

.table-item.active {
  background: linear-gradient(135deg, #18a058 0%, #2db77d 100%);
  color: white;
  border-color: #18a058;
  box-shadow: 0 4px 12px rgba(24, 160, 88, 0.3);
}

.table-item.active .table-icon {
  color: white;
}

.table-name-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-icon {
  flex-shrink: 0;
  color: #18a058;
  transition: color 0.3s;
}

.table-name {
  flex: 1;
  cursor: pointer;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-input {
  flex: 1;
}

.edit-icon {
  flex-shrink: 0;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s;
  color: #666;
}

.table-item:hover .edit-icon {
  opacity: 1;
}

.table-item.active .edit-icon {
  color: rgba(255, 255, 255, 0.8);
  opacity: 1;
}

.edit-icon:hover {
  transform: scale(1.2);
}

.table-item.active .edit-icon:hover {
  color: white;
}

/* 右侧内容区域 */
.table-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.action-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.data-card {
  flex: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.data-card :deep(.n-card__content) {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

/* 表格样式优化 */
:deep(.n-data-table) {
  font-size: 14px;
}

:deep(.n-data-table-th) {
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
  font-weight: 600;
  color: #333;
}

:deep(.n-data-table-td) {
  padding: 12px 16px;
}

:deep(.n-data-table-tr:hover) {
  background: #f8fafc;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .table-list-card {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
  }

  .table-list-card {
    width: 100%;
    max-height: 200px;
  }
}
</style>
