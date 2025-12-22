<template>
  <n-drawer :show="show" :width="520" placement="right" @update:show="emit('update:show', $event)">
    <n-drawer-content title="AI 服务商配置">
      <!-- 服务商选择下拉菜单 -->
      <div class="provider-selector">
        <n-select
          v-model:value="activeTab"
          :options="providerOptions"
          size="large"
          :render-label="renderProviderLabel"
        />
      </div>

      <!-- 当前服务商配置 -->
      <div v-if="currentProvider" class="provider-config">
        <!-- 服务商信息卡片 -->
        <n-card class="provider-info-card" :bordered="false">
          <div class="provider-header">
            <div class="provider-icon-wrapper">
              <h-icon :name="currentProvider.icon" class="provider-icon" />
            </div>
            <div class="provider-details">
              <div class="provider-name">
                {{ currentProvider.name }}
              </div>
              <div class="provider-id">
                ID: {{ currentProvider.id }}
              </div>
              <div class="provider-capabilities">
                <n-tag v-if="currentProvider.supportsChat" size="small" type="info">
                  💬 文本
                </n-tag>
                <n-tag v-if="currentProvider.supportsImage" size="small" type="success">
                  🖼️ 图片
                </n-tag>
                <n-tag v-if="currentProvider.supportsVideo" size="small" type="warning">
                  🎬 视频
                </n-tag>
                <n-tag v-if="currentProvider.supportsAudio" size="small" type="error">
                  🎵 音频
                </n-tag>
              </div>
            </div>
          </div>
        </n-card>

        <!-- 配置表单 -->
        <n-card title="API 配置" class="config-form-card" :bordered="false">
          <n-form label-placement="top" :show-feedback="false">
            <n-form-item label="API Key" required>
              <n-input
                v-model:value="apiKeys[currentProvider.id]"
                type="password"
                show-password-on="click"
                :placeholder="`请输入 ${currentProvider.name} 的 API Key`"
                size="large"
              >
                <template #prefix>
                  🔑
                </template>
              </n-input>
            </n-form-item>
            <n-form-item label="Base URL">
              <n-input
                v-model:value="baseUrls[currentProvider.id]"
                :placeholder="currentProvider.baseUrl"
                size="large"
              >
                <template #prefix>
                  🌐
                </template>
              </n-input>
              <template #feedback>
                <n-text depth="3" style="font-size: 12px; color: #999;">
                  默认值：{{ currentProvider.baseUrl }} (只填写基础路径，不要包含 /chat/completions 等接口路径)
                </n-text>
              </template>
            </n-form-item>
          </n-form>
        </n-card>

        <!-- 提示信息 -->
        <n-alert v-if="currentProvider.id === 'openai'" type="info" class="provider-tip">
          <template #icon>
            💡
          </template>
          OpenAI API 需要科学上网，或使用代理服务。国内用户建议使用兼容 OpenAI 格式的第三方服务。
        </n-alert>
        <n-alert v-else-if="currentProvider.id === 'zhipu'" type="success" class="provider-tip">
          <template #icon>
            ✨
          </template>
          智谱 AI 支持视频生成（CogVideoX），是目前唯一支持视频的国产大模型服务商。
        </n-alert>
        <n-alert v-else-if="currentProvider.id === 'deepseek'" type="info" class="provider-tip">
          <template #icon>
            🧠
          </template>
          DeepSeek 是一家专注于深度学习的 AI 公司，提供高性能的对话模型。
        </n-alert>
        <n-alert v-else-if="currentProvider.id === 'moonshot'" type="info" class="provider-tip">
          <template #icon>
            🌙
          </template>
          Moonshot AI（月之暗面）提供 Kimi 大模型服务，支持超长上下文。
        </n-alert>
        <n-alert v-else type="default" class="provider-tip">
          <template #icon>
            📝
          </template>
          请在上方输入您的 API Key 以使用 {{ currentProvider.name }} 服务。
        </n-alert>
      </div>

      <template #footer>
        <n-space>
          <n-button @click="handleCancel">
            取消
          </n-button>
          <n-button type="primary" @click="handleSave">
            保存配置
          </n-button>
        </n-space>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup>
import { h } from 'vue'
import { AI_PROVIDERS } from '../config/providers'

const props = defineProps({
  show: Boolean,
  modelValue: Object,
})

const emit = defineEmits(['update:show', 'update:modelValue', 'save'])

const providers = Object.values(AI_PROVIDERS)

const activeTab = ref(providers[0]?.id || 'openai')
const apiKeys = ref({})
const baseUrls = ref({})

// 当前选中的服务商
const currentProvider = computed(() => {
  return providers.find(p => p.id === activeTab.value)
})

// 服务商选项列表
const providerOptions = computed(() => {
  return providers.map(provider => ({
    label: provider.name,
    value: provider.id,
    icon: provider.icon,
  }))
})

