/**
 * AI 服务商配置
 * 定义所有支持的 AI 服务提供商
 */

export const AI_PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: 'si-openai',
    baseUrl: 'https://api.openai.com/v1',
    supportsChat: true,
    supportsImage: true,
    supportsVideo: false,
    supportsAudio: true,
    requiresAuth: true,
    authType: 'bearer', // bearer, apikey, custom
  },
  zhipu: {
    id: 'zhipu',
    name: '智谱 AI',
    icon: 'ri-robot-line',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    supportsChat: true,
    supportsImage: true,
    supportsVideo: true, // CogVideoX
    supportsAudio: false,
    requiresAuth: true,
    authType: 'bearer',
  },
  qwen: {
    id: 'qwen',
    name: '阿里通义千问',
    icon: 'ri-cloud-line',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    supportsChat: true,
    supportsImage: true, // 通义万相
    supportsVideo: false,
    supportsAudio: true,
    requiresAuth: true,
    authType: 'apikey',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: 'fa-brain',
    baseUrl: 'https://api.deepseek.com',
    supportsChat: true,
    supportsImage: false,
    supportsVideo: false,
    supportsAudio: false,
    requiresAuth: true,
    authType: 'bearer',
  },
  hunyuan: {
    id: 'hunyuan',
    name: '腾讯混元',
    icon: 'ri-qq-line',
    baseUrl: 'https://hunyuan.tencentcloudapi.com',
    supportsChat: true,
    supportsImage: true,
    supportsVideo: false,
    supportsAudio: false,
    requiresAuth: true,
    authType: 'custom', // 需要 SecretId 和 SecretKey
  },
  baidu: {
    id: 'baidu',
    name: '百度文心',
    icon: 'ri-computer-line',
    baseUrl: 'https://aip.baidubce.com',
    supportsChat: true,
    supportsImage: true, // 文心一格
    supportsVideo: false,
    supportsAudio: true,
    requiresAuth: true,
    authType: 'custom', // API Key + Secret Key
  },
  xfyun: {
    id: 'xfyun',
    name: '讯飞星火',
    icon: 'ri-star-line',
    baseUrl: 'https://spark-api.xf-yun.com',
    supportsChat: true,
    supportsImage: false,
    supportsVideo: false,
    supportsAudio: true,
    requiresAuth: true,
    authType: 'custom', // AppId + APIKey + APISecret
  },
  moonshot: {
    id: 'moonshot',
    name: 'Moonshot AI (Kimi)',
    icon: 'ri-moon-line',
    baseUrl: 'https://api.moonshot.cn/v1',
    supportsChat: true,
    supportsImage: false,
    supportsVideo: false,
    supportsAudio: false,
    requiresAuth: true,
    authType: 'bearer',
  },
}

/**
 * 获取支持特定能力的服务商列表
 */
export function getProvidersByCapability(capability) {
  return Object.values(AI_PROVIDERS).filter(provider => provider[capability])
}

/**
 * 获取服务商配置
 */
export function getProviderConfig(providerId) {
  return AI_PROVIDERS[providerId]
}
