<template>
  <div class="table-toolbar" :class="{ 'no-left-content': !hasLeftContent }">
    <!-- 左侧操作按钮区域 -->
    <div v-if="hasLeftContent" class="toolbar-left">
      <n-space :size="8">
        <slot name="left">
          <!-- 默认的左侧按钮 -->
          <n-button v-if="showAdd" type="primary" size="small" @click="handleAdd">
            <template #icon>
              <i class="i-carbon-add" />
            </template>
            添加
          </n-button>
          <n-button v-if="showDelete" type="error" size="small" @click="handleDelete">
            <template #icon>
              <i class="i-carbon-trash-can" />
            </template>
            删除
          </n-button>
          <n-button v-if="showDetail" size="small" @click="handleDetail">
            <template #icon>
              <i class="i-carbon-document" />
            </template>
            详情
          </n-button>
        </slot>
      </n-space>
    </div>

    <!-- 右侧工具按钮区域 -->
    <div class="toolbar-right">
      <!-- 斑马纹切换 -->
      <n-tooltip v-if="showStriped" trigger="hover">
        <template #trigger>
          <n-button
            :type="striped ? 'primary' : 'default'"
            text
            class="toolbar-btn"
            @click="toggleStriped"
          >
            <template #icon>
              <div class="i-carbon-list toolbar-icon" />
            </template>
          </n-button>
        </template>
        斑马纹
      </n-tooltip>

      <!-- 边框切换 -->
      <n-tooltip v-if="showBordered" trigger="hover">
        <template #trigger>
          <n-button
            :type="bordered ? 'primary' : 'default'"
            text
            class="toolbar-btn"
            @click="toggleBordered"
          >
            <template #icon>
              <div class="i-carbon-grid toolbar-icon" />
            </template>
          </n-button>
        </template>
        边框
      </n-tooltip>

      <!-- 刷新 -->
      <n-tooltip v-if="showRefresh" trigger="hover">
        <template #trigger>
          <n-button text class="toolbar-btn" @click="handleRefresh">
            <template #icon>
              <div class="i-carbon-renew toolbar-icon" />
            </template>
          </n-button>
        </template>
        刷新
      </n-tooltip>

      <!-- 表格大小 -->
      <n-dropdown
        v-if="showSize"
        trigger="click"
        :options="sizeOptions"
        @select="handleSizeChange"
      >
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button text class="toolbar-btn">
              <template #icon>
                <div class="i-carbon-expand-categories toolbar-icon" />
              </template>
            </n-button>
          </template>
          表格大小
        </n-tooltip>
      </n-dropdown>

      <!-- 列设置 -->
      <n-popover
        v-if="showColumnSetting && columns.length > 0"
        trigger="click"
        placement="bottom-end"
        :width="200"
      >
        <template #trigger>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button text class="toolbar-btn">
                <template #icon>
                  <div class="i-carbon-settings toolbar-icon" />
                </template>
              </n-button>
            </template>
            列设置
          </n-tooltip>
        </template>
        <div class="column-settings">
          <div class="column-settings-header">
            <n-checkbox
              :checked="allColumnsChecked"
              :indeterminate="someColumnsChecked"
              @update:checked="handleCheckAllColumns"
            >
              列展示
            </n-checkbox>
          </div>
          <n-divider style="margin: 8px 0;" />
          <div class="column-settings-list">
            <div
              v-for="col in columns"
              :key="col.key"
              class="column-settings-item"
            >
              <n-checkbox
                :checked="!hiddenColumns.includes(col.key)"
                @update:checked="(checked) => handleColumnToggle(col.key, checked)"
              >
                {{ col.title }}
              </n-checkbox>
            </div>
          </div>
        </div>
      </n-popover>

      <!-- 全屏切换 -->
      <n-tooltip v-if="showFullscreen" trigger="hover">
        <template #trigger>
          <n-button text class="toolbar-btn" @click="toggleFullscreen">
            <template #icon>
              <div :class="fullscreen ? 'i-carbon-minimize' : 'i-carbon-maximize'" class="toolbar-icon" />
            </template>
          </n-button>
        </template>
        {{ fullscreen ? '退出全屏' : '全屏' }}
      </n-tooltip>
    </div>
  </div>
</template>

<script setup>
import { NButton, NCheckbox, NDivider, NDropdown, NPopover, NSpace, NTooltip } from 'naive-ui'
import { computed, h } from 'vue'

