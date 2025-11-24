<template>
  <div class="workflow-container">
    <div class="viewer-toolbar">
      <div class="toolbar-left">
        <span>工作流操作面板</span>
        <div class="toolbar-divider" />
        <n-button
          size="small"
          tertiary
          :focusable="false"
          @click="() => addNode('input-node')"
        >
          输入
        </n-button>
        <n-button
          size="small"
          tertiary
          :focusable="false"
          @click="() => addNode('llm-node')"
        >
          LLM
        </n-button>
        <n-button
          size="small"
          tertiary
          :focusable="false"
          @click="() => addNode('tool-node')"
        >
          工具
        </n-button>
        <n-button
          size="small"
          tertiary
          :focusable="false"
          @click="() => addNode('branch-node')"
        >
          分支
        </n-button>
        <n-button
          size="small"
          tertiary
          :focusable="false"
          @click="() => addNode('group-node')"
        >
          工作组
        </n-button>
        <n-button
          size="small"
          tertiary
          :focusable="false"
          @click="() => addNode('output-node')"
        >
          输出
        </n-button>
      </div>

      <div class="toolbar-right">
        <n-button
          size="small"
          quaternary
          :focusable="false"
          @click="handleClose"
        >
          <template #icon>
            <h-icon name="fa-compress" />
          </template>
        </n-button>
      </div>
    </div>

    <vue-flow
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ zoom: 0.6 }"
      :max-zoom="1.5"
      :min-zoom="0.2"
      :nodes-draggable="nodesDraggable"
      :nodes-connectable="true"
      @pane-ready="handlePaneReady"
      @connect="onConnect"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
      @node-drag-stop="onNodeDragStop"
    >
      <background
        :gap="15"
        :size="1"
        class="h-full w-full"
        pattern-color="#BDBDBD"
      />
      <template #node-special="specialNodeProps">
        <special-node v-bind="specialNodeProps" />
      </template>

      <template #edge-special="specialEdgeProps">
        <special-edge v-bind="specialEdgeProps" />
      </template>
    </vue-flow>

    <n-drawer v-model:show="inspectorOpen" placement="right" :width="360">
      <n-drawer-content title="属性">
        <n-form
          v-if="selectedType === 'node' && selectedNode"
          label-placement="left"
        >
          <n-form-item label="标题">
            <n-input v-model:value="selectedNode.data.title" />
          </n-form-item>
          <n-form-item label="描述">
            <n-input
              v-model:value="selectedNode.data.description"
              type="textarea"
            />
          </n-form-item>
          <n-form-item
            v-if="selectedNode.data.type === 'llm-node'"
            label="模型"
          >
            <n-input v-model:value="selectedNode.data.params.model" />
          </n-form-item>
          <n-form-item
            v-if="selectedNode.data.type === 'llm-node'"
            label="温度"
          >
            <n-input v-model:value="selectedNode.data.params.temperature" />
          </n-form-item>
        </n-form>
        <template v-if="selectedType === 'node' && selectedNode">
          <div class="mt-2">
            变量
          </div>
          <div>
            <div
              v-for="(v, k) in selectedNode.data.variables || {}"
              :key="k"
              class="var-row"
            >
              <span class="var-key">{{ k }}</span>
              <n-input
                v-model:value="selectedNode.data.variables[k]"
                class="var-input"
              />
              <n-button size="small" tertiary @click="removeVariable(k)">
                删除
              </n-button>
            </div>
            <div class="var-row">
              <n-input
                v-model:value="newVarKey"
                class="var-input"
                placeholder="变量名"
              />
              <n-input
                v-model:value="newVarValue"
                class="var-input"
                placeholder="变量值"
              />
              <n-button size="small" secondary @click="addVariable">
                添加
              </n-button>
            </div>
          </div>
        </template>
        <n-form
          v-else-if="selectedType === 'edge' && selectedEdge"
          label-placement="left"
        >
          <n-form-item label="标签">
            <n-input v-model:value="selectedEdge.data.label" />
          </n-form-item>
          <n-form-item label="状态">
            <n-select
              v-model:value="selectedEdge.data.status"
              :options="[
                { label: '默认', value: 'default' },
                { label: '运行中', value: 'running' },
                { label: '成功', value: 'success' },
                { label: '错误', value: 'error' },
                { label: '跳过', value: 'skipped' },
              ]"
            />
          </n-form-item>
        </n-form>
        <template v-if="selectedType === 'node' && selectedNode && selectedNode.data?.type === 'group-node'">
          <n-form-item label="所属工作组">
            <n-select
              :options="groupOptions"
              :value="selectedNode.parentNode || null"
              placeholder="未分组"
              @update:value="setNodeGroup"
            />
          </n-form-item>
          <n-form-item label="组内添加节点">
            <n-space>
              <n-button size="small" tertiary :focusable="false" :disabled="groupChildCount >= 2" @click="() => addNodeToGroup('input-node')">
                输入
              </n-button>
              <n-button size="small" tertiary :focusable="false" :disabled="groupChildCount >= 2" @click="() => addNodeToGroup('llm-node')">
                LLM
              </n-button>
              <n-button size="small" tertiary :focusable="false" :disabled="groupChildCount >= 2" @click="() => addNodeToGroup('tool-node')">
                工具
              </n-button>
              <n-button size="small" tertiary :focusable="false" :disabled="groupChildCount >= 2" @click="() => addNodeToGroup('branch-node')">
                分支
              </n-button>
              <n-button size="small" tertiary :focusable="false" :disabled="groupChildCount >= 2" @click="() => addNodeToGroup('output-node')">
                输出
              </n-button>
            </n-space>
          </n-form-item>
          <div v-if="groupChildCount >= 2" style="font-size:12px;color:#9ca3af;">
            该工作组最多只能添加两个子节点
          </div>
          <div v-if="groupChildCount >= 2" style="font-size:12px;color:#9ca3af;">
            该工作组最多只能添加两个子节点
          </div>
          <n-form-item>
            <n-button size="small" @click="() => selectedNode && alignGroup(selectedNode.id)">
              对齐组内
            </n-button>
          </n-form-item>
        </template>
      </n-drawer-content>
    </n-drawer>

    <n-drawer v-model:show="exportOpen" placement="right" :height="280">
      <n-drawer-content title="导出 JSON">
        <n-input v-model:value="exportText" type="textarea" />
      </n-drawer-content>
    </n-drawer>

    <n-drawer v-model:show="importOpen" placement="right" :height="280">
      <n-drawer-content title="导入 JSON">
        <n-input v-model:value="importText" type="textarea" />
        <n-button class="mt-2" @click="applyImport">
          应用
        </n-button>
      </n-drawer-content>
    </n-drawer>
    <div class="actions-floating">
      <n-button size="small" :focusable="false" @click="handleFit">
        适配视图
      </n-button>
      <n-button size="small" :focusable="false" @click="openDebug">
        运行模拟
      </n-button>
      <n-button size="small" :focusable="false" @click="resetStatus">
        重置状态
      </n-button>
      <n-button size="small" :focusable="false" @click="openExport">
        导出
      </n-button>
      <n-button size="small" :focusable="false" @click="openImport">
        导入
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { Background } from '@vue-flow/background'
import { VueFlow } from '@vue-flow/core'
import { useEventListener, useThrottleFn } from '@vueuse/core'
import { nextTick, onMounted } from 'vue'
import SpecialEdge from './components/SpecialEdge.vue'
import SpecialNode from './components/SpecialNode.vue'