// 自定义渲染服务商选项（带图标）
function renderProviderLabel(option) {
  return h(
    'div',
    { style: 'display: flex; align-items: center; gap: 8px;' },
    [
      h('h-icon', { name: option.icon }),
      h('span', option.label),
    ],
  )
}

// 初始化配置
watch(() => props.show, (show) => {
  if (show) {
    apiKeys.value = { ...props.modelValue?.apiKeys }
    baseUrls.value = { ...props.modelValue?.baseUrls }

    // 从 localStorage 加载
    providers.forEach((provider) => {
      const savedKey = localStorage.getItem(`wf_api_key_${provider.id}`)
      const savedUrl = localStorage.getItem(`wf_base_url_${provider.id}`)
      if (savedKey)
        apiKeys.value[provider.id] = savedKey
      if (savedUrl)
        baseUrls.value[provider.id] = savedUrl
      // 未配置则填充默认值，避免显示其他厂商的地址
      if (!baseUrls.value[provider.id])
        baseUrls.value[provider.id] = provider.baseUrl
      if (!apiKeys.value[provider.id])
        apiKeys.value[provider.id] = ''
    })
  }
})

// 切换服务商时，如果当前服务商未配置 Base URL，则填充默认值
watch(activeTab, (id) => {
  const p = providers.find(x => x.id === id)
  if (p && !baseUrls.value[id]) {
    baseUrls.value[id] = p.baseUrl
  }
})

function handleSave() {
  // 清理和验证 Base URL
  providers.forEach((provider) => {
    if (baseUrls.value[provider.id]) {
      let url = baseUrls.value[provider.id].trim()
      
      // 移除末尾的斜杠
      url = url.replace(/\/+$/, '')
      
      // 移除常见的错误路径（接口端点）
      const wrongPaths = [
        '/chat/completions',
        '/v1/chat/completions',
        '/completions',
        '/images/generations',
        '/videos/generations',
      ]
      
      for (const path of wrongPaths) {
        if (url.endsWith(path)) {
          url = url.slice(0, -path.length)
          window.$message?.warning(`已自动移除 Base URL 中的接口路径：${path}`)
        }
      }
      
      baseUrls.value[provider.id] = url
    }
  })
  
  // 保存到 localStorage
  providers.forEach((provider) => {
    if (apiKeys.value[provider.id]) {
      localStorage.setItem(`wf_api_key_${provider.id}`, apiKeys.value[provider.id])
    }
    if (baseUrls.value[provider.id]) {
      localStorage.setItem(`wf_base_url_${provider.id}`, baseUrls.value[provider.id])
    }
  })

  emit('update:modelValue', {
    apiKeys: { ...apiKeys.value },
    baseUrls: { ...baseUrls.value },
  })

  emit('save')
  emit('update:show', false)
  window.$message?.success('配置已保存')
}

function handleCancel() {
  emit('update:show', false)
}
</script>

<style scoped>
.provider-selector {
  margin-bottom: 24px;
}

.provider-config {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 服务商信息卡片 */
.provider-info-card {
  position: relative;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.25);
  border-radius: 16px;
  overflow: hidden;
}

.provider-info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.provider-info-card :deep(.n-card__content) {
  padding: 24px;
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.provider-icon-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.provider-icon-wrapper:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.provider-icon {
  font-size: 36px;
  color: white;
}

.provider-details {
  flex: 1;
}

.provider-name {
  font-size: 26px;
  font-weight: 700;
  color: white;
  margin-bottom: 6px;
  line-height: 1.2;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.provider-id {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 14px;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
  font-weight: 500;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
  backdrop-filter: blur(10px);
}

.provider-capabilities {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.provider-capabilities :deep(.n-tag) {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  font-weight: 600;
  padding: 6px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

/* 配置表单卡片 */
.config-form-card {
  background: white;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 10px 30px rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.config-form-card:hover {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 12px 36px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.config-form-card :deep(.n-card-header) {
  font-weight: 600;
  font-size: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.config-form-card :deep(.n-card__content) {
  padding: 24px;
}

.config-form-card :deep(.n-form-item-label) {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

/* 提示信息 */
.provider-tip {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.provider-tip :deep(.n-alert__icon) {
  font-size: 20px;
}

.provider-tip :deep(.n-alert-body__content) {
  line-height: 1.6;
}

/* 深色模式适配 */
.dark .provider-info-card {
  background: linear-gradient(135deg, #3730a3 0%, #6b21a8 50%, #86198f 100%);
  box-shadow: 0 8px 32px rgba(55, 48, 163, 0.3);
}

.dark .provider-info-card::before {
  background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
}

.dark .config-form-card {
  background: #1a1a1a;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.dark .config-form-card :deep(.n-card-header) {
  border-bottom-color: #333;
}

/* 响应式 */
@media (max-width: 640px) {
  .provider-header {
    flex-direction: column;
    text-align: center;
  }

  .provider-name {
    font-size: 20px;
  }

  .provider-icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .provider-icon {
    font-size: 32px;
  }
}
</style>
