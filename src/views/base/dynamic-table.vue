<template>
  <common-page :show-footer="false" :show-header="false">
    <div class="dynamic-table-wrapper">
      <!-- 顶部操作栏 -->
      <n-card class="header-card" :bordered="false">
        <n-space :size="12">
          <n-button type="primary">
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                </svg>
              </n-icon>
            </template>
            表格信息
          </n-button>
          <n-button type="default" @click="addNewTable()">
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
      <div class="content-wrapper">
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
          <div
            ref="tableContentRef"
            class="table-content"
            :class="{ 'fullscreen-mode': isFullscreen }"
            :style="{ backgroundColor: isFullscreen ? themeVars.modalColor : '' }"
          >
            <!-- 操作按钮区域 -->
            <n-space v-if="currentTable" :size="8">
              <n-button type="success" size="small" @click="addColumn">
                <template #icon>
                  <i class="i-carbon-add-alt" />
                </template>
                添加列
              </n-button>
              <n-button
                :disabled="currentTable.columnData.length === 0"
                type="success"
                size="small"
                @click="addRows"
              >
                <template #icon>
                  <i class="i-carbon-add" />
                </template>
                添加行
              </n-button>
              <n-button
                v-if="tableNameList.length > 1 && currentTableId !== tableNameList[0].id"
                type="error"
                size="small"
                @click="deleteTable(currentTable.id)"
              >
                <template #icon>
                  <i class="i-carbon-trash-can" />
                </template>
                删除表格
              </n-button>
            </n-space>

            <!-- 表格区域（包含工具栏和数据） -->
            <div class="table-wrapper">
              <!-- 表格工具栏 -->
              <table-toolbar
                v-if="currentTable"
                v-model:striped="tableStriped"
                v-model:bordered="tableBordered"
                v-model:size="tableSize"
                v-model:hidden-columns="hiddenColumns"
                :columns="allTableColumns"
                :fullscreen="isFullscreen"
                :show-add="true"
                :show-delete="true"
                :show-detail="true"
                :show-fullscreen="true"
                @refresh="handleRefresh"
                @fullscreen-change="handleFullscreenChange"
                @add="addColumn"
                @delete="deleteTable(currentTable.id)"
              />

              <!-- 表格数据区域 -->
              <div class="data-card">
                <n-data-table
                  :columns="tableColumns"
                  :data="currentTableData"
                  :striped="tableStriped"
                  :bordered="tableBordered"
                  :size="tableSize"
                  :row-key="row => row.index"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </common-page>
</template>

<script setup>
import { NButton, NIcon, NInput, useThemeVars } from 'naive-ui'
import { getCurrentInstance } from 'vue'
import TableToolbar from '@/components/TableToolbar/index.vue'

defineOptions({ name: 'BaseDynamicTable' })

const { proxy } = getCurrentInstance()
const screenfull = proxy.$screenfull

const currentTableId = ref(1) // 当前选中的表格ID
const tableIdCounter = ref(1) // 表格ID计数器
const columnPropIndex = ref(3) // 列属性自增
const editInputRefs = ref({})
const editingRowIndex = ref(null) // 当前正在编辑的行索引
const editingColumnHeader = ref(null) // 当前正在编辑的列标题 {prop}
const tableContentRef = ref(null) // 表格内容区域引用
const themeVars = useThemeVars()

// 表格配置
const tableStriped = ref(false) // 是否显示斑马纹
const tableBordered = ref(true) // 是否显示边框
const tableSize = ref('medium') // 表格大小: small | medium | large
const hiddenColumns = ref([]) // 隐藏的列 key 数组
const isFullscreen = ref(false) // 是否全屏

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

// 构建表格列配置（用于工具栏的列设置）
const allTableColumns = computed(() => {
  const columns = [
    {
      title: '序号',
      key: 'index',
    },
  ]

  // 添加动态列标题
  currentColumnData.value.forEach((item) => {
    columns.push({
      title: item.label,
      key: item.prop,
    })
  })

  columns.push({
    title: '操作',
    key: 'actions',
  })

  return columns
})

