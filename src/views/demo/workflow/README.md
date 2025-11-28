# AI 工作流系统 - 完整重构版

## 📋 项目概述

这是一个完全重构的 AI 工作流可视化编辑器，支持多家国内外 AI 服务商，实现了文本生成、图片生成、视频生成等多种 AI 能力的编排。

## ✨ 主要特性

### 🎯 核心功能
- **可视化编辑器**：基于 Vue Flow 的拖拽式节点编辑
- **多 AI 服务商支持**：
  - ✅ OpenAI (GPT-4, DALL-E 3)
  - 🇨🇳 智谱 AI (GLM-4, CogView, CogVideoX)
  - 🇨🇳 阿里通义千问 (Qwen, 通义万相)
  - 🇨🇳 DeepSeek
  - 🇨🇳 Moonshot AI (Kimi)
- **丰富的节点类型**：
  - 输入/输出节点
  - LLM 文本生成
  - 图片生成
  - 🆕 视频生成
  - 🆕 音频生成（TTS）
  - 文本处理、条件分支、合并等逻辑节点
- **智能执行引擎**：
  - 自动依赖分析和执行顺序
  - 错误重试机制
  - 详细的执行日志
  - Markdown 报告导出
- **工程化设计**：
  - 适配器模式统一 API 调用
  - 执行器模式解耦节点逻辑
  - 完整的错误处理和类型提示

## 🏗️ 架构设计

```
workflow/
├── config/              # 配置文件
│   ├── providers.js     # AI 服务商配置
│   ├── models.js        # 模型配置
│   └── node-types.js    # 节点类型定义
├── adapters/            # AI 适配器层
│   ├── base.js          # 基础适配器接口
│   ├── openai.js        # OpenAI 适配器
│   ├── zhipu.js         # 智谱 AI 适配器
│   ├── qwen.js          # 通义千问适配器
│   ├── deepseek.js      # DeepSeek 适配器
│   └── index.js         # 适配器工厂
├── executors/           # 节点执行器
│   ├── base.js          # 基础执行器
│   ├── llm.js           # LLM 执行器
│   ├── image-gen.js     # 图片生成执行器
│   ├── video-gen.js     # 视频生成执行器
│   ├── audio-gen.js     # 音频生成执行器
│   └── index.js         # 执行器注册表
├── engine/              # 工作流引擎
│   └── executor.js      # 执行引擎
├── utils/               # 工具函数
│   ├── error-handler.js # 错误处理
│   ├── retry.js         # 重试机制
│   └── stream-handler.js# 流式处理
├── components/          # UI 组件
│   ├── SpecialNode.vue  # 节点组件
│   ├── SpecialEdge.vue  # 连线组件
│   ├── NodePalette.vue  # 节点库面板
│   └── ProviderSettings.vue # 服务商配置面板
├── index.vue            # 主界面（原版）
└── index-v2.vue         # 主界面（重构版）⭐ 推荐使用
```

## 🚀 快速开始

### 1. 安装依赖

项目已经包含必要的依赖，无需额外安装。

### 2. 配置 AI 服务商

在项目根目录创建 `.env.local` 文件：

```bash
# OpenAI
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# 智谱 AI
VITE_ZHIPU_API_KEY=your_zhipu_api_key
VITE_ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4

# 阿里通义千问
VITE_QWEN_API_KEY=sk-...
VITE_QWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1

# DeepSeek
VITE_DEEPSEEK_API_KEY=sk-...
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com

# Moonshot AI
VITE_MOONSHOT_API_KEY=sk-...
VITE_MOONSHOT_BASE_URL=https://api.moonshot.cn/v1
```

### 3. 启动项目

```bash
pnpm dev
```

访问 `http://localhost:3200`，导航到工作流页面。

### 4. 使用界面

#### 4.1 添加节点
1. 点击顶部工具栏的"添加节点"按钮
2. 从节点库中选择需要的节点类型
3. 节点会自动添加到画布上

#### 4.2 配置节点
1. 点击节点打开属性面板
2. 配置 AI 服务商、模型、参数等
3. 修改会自动保存

#### 4.3 连接节点
- 拖拽节点的输出端口到另一个节点的输入端口
- 形成工作流的执行顺序

#### 4.4 运行工作流
1. 点击"运行工作流"按钮
2. 查看节点状态变化和执行日志
3. 执行完成后会自动下载 Markdown 报告

## 🎨 节点类型说明

### 输入输出节点
- **输入节点**：工作流的起点，可以设置默认输入内容
- **输出节点**：工作流的终点，返回最终结果

### AI 生成节点
- **LLM 文本生成**：使用大语言模型生成文本
  - 支持自定义系统提示词
  - 可调节温度、最大 token 数等参数
- **图片生成**：根据文本描述生成图片
  - 支持多种尺寸和风格
- **视频生成**：生成短视频（智谱 CogVideoX）
  - 支持文本生视频和图生视频
  - 可设置时长和分辨率
- **音频生成**：文本转语音
  - 支持多种音色和语速

### 处理节点
- **文本处理**：格式化、提取、替换文本
- **合并节点**：合并多个输入
- **条件分支**：根据条件选择不同路径

### 组织节点
- **工作组**：将多个节点组织在一起
- **自定义工具**：执行自定义 JavaScript 代码

## 📦 部署到 Vercel

### 1. 配置环境变量

在 Vercel 项目设置中添加环境变量：

