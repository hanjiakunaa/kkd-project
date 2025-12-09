<template>
  <div class="execution-result-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <h-icon name="ri-file-list-3-line" />
        执行日志
      </h3>
      <n-space>
        <n-button size="small" quaternary @click="copyAllLogs">
          <template #icon>
            <h-icon name="ri-file-copy-line" />
          </template>
          复制全部
        </n-button>
        <n-button size="small" quaternary @click="clearLogs">
          <template #icon>
            <h-icon name="ri-delete-bin-line" />
          </template>
          清空
        </n-button>
        <n-button size="small" quaternary @click="$emit('close')">
          <template #icon>
            <h-icon name="ri-close-line" />
          </template>
        </n-button>
      </n-space>
    </div>

    <div class="panel-body">
      <n-scrollbar class="logs-scrollbar">
        <div v-if="logs.length === 0" class="empty-state">
          <h-icon name="ri-inbox-line" size="48" />
          <p>暂无执行记录</p>
          <p class="hint">点击"运行并生成MD"开始执行工作流</p>
        </div>

        <div v-else class="logs-timeline">
          <div
            v-for="(log, index) in logs"
            :key="log.id"
            class="log-item"
            :class="`log-type-${log.type}`"
          >
            <!-- 时间线节点 -->
            <div class="timeline-node">
              <div class="timeline-dot" />
              <div v-if="index < logs.length - 1" class="timeline-line" />
            </div>

            <!-- 日志内容 -->
            <div class="log-content">
              <div class="log-header">
                <n-space align="center">
                  <h-icon :name="getNodeIcon(log.type)" :style="{ color: getNodeColor(log.type) }" />
                  <span class="log-title">{{ log.title }}</span>
                  <n-tag :type="getNodeTagType(log.type)" size="small" round>
                    {{ log.type }}
                  </n-tag>
                </n-space>
                <span class="log-time">{{ log.startTime }}</span>
              </div>

              <!-- 参数信息 -->
              <div v-if="log.params && Object.keys(log.params).length > 0" class="log-params">
                <div class="section-label">
                  <h-icon name="ri-settings-3-line" />
                  参数
                </div>
                <div class="params-grid">
                  <div v-for="(value, key) in log.params" :key="key" class="param-item">
                    <span class="param-key">{{ key }}:</span>
                    <span class="param-value">{{ value }}</span>
                  </div>
                </div>
              </div>

              <!-- 输入内容 -->
              <div v-if="log.input" class="log-section">
                <div class="section-label">
                  <h-icon name="ri-arrow-down-circle-line" />
                  输入
                  <n-button
                    size="tiny"
                    text
                    @click="copyText(log.input)"
                  >
                    <h-icon name="ri-file-copy-line" />
                  </n-button>
                </div>
                <div class="section-content input-content">
                  {{ log.input }}
                </div>
              </div>

              <!-- 输出内容 -->
              <div v-if="log.output" class="log-section">
                <div class="section-label">
                  <h-icon name="ri-arrow-up-circle-line" />
                  输出
                  <n-button
                    size="tiny"
                    text
                    @click="copyText(log.output)"
                  >
                    <h-icon name="ri-file-copy-line" />
                  </n-button>
                  <n-button
                    size="tiny"
                    text
                    @click="expandedLogs[log.id] = !expandedLogs[log.id]"
                  >
                    <h-icon :name="expandedLogs[log.id] ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'" />
                  </n-button>
                </div>
                <div
                  class="section-content output-content"
                  :class="{ expanded: expandedLogs[log.id] }"
                >
                  <!-- 检测是否是图片 -->
                  <template v-if="isImageMarkdown(log.output)">
                    <img :src="extractImageUrl(log.output)" alt="生成的图片" class="output-image">
                  </template>
                  <!-- 普通文本 -->
                  <template v-else>
                    <div class="output-text">{{ log.output }}</div>
                  </template>
                </div>
              </div>

              <!-- 耗时统计 -->
              <div v-if="log.duration" class="log-footer">
                <n-space size="small">
                  <n-tag size="tiny" :bordered="false">
                    <template #icon>
                      <h-icon name="ri-time-line" />
                    </template>
                    耗时: {{ log.duration }}ms
                  </n-tag>
                </n-space>
              </div>
            </div>
          </div>
        </div>
      </n-scrollbar>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'clear'])

const expandedLogs = reactive({})

// 节点类型图标映射
const nodeIconMap = {
  'input-node': 'ri-login-circle-line',
  'llm-node': 'ri-robot-line',
  'image-gen-node': 'ri-image-line',
  'tool-node': 'ri-tools-line',
  'branch-node': 'ri-git-branch-line',
  'group-node': 'ri-folder-line',
  'output-node': 'ri-logout-circle-line',
}

