<template>
  <div class="workflow-container">
    <!-- 顶部工具栏 -->
    <div class="viewer-toolbar">
      <div class="toolbar-left">
        <n-button size="small" tertiary @click="managerOpen = true">
          <template #icon>
            <h-icon name="ri-folder-line" />
          </template>
          工作流管理
        </n-button>
        <div class="toolbar-divider" />
        <n-button size="small" tertiary @click="templateOpen = true">
          <template #icon>
            <h-icon name="hi-template" />
          </template>
          模板库
        </n-button>
        <div class="toolbar-divider" />
        <n-button size="small" tertiary @click="paletteOpen = true">
          <template #icon>
            <h-icon name="ri-add-circle-line" />
          </template>
          添加节点
        </n-button>
        <div class="toolbar-divider" />
        <n-button size="small" tertiary @click="handleFit">
          <template #icon>
            <h-icon name="bi-view-list" />
          </template>
          适配视图
        </n-button>
        <n-button size="small" tertiary :loading="isRunning" :disabled="isRunning" @click="runWorkflow">
          <template #icon>
            <h-icon name="ri-play-circle-line" />
          </template>
          {{ isRunning ? '运行中...' : '运行工作流' }}
        </n-button>
      </div>
      <div class="toolbar-right">
        <n-button size="small" tertiary @click="showSaveDialog">
          <template #icon>
            <h-icon name="hi-save-as" />
          </template>
          保存工作流
        </n-button>
        <div class="toolbar-divider" />
        <n-button size="small" quaternary @click="settingsOpen = true">
          <template #icon>
            <h-icon name="ri-settings-3-line" />
          </template>
        </n-button>
        <n-button size="small" quaternary @click="openExport">
          <template #icon>
            <h-icon name="ri-download-line" />
          </template>
        </n-button>
        <n-button size="small" quaternary @click="openImport">
          <template #icon>
            <h-icon name="ri-upload-line" />
          </template>
        </n-button>
        <n-button size="small" quaternary @click="handleClose">
          <template #icon>
            <h-icon name="fa-compress" />
          </template>
        </n-button>
      </div>
    </div>

    <!-- 流程图画布 -->
    <vue-flow
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ zoom: 0.6 }"
      :max-zoom="1.5"
      :min-zoom="0.2"
      :nodes-draggable="true"
      :nodes-connectable="true"
      @pane-ready="handlePaneReady"
      @connect="onConnect"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
      @node-drag-stop="alignLinear"
    >
      <background :gap="15" :size="1" pattern-color="#BDBDBD" />
      <template #node-special="props">
        <special-node v-bind="props" />
      </template>
      <template #edge-special="props">
        <special-edge v-bind="props" />
      </template>
    </vue-flow>

    <!-- 工作流管理面板 -->
    <workflow-manager :show="managerOpen" @update:show="managerOpen = $event" @load-workflow="loadSavedWorkflow" @view-history="viewHistory" />

    <!-- 模板库面板 -->
    <template-gallery :show="templateOpen" @update:show="templateOpen = $event" @load-template="loadTemplate" />

    <!-- 节点库面板 -->
    <node-palette :show="paletteOpen" @update:show="paletteOpen = $event" @add-node="addNode" />

    <!-- 服务商配置面板 -->
    <provider-settings v-model="providerConfig" :show="settingsOpen" @update:show="settingsOpen = $event" @save="saveProviderConfig" />

    <!-- 属性面板 -->
    <n-drawer v-model:show="inspectorOpen" :width="380" placement="right">
      <n-drawer-content title="节点属性">
        <n-form v-if="selectedNode" label-placement="top">
          <n-form-item label="标题">
            <n-input v-model:value="selectedNode.data.title" />
          </n-form-item>
          <n-form-item label="描述">
            <n-input v-model:value="selectedNode.data.description" type="textarea" :rows="2" />
          </n-form-item>

          <!-- LLM 节点配置 -->
          <template v-if="selectedNode.data.type === 'llm-node'">
            <n-form-item label="AI 服务商">
              <n-select
                v-model:value="selectedNode.data.params.provider"
                :options="chatProviders"
                @update:value="onProviderChange"
              />
            </n-form-item>
            <n-form-item label="模型">
              <n-select
                v-model:value="selectedNode.data.params.model"
                :options="getCurrentModels('chat')"
              />
            </n-form-item>
            <n-form-item label="温度">
              <n-slider v-model:value="selectedNode.data.params.temperature" :min="0" :max="2" :step="0.1" />
              <span class="param-value">{{ selectedNode.data.params.temperature }}</span>
            </n-form-item>
            <n-form-item label="系统提示词">
              <n-input
                v-model:value="selectedNode.data.params.systemPrompt"
                type="textarea"
                :rows="3"
                placeholder="你是一个有用的助手。"
              />
            </n-form-item>
          </template>

          <!-- 图片生成节点配置 -->
          <template v-if="selectedNode.data.type === 'image-gen-node'">
            <n-form-item label="AI 服务商">
              <n-select
                v-model:value="selectedNode.data.params.provider"
                :options="imageProviders"
                @update:value="onProviderChange"
              />
            </n-form-item>
            <n-form-item label="模型">
              <n-select
                v-model:value="selectedNode.data.params.model"
                :options="getCurrentModels('image')"
              />
            </n-form-item>
            <n-form-item label="尺寸">
              <n-select
                v-model:value="selectedNode.data.params.size"
                :options="imageSizes"
              />
            </n-form-item>
          </template>

          <!-- 视频生成节点配置 -->
          <template v-if="selectedNode.data.type === 'video-gen-node'">
            <n-form-item label="AI 服务商">
              <n-select
                v-model:value="selectedNode.data.params.provider"
                :options="videoProviders"
                @update:value="onProviderChange"
              />
            </n-form-item>
            <n-form-item label="模型">
              <n-select
                v-model:value="selectedNode.data.params.model"
                :options="getCurrentModels('video')"
              />
            </n-form-item>
            <n-form-item label="时长 (秒)">
              <n-input-number v-model:value="selectedNode.data.params.duration" :min="1" :max="30" />
            </n-form-item>
            <n-form-item label="分辨率">
              <n-select
                v-model:value="selectedNode.data.params.resolution"
                :options="videoResolutions"
              />
            </n-form-item>
          </template>

          <!-- 删除节点按钮 -->
          <n-button type="error" block @click="deleteNode">
            <template #icon>
              <h-icon name="ri-delete-bin-line" />
            </template>
            删除节点
          </n-button>
        </n-form>
      </n-drawer-content>
    </n-drawer>

    <!-- 导入导出面板 -->
    <n-drawer v-model:show="exportOpen" :height="280" placement="bottom">
      <n-drawer-content title="导出工作流">
        <n-input v-model:value="exportText" type="textarea" :rows="8" readonly />
        <template #footer>
          <n-button @click="copyExportText">
            复制到剪贴板
          </n-button>
        </template>
      </n-drawer-content>
    </n-drawer>

    <n-drawer v-model:show="importOpen" :height="280" placement="bottom">
      <n-drawer-content title="导入工作流">
        <n-input v-model:value="importText" type="textarea" :rows="8" placeholder="粘贴工作流 JSON..." />
        <template #footer>
          <n-button type="primary" @click="applyImport">
            导入
          </n-button>
        </template>
      </n-drawer-content>
    </n-drawer>

    <!-- 执行日志面板 -->
    <n-drawer v-model:show="logsOpen" :width="480" placement="right">
      <n-drawer-content title="执行日志">
        <n-timeline>
          <n-timeline-item
            v-for="log in executionLogs"
            :key="log.id"
            :type="log.error ? 'error' : 'success'"
            :title="`${log.title} (${log.type})`"
            :time="log.startTime"
          >
            <div class="log-content">
              <div v-if="log.params" class="log-params">
                <strong>参数:</strong> {{ JSON.stringify(log.params) }}
              </div>
              <div class="log-input">
                <strong>输入:</strong> {{ truncate(String(log.input), 100) }}
              </div>
              <div v-if="log.output" class="log-output">
                <strong>输出:</strong> {{ truncate(String(log.output), 100) }}
              </div>
              <div v-if="log.error" class="log-error">
                <strong>错误:</strong> {{ log.error }}
              </div>
              <div class="log-duration">
                <strong>耗时:</strong> {{ log.duration }}ms
              </div>
            </div>
          </n-timeline-item>
        </n-timeline>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup>