const router = useRouter()
const SCHEMA_VERSION = 1
const DRAFT_KEY = 'workflow_draft_v1'

const vueFlowInstance = ref(null)
const nodesDraggable = ref(true)
const autoFit = ref(true)
const throttledFit = useThrottleFn(() => {
  if (vueFlowInstance.value)
    vueFlowInstance.value.fitView()
}, 200)
// 窗口尺寸变化时自动适配，避免容器尺寸变化导致视图不正确
useEventListener(window, 'resize', () => {
  if (vueFlowInstance.value)
    throttledFit()
})
useEventListener(window, 'keydown', (e) => {
  const isMeta = e.metaKey || e.ctrlKey
  if (isMeta && e.key.toLowerCase() === 'r') {
    e.preventDefault()
    openDebug()
    return
  }
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
        if (vueFlowInstance.value)
          vueFlowInstance.value.fitView()
      })
    }
    return
  }
  if (e.key === 'Delete') {
    if (selectedType.value === 'node' && selectedNode.value) {
      const nid = selectedNode.value.id
      nodes.value = nodes.value.filter(n => n.id !== nid)
      edges.value = edges.value.filter(
        e => e.source !== nid && e.target !== nid,
      )
      selectedNodeId.value = null
    }
    else if (selectedType.value === 'edge' && selectedEdge.value) {
      const eid = selectedEdge.value.id
      edges.value = edges.value.filter(e => e.id !== eid)
      selectedEdgeId.value = null
    }
  }
})
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

