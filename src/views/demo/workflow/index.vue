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
        <n-button size="small" tertiary @click="autoLayout">
          <template #icon>
            <h-icon name="ri-layout-grid-line" />
          </template>
          自动布局
        </n-button>
        <n-switch v-model:value="useStream" size="small" :round="false" style="margin-right: 8px">
          <template #checked>
            流式
          </template>
          <template #unchecked>
            非流
          </template>
        </n-switch>
        <n-button size="small" tertiary :loading="isRunning" :disabled="isRunning" @click="runWorkflow">
          <template #icon>
            <h-icon name="ri-play-circle-line" />
          </template>
          {{ isRunning ? '运行中...' : '运行工作流' }}
        </n-button>
      </div>
      <div class="toolbar-right">
        <n-progress type="line" :percentage="progressPercent" indicator-placement="inside" style="width: 180px" />
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
        <special-node v-bind="props" @run-node="runNodeById" @view-logs="openLogsForNode" />
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
          <n-alert v-if="getNodeIssues(selectedNode).length" type="warning" style="margin-bottom: 8px">
            缺少: {{ getNodeIssues(selectedNode).join('，') }}
            <n-button size="tiny" type="primary" style="margin-left:8px" @click="fixNodeIssues">
              一键修复
            </n-button>
          </n-alert>
          <n-form-item label="标题">
            <n-input v-model:value="selectedNode.data.title" />
          </n-form-item>
          <n-form-item label="描述">
            <n-input v-model:value="selectedNode.data.description" type="textarea" :rows="2" />
          </n-form-item>

          <!-- 输入节点配置：支持文本/图片上传 -->
          <template v-if="selectedNode.data.type === 'input-node'">
            <n-form-item label="输入类型">
              <n-select
                v-model:value="selectedNode.data.params.schema"
                :options="[
                  { label: '文本', value: 'text' },
                  { label: '图片', value: 'image' },
                ]"
              />
            </n-form-item>
            <template v-if="selectedNode.data.params.schema === 'text'">
              <n-form-item label="文本输入">
                <n-input
                  v-model:value="selectedNode.data.variables.input"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入起始输入文本"
                />
              </n-form-item>
            </template>
            <template v-else>
              <n-form-item label="图片URL">
                <n-input
                  v-model:value="selectedNode.data.variables.input"
                  placeholder="粘贴图片URL，或下方上传文件"
                />
              </n-form-item>
              <n-form-item label="上传图片文件">
                <input type="file" accept="image/*" @change="onImageFileChange">
              </n-form-item>
              <n-form-item v-if="selectedNode.data.variables.input" label="预览">
                <n-image :src="selectedNode.data.variables.input" style="max-width: 100%; border-radius: 8px;" />
              </n-form-item>
            </template>
          </template>

          <!-- LLM 节点配置 -->
          <template v-if="selectedNode.data.type === 'llm-node'">
            <n-form-item label="AI 服务商">
              <n-select
                v-model:value="selectedNode.data.params.provider"
                :options="chatProviders"
                @update:value="onProviderChange"
              />
            </n-form-item>
            <n-form-item label="提示词预设">
              <n-select
                v-model:value="selectedNode.data.params.preset"
                :options="LLM_PROMPT_PRESETS.map(p => ({ label: p.label, value: p.value }))"
                @update:value="applyLlmPreset"
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
            <n-form-item label="提示词">
              <n-input
                v-model:value="selectedNode.data.params.prompt"
                type="textarea"
                :rows="3"
                placeholder="请输入图片生成提示词，不填则使用上游输入"
              />
            </n-form-item>
            <n-form-item label="尺寸">
              <n-select
                v-model:value="selectedNode.data.params.size"
                :options="imageSizes"
              />
            </n-form-item>
          </template>

          <!-- OCR 节点配置 -->
          <template v-if="selectedNode.data.type === 'ocr-node'">
            <n-form-item label="OCR 服务商">
              <n-select
                v-model:value="selectedNode.data.params.provider"
                :options="[
                  { label: '阿里通义', value: 'qwen' },
                  { label: '百度 OCR', value: 'baidu' },
                  { label: '智谱 AI', value: 'zhipu' },
                  { label: 'OpenAI', value: 'openai' },
                ]"
              />
            </n-form-item>
            <n-form-item label="识别语言">
              <n-select
                v-model:value="selectedNode.data.params.language"
                :options="[
                  { label: '自动检测', value: 'auto' },
                  { label: '中文', value: 'zh' },
                  { label: '英文', value: 'en' },
                  { label: '中英混合', value: 'zh_en' },
                ]"
              />
            </n-form-item>
            <n-form-item label="输出格式">
              <n-select
                v-model:value="selectedNode.data.params.outputFormat"
                :options="[
                  { label: '纯文本', value: 'text' },
                  { label: 'JSON', value: 'json' },
                  { label: 'Markdown', value: 'markdown' },
                ]"
              />
            </n-form-item>
            <n-form-item v-if="selectedNode.data.params.provider === 'baidu'" label="识别表格">
              <n-switch v-model:value="selectedNode.data.params.detectTable" />
            </n-form-item>
            <n-divider />
            <n-form-item label="图片URL">
              <n-input
                v-model:value="selectedNode.data.variables.input"
                placeholder="粘贴图片URL，或下方上传文件"
              />
            </n-form-item>
            <n-form-item label="上传图片文件">
              <input type="file" accept="image/*" @change="onOcrFileChange">
            </n-form-item>
            <n-form-item v-if="selectedNode.data.variables.input" label="预览">
              <n-image :src="selectedNode.data.variables.input" style="max-width: 100%; border-radius: 8px;" />
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

          <!-- 视觉理解节点配置 -->
          <template v-if="selectedNode.data.type === 'vision-node'">
            <n-form-item label="提示词">
              <n-input
                v-model:value="selectedNode.data.params.prompt"
                type="textarea"
                :rows="3"
                placeholder="请填写图片分析提示词"
              />
            </n-form-item>
          </template>

          <!-- 只在输出节点展示AI内容和图片 -->
          <template v-if="selectedNode.data.type === 'output-node'">
            <!-- 收集的图片展示 -->
            <template v-if="selectedNode.data.images && selectedNode.data.images.length > 0">
              <n-divider style="margin: 20px 0;">
                <n-text depth="3" style="font-size: 12px;">
                  🖼️ 生成的图片 ({{ selectedNode.data.images.length }})
                </n-text>
              </n-divider>

              <!-- 使用 n-image-group 支持多图预览和切换 -->
              <n-image-group show-toolbar-tooltip>
                <div class="images-gallery">
                  <div
                    v-for="(img, index) in selectedNode.data.images"
                    :key="index"
                    class="image-item"
                  >
                    <n-image
                      :src="img.url"
                      :alt="img.prompt || 'AI生成的图片'"
                      object-fit="cover"
                      show-toolbar-tooltip
                      :img-props="{
                        style: {
                          width: '100%',
                          height: '200px',
                          borderRadius: '8px',
                          cursor: 'zoom-in',
                        },
                      }"
                      :previewed-img-props="{
                        style: {
                          maxWidth: '90vw',
                          maxHeight: '90vh',
                        },
                      }"
                    />
                    <div class="image-actions">
                      <n-button size="tiny" quaternary @click.stop="copyOutput(img.url)">
                        <template #icon>
                          <h-icon name="co-copy" />
                        </template>
                      </n-button>
                    </div>
                    <div v-if="img.prompt" class="image-title">
                      {{ img.prompt }}
                    </div>
                  </div>
                </div>
              </n-image-group>

              <n-text depth="3" style="font-size: 11px; display: block; text-align: center; margin-top: 8px;">
                💡 点击图片可放大预览，支持左右切换
              </n-text>
            </template>

            <!-- AI文本内容展示 -->
            <template v-if="selectedNode.data.variables?.output">
              <n-divider style="margin: 20px 0;">
                <n-text depth="3" style="font-size: 12px;">
                  📝 AI 生成内容
                </n-text>
              </n-divider>

              <div class="ai-output-section">
                <div class="output-content-box">
                  <n-scrollbar style="max-height: 500px;">
                    <div class="output-text">
                      {{ selectedNode.data.variables.output }}
                    </div>
                  </n-scrollbar>
                </div>

                <!-- 操作按钮 -->
                <div class="output-actions">
                  <n-space justify="space-between" style="width: 100%;">
                    <n-space>
                      <n-button size="small" @click="copyOutput(selectedNode.data.variables.output)">
                        <template #icon>
                          <h-icon name="co-copy" />
                        </template>
                        复制
                      </n-button>
                      <n-button size="small" quaternary @click="clearOutput(selectedNode.id)">
                        <template #icon>
                          <h-icon name="ri-delete-bin-line" />
                        </template>
                        清除
                      </n-button>
                    </n-space>
                    <n-tag size="small" :bordered="false">
                      {{ selectedNode.data.variables.output.length }} 字符
                    </n-tag>
                  </n-space>
                </div>
              </div>
            </template>

            <!-- 无内容提示 -->
            <template v-if="!selectedNode.data.images?.length && !selectedNode.data.variables?.output">
              <n-empty description="运行工作流后，结果将在这里展示" style="margin: 40px 0;">
                <template #icon>
                  <h-icon name="ri-inbox-line" style="font-size: 48px; color: #ccc;" />
                </template>
              </n-empty>
            </template>
          </template>

          <!-- 删除节点按钮 -->
          <n-space vertical>
            <n-button type="primary" block style="margin-top: 8px;" @click="runSelectedNode">
              <template #icon>
                <h-icon name="ri-play-mini-fill" />
              </template>
              试跑该节点
            </n-button>
            <n-button type="error" block style="margin-top: 8px;" @click="deleteNode">
              <template #icon>
                <h-icon name="ri-delete-bin-line" />
              </template>
              删除节点
            </n-button>
          </n-space>
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
              <n-space :size="8" style="margin-bottom: 6px">
                <n-tag size="small" :bordered="false" type="info">
                  状态: {{ log.status || (log.error ? 'error' : 'success') }}
                </n-tag>
                <n-tag v-if="Number(log.retryCount) > 0" size="small" :bordered="false" type="warning">
                  重试: {{ log.retryCount }}
                </n-tag>
                <n-tag size="small" :bordered="false">
                  耗时: {{ log.duration }}ms
                </n-tag>
              </n-space>
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
import { LLM_PROMPT_PRESETS } from './config/presets'
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
const useStream = ref(false)
const progressPercent = computed(() => {
  const total = nodes.value.length
  if (!total)
    return 0
  const done = nodes.value.filter(n => n.data.status === 'done').length
  const running = nodes.value.filter(n => n.data.status === 'running').length
  const percent = Math.min(100, Math.round(((done + running * 0.5) / total) * 100))
  return percent
})

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
    // 若未配置，则使用默认 Base URL，避免显示其它厂商地址
    if (!baseUrls[providerId]) {
      baseUrls[providerId] = AI_PROVIDERS[providerId].baseUrl
    }
  })

  providerConfig.value = { apiKeys, baseUrls }

  // 调试日志
  const configuredProviders = Object.keys(apiKeys)
  if (configuredProviders.length > 0) {
    console.warn('[Workflow] 已加载配置的服务商:', configuredProviders)
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

function onImageFileChange(e) {
  const file = e.target?.files?.[0]
  if (!file)
    return
  const reader = new FileReader()
  reader.onload = () => {
    if (!selectedNode.value)
      return
    if (!selectedNode.value.data.variables)
      selectedNode.value.data.variables = {}
    selectedNode.value.data.variables.input = String(reader.result)
    selectedNode.value.data.params.fileName = file.name
    window.$message?.success('图片已读取')
  }
  reader.onerror = () => {
    window.$message?.error('图片读取失败')
  }
  reader.readAsDataURL(file)
}

function onOcrFileChange(e) {
  const file = e.target?.files?.[0]
  if (!file)
    return
  const reader = new FileReader()
  reader.onload = () => {
    if (!selectedNode.value)
      return
    if (!selectedNode.value.data.variables)
      selectedNode.value.data.variables = {}
    selectedNode.value.data.variables.input = String(reader.result)
    selectedNode.value.data.params.fileName = file.name
    window.$message?.success('图片已读取')
  }
  reader.onerror = () => {
    window.$message?.error('图片读取失败')
  }
  reader.readAsDataURL(file)
}
function applyLlmPreset(val) {
  const p = LLM_PROMPT_PRESETS.find(x => x.value === val)
  if (p && selectedNode.value) {
    selectedNode.value.data.params.systemPrompt = p.prompt
  }
}

function getNodeIssues(node) {
  const issues = []
  const t = node.data.type
  const p = node.data.params || {}
  if (t === 'llm-node' || t === 'image-gen-node' || t === 'video-gen-node') {
    if (!p.provider)
      issues.push('服务商')
    if (!p.model)
      issues.push('模型')
  }
  if (t === 'ocr-node') {
    if (!p.provider)
      issues.push('服务商')
    const incoming = edges.value.filter(e => e.target === node.id)
    if (incoming.length === 0 && !node.data?.variables?.input)
      issues.push('图片输入')
  }
  return issues
}

function fixNodeIssues() {
  if (!selectedNode.value)
    return
  const n = selectedNode.value
  const t = n.data.type
  if (t === 'llm-node') {
    if (!n.data.params.provider)
      n.data.params.provider = chatProviders.value[0]?.value
    const models = getCurrentModels('chat')
    if (!n.data.params.model && models.length)
      n.data.params.model = models[0].value
  }
  else if (t === 'image-gen-node') {
    if (!n.data.params.provider)
      n.data.params.provider = imageProviders.value[0]?.value
    const models = getCurrentModels('image')
    if (!n.data.params.model && models.length)
      n.data.params.model = models[0].value
  }
  else if (t === 'video-gen-node') {
    if (!n.data.params.provider)
      n.data.params.provider = videoProviders.value[0]?.value
    const models = getCurrentModels('video')
    if (!n.data.params.model && models.length)
      n.data.params.model = models[0].value
  }
  else if (t === 'ocr-node') {
    if (!n.data.params.provider)
      n.data.params.provider = 'qwen'
    if (!n.data.variables)
      n.data.variables = {}
    if (!n.data.variables.input)
      n.data.variables.input = ''
  }
  window.$message?.success('已应用默认配置')
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

// AI输出相关工具函数
function copyOutput(text) {
  if (!text)
    return
  navigator.clipboard.writeText(text).then(() => {
    window.$message?.success('已复制到剪贴板')
  }).catch(() => {
    window.$message?.error('复制失败')
  })
}

function clearOutput(nodeId) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node?.data?.variables) {
    delete node.data.variables.output
    window.$message?.success('已清除输出')
  }
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

async function runSelectedNode() {
  if (!selectedNode.value)
    return
  const node = selectedNode.value
  const exec = new WorkflowExecutor({ enableRetry: true, enableStream: useStream.value })
  const input = (() => {
    const incoming = edges.value.filter(e => e.target === node.id)
    if (incoming.length === 0) {
      return nodes.value.find(n => n.data.type === 'input-node')?.data?.variables?.input || ''
    }
    if (incoming.length === 1) {
      const srcId = incoming[0].source
      const src = nodes.value.find(n => n.id === srcId)
      return src?.data?.variables?.output || ''
    }
    return incoming.map(e => nodes.value.find(n => n.id === e.source)?.data?.variables?.output || '').filter(Boolean).join('\n')
  })()
  const context = {
    apiKeys: providerConfig.value.apiKeys,
    baseUrls: providerConfig.value.baseUrls,
    getApiKey: p => providerConfig.value.apiKeys[p],
    getBaseUrl: p => providerConfig.value.baseUrls[p],
    defaultInput: input,
    strictMode: false,
  }
  try {
    node.data.status = 'running'
    const executor = (await import('./executors')).getExecutor(node.data.type)
    const renderedInput = String(input)
    const output = await executor.execute(node, renderedInput, context)
    node.data.status = 'done'
    node.data.variables = node.data.variables || {}
    node.data.variables.output = (typeof output === 'object')
      ? (output.markdown || JSON.stringify(output, null, 2))
      : String(output)
    window.$message?.success('节点试跑完成')
  }
  catch (e) {
    node.data.status = 'failed'
    window.$message?.error(`试跑失败: ${e.message}`)
  }
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
    const tplData = node.data || {}

    // 合并配置：优先使用模板中的配置，缺失的使用默认配置
    const nodeData = {
      type: systemType, // 使用系统节点类型
      title: tplData.label || tplData.title || defaultConfig.title || '未命名节点',
      description: tplData.description || defaultConfig.description || '',
      icon: defaultConfig.icon || getNodeTypeIcon(node.type),
      params: {
        ...(defaultConfig.params || {}),
        ...(tplData.params || {}),
      },
      variables: tplData.variables || {},
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

function autoLayout() {
  const levelMap = new Map()
  const inDegree = new Map()
  nodes.value.forEach(n => inDegree.set(n.id, 0))
  edges.value.forEach(e => inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1))
  const queue = nodes.value.filter(n => inDegree.get(n.id) === 0).map(n => n.id)
  queue.forEach(id => levelMap.set(id, 0))
  while (queue.length) {
    const id = queue.shift()
    const lvl = levelMap.get(id) || 0
    edges.value.filter(e => e.source === id).forEach((e) => {
      const nextLvl = Math.max(lvl + 1, levelMap.get(e.target) ?? 0)
      levelMap.set(e.target, nextLvl)
      queue.push(e.target)
    })
  }
  const colSpacing = 300
  const rowSpacing = 220
  const columns = new Map()
  nodes.value.forEach((n) => {
    const lvl = levelMap.get(n.id) || 0
    if (!columns.has(lvl))
      columns.set(lvl, [])
    columns.get(lvl).push(n)
  })
  columns.forEach((arr, lvl) => {
    arr.forEach((n, idx) => {
      n.position = { x: 120 + lvl * colSpacing, y: 120 + idx * rowSpacing }
    })
  })
  nextTick(() => handleFit())
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

    executor.options.enableStream = useStream.value
    console.warn('[Workflow] 执行上下文配置:', {
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

    executor.on('streamChunk', ({ nodeId, chunk }) => {
      const node = nodes.value.find(n => n.id === nodeId)
      if (!node)
        return
      if (!node.data.variables)
        node.data.variables = {}
      const prev = node.data.variables.output || ''
      node.data.variables.output = String(prev) + String(chunk)
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
  }
  catch (error) {
    console.error('工作流执行失败:', error)
    window.$message?.error(`工作流执行失败: ${error.message}`)
  }
  finally {
    isRunning.value = false
  }
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
    // 深度序列化并清理数据，移除不可序列化的对象
    const sanitizeLogs = (logs) => {
      return logs.map(log => ({
        nodeId: log.nodeId,
        nodeTitle: log.nodeTitle,
        status: log.status,
        duration: log.duration,
        timestamp: log.timestamp,
        // 只保留可序列化的数据
        input: typeof log.input === 'string' ? log.input : JSON.stringify(log.input || {}),
        output: typeof log.output === 'string' ? log.output : JSON.stringify(log.output || {}),
        error: log.error ? String(log.error) : undefined,
      }))
    }

    const history = {
      workflowId: currentWorkflow.value.id,
      workflowName: currentWorkflow.value.name,
      status: result.success ? 'success' : 'failed',
      duration: result.logs.reduce((sum, log) => sum + (log.duration || 0), 0),
      logs: sanitizeLogs(result.logs),
      nodeCount: nodes.value.length,
      edgeCount: edges.value.length,
    }

    await workflowStorage.saveHistory(history)
    console.warn('[Workflow] 执行历史已保存')
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

/* ==================== AI 输出展示区域样式 ==================== */

/* 优化的提示信息框 */
.content-info-tip {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
  transition: all 0.3s ease;
}

.content-info-tip:hover {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12);
  transform: translateX(2px);
}

.tip-icon {
  font-size: 20px;
  color: #3b82f6;
  animation: pulse-subtle 2s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 2px;
}

.tip-desc {
  font-size: 12px;
  color: #60a5fa;
  opacity: 0.9;
}

/* AI输出区域容器 */
.ai-output-section {
  margin-top: 12px;
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 输出头部 - 高级渐变设计 */
.output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  border-radius: 12px;
  color: #ffffff;
  box-shadow:
    0 4px 14px rgba(16, 185, 129, 0.25),
    0 2px 6px rgba(16, 185, 129, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 头部光效装饰 */
.output-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  50%,
  100% {
    left: 100%;
  }
}

.output-header:hover {
  box-shadow:
    0 6px 20px rgba(16, 185, 129, 0.35),
    0 3px 10px rgba(16, 185, 129, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1;
}

.header-right {
  z-index: 1;
}

.output-icon {
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  animation: rotate-subtle 4s ease-in-out infinite;
}

@keyframes rotate-subtle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

.output-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

/* 内容展示框 - 现代卡片设计 */
.output-content-box {
  background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  min-height: 120px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  position: relative;
}

.output-content-box:hover {
  border-color: #10b981;
  box-shadow:
    0 4px 16px rgba(16, 185, 129, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

/* 左侧装饰条 */
.output-content-box::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20px;
  bottom: 20px;
  width: 4px;
  background: linear-gradient(to bottom, #10b981, #059669);
  border-radius: 0 4px 4px 0;
  opacity: 0.6;
}

/* 文本内容 - 优化可读性 */
.output-text {
  font-size: 14px;
  line-height: 1.9;
  color: #1f2937;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  letter-spacing: 0.2px;
  padding-left: 12px;
}

/* 美化滚动条 */
.output-text::-webkit-scrollbar {
  width: 8px;
}

.output-text::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.output-text::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #10b981, #059669);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.output-text::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #059669, #047857);
}

/* 图片画廊 - 多图展示 */
.images-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.image-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.image-item .output-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.image-item .image-actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-item:hover .image-actions {
  opacity: 1;
}

.image-item .image-actions .n-button {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.image-item .image-title {
  padding: 8px 12px;
  font-size: 12px;
  color: #64748b;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* n-image 样式优化 */
.image-item :deep(.n-image) {
  width: 100%;
  display: block;
  border-radius: 8px;
  overflow: hidden;
}

.image-item :deep(.n-image img) {
  transition: transform 0.3s ease;
}

.image-item:hover :deep(.n-image img) {
  transform: scale(1.05);
}

/* 图片展示 - 优雅设计 */
.output-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border-radius: 8px;
}

.output-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 10px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 4px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid #ffffff;
}

.output-image:hover {
  transform: scale(1.03) translateY(-2px);
  box-shadow:
    0 12px 32px rgba(16, 185, 129, 0.2),
    0 6px 12px rgba(0, 0, 0, 0.1);
}

/* 操作按钮区域 - 专业布局 */
.output-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(to right, #f9fafb, #f3f4f6);
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  margin-top: 4px;
}
</style>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
</style>
function runNodeById(id) {
  selectedNodeId.value = id
  runSelectedNode()
}

function openLogsForNode(id) {
  logsOpen.value = true
}
