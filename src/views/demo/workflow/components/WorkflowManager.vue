<template>
  <n-drawer v-model:show="visible" :width="480" placement="left">
    <n-drawer-content title="工作流管理">
      <template #header-extra>
        <n-button size="small" tertiary @click="loadWorkflows">
          <template #icon>
            <h-icon name="ri-refresh-line" />
          </template>
        </n-button>
      </template>

      <n-tabs v-model:value="activeTab" type="line">
        <!-- 已保存的工作流 -->
        <n-tab-pane name="saved" tab="已保存">
          <n-space vertical :size="12">
            <n-input
              v-model:value="searchText"
              placeholder="搜索工作流..."
              clearable
            >
              <template #prefix>
                <h-icon name="ri-search-line" />
              </template>
            </n-input>

            <n-empty
              v-if="filteredWorkflows.length === 0"
              description="暂无保存的工作流"
              size="small"
            />

            <n-list v-else bordered hoverable clickable>
              <n-list-item
                v-for="workflow in filteredWorkflows"
                :key="workflow.id"
              >
                <template #prefix>
                  <h-icon name="ri-file-list-3-line" size="20" />
                </template>

                <n-thing :title="workflow.name">
                  <template #description>
                    <n-space vertical :size="4">
                      <n-text depth="3" style="font-size: 12px">
                        创建: {{ formatDate(workflow.createdAt) }}
                      </n-text>
                      <n-text depth="3" style="font-size: 12px">
                        更新: {{ formatDate(workflow.updatedAt) }}
                      </n-text>
                      <n-text depth="3" style="font-size: 12px">
                        节点数: {{ workflow.nodes?.length || 0 }} |
                        连线数: {{ workflow.edges?.length || 0 }}
                      </n-text>
                    </n-space>
                  </template>
                </n-thing>

                <template #suffix>
                  <n-space>
                    <n-button size="tiny" @click="loadWorkflow(workflow)">
                      加载
                    </n-button>
                    <n-button
                      size="tiny"
                      type="error"
                      quaternary
                      @click="deleteWorkflow(workflow.id)"
                    >
                      <template #icon>
                        <h-icon name="ri-delete-bin-line" />
                      </template>
                    </n-button>
                  </n-space>
                </template>
              </n-list-item>
            </n-list>

            <n-space vertical :size="8">
              <n-divider />
              <n-text depth="3" style="font-size: 12px">
                共 {{ workflows.length }} 个工作流
              </n-text>
            </n-space>
          </n-space>
        </n-tab-pane>

        <!-- 执行历史 -->
        <n-tab-pane name="history" tab="执行历史">
          <n-space vertical :size="12">
            <n-empty
              v-if="historyList.length === 0"
              description="暂无执行历史"
              size="small"
            />

            <n-list v-else bordered>
              <n-list-item
                v-for="history in historyList"
                :key="history.id"
              >
                <template #prefix>
                  <h-icon
                    :name="history.status === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'"
                    :color="history.status === 'success' ? '#10b981' : '#ef4444'"
                    size="20"
                  />
                </template>

                <n-thing :title="history.workflowName || '未命名工作流'">
                  <template #description>
                    <n-space vertical :size="4">
                      <n-text depth="3" style="font-size: 12px">
                        执行时间: {{ formatDate(history.executedAt) }}
                      </n-text>
                      <n-text depth="3" style="font-size: 12px">
                        总耗时: {{ history.duration }}ms
                      </n-text>
                      <n-text depth="3" style="font-size: 12px">
                        节点数: {{ history.logs?.length || 0 }}
                      </n-text>
                    </n-space>
                  </template>
                </n-thing>

                <template #suffix>
                  <n-space>
                    <n-button size="tiny" @click="viewHistory(history)">
                      查看
                    </n-button>
                    <n-button
                      size="tiny"
                      type="error"
                      quaternary
                      @click="deleteHistory(history.id)"
                    >
                      <template #icon>
                        <h-icon name="ri-delete-bin-line" />
                      </template>
                    </n-button>
                  </n-space>
                </template>
              </n-list-item>
            </n-list>

            <n-space vertical :size="8">
              <n-divider />
              <n-space justify="space-between">
                <n-text depth="3" style="font-size: 12px">
                  共 {{ historyList.length }} 条记录
                </n-text>
                <n-button
                  v-if="historyList.length > 0"
                  size="tiny"
                  type="error"
                  quaternary
                  @click="clearHistory"
                >
                  清空历史
                </n-button>
              </n-space>
            </n-space>
          </n-space>
        </n-tab-pane>

        <!-- 统计信息 -->
        <n-tab-pane name="stats" tab="统计">
          <n-space vertical :size="16">
            <n-card size="small" title="存储统计">
              <n-space vertical :size="12">
                <n-statistic label="工作流数量" :value="stats.workflows || 0" />
                <n-statistic label="执行历史" :value="stats.execution_history || 0" />
                <n-statistic label="自定义模板" :value="stats.templates || 0" />
              </n-space>
            </n-card>

            <n-card size="small" title="数据管理">
              <n-space vertical :size="12">
                <n-button
                  block
                  @click="exportAllData"
                >
                  <template #icon>
                    <h-icon name="ri-download-line" />
                  </template>
                  导出所有数据
                </n-button>

                <n-button
                  block
                  type="warning"
                  @click="confirmClearAll"
                >
                  <template #icon>
                    <h-icon name="ri-delete-bin-line" />
                  </template>
                  清空所有数据
                </n-button>
              </n-space>
            </n-card>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup>