// 节点类型颜色映射
const nodeColorMap = {
  'input-node': '#059669',
  'llm-node': '#2563eb',
  'image-gen-node': '#db2777',
  'tool-node': '#7c3aed',
  'branch-node': '#d97706',
  'group-node': '#6b7280',
  'output-node': '#10b981',
}

// 节点类型标签类型映射
const nodeTagTypeMap = {
  'input-node': 'success',
  'llm-node': 'info',
  'image-gen-node': 'error',
  'tool-node': 'warning',
  'branch-node': 'warning',
  'group-node': 'default',
  'output-node': 'success',
}

function getNodeIcon(type) {
  return nodeIconMap[type] || 'ri-apps-line'
}

function getNodeColor(type) {
  return nodeColorMap[type] || '#6b7280'
}

function getNodeTagType(type) {
  return nodeTagTypeMap[type] || 'default'
}

// 检测是否是图片 Markdown
function isImageMarkdown(text) {
  return /!\[.*?\]\(.*?\)/.test(text)
}

// 提取图片 URL
function extractImageUrl(text) {
  const match = text.match(/!\[.*?\]\((.*?)\)/)
  return match ? match[1] : ''
}

// 复制文本
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    window.$message?.success('已复制到剪贴板')
  }).catch(() => {
    window.$message?.error('复制失败')
  })
}

// 复制所有日志
function copyAllLogs() {
  const allText = props.logs.map((log) => {
    let text = `[${log.startTime}] ${log.title} (${log.type})\n`
    if (log.params && Object.keys(log.params).length > 0) {
      text += '参数: ' + JSON.stringify(log.params, null, 2) + '\n'
    }
    if (log.input)
      text += '输入:\n' + log.input + '\n'
    if (log.output)
      text += '输出:\n' + log.output + '\n'
    text += '---\n'
    return text
  }).join('\n')

  copyText(allText)
}

// 清空日志
function clearLogs() {
  emit('clear')
}

// 自动展开最新的日志
watch(() => props.logs.length, (newLen, oldLen) => {
  if (newLen > oldLen && props.logs[newLen - 1]) {
    const lastLog = props.logs[newLen - 1]
    expandedLogs[lastLog.id] = true
  }
})
</script>

<style scoped>
.execution-result-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.panel-body {
  flex: 1;
  overflow: hidden;
}

.logs-scrollbar {
  height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
  text-align: center;
}

.empty-state p {
  margin: 8px 0;
  font-size: 14px;
}

.empty-state .hint {
  font-size: 12px;
  color: #d1d5db;
}

.logs-timeline {
  padding: 20px;
}

.log-item {
  position: relative;
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.log-item:last-child {
  margin-bottom: 0;
}

.timeline-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid #dbeafe;
  z-index: 1;
}

.log-type-input-node .timeline-dot {
  background: #059669;
  border-color: #d1fae5;
}

.log-type-llm-node .timeline-dot {
  background: #2563eb;
  border-color: #dbeafe;
}

.log-type-image-gen-node .timeline-dot {
  background: #db2777;
  border-color: #fce7f3;
}

.log-type-output-node .timeline-dot {
  background: #10b981;
  border-color: #d1fae5;
}

.timeline-line {
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: #e5e7eb;
  margin-top: 4px;
}

.log-content {
  flex: 1;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s ease;
}

.log-content:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.log-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.log-time {
  font-size: 12px;
  color: #9ca3af;
}

.log-params {
  margin-bottom: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.param-item {
  font-size: 12px;
}

.param-key {
  font-weight: 600;
  color: #6b7280;
  margin-right: 4px;
}

.param-value {
  color: #374151;
}

.log-section {
  margin-bottom: 12px;
}

.log-section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.section-content {
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
}

.input-content {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  white-space: pre-wrap;
  word-break: break-word;
}

.output-content {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  max-height: 300px;
  overflow-y: auto;
  position: relative;
  transition: max-height 0.3s ease;
}

.output-content.expanded {
  max-height: 800px;
  overflow-y: auto;
}

/* 美化滚动条 */
.output-content::-webkit-scrollbar {
  width: 6px;
}

.output-content::-webkit-scrollbar-track {
  background: #dcfce7;
  border-radius: 3px;
}

.output-content::-webkit-scrollbar-thumb {
  background: #86efac;
  border-radius: 3px;
}

.output-content::-webkit-scrollbar-thumb:hover {
  background: #4ade80;
}

.output-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.output-image {
  max-width: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.log-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
}
</style>

