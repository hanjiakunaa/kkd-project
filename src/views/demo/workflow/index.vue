<template>
  <div class="workflow-container">
    <!-- 顶部工具栏 -->
    <div class="viewer-toolbar">
      <div class="toolbar-left">
        <span>工作流操作面板</span>
        <div class="toolbar-divider" />
        <n-button
          v-for="nodeType in NODE_TYPES"
          :key="nodeType.type"
          size="small"
          tertiary
          :focusable="false"
          @click="() => addNode(nodeType.type)"
        >
          {{ nodeType.label }}
        </n-button>
      </div>
      <div class="toolbar-right">
        <n-button size="small" @click="openSettings">
          <template #icon>
            <h-icon name="ri-settings-3-line" />
          </template>
        </n-button>
        <n-button size="small" quaternary :focusable="false" @click="handleClose">
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

    <!-- 设置面板 -->
    <n-drawer v-model:show="settingsOpen" placement="right" :width="360">
      <n-drawer-content title="全局设置">
        <n-form label-placement="top">
          <n-form-item label="API Base URL">
            <n-input v-model:value="globalSettings.baseUrl" placeholder="例如: https://api.openai.com/v1" />
          </n-form-item>
          <n-form-item label="API Key">
            <n-input v-model:value="globalSettings.apiKey" type="password" show-password-on="click" placeholder="sk-..." />
          </n-form-item>
          <n-alert type="info" title="提示" class="mt-2">
            请确保使用的 API 服务支持跨域(CORS)请求，或者使用本地代理地址。
            如果是 OpenAI 官方接口，需要在服务端进行转发。
          </n-alert>
        </n-form>
        <template #footer>
          <n-button type="primary" @click="saveSettings">
            保存配置
          </n-button>
        </template>
      </n-drawer-content>
    </n-drawer>

    <!-- 属性面板 -->
    <n-drawer v-model:show="inspectorOpen" placement="right" :width="360">
      <n-drawer-content title="属性">
        <!-- 节点属性 -->
        <n-form v-if="selectedType === 'node' && selectedNode" label-placement="left">
          <n-form-item label="标题">
            <n-input v-model:value="selectedNode.data.title" />
          </n-form-item>
          <n-form-item label="描述">
            <n-input v-model:value="selectedNode.data.description" type="textarea" />
          </n-form-item>
          <template v-if="selectedNode.data.type === 'llm-node'">
            <n-form-item label="模型">
              <n-input v-model:value="selectedNode.data.params.model" />
            </n-form-item>
            <n-form-item label="温度">
              <n-input v-model:value="selectedNode.data.params.temperature" />
            </n-form-item>
          </template>
          <template v-if="selectedNode.data.type === 'image-gen-node'">
            <n-form-item label="尺寸">
              <n-select
                v-model:value="selectedNode.data.params.size"
                :options="[
                  { label: '1024x1024', value: '1024x1024' },
                  { label: '512x512', value: '512x512' },
                  { label: '256x256', value: '256x256' },
                ]"
              />
            </n-form-item>
            <n-form-item label="风格">
              <n-select
                v-model:value="selectedNode.data.params.style"
                :options="[
                  { label: '自然 (Natural)', value: 'natural' },
                  { label: '鲜艳 (Vivid)', value: 'vivid' },
                ]"
              />
            </n-form-item>
          </template>
        </n-form>

        <!-- 变量管理 -->
        <template v-if="selectedType === 'node' && selectedNode">
          <div class="mt-2">
            变量
          </div>
          <div>
            <div v-for="(v, k) in selectedNode.data.variables || {}" :key="k" class="var-row">
              <span class="var-key">{{ k }}</span>
              <n-input v-model:value="selectedNode.data.variables[k]" class="var-input" />
              <n-button size="small" tertiary @click="removeVariable(k)">
                删除
              </n-button>
            </div>
            <div class="var-row">
              <n-input v-model:value="newVarKey" class="var-input" placeholder="变量名" />
              <n-input v-model:value="newVarValue" class="var-input" placeholder="变量值" />
              <n-button size="small" secondary @click="addVariable">
                添加
              </n-button>
            </div>
          </div>
        </template>

        <!-- 工作组管理 -->
        <template v-if="selectedType === 'node' && selectedNode && selectedNode.data?.type === 'group-node'">
          <n-form-item label="组内添加节点">
            <n-space>
              <n-button
                v-for="nodeType in NODE_TYPES.filter(t => t.type !== 'group-node')"
                :key="nodeType.type"
                size="small"
                tertiary
                :disabled="groupChildCount >= 2"
                @click="() => addNodeToGroup(nodeType.type)"
              >
                {{ nodeType.label }}
              </n-button>
            </n-space>
          </n-form-item>
          <div v-if="groupChildCount >= 2" style="font-size:12px;color:#9ca3af;">
            该工作组最多只能添加两个子节点
          </div>
          <n-form-item>
            <n-button size="small" @click="() => alignGroup(selectedNode.id)">
              对齐组内
            </n-button>
          </n-form-item>
        </template>

        <!-- 连线属性 -->
        <n-form v-else-if="selectedType === 'edge' && selectedEdge" label-placement="left">
          <n-form-item label="标签">
            <n-input v-model:value="selectedEdge.data.label" />
          </n-form-item>
          <n-form-item label="状态">
            <n-select v-model:value="selectedEdge.data.status" :options="EDGE_STATUS_OPTIONS" />
          </n-form-item>
        </n-form>
      </n-drawer-content>
    </n-drawer>

    <!-- 导出面板 -->
    <n-drawer v-model:show="exportOpen" placement="right" :height="280">
      <n-drawer-content title="导出 JSON">
        <n-input v-model:value="exportText" type="textarea" />
      </n-drawer-content>
    </n-drawer>

    <!-- 导入面板 -->
    <n-drawer v-model:show="importOpen" placement="right" :height="280">
      <n-drawer-content title="导入 JSON">
        <n-input v-model:value="importText" type="textarea" />
        <n-button class="mt-2" @click="applyImport">
          应用
        </n-button>
      </n-drawer-content>
    </n-drawer>

    <!-- 浮动操作按钮 -->
    <div class="actions-floating">
      <n-button size="small" @click="handleFit">
        适配视图
      </n-button>
      <n-button size="small" :loading="isRunning" @click="openDebug">
        {{ isRunning ? '运行中...' : '运行并生成MD' }}
      </n-button>
      <n-button size="small" @click="resetStatus">
        重置状态
      </n-button>
      <n-button size="small" @click="openExport">
        导出
      </n-button>
      <n-button size="small" @click="openImport">
        导入
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { Background } from '@vue-flow/background'
import { VueFlow } from '@vue-flow/core'
import { useEventListener, useThrottleFn } from '@vueuse/core'
import { nextTick } from 'vue'
import api from './api'
import SpecialEdge from './components/SpecialEdge.vue'
import SpecialNode from './components/SpecialNode.vue'