// 构建实际渲染的表格列配置
const tableColumns = computed(() => {
  const columns = []

  // 序号列
  if (!hiddenColumns.value.includes('index')) {
    columns.push({
      title: '#',
      key: 'index',
      width: 50,
      render: row => row.index,
    })
  }

  // 添加动态列
  currentColumnData.value.forEach((item) => {
    // 如果列被隐藏，跳过
    if (hiddenColumns.value.includes(item.prop)) {
      return
    }
    columns.push({
      // 使用函数形式的 title 来自定义列标题
      title: () => {
        const isEditingHeader = editingColumnHeader.value?.prop === item.prop

        if (isEditingHeader) {
          // 编辑状态：显示输入框
          return h(NInput, {
            value: item.label,
            size: 'small',
            ref: (el) => {
              if (el) {
                nextTick(() => {
                  el?.focus?.()
                })
              }
            },
            onUpdateValue: (value) => {
              // 更新列标题
              const columnIndex = currentTable.value.columnData.findIndex(col => col.prop === item.prop)
              if (columnIndex !== -1) {
                currentTable.value.columnData[columnIndex].label = value
              }
            },
            onBlur: () => {
              editingColumnHeader.value = null
            },
            onKeyup: (e) => {
              if (e.key === 'Enter') {
                editingColumnHeader.value = null
              }
            },
          })
        }
        else {
          // 非编辑状态：显示可点击的文本
          return h(
            'div',
            {
              style: {
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                display: 'inline-block',
                userSelect: 'none',
              },
              onClick: (e) => {
                e.stopPropagation()
                editingColumnHeader.value = { prop: item.prop }
              },
              onMouseenter: (e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.06)'
              },
              onMouseleave: (e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              },
            },
            item.label,
          )
        }
      },
      key: item.prop,
      width: item.width,
      render: (row, rowIndex) => {
        if (row[item.prop] !== null && row[item.prop] !== undefined) {
          // 当前行是否在编辑模式
          const isRowEditing = editingRowIndex.value === rowIndex

          if (isRowEditing) {
            // 编辑状态：显示输入框
            return h(NInput, {
              value: row[item.prop],
              size: 'small',
              onUpdateValue: (value) => {
                currentTable.value.tableData[rowIndex][item.prop] = value
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
                  // 点击单元格进入该行的编辑模式
                  editingRowIndex.value = rowIndex
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

  // 添加操作列（如果没有被隐藏）
  if (!hiddenColumns.value.includes('actions')) {
    columns.push({
      title: '操作',
      key: 'actions',
      minwidth: 80,
      fixed: 'right',
      render: (row, rowIndex) => {
        const isRowEditing = editingRowIndex.value === rowIndex

        // 创建按钮数组
        const buttons = []

        // 编辑模式时显示保存按钮
        if (isRowEditing) {
          buttons.push(
            h(NButton, {
              text: true,
              type: 'success',
              size: 'small',
              onClick: () => {
                editingRowIndex.value = null
              },
            }, { default: () => '保存' }),
          )
        }

        // 始终显示删除按钮
        buttons.push(
          h(NButton, {
            text: true,
            type: 'error',
            size: 'small',
            onClick: () => deleteRows(rowIndex),
          }, { default: () => '删除行' }),
        )

        // 返回按钮组
        return h('div', { style: 'display: flex; gap: 8px;' }, buttons)
      },
    })
  }

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

  // 新增行后自动进入该行的编辑模式
  editingRowIndex.value = tableData.length - 1
}

/** 删除行 */
function deleteRows(rowIndex) {
  if (!currentTable.value)
    return
  currentTable.value.tableData.splice(rowIndex, 1)

  // 如果删除的是正在编辑的行，清除编辑状态
  if (editingRowIndex.value === rowIndex) {
    editingRowIndex.value = null
  }
  else if (editingRowIndex.value !== null && editingRowIndex.value > rowIndex) {
    // 如果删除的行在编辑行之前，需要调整编辑行索引
    editingRowIndex.value -= 1
  }
}

/** 添加列 */
function addColumn() {
  if (!currentTable.value)
    return

  // 在外部创建 ref，这样可以在 onPositiveClick 中访问
  const inputValue = ref('')

  $dialog.create({
    title: '表格列名',
    content: () => {
      return h('div', [
        h(NInput, {
          value: inputValue.value,
          style: { width: '100%', margin: '12px 0' },
          size: 'small',
          ref: (el) => {
            // 使用 ref 回调在元素挂载后立即聚焦
            if (el) {
              nextTick(() => {
                el?.focus?.()
              })
            }
          },
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
  // 退出行编辑模式
  editingRowIndex.value = null
  editingColumnHeader.value = null
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
  // 退出行编辑模式
  editingRowIndex.value = null
  editingColumnHeader.value = null
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

// 刷新表格
function handleRefresh() {
  $message.info('刷新表格')
  // 这里可以添加重新加载数据的逻辑
}

// 全屏切换处理
function handleFullscreenChange() {
  if (!screenfull.isEnabled) {
    $message.warning('您的浏览器不支持全屏')
    return
  }
  if (tableContentRef.value) {
    screenfull.toggle(tableContentRef.value)
  }
}

// 监听全屏状态变化
function changeFullscreen() {
  isFullscreen.value = screenfull.isFullscreen
}

// 删除表格
function deleteTable(tableId) {
  if (tableNameList.value.length <= 1) {
    $message.warning('至少需要保留一个表格')
    return
  }

  // 退出行编辑模式
  editingRowIndex.value = null
  editingColumnHeader.value = null

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

// 组件挂载时添加事件监听
onMounted(() => {
  if (screenfull.isEnabled) {
    screenfull.on('change', changeFullscreen)
  }
})

// 组件卸载前移除事件监听
onUnmounted(() => {
  if (screenfull.isEnabled) {
    screenfull.off('change', changeFullscreen)
  }
})
</script>

<style scoped>
.dynamic-table-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  background: var(--bg-color);
  border: 2px solid transparent;
}

.table-item.active {
  background: var(--bg-color-hover);
  color: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(var(--primary-color), 0.3);
}

.table-item.active .table-icon {
  color: var(--primary-color);
}

.table-name-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-icon {
  flex-shrink: 0;
  color: var(--primary-color);
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
  color: rgb(var(--primary-color));
  opacity: 1;
}

.edit-icon:hover {
  transform: scale(1.2);
}

.table-item.active .edit-icon:hover {
  color: var(--primary-color);
}

/* 右侧内容区域 */
.table-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

/* 表格容器（工具栏+数据表格） */
.table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 6px;
}

.data-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  background-color: var(--n-color);
  border-radius: 0 0 6px 6px;
}

/* 全屏模式 */
.table-content.fullscreen-mode {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  padding: 16px;
  border-radius: 0;
}

.table-content.fullscreen-mode .action-card {
  border-radius: 6px;
}

.table-content.fullscreen-mode .table-wrapper {
  flex: 1;
  border-radius: 6px;
}

.table-content.fullscreen-mode .data-card {
  flex: 1;
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