import { Background } from '@vue-flow/background'
import { VueFlow } from '@vue-flow/core'
import { useEventListener } from '@vueuse/core'
import NodePalette from './components/NodePalette.vue'
import ProviderSettings from './components/ProviderSettings.vue'
import SpecialEdge from './components/SpecialEdge.vue'
import SpecialNode from './components/SpecialNode.vue'
import TemplateGallery from './components/TemplateGallery.vue'
import WorkflowManager from './components/WorkflowManager.vue'
import { getModels } from './config/models'
import { getNodeConfig } from './config/node-types'
import { AI_PROVIDERS, getProvidersByCapability } from './config/providers'
import { WorkflowExecutor } from './engine/executor'
import { workflowStorage } from './utils/storage'

const router = useRouter()

// ==================== 状态管理 ====================
const vueFlowInstance = ref(null)
const idSeed = ref(4)
const nodes = ref([
  {
    id: '1',
    type: 'special',
    position: { x: 120, y: 180 },
    data: getNodeConfig('input-node'),
  },
  {
    id: '2',
    type: 'special',
    position: { x: 380, y: 180 },
    data: getNodeConfig('llm-node'),
  },
  {
    id: '3',
    type: 'special',
    position: { x: 640, y: 180 },
    data: getNodeConfig('output-node'),
  },
])