const router = useRouter()

// ==================== 常量定义 ====================
const SCHEMA_VERSION = 1
const SPACING = 260
const BASE_Y = 180

const NODE_TYPES = [
  { type: 'input-node', label: '输入', icon: 'ri-login-circle-line' },
  { type: 'llm-node', label: 'LLM', icon: 'ri-robot-line', params: { model: 'gpt-4o-mini', temperature: '0.7' } },
  { type: 'image-gen-node', label: '绘图', icon: 'ri-image-line', params: { size: '1024x1024', style: 'natural' } },
  { type: 'tool-node', label: '工具', icon: 'ri-tools-line' },
  { type: 'branch-node', label: '分支', icon: 'ri-git-branch-line' },
  { type: 'group-node', label: '工作组', icon: 'ri-folder-line' },
  { type: 'output-node', label: '输出', icon: 'ri-logout-circle-line' },
]

const EDGE_STATUS_OPTIONS = [
  { label: '默认', value: 'default' },
  { label: '运行中', value: 'running' },
  { label: '成功', value: 'success' },
  { label: '错误', value: 'error' },
  { label: '跳过', value: 'skipped' },
]

// ==================== 响应式状态 ====================
// 画布相关
const vueFlowInstance = ref(null)
const idSeed = ref(5)
const nodes = ref([
  {
    id: '1',
    type: 'special',
    position: { x: 120, y: 180 },
    data: {
      title: '输入',
      icon: 'ri-login-circle-line',
      type: 'input-node',
      status: 'ready',
      params: { schema: 'text' },
      description: '工作流输入',
    },
  },
  {
    id: '2',
    type: 'special',
    position: { x: 380, y: 180 },
    data: {
      title: 'LLM',
      icon: 'ri-robot-line',
      type: 'llm-node',
      status: 'ready',
      params: { model: 'gpt-4o-mini', temperature: '0.7' },
      description: '文本生成',
    },
  },
  {
    id: '3',
    type: 'special',
    position: { x: 640, y: 180 },
    data: {
      title: '输出',
      icon: 'ri-logout-circle-line',
      type: 'output-node',
      status: 'ready',
      params: {},
      description: '工作流输出',
    },
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
    data: { label: '处理', status: 'default' },
  },
  {
    id: 'e2->3',
    type: 'special',
    source: '2',
    target: '3',
    sourceHandle: 'out',
    targetHandle: 'in',
    data: { label: '结果', status: 'default' },
  },
])

