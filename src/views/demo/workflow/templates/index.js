/**
 * 工作流模板库
 * 提供预设的工作流场景
 */

export const WORKFLOW_TEMPLATES = [
  {
    id: 'xiaohongshu-content',
    name: '小红书图文生成器',
    description: '输入产品描述，自动生成小红书风格的标题、文案和配图',
    category: 'content',
    icon: 'ri-image-add-line',
    workflow: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: {
            label: '产品描述输入',
            params: {
              defaultValue: '请输入产品描述...',
            },
          },
        },
        {
          id: 'llm-1',
          type: 'llm',
          position: { x: 100, y: 250 },
          data: {
            label: '生成小红书文案',
            params: {
              provider: 'zhipu',
              model: 'glm-4-flash',
              systemPrompt: `你是一个小红书文案专家。只用中文输出平台风格内容，不要任何代码、JSON、解释或分析。

请根据产品描述生成：
1. 吸引人的标题（带emoji）
2. 3-5段精彩文案（每段不超过50字，口语化，包含表情）
3. 相关话题标签（#标签）
4. 末尾附加【图片描述】一句，概括画面元素与氛围，如：
【图片描述】极简背景下产品置于中央，柔光，干净质感【

严格要求：
- 不要输出任何代码块或技术说明
- 不要使用英文技术术语
- 标签单独成行
`,
              temperature: 0.8,
            },
          },
        },
        {
          id: 'text-process-1',
          type: 'text-process',
          position: { x: 100, y: 400 },
          data: {
            label: '提取图片描述',
            params: {
              operation: 'extract',
              pattern: '【图片描述】(.*?)【',
            },
          },
        },
        {
          id: 'text-process-2',
          type: 'text-process',
          position: { x: 250, y: 400 },
          data: {
            label: '清理代码与格式',
            params: {
              operation: 'stripCode',
            },
          },
        },
        {
          id: 'image-1',
          type: 'image-gen',
          position: { x: 400, y: 400 },
          data: {
            label: '生成配图1',
            params: {
              provider: 'zhipu',
              model: 'cogview-4',
              size: '1024x1024',
              prompt: '根据{{text-process-1}}生成适合社交的产品场景图',
            },
          },
        },
        {
          id: 'merge-1',
          type: 'merge',
          position: { x: 400, y: 550 },
          data: {
            label: '合并结果',
            params: {
              format: 'json',
            },
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 400, y: 700 },
          data: {
            label: '输出结果',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'text-process-1' },
        { id: 'e3', source: 'text-process-1', target: 'image-1' },
        { id: 'e5', source: 'llm-1', target: 'text-process-2' },
        { id: 'e6a', source: 'text-process-2', target: 'merge-1' },
        { id: 'e6', source: 'image-1', target: 'merge-1' },
        { id: 'e8', source: 'merge-1', target: 'output-1' },
      ],
    },
  },
  {
    id: 'video-script',
    name: '短视频脚本生成器',
    description: '根据主题生成短视频脚本、分镜和关键帧图片',
    category: 'content',
    icon: 'ri-video-add-line',
    workflow: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: {
            label: '视频主题',
            params: {
              defaultValue: '输入短视频主题...',
            },
          },
        },
        {
          id: 'llm-1',
          type: 'llm',
          position: { x: 100, y: 250 },
          data: {
            label: '生成视频脚本',
            params: {
              provider: 'deepseek',
              model: 'deepseek-chat',
              systemPrompt: `你是一个短视频编导。请根据主题生成：
1. 视频标题和简介
2. 完整脚本（分镜头）
3. 每个镜头的画面描述
4. 旁白文案
5. BGM建议

格式要求：
【分镜1】画面描述
旁白：xxx
【分镜2】画面描述
旁白：xxx`,
              temperature: 0.7,
            },
          },
        },
        {
          id: 'llm-2',
          type: 'llm',
          position: { x: 400, y: 250 },
          data: {
            label: '优化画面描述',
            params: {
              provider: 'qwen',
              model: 'qwen-plus',
              systemPrompt: '将每个分镜的画面描述转换为适合AI绘画的英文提示词，突出视觉元素和氛围。',
            },
          },
        },
        {
          id: 'image-1',
          type: 'image-gen',
          position: { x: 400, y: 400 },
          data: {
            label: '生成关键帧',
            params: {
              provider: 'qwen',
              model: 'wanx-v1',
              size: '1024*1024',
            },
          },
        },
        {
          id: 'audio-1',
          type: 'audio-gen',
          position: { x: 100, y: 400 },
          data: {
            label: '生成旁白',
            params: {
              provider: 'qwen',
              voice: 'zhixiaobai',
            },
          },
        },
        {
          id: 'merge-1',
          type: 'merge',
          position: { x: 250, y: 550 },
          data: {
            label: '合并素材',
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 250, y: 700 },
          data: {
            label: '输出脚本包',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'llm-2' },
        { id: 'e3', source: 'llm-1', target: 'audio-1' },
        { id: 'e4', source: 'llm-2', target: 'image-1' },
        { id: 'e5', source: 'llm-1', target: 'merge-1' },
        { id: 'e6', source: 'image-1', target: 'merge-1' },
        { id: 'e7', source: 'audio-1', target: 'merge-1' },
        { id: 'e8', source: 'merge-1', target: 'output-1' },
      ],
    },
  },
  {
    id: 'ai-customer-service',
    name: 'AI 客服助手',
    description: '智能客服对话流程，支持意图识别和多轮对话',
    category: 'assistant',
    icon: 'ri-customer-service-line',
    workflow: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: {
            label: '用户问题',
          },
        },
        {
          id: 'llm-1',
          type: 'llm',
          position: { x: 100, y: 250 },
          data: {
            label: '意图识别',
            params: {
              provider: 'deepseek',
              model: 'deepseek-chat',
              systemPrompt: `分析用户问题的意图，返回以下类别之一：
- 产品咨询
- 订单查询
- 售后服务
- 投诉建议
- 其他

只返回类别名称。`,
              temperature: 0.3,
            },
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 100, y: 400 },
          data: {
            label: '路由分发',
            params: {
              conditions: [
                { value: '产品咨询', target: 'llm-2' },
                { value: '订单查询', target: 'llm-3' },
                { value: '售后服务', target: 'llm-4' },
              ],
            },
          },
        },
        {
          id: 'llm-2',
          type: 'llm',
          position: { x: -100, y: 550 },
          data: {
            label: '产品咨询回复',
            params: {
              provider: 'moonshot',
              model: 'moonshot-v1-8k',
              systemPrompt: '你是产品专家，详细介绍产品特点和优势。',
            },
          },
        },
        {
          id: 'llm-3',
          type: 'llm',
          position: { x: 100, y: 550 },
          data: {
            label: '订单查询回复',
            params: {
              provider: 'qwen',
              model: 'qwen-plus',
              systemPrompt: '你是订单客服，帮助用户查询订单状态。',
            },
          },
        },
        {
          id: 'llm-4',
          type: 'llm',
          position: { x: 300, y: 550 },
          data: {
            label: '售后服务回复',
            params: {
              provider: 'zhipu',
              model: 'glm-4',
              systemPrompt: '你是售后客服，提供退换货和维修服务指导。',
            },
          },
        },
        {
          id: 'merge-1',
          type: 'merge',
          position: { x: 100, y: 700 },
          data: {
            label: '汇总回复',
          },
        },
        {
          id: 'audio-1',
          type: 'audio-gen',
          position: { x: 100, y: 850 },
          data: {
            label: '语音回复',
            params: {
              provider: 'baidu',
              voice: 'zh_DuXiaoyao',
            },
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 100, y: 1000 },
          data: {
            label: '输出回复',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'condition-1' },
        { id: 'e3', source: 'condition-1', target: 'llm-2' },
        { id: 'e4', source: 'condition-1', target: 'llm-3' },
        { id: 'e5', source: 'condition-1', target: 'llm-4' },
        { id: 'e6', source: 'llm-2', target: 'merge-1' },
        { id: 'e7', source: 'llm-3', target: 'merge-1' },
        { id: 'e8', source: 'llm-4', target: 'merge-1' },
        { id: 'e9', source: 'merge-1', target: 'audio-1' },
        { id: 'e10', source: 'audio-1', target: 'output-1' },
      ],
    },
  },
  {
    id: 'document-processor',
    name: '智能文档处理',
    description: '批量处理文档，提取关键信息并生成结构化报告',
    category: 'automation',
    icon: 'ri-file-text-line',
    workflow: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: {
            label: '文档内容',
            params: {
              defaultValue: '粘贴文档内容或上传文件...',
            },
          },
        },
        {
          id: 'llm-1',
          type: 'llm',
          position: { x: 100, y: 250 },
          data: {
            label: '提取关键信息',
            params: {
              provider: 'moonshot',
              model: 'moonshot-v1-32k',
              systemPrompt: `你是文档分析专家。请从文档中提取：
1. 主题和摘要
2. 关键人物/机构
3. 重要日期和数字
4. 核心观点
5. 待办事项

以JSON格式返回：
{
  "summary": "摘要",
  "entities": ["人物/机构"],
  "dates": ["日期"],
  "numbers": ["数字"],
  "keyPoints": ["观点"],
  "todos": ["待办"]
}`,
              temperature: 0.3,
            },
          },
        },
        {
          id: 'llm-2',
          type: 'llm',
          position: { x: 400, y: 250 },
          data: {
            label: '生成分析报告',
            params: {
              provider: 'deepseek',
              model: 'deepseek-chat',
              systemPrompt: '基于提取的信息，生成一份结构化的分析报告，包括执行摘要、详细分析和建议。',
              temperature: 0.7,
            },
          },
        },
        {
          id: 'llm-3',
          type: 'llm',
          position: { x: 250, y: 400 },
          data: {
            label: '生成可视化建议',
            params: {
              provider: 'qwen',
              model: 'qwen-plus',
              systemPrompt: '分析数据特点，建议适合的图表类型（柱状图、折线图、饼图等）和配色方案。',
            },
          },
        },
        {
          id: 'merge-1',
          type: 'merge',
          position: { x: 250, y: 550 },
          data: {
            label: '整合报告',
            params: {
              format: 'markdown',
            },
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 250, y: 700 },
          data: {
            label: '输出分析报告',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'llm-2' },
        { id: 'e3', source: 'llm-1', target: 'llm-3' },
        { id: 'e4', source: 'llm-1', target: 'merge-1' },
        { id: 'e5', source: 'llm-2', target: 'merge-1' },
        { id: 'e6', source: 'llm-3', target: 'merge-1' },
        { id: 'e7', source: 'merge-1', target: 'output-1' },
      ],
    },
  },
  {
    id: 'ocr-document-processor',
    name: 'OCR 文档处理器',
    description: '智能识别图片中的文字,自动整理并生成结构化文档',
    category: 'automation',
    icon: 'ri-scan-line',
    workflow: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: {
            label: '图片输入',
            params: {
              schema: 'image',
              placeholder: '粘贴图片URL或上传文件',
              defaultValue: 'https://example.com/document.jpg',
            },
          },
        },
        {
          id: 'ocr-1',
          type: 'ocr',
          position: { x: 100, y: 250 },
          data: {
            label: 'OCR 文字识别',
            params: {
              provider: 'qwen',
              language: 'auto',
              outputFormat: 'text',
            },
          },
        },
        {
          id: 'llm-1',
          type: 'llm',
          position: { x: 100, y: 400 },
          data: {
            label: '内容整理优化',
            params: {
              provider: 'deepseek',
              model: 'deepseek-chat',
              systemPrompt: `你是文档整理专家。请对识别的文字进行：
1. 纠正识别错误
2. 调整格式和排版
3. 补充标点符号
4. 分段优化
5. 生成摘要

输出格式化的Markdown文档。`,
              temperature: 0.3,
            },
          },
        },
        {
          id: 'llm-2',
          type: 'llm',
          position: { x: 400, y: 400 },
          data: {
            label: '提取关键信息',
            params: {
              provider: 'qwen',
              model: 'qwen-plus',
              systemPrompt: `从文档中提取关键信息：
- 主题
- 关键人物/机构
- 重要日期
- 数字数据
- 待办事项

以JSON格式输出。`,
              temperature: 0.2,
            },
          },
        },
        {
          id: 'merge-1',
          type: 'merge',
          position: { x: 250, y: 550 },
          data: {
            label: '合并结果',
            params: {
              method: 'json',
            },
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 250, y: 700 },
          data: {
            label: '输出结构化文档',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'ocr-1' },
        { id: 'e2', source: 'ocr-1', target: 'llm-1' },
        { id: 'e3', source: 'ocr-1', target: 'llm-2' },
        { id: 'e4', source: 'llm-1', target: 'merge-1' },
        { id: 'e5', source: 'llm-2', target: 'merge-1' },
        { id: 'e6', source: 'merge-1', target: 'output-1' },
      ],
    },
  },
  {
    id: 'vision-image-analyzer',
    name: 'AI 图片智能分析',
    description: '使用 Vision 模型深度分析图片,生成详细报告',
    category: 'content',
    icon: 'ri-eye-line',
    workflow: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: {
            label: '图片URL',
            params: {
              defaultValue: 'https://example.com/image.jpg',
            },
          },
        },
        {
          id: 'vision-1',
          type: 'vision',
          position: { x: 100, y: 250 },
          data: {
            label: '基础场景识别',
            params: {
              provider: 'openai',
              model: 'gpt-4o',
              prompt: '请详细描述这张图片：场景、主体、色彩、构图、氛围等。',
              temperature: 0.7,
            },
          },
        },
        {
          id: 'vision-2',
          type: 'vision',
          position: { x: 350, y: 250 },
          data: {
            label: '细节分析',
            params: {
              provider: 'zhipu',
              model: 'glm-4v',
              prompt: '分析图片中的细节元素：物体、人物、文字、标志等。',
              temperature: 0.5,
            },
          },
        },
        {
          id: 'vision-3',
          type: 'vision',
          position: { x: 225, y: 400 },
          data: {
            label: '情感分析',
            params: {
              provider: 'qwen',
              model: 'qwen-vl-plus',
              prompt: '分析图片传达的情感、意图和可能的用途场景。',
              temperature: 0.6,
            },
          },
        },
        {
          id: 'merge-1',
          type: 'merge',
          position: { x: 225, y: 550 },
          data: {
            label: '汇总分析结果',
            params: {
              method: 'concat',
              separator: '\n\n---\n\n',
            },
          },
        },
        {
          id: 'llm-1',
          type: 'llm',
          position: { x: 225, y: 700 },
          data: {
            label: '生成分析报告',
            params: {
              provider: 'deepseek',
              model: 'deepseek-chat',
              systemPrompt: `你是图片分析专家。基于以下综合分析结果生成专业报告：\n\n{{merge-1}}\n\n请按如下结构输出：

# 图片分析报告

## 1. 整体概述
[综合描述]

## 2. 视觉元素
[详细元素分析]

## 3. 情感与氛围
[情感分析]

## 4. 应用建议
[适用场景和用途]

用Markdown格式输出。`,
              temperature: 0.7,
            },
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 225, y: 850 },
          data: {
            label: '输出分析报告',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'vision-1' },
        { id: 'e2', source: 'input-1', target: 'vision-2' },
        { id: 'e3', source: 'input-1', target: 'vision-3' },
        { id: 'e4', source: 'vision-1', target: 'merge-1' },
        { id: 'e5', source: 'vision-2', target: 'merge-1' },
        { id: 'e6', source: 'vision-3', target: 'merge-1' },
        { id: 'e7', source: 'merge-1', target: 'llm-1' },
        { id: 'e8', source: 'llm-1', target: 'output-1' },
      ],
    },
  },
  {
    id: 'brand-vi-generator',
    name: '品牌VI生成器',
    description: '根据品牌理念生成Logo设计和配色方案',
    category: 'design',
    icon: 'ri-palette-line',
    workflow: {
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: {
            label: '品牌理念',
            params: {
              defaultValue: '描述品牌的定位、理念、目标用户...',
            },
          },
        },
        {
          id: 'llm-1',
          type: 'llm',
          position: { x: 100, y: 250 },
          data: {
            label: 'VI设计策略',
            params: {
              provider: 'zhipu',
              model: 'glm-4',
              systemPrompt: `你是品牌设计专家。请根据品牌理念提出：
1. Logo设计方向（极简/复古/现代等）
2. 主色调建议（3-5种颜色及色值）
3. 辅助图形元素
4. 字体选择建议
5. 应用场景示例`,
              temperature: 0.8,
            },
          },
        },
        {
          id: 'text-process-1',
          type: 'text-process',
          position: { x: 100, y: 400 },
          data: {
            label: '提取Logo描述',
            params: {
              operation: 'extract',
            },
          },
        },
        {
          id: 'image-1',
          type: 'image-gen',
          position: { x: 100, y: 550 },
          data: {
            label: '生成Logo方案1',
            params: {
              provider: 'qwen',
              model: 'wanx-v1',
              size: '1024*1024',
            },
          },
        },
        {
          id: 'llm-2',
          type: 'llm',
          position: { x: 400, y: 250 },
          data: {
            label: '生成应用示例描述',
            params: {
              provider: 'qwen',
              model: 'qwen-plus',
              systemPrompt: '描述Logo在不同场景的应用效果：名片、网站、产品包装等。用英文，适合AI绘画。',
            },
          },
        },
        {
          id: 'merge-1',
          type: 'merge',
          position: { x: 250, y: 700 },
          data: {
            label: '整合VI方案',
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 250, y: 850 },
          data: {
            label: '输出VI设计包',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'input-1', target: 'llm-2' },
        { id: 'e3', source: 'llm-1', target: 'text-process-1' },
        { id: 'e4', source: 'text-process-1', target: 'image-1' },
        { id: 'e8', source: 'llm-1', target: 'merge-1' },
        { id: 'e9', source: 'image-1', target: 'merge-1' },
        { id: 'e10', source: 'merge-1', target: 'output-1' },
      ],
    },
  },
]

/**
 * 根据分类获取模板
 */
export function getTemplatesByCategory(category) {
  if (!category)
    return WORKFLOW_TEMPLATES
  return WORKFLOW_TEMPLATES.filter(t => t.category === category)
}

/**
 * 根据 ID 获取模板
 */
export function getTemplateById(id) {
  return WORKFLOW_TEMPLATES.find(t => t.id === id)
}

/**
 * 模板分类
 */
export const TEMPLATE_CATEGORIES = [
  { value: 'all', label: '全部模板', icon: 'ri-apps-line' },
  { value: 'content', label: '内容创作', icon: 'gi-quill-ink' },
  { value: 'assistant', label: '智能助手', icon: 'ri-robot-line' },
  { value: 'automation', label: '自动化', icon: 'fa-autoprefixer' },
  { value: 'design', label: '设计生成', icon: 'ri-palette-line' },
]