```
OPENAI_API_KEY=sk-...
ZHIPU_API_KEY=...
QWEN_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
MOONSHOT_API_KEY=sk-...
```

⚠️ **注意**：Vercel 环境变量不需要 `VITE_` 前缀！

### 2. 部署

```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 3. Vercel Serverless Functions

项目已配置 Serverless Functions 来处理 API 请求：

- `/api/proxy` - 统一的 AI 请求代理
- 自动使用服务端环境变量中的 API Key
- 支持所有已实现的 AI 服务商

## 🔧 开发指南

### 添加新的 AI 服务商

1. **创建适配器**

```javascript
// adapters/new-provider.js
import { BaseAdapter } from './base'

export class NewProviderAdapter extends BaseAdapter {
  async chat(messages, options = {}) {
    // 实现 chat 方法
  }

  async generateImage(prompt, options = {}) {
    // 实现图片生成
  }
}
```

2. **注册适配器**

```javascript
// adapters/index.js
import { NewProviderAdapter } from './new-provider'

const ADAPTERS = {
  // ...
  'new-provider': NewProviderAdapter,
}
```

3. **添加配置**

```javascript
// config/providers.js
export const AI_PROVIDERS = {
  // ...
  'new-provider': {
    id: 'new-provider',
    name: 'New Provider',
    icon: 'ri-robot-line',
    baseUrl: 'https://api.newprovider.com',
    supportsChat: true,
    supportsImage: true,
    // ...
  },
}
```

4. **添加模型配置**

```javascript
// config/models.js
export const AI_MODELS = {
  // ...
  'new-provider': {
    chat: [
      { value: 'model-1', label: 'Model 1', maxTokens: 8000 },
    ],
  },
}
```

### 添加新的节点类型

1. **定义节点类型**

```javascript
// config/node-types.js
export const NODE_TYPES = [
  // ...
  {
    type: 'new-node',
    label: '新节点',
    category: NODE_CATEGORIES.AI_GENERATION,
    icon: 'ri-magic-line',
    color: '#8b5cf6',
    description: '新功能描述',
    defaultParams: {
      model: 'default',
    },
  },
]
```

2. **创建执行器**

```javascript
// executors/new-node.js
import { BaseExecutor } from './base'

export class NewNodeExecutor extends BaseExecutor {
  async execute(node, input, context) {
    // 实现执行逻辑
    return output
  }
}
```

3. **注册执行器**

```javascript
// executors/index.js
import { NewNodeExecutor } from './new-node'

const EXECUTORS = {
  // ...
  'new-node': NewNodeExecutor,
}
```

## 🐛 常见问题

### 1. CORS 错误

**问题**：调用 AI API 时出现跨域错误

**解决方案**：
- 使用项目内置的代理服务（`/api/proxy`）
- 或在 Vercel 部署，使用服务端环境变量

### 2. API Key 无效

**问题**：提示 API Key 配置错误

**解决方案**：
- 检查环境变量是否正确配置
- 本地开发使用 `VITE_` 前缀
- Vercel 部署不使用 `VITE_` 前缀
- 在界面的"设置"中手动配置

### 3. 视频生成超时

**问题**：视频生成任务长时间无响应

**解决方案**：
- 智谱的视频生成通常需要 1-5 分钟
- 执行器已实现轮询机制，最多等待 5 分钟
- 可以调整 `video-gen.js` 中的超时配置

### 4. 节点执行失败

**问题**：工作流执行时某个节点失败

**解决方案**：
- 查看执行日志了解详细错误
- 检查节点配置是否正确
- 确认 API Key 有足够的配额
- 启用重试机制（默认已启用）

## 📊 性能优化

1. **并发控制**：执行引擎限制最大并发数为 3
2. **超时控制**：每个请求默认超时 60 秒
3. **错误重试**：自动重试网络错误和超时错误
4. **流式输出**：支持流式响应，实时显示结果

## 🔐 安全建议

1. **API Key 安全**：
   - 不要在前端代码中硬编码 API Key
   - 使用环境变量或服务端存储
   - Vercel 部署时使用服务端环境变量

2. **自定义代码节点**：
   - 谨慎使用"自定义工具"节点
   - 不要执行不可信的代码
   - 考虑在沙箱环境中运行

3. **跨域安全**：
   - 代理服务已配置 CORS
   - 生产环境建议限制允许的域名

## 📝 更新日志

### v2.0.0 (2024-11-28)

**重大更新**：
- ✨ 重构整个架构，采用适配器模式
- 🆕 支持多家 AI 服务商（智谱、通义、DeepSeek 等）
- 🆕 新增视频生成功能（智谱 CogVideoX）
- 🆕 新增音频生成功能（TTS）
- 🆕 新增执行引擎，支持错误重试
- 🆕 新增节点库面板和服务商配置面板
- 🆕 优化 Vercel 部署配置
- 🆕 完善的错误处理和日志系统
- 📚 完整的文档和示例

**突破性变更**：
- 配置方式从单一 baseUrl/apiKey 改为多服务商配置
- 节点执行逻辑从主文件分离到独立的执行器
- API 代理支持服务端 API Key

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Vue Flow](https://vueflow.dev/) - 流程图编辑器
- [Naive UI](https://www.naiveui.com/) - UI 组件库
- 各 AI 服务商提供的优秀 API

---

**🎉 享受使用 AI 工作流系统！**

如有问题，请查看上方的常见问题或提交 Issue。