import { workflowStorage } from '../utils/storage'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:show', 'load-workflow', 'view-history'])

const visible = computed({
  get: () => props.show,
  set: val => emit('update:show', val),
})

// 状态
const activeTab = ref('saved')
const searchText = ref('')
const workflows = ref([])
const historyList = ref([])
const stats = ref({})

// 计算属性
const filteredWorkflows = computed(() => {
  if (!searchText.value) {
    return workflows.value
  }
  const keyword = searchText.value.toLowerCase()
  return workflows.value.filter(w =>
    w.name?.toLowerCase().includes(keyword) ||
    w.description?.toLowerCase().includes(keyword),
  )
})

// 方法
async function loadWorkflows() {
  try {
    workflows.value = await workflowStorage.getAllWorkflows()
  }
  catch (error) {
    console.error('[WorkflowManager] 加载工作流失败:', error)
    window.$message?.error('加载工作流失败')
  }
}

async function loadHistory() {
  try {
    historyList.value = await workflowStorage.getAllHistory()
  }
  catch (error) {
    console.error('[WorkflowManager] 加载历史失败:', error)
    window.$message?.error('加载历史失败')
  }
}

async function loadStats() {
  try {
    stats.value = await workflowStorage.getStats()
  }
  catch (error) {
    console.error('[WorkflowManager] 加载统计失败:', error)
  }
}

function loadWorkflow(workflow) {
  emit('load-workflow', workflow)
  visible.value = false
}

async function deleteWorkflow(id) {
  window.$dialog?.warning({
    title: '确认删除',
    content: '确定要删除这个工作流吗？此操作不可恢复。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await workflowStorage.deleteWorkflow(id)
        await loadWorkflows()
        window.$message?.success('删除成功')
      }
      catch (error) {
        console.error('[WorkflowManager] 删除失败:', error)
        window.$message?.error('删除失败')
      }
    },
  })
}

function viewHistory(history) {
  emit('view-history', history)
}

async function deleteHistory(id) {
  try {
    await workflowStorage.deleteHistory(id)
    await loadHistory()
    window.$message?.success('删除成功')
  }
  catch (error) {
    console.error('[WorkflowManager] 删除历史失败:', error)
    window.$message?.error('删除失败')
  }
}

async function clearHistory() {
  window.$dialog?.warning({
    title: '确认清空',
    content: '确定要清空所有执行历史吗？此操作不可恢复。',
    positiveText: '清空',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        // 删除所有历史记录
        for (const history of historyList.value) {
          await workflowStorage.deleteHistory(history.id)
        }
        await loadHistory()
        window.$message?.success('清空成功')
      }
      catch (error) {
        console.error('[WorkflowManager] 清空历史失败:', error)
        window.$message?.error('清空失败')
      }
    },
  })
}

async function exportAllData() {
  try {
    const allWorkflows = await workflowStorage.getAllWorkflows()
    const allHistory = await workflowStorage.getAllHistory()
    const allTemplates = await workflowStorage.getAllTemplates()

    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      workflows: allWorkflows,
      history: allHistory,
      templates: allTemplates,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workflow_backup_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    window.$message?.success('导出成功')
  }
  catch (error) {
    console.error('[WorkflowManager] 导出失败:', error)
    window.$message?.error('导出失败')
  }
}

function confirmClearAll() {
  window.$dialog?.error({
    title: '危险操作',
    content: '确定要清空所有数据吗？包括工作流、执行历史和模板。此操作不可恢复！',
    positiveText: '确定清空',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await workflowStorage.clearAll()
        await loadWorkflows()
        await loadHistory()
        await loadStats()
        window.$message?.success('已清空所有数据')
      }
      catch (error) {
        console.error('[WorkflowManager] 清空数据失败:', error)
        window.$message?.error('清空失败')
      }
    },
  })
}

function formatDate(dateStr) {
  if (!dateStr)
    return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 监听面板打开/关闭
watch(visible, async (newVal) => {
  if (newVal) {
    await Promise.all([
      loadWorkflows(),
      loadHistory(),
      loadStats(),
    ])
  }
})
</script>

<style scoped>
.n-list-item {
  padding: 12px;
}
</style>