const edges = ref([
  {
    id: 'e1->2',
    type: 'special',
    source: '1',
    target: '2',
    sourceHandle: 'out',
    targetHandle: 'in',
    data: { label: '', status: 'default' },
  },
  {
    id: 'e2->3',
    type: 'special',
    source: '2',
    target: '3',
    sourceHandle: 'out',
    targetHandle: 'in',
    data: { label: '', status: 'default' },
  },
])

// 面板状态
const managerOpen = ref(false)
const templateOpen = ref(false)
const paletteOpen = ref(false)
const settingsOpen = ref(false)
const inspectorOpen = ref(false)
const exportOpen = ref(false)
const importOpen = ref(false)
const logsOpen = ref(false)

// 当前工作流信息
const currentWorkflow = ref({
  id: null,
  name: '未命名工作流',
  description: '',
})

// 选中的节点/边
const selectedNodeId = ref(null)
const selectedNode = computed(() => nodes.value.find(n => n.id === selectedNodeId.value))

// 执行状态
const isRunning = ref(false)
const executionLogs = ref([])
const executor = new WorkflowExecutor()

// 服务商配置
const providerConfig = ref({
  apiKeys: {},
  baseUrls: {},
})

// 从 localStorage 加载配置
function loadProviderConfig() {
  const apiKeys = {}
  const baseUrls = {}

  Object.keys(AI_PROVIDERS).forEach((providerId) => {
    const savedKey = localStorage.getItem(`wf_api_key_${providerId}`)
    const savedUrl = localStorage.getItem(`wf_base_url_${providerId}`)

    if (savedKey) {
      apiKeys[providerId] = savedKey
    }
    if (savedUrl) {
      baseUrls[providerId] = savedUrl
    }
  })

  providerConfig.value = { apiKeys, baseUrls }

  // 调试日志
  const configuredProviders = Object.keys(apiKeys)
  if (configuredProviders.length > 0) {
    console.log('[Workflow] 已加载配置的服务商:', configuredProviders)
  }
  else {
    console.warn('[Workflow] 未找到任何服务商配置，请在设置中配置 API Key')
  }
}

// 组件挂载时加载配置
onMounted(() => {
  loadProviderConfig()
})

// 导入导出
const exportText = ref('')
const importText = ref('')

