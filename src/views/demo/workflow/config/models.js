/**
 * AI 模型配置
 * 定义各服务商支持的模型
 */

export const AI_MODELS = {
  // OpenAI 模型
  openai: {
    chat: [
      { value: 'gpt-4o', label: 'GPT-4o', maxTokens: 128000, cost: { input: 2.5, output: 10 } },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini', maxTokens: 128000, cost: { input: 0.15, output: 0.6 } },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', maxTokens: 128000, cost: { input: 10, output: 30 } },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', maxTokens: 16385, cost: { input: 0.5, output: 1.5 } },
    ],
    image: [
      { value: 'dall-e-3', label: 'DALL-E 3', sizes: ['1024x1024', '1024x1792', '1792x1024'] },
      { value: 'dall-e-2', label: 'DALL-E 2', sizes: ['256x256', '512x512', '1024x1024'] },
    ],
  },

  // 智谱 AI 模型
  zhipu: {
    chat: [
      { value: 'glm-4.6', label: 'GLM-4.6', maxTokens: 65536 },
      { value: 'glm-4-plus', label: 'GLM-4 Plus', maxTokens: 128000 },
      { value: 'glm-4-0520', label: 'GLM-4', maxTokens: 128000 },
      { value: 'glm-4-air', label: 'GLM-4 Air', maxTokens: 128000 },
      { value: 'glm-4-airx', label: 'GLM-4 AirX', maxTokens: 8192 },
      { value: 'glm-4-flash', label: 'GLM-4 Flash', maxTokens: 128000 },
      { value: 'glm-3-turbo', label: 'GLM-3 Turbo', maxTokens: 128000 },
    ],
    image: [
      { value: 'cogview-4', label: 'CogView-4', sizes: ['1024x1024', '768x1024', '1024x768'] },
    ],
    video: [
      { value: 'cogvideox', label: 'CogVideoX', duration: [5, 10], resolution: ['720p', '1080p'] },
    ],
  },

  // 阿里通义千问模型
  qwen: {
    chat: [
      { value: 'qwen-max', label: 'Qwen Max', maxTokens: 30000 },
      { value: 'qwen-max-longcontext', label: 'Qwen Max (长文本)', maxTokens: 1000000 },
      { value: 'qwen-plus', label: 'Qwen Plus', maxTokens: 30000 },
      { value: 'qwen-turbo', label: 'Qwen Turbo', maxTokens: 30000 },
    ],
    image: [
      { value: 'wanx-v1', label: '通义万相 V1', sizes: ['1024x1024', '720x1280', '1280x720'] },
    ],
  },

  // DeepSeek 模型
  deepseek: {
    chat: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat', maxTokens: 32000 },
      { value: 'deepseek-coder', label: 'DeepSeek Coder', maxTokens: 16000 },
    ],
  },

  // 腾讯混元模型
  hunyuan: {
    chat: [
      { value: 'hunyuan-large', label: '混元 Large', maxTokens: 8000 },
      { value: 'hunyuan-standard', label: '混元 Standard', maxTokens: 4000 },
      { value: 'hunyuan-lite', label: '混元 Lite', maxTokens: 4000 },
    ],
    image: [
      { value: 'hunyuan-image', label: '混元绘画', sizes: ['1024x1024', '768x1024', '1024x768'] },
    ],
  },

  // 百度文心模型
  baidu: {
    chat: [
      { value: 'ernie-4.0-8k', label: 'ERNIE 4.0 8K', maxTokens: 8000 },
      { value: 'ernie-3.5-8k', label: 'ERNIE 3.5 8K', maxTokens: 8000 },
      { value: 'ernie-speed', label: 'ERNIE Speed', maxTokens: 8000 },
      { value: 'ernie-lite-8k', label: 'ERNIE Lite 8K', maxTokens: 8000 },
    ],
    image: [
      { value: 'yige-v1', label: '文心一格 V1', sizes: ['1024x1024', '768x1024', '1024x768'] },
    ],
  },

  // 讯飞星火模型
  xfyun: {
    chat: [
      { value: 'spark-max', label: '星火 Max', maxTokens: 8000 },
      { value: 'spark-pro', label: '星火 Pro', maxTokens: 8000 },
      { value: 'spark-lite', label: '星火 Lite', maxTokens: 4000 },
    ],
  },

  // Moonshot AI 模型
  moonshot: {
    chat: [
      { value: 'moonshot-v1-8k', label: 'Moonshot 8K', maxTokens: 8000 },
      { value: 'moonshot-v1-32k', label: 'Moonshot 32K', maxTokens: 32000 },
      { value: 'moonshot-v1-128k', label: 'Moonshot 128K', maxTokens: 128000 },
    ],
  },
}

/**
 * 获取指定服务商和类型的模型列表
 */
export function getModels(provider, type = 'chat') {
  return AI_MODELS[provider]?.[type] || []
}

/**
 * 获取模型的详细配置
 */
export function getModelConfig(provider, type, modelValue) {
  const models = getModels(provider, type)
  return models.find(m => m.value === modelValue)
}
