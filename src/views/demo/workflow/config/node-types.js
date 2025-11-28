/**
 * 工作流节点类型定义
 */

export const NODE_CATEGORIES = {
  IO: '输入输出',
  AI_GENERATION: 'AI 生成',
  PROCESSING: '数据处理',
  LOGIC: '逻辑控制',
  DATA: '数据操作',
  ORGANIZATION: '组织管理',
}

export const NODE_TYPES = [
  // ==================== 输入输出节点 ====================
  {
    type: 'input-node',
    label: '输入',
    category: NODE_CATEGORIES.IO,
    icon: 'ri-login-circle-line',
    color: '#059669',
    description: '工作流的起始节点，接收外部输入',
    defaultParams: {
      schema: 'text',
      placeholder: '请输入内容...',
    },
  },
  {
    type: 'output-node',
    label: '输出',
    category: NODE_CATEGORIES.IO,
    icon: 'ri-logout-circle-line',
    color: '#10b981',
    description: '工作流的输出节点，返回最终结果',
    defaultParams: {
      format: 'text',
    },
  },

  // ==================== AI 生成节点 ====================
  {
    type: 'llm-node',
    label: 'LLM 文本生成',
    category: NODE_CATEGORIES.AI_GENERATION,
    icon: 'ri-robot-line',
    color: '#2563eb',
    description: '使用大语言模型生成文本内容',
    defaultParams: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: '你是一个有用的助手。',
    },
  },
  {
    type: 'image-gen-node',
    label: '图片生成',
    category: NODE_CATEGORIES.AI_GENERATION,
    icon: 'ri-image-line',
    color: '#db2777',
    description: '根据文本描述生成图片',
    defaultParams: {
      provider: 'openai',
      model: 'dall-e-3',
      size: '1024x1024',
      style: 'natural',
      quality: 'standard',
    },
  },
  {
    type: 'video-gen-node',
    label: '视频生成',
    category: NODE_CATEGORIES.AI_GENERATION,
    icon: 'ri-video-line',
    color: '#8b5cf6',
    description: '根据文本或图片生成视频',
    defaultParams: {
      provider: 'zhipu',
      model: 'cogvideox',
      duration: 5,
      resolution: '720p',
      fps: 24,
    },
  },
  {
    type: 'audio-gen-node',
    label: '音频生成',
    category: NODE_CATEGORIES.AI_GENERATION,
    icon: 'ri-volume-up-line',
    color: '#f59e0b',
    description: '文本转语音或生成音乐',
    defaultParams: {
      provider: 'openai',
      model: 'tts-1',
      voice: 'alloy',
      speed: 1.0,
    },
  },
  {
    type: 'image-to-video-node',
    label: '图生视频',
    category: NODE_CATEGORIES.AI_GENERATION,
    icon: 'ri-film-line',
    color: '#a855f7',
    description: '将静态图片转换为动态视频',
    defaultParams: {
      provider: 'zhipu',
      duration: 5,
      motion: 'auto',
    },
  },

  // ==================== 数据处理节点 ====================
  {
    type: 'text-process-node',
    label: '文本处理',
    category: NODE_CATEGORIES.PROCESSING,
    icon: 'ri-text',
    color: '#6366f1',
    description: '文本格式化、提取、替换等操作',
    defaultParams: {
      operation: 'format',
      options: {},
    },
  },
  {
    type: 'image-process-node',
    label: '图片处理',
    category: NODE_CATEGORIES.PROCESSING,
    icon: 'ri-edit-line',
    color: '#ec4899',
    description: '图片裁剪、缩放、滤镜等操作',
    defaultParams: {
      operation: 'resize',
      width: 1024,
      height: 1024,
    },
  },
  {
    type: 'ocr-node',
    label: 'OCR 识别',
    category: NODE_CATEGORIES.PROCESSING,
    icon: 'ri-scan-line',
    color: '#14b8a6',
    description: '从图片中识别文字',
    defaultParams: {
      provider: 'qwen',
      language: 'auto',
    },
  },
  {
    type: 'embedding-node',
    label: '向量化',
    category: NODE_CATEGORIES.PROCESSING,
    icon: 'ri-code-box-line',
    color: '#06b6d4',
    description: '将文本转换为向量表示',
    defaultParams: {
      provider: 'openai',
      model: 'text-embedding-3-small',
    },
  },

  // ==================== 逻辑控制节点 ====================
  {
    type: 'branch-node',
    label: '条件分支',
    category: NODE_CATEGORIES.LOGIC,
    icon: 'ri-git-branch-line',
    color: '#d97706',
    description: '根据条件选择不同的执行路径',
    defaultParams: {
      condition: '',
      operator: 'contains',
    },
  },
  {
    type: 'loop-node',
    label: '循环',
    category: NODE_CATEGORIES.LOGIC,
    icon: 'ri-loop-left-line',
    color: '#ea580c',
    description: '重复执行指定的节点或子流程',
    defaultParams: {
      type: 'count',
      count: 3,
      maxIterations: 10,
    },
  },
  {
    type: 'merge-node',
    label: '合并',
    category: NODE_CATEGORIES.LOGIC,
    icon: 'ri-merge-cells-horizontal',
    color: '#84cc16',
    description: '合并多个输入为一个输出',
    defaultParams: {
      method: 'concat',
      separator: '\n',
    },
  },

  // ==================== 数据操作节点 ====================
  {
    type: 'http-node',
    label: 'HTTP 请求',
    category: NODE_CATEGORIES.DATA,
    icon: 'ri-global-line',
    color: '#3b82f6',
    description: '发起 HTTP 请求获取外部数据',
    defaultParams: {
      method: 'GET',
      url: '',
      headers: {},
    },
  },
  {
    type: 'database-node',
    label: '数据库',
    category: NODE_CATEGORIES.DATA,
    icon: 'ri-database-line',
    color: '#0891b2',
    description: '查询或操作数据库',
    defaultParams: {
      type: 'query',
      sql: '',
    },
  },
  {
    type: 'file-node',
    label: '文件操作',
    category: NODE_CATEGORIES.DATA,
    icon: 'ri-file-line',
    color: '#64748b',
    description: '读取或写入文件',
    defaultParams: {
      operation: 'read',
      path: '',
    },
  },

  // ==================== 组织管理节点 ====================
  {
    type: 'group-node',
    label: '工作组',
    category: NODE_CATEGORIES.ORGANIZATION,
    icon: 'ri-folder-line',
    color: '#9ca3af',
    description: '将多个节点组织在一起',
    defaultParams: {
      collapsed: false,
    },
  },
  {
    type: 'tool-node',
    label: '自定义工具',
    category: NODE_CATEGORIES.ORGANIZATION,
    icon: 'ri-tools-line',
    color: '#7c3aed',
    description: '执行自定义的 JavaScript 代码',
    defaultParams: {
      code: '// 在这里编写代码\nreturn input;',
    },
  },
]

/**
 * 获取节点配置
 */
export function getNodeConfig(type) {
  const nodeType = NODE_TYPES.find(t => t.type === type)
  if (!nodeType) {
    return null
  }
  return {
    title: nodeType.label,
    icon: nodeType.icon,
    type,
    status: 'ready',
    params: { ...nodeType.defaultParams },
    variables: {},
    description: nodeType.description,
  }
}

/**
 * 按分类获取节点
 */
export function getNodesByCategory() {
  const result = {}
  NODE_TYPES.forEach((node) => {
    const category = node.category
    if (!result[category]) {
      result[category] = []
    }
    result[category].push(node)
  })
  return result
}

/**
 * 获取节点类型的颜色
 */
export function getNodeColor(type) {
  const nodeType = NODE_TYPES.find(t => t.type === type)
  return nodeType?.color || '#9ca3af'
}