// ==================== 计算属性 ====================
const chatProviders = computed(() => {
  return getProvidersByCapability('supportsChat').map(p => ({
    label: p.name,
    value: p.id,
  }))
})

const imageProviders = computed(() => {
  return getProvidersByCapability('supportsImage').map(p => ({
    label: p.name,
    value: p.id,
  }))
})

const videoProviders = computed(() => {
  return getProvidersByCapability('supportsVideo').map(p => ({
    label: p.name,
    value: p.id,
  }))
})

const imageSizes = [
  { label: '1024x1024', value: '1024x1024' },
  { label: '1024x1792 (竖图)', value: '1024x1792' },
  { label: '1792x1024 (横图)', value: '1792x1024' },
  { label: '768x1024', value: '768x1024' },
  { label: '1024x768', value: '1024x768' },
]

const videoResolutions = [
  { label: '720p', value: '720p' },
  { label: '1080p', value: '1080p' },
]

// ==================== 方法 ====================
function getCurrentModels(type) {
  if (!selectedNode.value)
    return []
  const provider = selectedNode.value.data.params.provider
  if (!provider)
    return []
  return getModels(provider, type).map(m => ({
    label: m.label,
    value: m.value,
  }))
}

function onProviderChange() {
  // 重置模型选择
  if (selectedNode.value) {
    const type = selectedNode.value.data.type
    const models = getCurrentModels(
      type === 'llm-node' ? 'chat' : type === 'image-gen-node' ? 'image' : 'video',
    )
    if (models.length > 0) {
      selectedNode.value.data.params.model = models[0].value
    }
  }
}

function handlePaneReady(instance) {
  vueFlowInstance.value = instance
  nextTick(() => {
    instance.fitView()
  })
}

function handleFit() {
  vueFlowInstance.value?.fitView()
}

function handleClose() {
  router.back()
}

function onConnect(conn) {
  if (conn.source === conn.target)
    return

  edges.value.push({
    id: `e${conn.source}->${conn.target}`,
    type: 'special',
    source: conn.source,
    target: conn.target,
    sourceHandle: conn.sourceHandle || 'out',
    targetHandle: conn.targetHandle || 'in',
    data: { label: '', status: 'default' },
  })
}

function onNodeClick({ node }) {
  selectedNodeId.value = node.id
  inspectorOpen.value = true
}

function onEdgeClick() {
  // 可以添加边的属性编辑
}

function addNode(type) {
  const id = String(idSeed.value++)
  const lastNode = nodes.value[nodes.value.length - 1]
  const position = {
    x: lastNode ? lastNode.position.x + 260 : 120,
    y: lastNode ? lastNode.position.y : 180,
  }

  const node = {
    id,
    type: 'special',
    position,
    data: getNodeConfig(type),
  }

  nodes.value.push(node)

  // 自动连接到最后一个节点
  if (lastNode) {
    edges.value.push({
      id: `e${lastNode.id}->${id}`,
      type: 'special',
      source: lastNode.id,
      target: id,
      sourceHandle: 'out',
      targetHandle: 'in',
      data: { label: '', status: 'default' },
    })
  }

  nextTick(() => {
    vueFlowInstance.value?.fitView()
  })
}

function deleteNode() {
  if (!selectedNode.value)
    return

  const nodeId = selectedNode.value.id
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
  selectedNodeId.value = null
  inspectorOpen.value = false
}

// 加载模板
function loadTemplate(template) {
  if (!template || !template.workflow) {
    window.$message?.error('无效的模板数据')
    return
  }

  // 确认是否替换当前工作流
  if (nodes.value.length > 3 || edges.value.length > 2) {
    window.$dialog?.warning({
      title: '确认加载模板',
      content: '加载模板将替换当前工作流，是否继续？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        applyTemplate(template)
      },
    })
  }
  else {
    applyTemplate(template)
  }
}