const props = defineProps({
  // 左侧按钮显示控制
  showAdd: {
    type: Boolean,
    default: true,
  },
  showDelete: {
    type: Boolean,
    default: true,
  },
  showDetail: {
    type: Boolean,
    default: true,
  },

  // 右侧功能显示控制
  showStriped: {
    type: Boolean,
    default: true,
  },
  showBordered: {
    type: Boolean,
    default: true,
  },
  showRefresh: {
    type: Boolean,
    default: true,
  },
  showSize: {
    type: Boolean,
    default: true,
  },
  showColumnSetting: {
    type: Boolean,
    default: true,
  },
  showFullscreen: {
    type: Boolean,
    default: true,
  },

  // 表格配置
  striped: {
    type: Boolean,
    default: false,
  },
  bordered: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: 'medium',
  },
  fullscreen: {
    type: Boolean,
    default: false,
  },

  // 列配置
  columns: {
    type: Array,
    default: () => [],
  },
  hiddenColumns: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'add',
  'delete',
  'detail',
  'update:striped',
  'update:bordered',
  'update:size',
  'update:hiddenColumns',
  'refresh',
  'fullscreenChange',
])

// 检测是否有左侧内容
const hasLeftContent = computed(() => {
  return props.showAdd || props.showDelete || props.showDetail
})

// 表格大小选项
const sizeOptions = [
  {
    label: '大',
    key: 'large',
    icon: () => h('div', { class: 'i-carbon-chevron-sort-up', style: 'width: 16px; height: 16px; display: inline-block;' }),
  },
  {
    label: '中',
    key: 'medium',
    icon: () => h('div', { class: 'i-carbon-minus', style: 'width: 16px; height: 16px; display: inline-block;' }),
  },
  {
    label: '小',
    key: 'small',
    icon: () => h('div', { class: 'i-carbon-chevron-sort-down', style: 'width: 16px; height: 16px; display: inline-block;' }),
  },
]

// 计算所有列是否都被选中
const allColumnsChecked = computed(() => {
  return props.hiddenColumns.length === 0
})

// 计算是否部分列被选中
const someColumnsChecked = computed(() => {
  return props.hiddenColumns.length > 0 && props.hiddenColumns.length < props.columns.length
})

// 左侧操作按钮事件
function handleAdd() {
  emit('add')
}

function handleDelete() {
  emit('delete')
}

function handleDetail() {
  emit('detail')
}

// 右侧工具按钮事件
function toggleStriped() {
  emit('update:striped', !props.striped)
}

function toggleBordered() {
  emit('update:bordered', !props.bordered)
}

function handleRefresh() {
  emit('refresh')
}

function handleSizeChange(key) {
  emit('update:size', key)
}

function handleCheckAllColumns(checked) {
  if (checked) {
    emit('update:hiddenColumns', [])
  }
  else {
    const allKeys = props.columns.map(col => col.key)
    emit('update:hiddenColumns', allKeys)
  }
}

function handleColumnToggle(key, checked) {
  const newHiddenColumns = [...props.hiddenColumns]
  if (checked) {
    // 显示列
    const index = newHiddenColumns.indexOf(key)
    if (index > -1) {
      newHiddenColumns.splice(index, 1)
    }
  }
  else {
    // 隐藏列
    if (!newHiddenColumns.includes(key)) {
      newHiddenColumns.push(key)
    }
  }
  emit('update:hiddenColumns', newHiddenColumns)
}

function toggleFullscreen() {
  emit('fullscreenChange', !props.fullscreen)
}
</script>

<style scoped lang="scss">
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--n-color);
  border-radius: 6px 6px 0 0;
  border-bottom: 1px solid var(--n-border-color);
  min-height: 52px;

  .toolbar-left {
    flex: 1;
    min-width: 0;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 16px;
    padding-left: 16px;
    border-left: 1px solid var(--n-border-color);
  }

  // 当没有左侧内容时
  &.no-left-content {
    justify-content: flex-end;

    .toolbar-right {
      margin-left: 0;
      padding-left: 0;
      border-left: none;
    }
  }
}

// 工具栏按钮样式
.toolbar-btn {
  min-width: 32px;
  min-height: 32px;
  padding: 4px 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

// 工具栏图标样式
.toolbar-icon {
  width: 18px;
  height: 18px;
  font-size: 18px;
  display: inline-block;
}

.column-settings {
  .column-settings-header {
    padding: 4px 0;
  }

  .column-settings-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .column-settings-item {
    padding: 6px 0;

    &:hover {
      background-color: var(--n-item-color-hover);
    }
  }
}
</style>