// 属性面板相关
const inspectorOpen = ref(false)
const selectedType = ref('node')
const selectedNodeId = ref(null)
const selectedEdgeId = ref(null)
const newVarKey = ref('')
const newVarValue = ref('')

// 导入导出
const exportOpen = ref(false)
const exportText = ref('')
const importOpen = ref(false)
const importText = ref('')

// 全局设置
const settingsOpen = ref(false)
const globalSettings = ref({
  baseUrl: localStorage.getItem('wf_base_url') || 'https://api.openai.com/v1',
  apiKey: localStorage.getItem('wf_api_key') || '',
})

// ==================== 计算属性 ====================
const selectedNode = computed(() => nodes.value.find(n => n.id === selectedNodeId.value))
const selectedEdge = computed(() => edges.value.find(e => e.id === selectedEdgeId.value))
const groupChildCount = computed(() => {
  if (!(selectedNode.value && selectedNode.value.data?.type === 'group-node'))
    return 0
  return nodes.value.filter(n => n.parentNode === selectedNode.value.id).length
})

// ==================== 工具函数 ====================
const throttledFit = useThrottleFn(() => {
  vueFlowInstance.value?.fitView()
}, 200)

function getNodeConfig(type) {
  const nodeType = NODE_TYPES.find(t => t.type === type)
  return {
    title: nodeType?.label || '节点',
    icon: nodeType?.icon || 'ri-node-tree',
    type,
    status: 'ready',
    params: nodeType?.params || {},
    variables: {},
    description: '',
  }
}

function getStartNodes() {
  return nodes.value.filter(n => n.data.type === 'input-node' && !n.parentNode).map(n => n.id)
}

function getOutgoingEdges(nodeId) {
  return edges.value.filter(e => e.source === nodeId)
}