// 应用模板到画布
function applyTemplate(template) {
  const { nodes: templateNodes, edges: templateEdges } = template.workflow

  // 转换节点格式
  const newNodes = templateNodes.map((node) => {
    // 将模板中的简化类型转换为系统类型
    const systemType = convertTemplateTypeToSystemType(node.type)

    // 获取默认配置作为基础
    const defaultConfig = getNodeConfig(systemType) || {}

    // 合并配置：优先使用模板中的配置，缺失的使用默认配置
    const nodeData = {
      type: systemType, // 使用系统节点类型
      title: node.data.label || node.data.title || defaultConfig.title || '未命名节点',
      description: node.data.description || defaultConfig.description || '',
      icon: defaultConfig.icon || getNodeTypeIcon(node.type),
      params: {
        ...defaultConfig.params, // 先应用默认参数
        ...node.data.params, // 再应用模板参数（覆盖默认值）
      },
      variables: node.data.variables || {},
      status: 'idle',
    }

    return {
      id: node.id,
      type: 'special', // 使用统一的 special 节点类型
      position: node.position,
      data: nodeData,
    }
  })

  // 转换连线格式
  const newEdges = templateEdges.map((edge) => {
    return {
      id: edge.id,
      type: 'special', // 使用统一的 special 边类型
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'out',
      targetHandle: edge.targetHandle || 'in',
      data: edge.data || { label: '', status: 'default' },
    }
  })

  // 替换当前工作流
  nodes.value = newNodes
  edges.value = newEdges

  // 更新 ID 种子
  const maxId = Math.max(...newNodes.map(n => Number.parseInt(n.id) || 0))
  idSeed.value = maxId + 1

  // 适配视图
  nextTick(() => {
    handleFit()
  })
}

// 将模板类型转换为系统类型
function convertTemplateTypeToSystemType(templateType) {
  const typeMap = {
    'input': 'input-node',
    'output': 'output-node',
    'llm': 'llm-node',
    'image-gen': 'image-gen-node',
    'video-gen': 'video-gen-node',
    'audio-gen': 'audio-gen-node',
    'text-process': 'text-process-node',
    'merge': 'merge-node',
    'condition': 'condition-node',
  }
  return typeMap[templateType] || `${templateType}-node`
}

// 获取节点类型图标
function getNodeTypeIcon(type) {
  const iconMap = {
    'input': 'ri-input-method-line',
    'output': 'ri-printer-line',
    'llm': 'ri-robot-line',
    'image-gen': 'ri-image-add-line',
    'video-gen': 'ri-video-add-line',
    'audio-gen': 'ri-mic-line',
    'text-process': 'ri-text-wrap',
    'merge': 'ri-merge-cells-horizontal',
    'condition': 'ri-git-branch-line',
  }
  return iconMap[type] || 'ri-node-tree'
}

function alignLinear() {
  // 简单的线性布局
  const baseY = 180
  const spacing = 260
  nodes.value.forEach((node, index) => {
    if (!node.parentNode) {
      node.position = { x: 120 + index * spacing, y: baseY }
    }
  })
}