// 监听视图变化 适应视图让节点始终是可见的
function handlePaneReady(instance) {
  vueFlowInstance.value = instance
  nextTick(() => {
    requestAnimationFrame(() => {
      alignLinear()
      instance.fitView()
    })
  })
}
function handleClose() {
  router.back()
}

const inspectorOpen = ref(false)
const selectedType = ref('node')
const selectedNodeId = ref(null)
const selectedEdgeId = ref(null)
const selectedNode = computed(() =>
  nodes.value.find(n => n.id === selectedNodeId.value),
)
const selectedEdge = computed(() =>
  edges.value.find(e => e.id === selectedEdgeId.value),
)
const newVarKey = ref('')
const newVarValue = ref('')
const groupOptions = computed(() =>
  nodes.value
    .filter(n => n.data?.type === 'group-node')
    .map(n => ({ label: n.data?.title || `工作组(${n.id})`, value: n.id })),
)
const groupChildCount = computed(() => {
  if (!(selectedNode.value && selectedNode.value.data?.type === 'group-node'))
    return 0
  return nodes.value.filter(n => n.parentNode === selectedNode.value.id).length
})
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
  if (!selectedNode.value)
    return
  if (
    selectedNode.value.data?.variables
    && k in selectedNode.value.data.variables
  ) {
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
}
function setNodeGroup(groupId) {
  if (!selectedNode.value)
    return
  const i = nodes.value.findIndex(n => n.id === selectedNode.value.id)
  if (i === -1)
    return
  const base = { ...selectedNode.value }
  if (groupId) {
    const count = nodes.value.filter(n => n.parentNode === groupId).length
    if (count >= 2)
      return
    const group = nodes.value.find(n => n.id === groupId)
    const width = Number.parseInt(group?.style?.width || '460')
    const margin = 40
    const header = 100
    const pos = { x: margin, y: header + margin }
    nodes.value[i] = { ...base, parentNode: groupId, extent: 'parent', position: pos, data: { ...base.data } }
  }
  else {
    const { parentNode, extent, ...rest } = base
    nodes.value[i] = { ...rest, parentNode: undefined, extent: undefined }
  }
  nextTick(() => {
    if (vueFlowInstance.value)
      vueFlowInstance.value.fitView()
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
function addNode(type) {
  const id = String(idSeed.value++)
  const base = { status: 'ready', params: {}, variables: {}, description: '' }
  const m = {
    'input-node': { title: '输入', icon: 'ri-login-circle-line' },
    'llm-node': {
      title: 'LLM',
      icon: 'ri-robot-line',
      params: { model: 'gpt-4o-mini', temperature: '0.7' },
    },
    'tool-node': { title: '工具', icon: 'ri-tools-line' },
    'branch-node': { title: '分支', icon: 'ri-git-branch-line' },
    'group-node': { title: '工作组', icon: 'ri-folder-line' },
    'output-node': { title: '输出', icon: 'ri-logout-circle-line' },
  }
  const candidate = (selectedType.value === 'node' && selectedNode.value && !selectedNode.value.parentNode)
    ? selectedNode.value
    : nodes.value[nodes.value.length - 1]
  const baseY = candidate ? candidate.position.y : 180
  const defaultPos = candidate
    ? { x: candidate.position.x + 160, y: baseY + 180 }
    : { x: 120, y: baseY }
  // 工作组节点需要紧贴参照节点右下方，避免被线性对齐逻辑覆盖
  const groupPos = candidate
    ? { x: candidate.position.x + 220, y: candidate.position.y + 140 }
    : { x: defaultPos.x + 60, y: defaultPos.y + 60 }
  const pos = type === 'group-node' ? groupPos : defaultPos
  const node = {
    id,
    type: 'special',
    position: pos,
    data: { ...base, ...m[type], type },
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
    if (vueFlowInstance.value)
      vueFlowInstance.value.fitView()
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
  const cols = Math.max(1, Math.floor((width - margin * 2) / spacingX))
  children.forEach((n, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    n.position = { x: margin + col * spacingX, y: header + margin + row * spacingY }
    n.extent = 'parent'
  })
}

function addNodeToGroup(type) {
  if (!selectedNode.value || selectedNode.value.data?.type !== 'group-node')
    return
  const gid = selectedNode.value.id
  const existing = nodes.value.filter(n => n.parentNode === gid)
  if (existing.length >= 2)
    return
  const id = String(idSeed.value++)
  const base = { status: 'ready', params: {}, variables: {}, description: '' }
  const m = {
    'input-node': { title: '输入', icon: 'ri-login-circle-line' },
    'llm-node': { title: 'LLM', icon: 'ri-robot-line', params: { model: 'gpt-4o-mini', temperature: '0.7' } },
    'tool-node': { title: '工具', icon: 'ri-tools-line' },
    'branch-node': { title: '分支', icon: 'ri-git-branch-line' },
    'output-node': { title: '输出', icon: 'ri-logout-circle-line' },
  }
  const children = existing
  const group = selectedNode.value
  const width = Number.parseInt(group?.style?.width || '460')
  const margin = 40
  const header = 100
  const spacingX = 220
  const spacingY = 160
  const cols = Math.max(1, Math.floor((width - margin * 2) / spacingX))
  const col = children.length % cols
  const row = Math.floor(children.length / cols)
  const pos = { x: margin + col * spacingX, y: header + margin + row * spacingY }
  const node = { id, type: 'special', position: pos, parentNode: gid, extent: 'parent', data: { ...base, ...m[type], type } }
  nodes.value.push(node)
  const lastChild = children[children.length - 1]
  if (lastChild) {
    edges.value.push({ id: `e${lastChild.id}->${id}`, type: 'special', source: lastChild.id, target: id, sourceHandle: 'out', targetHandle: 'in', data: { label: '', status: 'default' } })
  }
  nextTick(() => {
    alignGroup(gid); if (vueFlowInstance.value)
      vueFlowInstance.value.fitView()
  })
}
function onConnect(conn) {
  const sourceHandle = conn.sourceHandle || 'out'
  const targetHandle = conn.targetHandle || 'in'
  if (conn.source === conn.target)
    return
  if (targetHandle !== 'in')
    return
  const exists = edges.value.some(
    e =>
      e.source === conn.source
      && e.target === conn.target
      && (e.sourceHandle || 'out') === sourceHandle
      && (e.targetHandle || 'in') === targetHandle,
  )
  if (exists)
    return
  const id = `e${conn.source}->${conn.target}`
  edges.value.push({
    id,
    type: 'special',
    source: conn.source,
    target: conn.target,
    sourceHandle,
    targetHandle,
    data: { label: '', status: 'default' },
  })
}
function handleFit() {
  if (vueFlowInstance.value)
    vueFlowInstance.value.fitView()
}

watch(
  () => nodes.value.length,
  () => {
    alignLinear()
    if (autoFit.value)
      throttledFit()
  },
)
function onNodeDragStop() {
  if (autoFit.value)
    throttledFit()
}

function alignLinear() {
  const spacing = 260
  const baseY = nodes.value.length ? nodes.value[0].position.y : 180
  const visited = new Set()
  const order = []
  const nextOf = nid =>
    edges.value.filter(e => e.source === nid).map(e => e.target)
  const starts = nodes.value
    .filter(n => n.data.type === 'input-node' && !n.parentNode)
    .map(n => n.id)
  const walk = (nid) => {
    if (visited.has(nid))
      return
    visited.add(nid)
    order.push(nid)
    nextOf(nid).forEach(walk)
  }
  starts.forEach(walk)
  nodes.value
    .filter(n => !visited.has(n.id) && !n.parentNode)
    .sort((a, b) => a.position.x - b.position.x)
    .forEach(n => order.push(n.id))
  order.forEach((id, idx) => {
    const n = nodes.value.find(nn => nn.id === id)
    if (!n.parentNode && n.data.type !== 'group-node')
      n.position = { x: 120 + idx * spacing, y: baseY }
  })
  if (vueFlowInstance.value)
    vueFlowInstance.value.fitView()
}

const debugOpen = ref(false)
const simRunning = ref(false)
const simPaused = ref(false)
const simSpeed = ref(400)
const simLogs = ref([])
const stepMode = ref(false)
function log(msg) {
  simLogs.value.push({ t: Date.now(), msg })
}
function openDebug() {
  debugOpen.value = true
}
function stopSimulation() {
  simRunning.value = false
  simPaused.value = false
}
function pauseSimulation() {
  if (simRunning.value)
    simPaused.value = true
}
function resumeSimulation() {
  if (simRunning.value)
    simPaused.value = false
}
async function wait(ms) {
  const step = 50
  let elapsed = 0
  while (elapsed < ms) {
    if (simPaused.value) {
      await new Promise(r => setTimeout(r, step))
      continue
    }
    await new Promise(r => setTimeout(r, step))
    elapsed += step
  }
}
function getStarts() {
  return nodes.value
    .filter(n => n.data.type === 'input-node')
    .map(n => n.id)
}
function outsOf(nid) {
  return edges.value.filter(e => e.source === nid)
}
async function execute() {
  simRunning.value = true
  simPaused.value = false
  simLogs.value = []
  const visited = new Set()
  const stepExec = async (nid) => {
    const node = nodes.value.find(n => n.id === nid)
    if (!node || visited.has(nid))
      return
    visited.add(nid)
    node.data.status = 'running'
    log(`节点 ${node.data.title} 开始`)
    await wait(simSpeed.value)
    node.data.status = 'done'
    log(`节点 ${node.data.title} 完成`)
    const outs = outsOf(nid)
    for (const e of outs) {
      e.data.status = 'running'
      await wait(Math.max(200, simSpeed.value / 2))
      e.data.status = 'default'
    }
    if (stepMode.value) {
      simRunning.value = false
      simPaused.value = true
      stepMode.value = false
      return
    }
    for (const e of outs) {
      await stepExec(e.target)
    }
  }
  for (const s of getStarts()) {
    await stepExec(s)
  }
  simRunning.value = false
}
async function stepOnce() {
  if (!simRunning.value) {
    stepMode.value = true
    await execute()
  }
  else {
    stepMode.value = true
  }
}
function resetStatus() {
  nodes.value.forEach((n) => {
    n.data.status = 'ready'
  })
  edges.value.forEach((e) => {
    e.data.status = 'default'
  })
}

const exportOpen = ref(false)
const exportText = ref('')
function openExport() {
  exportText.value = JSON.stringify(
    { version: SCHEMA_VERSION, nodes: nodes.value, edges: edges.value },
    null,
    2,
  )
  exportOpen.value = true
}
const importOpen = ref(false)
const importText = ref('')
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
    }
    importOpen.value = false
    nextTick(() => {
      alignLinear()
      if (vueFlowInstance.value)
        vueFlowInstance.value.fitView()
    })
  }
  catch {}
}
watch(
  () => ({ nodes: nodes.value, edges: edges.value }),
  (val) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(val))
    }
    catch {}
  },
  { deep: true },
)

onMounted(() => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) {
      const obj = JSON.parse(raw)
      if (Array.isArray(obj.nodes) && Array.isArray(obj.edges)) {
        nodes.value = obj.nodes
        edges.value = obj.edges
      }
    }
  }
  catch {}
})
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