// ==================== 画布操作 ====================
function handlePaneReady(instance) {
  vueFlowInstance.value = instance
  nextTick(() => {
    requestAnimationFrame(() => {
      alignLinear()
      instance.fitView()
    })
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
  if ((conn.targetHandle || 'in') !== 'in')
    return

  const sourceHandle = conn.sourceHandle || 'out'
  const targetHandle = conn.targetHandle || 'in'

  const exists = edges.value.some(
    e => e.source === conn.source && e.target === conn.target
      && (e.sourceHandle || 'out') === sourceHandle
      && (e.targetHandle || 'in') === targetHandle,
  )

  if (exists)
    return

  edges.value.push({
    id: `e${conn.source}->${conn.target}`,
    type: 'special',
    source: conn.source,
    target: conn.target,
    sourceHandle,
    targetHandle,
    data: { label: '', status: 'default' },
  })
}

// ==================== 节点操作 ====================
function addNode(type) {
  const id = String(idSeed.value++)
  const candidate = (selectedType.value === 'node' && selectedNode.value && !selectedNode.value.parentNode)
    ? selectedNode.value
    : nodes.value[nodes.value.length - 1]

  const baseY = candidate?.position.y || BASE_Y
  const defaultPos = candidate
    ? { x: candidate.position.x + 160, y: baseY + 180 }
    : { x: 120, y: baseY }

  const groupPos = candidate
    ? { x: candidate.position.x + 220, y: candidate.position.y + 140 }
    : { x: defaultPos.x + 60, y: defaultPos.y + 60 }

  const node = {
    id,
    type: 'special',
    position: type === 'group-node' ? groupPos : defaultPos,
    data: getNodeConfig(type),
  }

  if (type === 'group-node') {
    node.style = {
      width: '460px',
      height: '300px',
      backgroundColor: 'transparent',
      border: '1px solid #e5e7eb',
    }
  }

  nodes.value.push(node)

  if (candidate) {
    edges.value.push({
      id: `e${candidate.id}->${id}`,
      type: 'special',
      source: candidate.id,
      target: id,
      sourceHandle: 'out',
      targetHandle: 'in',
      data: { label: '', status: 'default' },
    })
  }

  nextTick(() => {
    alignLinear()
    throttledFit()
  })
}

function calcGroupColumns(width, margin, spacingX) {
  const innerWidth = width - margin * 2
  return Math.max(1, Math.floor((innerWidth + spacingX) / spacingX))
}

function addNodeToGroup(type) {
  if (!selectedNode.value || selectedNode.value.data?.type !== 'group-node')
    return

  const groupId = selectedNode.value.id
  const children = nodes.value.filter(n => n.parentNode === groupId)
  if (children.length >= 2)
    return

  const id = String(idSeed.value++)
  const group = selectedNode.value
  const width = Number.parseInt(group?.style?.width || '460')
  const margin = 40
  const header = 100
  const spacingX = 220
  const spacingY = 160
  const cols = calcGroupColumns(width, margin, spacingX)

  const col = children.length % cols
  const row = Math.floor(children.length / cols)
  const pos = { x: margin + col * spacingX, y: header + margin + row * spacingY }

  const node = {
    id,
    type: 'special',
    position: pos,
    parentNode: groupId,
    extent: 'parent',
    data: getNodeConfig(type),
  }

  nodes.value.push(node)

  const lastChild = children[children.length - 1]
  if (lastChild) {
    edges.value.push({
      id: `e${lastChild.id}->${id}`,
      type: 'special',
      source: lastChild.id,
      target: id,
      sourceHandle: 'out',
      targetHandle: 'in',
      data: { label: '', status: 'default' },
    })
  }

  nextTick(() => {
    alignGroup(groupId)
    throttledFit()
  })
}

function onNodeClick({ node }) {
  selectedType.value = 'node'
  selectedNodeId.value = node.id
  selectedEdgeId.value = null
  inspectorOpen.value = true
}

function onEdgeClick({ edge }) {
  selectedType.value = 'edge'
  selectedEdgeId.value = edge.id
  selectedNodeId.value = null
  inspectorOpen.value = true
}

// ==================== 布局对齐 ====================
function alignLinear() {
  const baseY = nodes.value.length ? nodes.value[0].position.y : BASE_Y
  const visited = new Set()
  const order = []

  const walk = (nid) => {
    if (visited.has(nid))
      return
    visited.add(nid)
    order.push(nid)
    getOutgoingEdges(nid).forEach(e => walk(e.target))
  }

  getStartNodes().forEach(walk)

  nodes.value
    .filter(n => !visited.has(n.id) && !n.parentNode)
    .sort((a, b) => a.position.x - b.position.x)
    .forEach(n => order.push(n.id))

  order.forEach((id, idx) => {
    const n = nodes.value.find(nn => nn.id === id)
    if (!n.parentNode && n.data.type !== 'group-node') {
      n.position = { x: 120 + idx * SPACING, y: baseY }
    }
  })
}

function alignGroup(groupId) {
  const children = nodes.value.filter(n => n.parentNode === groupId)
  const group = nodes.value.find(n => n.id === groupId)
  const width = Number.parseInt(group?.style?.width || '460')
  const margin = 40
  const header = 100
  const spacingX = 220
  const spacingY = 160
  const cols = calcGroupColumns(width, margin, spacingX)

  children.forEach((n, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    n.position = { x: margin + col * spacingX, y: header + margin + row * spacingY }
    n.extent = 'parent'
  })
}

// ==================== 变量管理 ====================
function addVariable() {
  const k = (newVarKey.value || '').trim()
  if (!k || !selectedNode.value)
    return

  selectedNode.value.data.variables = selectedNode.value.data.variables || {}
  selectedNode.value.data.variables[k] = newVarValue.value
  newVarKey.value = ''
  newVarValue.value = ''

  const i = nodes.value.findIndex(n => n.id === selectedNode.value.id)
  if (i !== -1) {
    nodes.value[i] = {
      ...selectedNode.value,
      data: {
        ...selectedNode.value.data,
        variables: { ...selectedNode.value.data.variables },
      },
    }
  }
}

function removeVariable(k) {
  if (!selectedNode.value?.data?.variables?.[k])
    return

  delete selectedNode.value.data.variables[k]
  const i = nodes.value.findIndex(n => n.id === selectedNode.value.id)
  if (i !== -1) {
    nodes.value[i] = {
      ...selectedNode.value,
      data: {
        ...selectedNode.value.data,
        variables: { ...selectedNode.value.data.variables },
      },
    }
  }
}

// ==================== 状态控制 ====================
const isRunning = ref(false)
const executionLogs = ref([])

function openSettings() {
  settingsOpen.value = true
}

function saveSettings() {
  localStorage.setItem('wf_base_url', globalSettings.value.baseUrl)
  localStorage.setItem('wf_api_key', globalSettings.value.apiKey)
  settingsOpen.value = false
  window.$message?.success('设置已保存')
}

function resetStatus() {
  nodes.value.forEach((n) => {
    n.data.status = 'ready'
  })
  edges.value.forEach((e) => {
    e.data.status = 'default'
  })
  executionLogs.value = []
}

// 真实 API 调用
async function executeNodeLogic(node, input) {
  const { type, params } = node.data
  const { apiKey, baseUrl } = globalSettings.value

  // 1. 输入节点：直接返回
  if (type === 'input-node') {
    return input
  }

  // 2. 检查配置
  if (!apiKey && (type === 'llm-node' || type === 'image-gen-node')) {
    throw new Error('请先点击右上角设置图标配置 API Key')
  }

  // 使用内部代理解决跨域问题
  // const proxyUrl = '/api/proxy'

  // 3. LLM 节点调用
  if (type === 'llm-node') {
    const model = params.model || 'gpt-3.5-turbo'
    const temperature = Number(params.temperature) || 0.7

    // 构建消息历史，这里简化为 system + user
    const messages = [
      { role: 'system', content: '你是一个有用的助手。' },
      { role: 'user', content: input },
    ]

    try {
      // 处理 URL 尾部斜杠
      const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
      const res = await api.aiProxy({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: {
          model,
          messages,
          temperature,
        },
      })

      return res.data?.choices?.[0]?.message?.content || '无返回内容'
    }
    catch (e) {
      throw new Error(`LLM 请求失败: ${e.message || e}`)
    }
  }

  // 4. 绘图节点调用
  if (type === 'image-gen-node') {
    const size = params.size || '1024x1024'
    // OpenAI 格式
    try {
      const url = `${baseUrl.replace(/\/+$/, '')}/images/generations`
      const res = await api.aiProxy({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: {
          prompt: input,
          n: 1,
          size,
          model: 'dall-e-3', // 默认尝试用 dall-e-3
        },
      })

      const imgUrl = res.data?.data?.[0]?.url
      return imgUrl ? `![生成图片](${imgUrl})` : '未获取到图片地址'
    }
    catch (e) {
      throw new Error(`绘图请求失败: ${e.message || e}`)
    }
  }

  // 5. 其他节点（工具/分支等）模拟
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`[模拟执行] ${type} 处理了: ${input.slice(0, 10)}...`)
    }, 1000)
  })
}