// 运行工作流
async function runWorkflow() {
  if (isRunning.value)
    return

  isRunning.value = true
  executionLogs.value = []

  try {
    // 重置状态
    nodes.value.forEach(n => (n.data.status = 'ready'))
    edges.value.forEach(e => (e.data.status = 'default'))

    // 创建执行上下文
    const context = {
      apiKeys: providerConfig.value.apiKeys,
      baseUrls: providerConfig.value.baseUrls,
      defaultInput: '你好，请介绍一下你自己。',
      strictMode: false,
      getApiKey: (provider) => {
        const key = providerConfig.value.apiKeys[provider]
        if (!key) {
          console.warn(`[Workflow] 未找到 ${provider} 的 API Key，请在设置中配置`)
        }
        return key
      },
      getBaseUrl: (provider) => {
        const url = providerConfig.value.baseUrls[provider]
        if (!url) {
          console.warn(`[Workflow] 未找到 ${provider} 的 Base URL，将使用默认值`)
        }
        return url
      },
    }

    // 调试日志：输出当前配置
    console.log('[Workflow] 执行上下文配置:', {
      apiKeys: Object.keys(context.apiKeys),
      baseUrls: Object.keys(context.baseUrls),
    })

    // 监听事件
    executor.on('nodeStart', ({ nodeId }) => {
      const node = nodes.value.find(n => n.id === nodeId)
      if (node)
        node.data.status = 'running'
    })

    executor.on('nodeComplete', ({ nodeId }) => {
      const node = nodes.value.find(n => n.id === nodeId)
      if (node)
        node.data.status = 'done'
    })

    executor.on('nodeError', ({ nodeId, error }) => {
      const node = nodes.value.find(n => n.id === nodeId)
      if (node)
        node.data.status = 'failed'
      window.$message?.error(`节点执行失败: ${error.message}`)
    })

    // 执行工作流
    const result = await executor.execute(nodes.value, edges.value, context)

    executionLogs.value = result.logs
    logsOpen.value = true

    window.$message?.success('工作流执行完成')

    // 保存执行历史
    await saveExecutionHistory(result)

    // 下载 Markdown 报告
    downloadMarkdown(result.logs)
  }
  catch (error) {
    console.error('工作流执行失败:', error)
    window.$message?.error(`工作流执行失败: ${error.message}`)
  }
  finally {
    isRunning.value = false
  }
}

function downloadMarkdown(logs) {
  let mdContent = `# 工作流执行报告\n\n执行时间: ${new Date().toLocaleString()}\n\n---\n\n`

  logs.forEach((log, index) => {
    mdContent += `### 步骤 ${index + 1}: ${log.title} (${log.type})\n`
    mdContent += `- **时间**: ${log.startTime}\n`
    mdContent += `- **耗时**: ${log.duration}ms\n\n`

    if (log.params && Object.keys(log.params).length > 0) {
      mdContent += `**参数**:\n\`\`\`json\n${JSON.stringify(log.params, null, 2)}\n\`\`\`\n\n`
    }

    mdContent += `**输入**:\n\`\`\`\n${log.input}\n\`\`\`\n\n`

    if (log.output) {
      mdContent += `**输出**:\n${log.output}\n\n`
    }

    if (log.error) {
      mdContent += `**错误**:\n\`\`\`\n${log.error}\n\`\`\`\n\n`
    }

    mdContent += `---\n\n`
  })

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `workflow_execution_${Date.now()}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function saveProviderConfig() {
  // 重新加载配置（因为 v-model 已经自动更新了 providerConfig）
  // 但为了确保数据一致，再次从 localStorage 读取
  loadProviderConfig()
  window.$message?.success('服务商配置已保存')
}

function openExport() {
  exportText.value = JSON.stringify(
    { version: 1, nodes: nodes.value, edges: edges.value },
    null,
    2,
  )
  exportOpen.value = true
}

function copyExportText() {
  navigator.clipboard.writeText(exportText.value)
  window.$message?.success('已复制到剪贴板')
}

function openImport() {
  importText.value = ''
  importOpen.value = true
}

function applyImport() {
  try {
    const obj = JSON.parse(importText.value)
    if (Array.isArray(obj.nodes) && Array.isArray(obj.edges)) {
      nodes.value = obj.nodes
      edges.value = obj.edges
      importOpen.value = false
      nextTick(() => {
        vueFlowInstance.value?.fitView()
      })
      window.$message?.success('导入成功')
    }
    else {
      window.$message?.error('格式错误')
    }
  }
  catch {
    window.$message?.error('JSON 解析失败')
  }
}

function truncate(text, length) {
  return text.length > length ? `${text.slice(0, length)}...` : text
}

// ==================== 工作流保存功能 ====================

// 显示保存对话框
function showSaveDialog() {
  window.$dialog?.create({
    title: currentWorkflow.value.id ? '保存工作流' : '另存为',
    content: () => {
      return h('div', [
        h('div', { style: 'margin-bottom: 12px' }, [
          h('label', { style: 'display: block; margin-bottom: 4px; font-size: 14px' }, '工作流名称'),
          h('input', {
            id: 'workflow-name-input',
            value: currentWorkflow.value.name,
            placeholder: '请输入工作流名称',
            style: 'width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px',
          }),
        ]),
        h('div', [
          h('label', { style: 'display: block; margin-bottom: 4px; font-size: 14px' }, '描述（可选）'),
          h('textarea', {
            id: 'workflow-desc-input',
            value: currentWorkflow.value.description,
            placeholder: '请输入工作流描述',
            style: 'width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; resize: vertical',
            rows: 3,
          }),
        ]),
      ])
    },
    positiveText: '保存',
    negativeText: '取消',
    onPositiveClick: async () => {
      const nameInput = document.getElementById('workflow-name-input')
      const descInput = document.getElementById('workflow-desc-input')
      const name = nameInput?.value?.trim()
      const description = descInput?.value?.trim()

      if (!name) {
        window.$message?.error('请输入工作流名称')
        return false
      }

      await saveWorkflow(name, description)
    },
  })
}

// 保存工作流
async function saveWorkflow(name, description) {
  try {
    const workflow = {
      id: currentWorkflow.value.id,
      name,
      description,
      nodes: nodes.value,
      edges: edges.value,
      version: 1,
    }

    const id = await workflowStorage.saveWorkflow(workflow)

    currentWorkflow.value = {
      id: id || currentWorkflow.value.id,
      name,
      description,
    }

    window.$message?.success('工作流已保存')
  }
  catch (error) {
    console.error('[Workflow] 保存失败:', error)
    window.$message?.error('保存失败')
  }
}

// 加载已保存的工作流
function loadSavedWorkflow(workflow) {
  if (!workflow || !workflow.nodes || !workflow.edges) {
    window.$message?.error('无效的工作流数据')
    return
  }

  // 确认是否替换当前工作流
  if (nodes.value.length > 3 || edges.value.length > 2) {
    window.$dialog?.warning({
      title: '确认加载工作流',
      content: '加载工作流将替换当前内容，是否继续？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        applyWorkflow(workflow)
      },
    })
  }
  else {
    applyWorkflow(workflow)
  }
}

// 应用工作流到画布
function applyWorkflow(workflow) {
  nodes.value = workflow.nodes
  edges.value = workflow.edges

  currentWorkflow.value = {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
  }

  // 更新 ID 种子
  const maxId = Math.max(...nodes.value.map(n => Number.parseInt(n.id) || 0))
  idSeed.value = maxId + 1

  // 适配视图
  nextTick(() => {
    handleFit()
  })

  window.$message?.success(`已加载工作流：${workflow.name}`)
}

// 保存执行历史
async function saveExecutionHistory(result) {
  try {
    const history = {
      workflowId: currentWorkflow.value.id,
      workflowName: currentWorkflow.value.name,
      status: result.success ? 'success' : 'failed',
      duration: result.logs.reduce((sum, log) => sum + (log.duration || 0), 0),
      logs: result.logs,
      nodeCount: nodes.value.length,
      edgeCount: edges.value.length,
    }

    await workflowStorage.saveHistory(history)
    console.log('[Workflow] 执行历史已保存')
  }
  catch (error) {
    console.error('[Workflow] 保存执行历史失败:', error)
  }
}

// 查看历史记录
function viewHistory(history) {
  if (!history || !history.logs) {
    window.$message?.error('无效的历史记录')
    return
  }

  executionLogs.value = history.logs
  logsOpen.value = true
}

// 快捷键
useEventListener(window, 'keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
    e.preventDefault()
    runWorkflow()
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    showSaveDialog()
  }
  if (e.key === 'Delete' && selectedNode.value) {
    deleteNode()
  }
})
</script>

<style scoped>
.workflow-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

.viewer-toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 8px;
}

.param-value {
  font-size: 12px;
  color: #6b7280;
  margin-left: 8px;
}

.log-content {
  font-size: 13px;
  line-height: 1.6;
}

.log-content > div {
  margin: 8px 0;
}

.log-error {
  color: #ef4444;
}
</style>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
</style>