async function runWorkflow() {
  if (isRunning.value)
    return
  isRunning.value = true
  resetStatus()
  executionLogs.value = []

  try {
    const startNodes = getStartNodes()
    if (startNodes.length === 0) {
      window.$message?.warning('没有找到起始节点 (输入节点)')
      return
    }

    // 简单的 BFS 执行引擎
    const queue = [...startNodes]
    const visited = new Set()
    // 存储节点输出结果，供后续节点使用
    const nodeOutputs = new Map()

    // 初始化输入节点的输出（假设输入是静态的）
    startNodes.forEach((id) => {
      const node = nodes.value.find(n => n.id === id)
      if (node)
        nodeOutputs.set(id, node.data.variables?.input || '默认输入内容')
    })

    while (queue.length > 0) {
      const nodeId = queue.shift()
      if (visited.has(nodeId))
        continue
      visited.add(nodeId)

      const node = nodes.value.find(n => n.id === nodeId)
      if (!node)
        continue

      // 设置节点状态为运行中
      node.data.status = 'running'

      // 获取上游节点的输出作为输入
      const incomingEdges = edges.value.filter(e => e.target === nodeId)
      let inputData = ''
      if (incomingEdges.length > 0) {
        // 简单拼接上游结果
        inputData = incomingEdges.map(e => nodeOutputs.get(e.source)).join('\n')
        // 高亮连线
        incomingEdges.forEach(e => (e.data.status = 'running'))
      }
      else {
        // 如果是起始节点，使用内部变量或默认值
        inputData = node.data.variables?.input || 'Start'
      }

      // 记录步骤开始
      const stepLog = {
        id: node.id,
        title: node.data.title,
        type: node.data.type,
        startTime: new Date().toLocaleTimeString(),
        input: inputData,
        params: node.data.params,
        output: '',
      }

      // 执行节点逻辑
      let outputData = ''
      try {
        outputData = await executeNodeLogic(node, inputData)
      }
      catch (err) {
        node.data.status = 'failed'
        window.$message?.error(`节点 ${node.data.title} 执行失败: ${err.message}`)
        throw err
      }

      // 更新节点状态和输出
      node.data.status = 'done'
      nodeOutputs.set(nodeId, outputData)

      // 将结果写入节点变量以便在UI查看
      if (!node.data.variables)
        node.data.variables = {}
      node.data.variables.output = outputData.length > 50 ? `${outputData.slice(0, 50)}...` : outputData

      stepLog.output = outputData
      executionLogs.value.push(stepLog)

      // 更新连线状态
      incomingEdges.forEach(e => (e.data.status = 'success'))

      // 将下游节点加入队列
      const outgoing = getOutgoingEdges(nodeId)
      outgoing.forEach((e) => {
        queue.push(e.target)
      })

      // 稍微停顿一下，让动画可见
      await new Promise(r => setTimeout(r, 500))
    }

    window.$message?.success('工作流执行完成')
    downloadMarkdown()
  }
  catch (error) {
    console.error(error)
    // 错误已经在 executeNodeLogic 中处理过一部分，这里是兜底
  }
  finally {
    isRunning.value = false
  }
}

function downloadMarkdown() {
  if (executionLogs.value.length === 0)
    return

  let mdContent = `# 工作流执行报告\n\n执行时间: ${new Date().toLocaleString()}\n\n---\n\n`

  executionLogs.value.forEach((step, index) => {
    mdContent += `### 步骤 ${index + 1}: ${step.title} (${step.type})\n`
    mdContent += `- **时间**: ${step.startTime}\n`

    if (step.params && Object.keys(step.params).length > 0) {
      mdContent += `- **参数**:\n`
      Object.entries(step.params).forEach(([k, v]) => {
        mdContent += `  - ${k}: ${v}\n`
      })
    }

    mdContent += `\n**输入**:\n\`\`\`\n${step.input}\n\`\`\`\n`
    mdContent += `\n**输出**:\n${step.output}\n`
    mdContent += `\n---\n\n`
  })

  // 创建 Blob 并下载
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

function openDebug() {
  runWorkflow()
}

// ==================== 导入导出 ====================
function openExport() {
  exportText.value = JSON.stringify(
    { version: SCHEMA_VERSION, nodes: nodes.value, edges: edges.value },
    null,
    2,
  )
  exportOpen.value = true
}

function openImport() {
  importText.value = ''
  importOpen.value = true
}

function applyImport() {
  try {
    const obj = JSON.parse(importText.value || '{}')
    if (Array.isArray(obj.nodes) && Array.isArray(obj.edges)) {
      nodes.value = obj.nodes
      edges.value = obj.edges
      importOpen.value = false
      nextTick(() => {
        alignLinear()
        throttledFit()
      })
    }
  }
  catch (e) {
    console.error('导入失败', e)
  }
}

// ==================== 键盘快捷键 ====================
useEventListener(window, 'resize', throttledFit)

useEventListener(window, 'keydown', (e) => {
  const isMeta = e.metaKey || e.ctrlKey

  // Ctrl/Cmd + R: 运行模拟
  if (isMeta && e.key.toLowerCase() === 'r') {
    e.preventDefault()
    openDebug()
    return
  }

  // Ctrl/Cmd + D: 复制节点
  if (isMeta && e.key.toLowerCase() === 'd') {
    e.preventDefault()
    if (selectedNode.value) {
      const id = String(idSeed.value++)
      const pos = {
        x: selectedNode.value.position.x + 40,
        y: selectedNode.value.position.y + 20,
      }
      const copy = JSON.parse(JSON.stringify(selectedNode.value.data))
      nodes.value.push({ id, type: 'special', position: pos, data: copy })
      nextTick(() => {
        alignLinear()
        throttledFit()
      })
    }
    return
  }

  // Delete: 删除节点或连线
  if (e.key === 'Delete') {
    if (selectedType.value === 'node' && selectedNode.value) {
      const nid = selectedNode.value.id
      nodes.value = nodes.value.filter(n => n.id !== nid)
      edges.value = edges.value.filter(e => e.source !== nid && e.target !== nid)
      selectedNodeId.value = null
    }
    else if (selectedType.value === 'edge' && selectedEdge.value) {
      const eid = selectedEdge.value.id
      edges.value = edges.value.filter(e => e.id !== eid)
      selectedEdgeId.value = null
    }
  }
})

watch(() => nodes.value.length, alignLinear)
</script>

<style scoped>
.workflow-container {
  width: 100%;
  height: 100vh; /* 保证容器有稳定高度 */
  position: relative;
}

.viewer-toolbar {
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 10px;
}
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 6px;
}

.actions-floating {
  position: absolute;
  left: 10px;
  bottom: 10px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 10px;
}
.debug-logs {
  max-height: 200px;
  overflow: auto;
  font-size: 12px;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px;
  background: #fafafa;
}
.var-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.var-key {
  min-width: 80px;
  font-size: 12px;
  color: #374151;
}
.var-input {
  flex: 1;
}
</style>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
</style>
