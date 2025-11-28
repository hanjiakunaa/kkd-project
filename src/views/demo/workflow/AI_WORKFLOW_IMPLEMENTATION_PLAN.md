# AI 工作流项目 - 完整实施方案

> **项目目标**：构建生产级 AI 工作流编排平台，接入多家国内 AI 服务商，实现图片、视频、音频等多模态内容生成，部署至 Vercel

---

## 📊 一、项目现状评估

### 1.1 架构优势 ✅

```
✅ 前端架构成熟
  • Vue Flow 可视化编辑器
  • 适配器模式统一 AI API
  • 执行器模式解耦节点逻辑
  • 工作流引擎支持错误重试

✅ 后端基础完善
  • 已实现：OpenAI、智谱、阿里、百度、腾讯
  • Serverless Functions 架构
  • 统一的路由和凭证管理
  
✅ 部署配置到位
  • Vercel 配置完善
  • 超时 300s，内存 3GB
  • CORS 和缓存策略已配置
```

### 1.2 待完善清单 🔨

```
🔨 后端适配器完善
  • 需要创建统一的 providers API 入口
  • 添加 DeepSeek、讯飞星火等服务商
  • 前后端适配器接口统一

🔨 高级功能缺失
  • 工作流保存/加载（IndexedDB）
  • 模板库（预设场景）
  • 执行历史记录
  • 结果缓存机制
  
🔨 节点类型扩展
  • Vision 图片理解
  • OCR 文字识别
  • 循环批量处理
  • HTTP 请求节点
```

---

## 🎯 二、核心需求整理

### 2.1 AI 服务商集成（P0 最高优先级）

#### 目标：接入 6+ 主流 AI 服务商

| 服务商 | 文本生成 | 图片生成 | 视频生成 | 音频生成 | 状态 | 优先级 |
|--------|----------|----------|----------|----------|------|--------|
| OpenAI | GPT-4o | DALL-E 3 | - | TTS | ✅ 完成 | P0 |
| 智谱 AI | GLM-4 | CogView-3 | CogVideoX | - | ✅ 完成 | P0 |
| 阿里通义 | Qwen-Plus | 通义万相 | - | Sambert | ✅ 完成 | P0 |
| 百度文心 | ERNIE-4.0 | 文心一格 | - | TTS | ✅ 完成 | P0 |
| 腾讯混元 | Hunyuan-Pro | HunyuanDIT | - | - | 🔄 部分 | P0 |
| DeepSeek | DeepSeek-V3 | - | - | - | 🆕 待做 | P1 |
| 讯飞星火 | Spark-Max | - | - | TTS | 🆕 待做 | P1 |
| Moonshot | Kimi | - | - | - | 🆕 待做 | P2 |

#### 实现要点

```javascript
// 1. 统一的适配器接口
class BaseAdapter {
  async chat(messages, options) {}
  async generateImage(prompt, options) {}
  async generateVideo(prompt, options) {}
  async generateAudio(text, options) {}
}

// 2. 统一的错误处理
class AIError extends Error {
  constructor(provider, message, code) {
    super(message)
    this.provider = provider
    this.code = code
    this.timestamp = Date.now()
  }
}

// 3. 统一的重试机制
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(Math.pow(2, i) * 1000)
    }
  }
}
```

### 2.2 节点类型扩展（P1 中优先级）

#### A. AI 能力节点

```
已有：
✅ LLM 文本生成
✅ 图片生成（Text2Image）
✅ 视频生成（Text2Video）
✅ 音频生成（TTS）

新增：
🆕 Vision 图片理解（识别图片内容）
🆕 OCR 文字识别（提取文字）
🆕 ASR 语音识别（语音转文字）
🆕 图片编辑（局部重绘、风格迁移）
🆕 文档解析（PDF/Word → Text）
```

#### B. 数据处理节点

```
已有：
✅ 文本处理
✅ 条件分支
✅ 合并节点

新增：
🆕 数据转换（JSON/CSV/XML）
🆕 HTTP 请求（调用外部 API）
🆕 数据库查询
🆕 正则表达式匹配
🆕 模板渲染（Handlebars/EJS）
```

#### C. 高级逻辑节点

```
🆕 循环节点（批量处理，例如批量生成 100 张图片）
🆕 并行执行（同时执行多个任务）
🆕 延迟执行（定时触发）
🆕 错误捕获（Try-Catch 逻辑）
🆕 变量存储（跨节点共享数据）
```

### 2.3 工作流管理（P0 最高优先级）

```javascript
// 核心功能列表
✅ 保存工作流到本地（IndexedDB）
✅ 导入/导出工作流（JSON）
✅ 工作流模板库（预设场景）
✅ 版本历史和回滚
✅ 执行历史记录
✅ 执行结果缓存
```

---

## 🚀 三、应用场景设计

### 3.1 核心应用场景

#### 场景 1：小红书批量内容生成器 📝

```
工作流设计：
[CSV 数据源（产品列表）]
  ↓
[循环节点]
  ↓
[LLM 生成标题和文案] (智谱/通义)
  ↓
[图片生成] (通义万相/DALL-E)
  ↓ (并行)
[生成 9 张配图]
  ↓
[合成到模板]
  ↓
[输出到文件夹]

应用价值：
• 电商：批量生成商品推广内容
• 自媒体：自动化内容创作
• 营销：大规模个性化内容生成
```

#### 场景 2：AI 短视频创作工作流 🎬

```
工作流设计：
[输入主题]
  ↓
[LLM 生成脚本] (DeepSeek)
  ↓
[分镜头规划] (LLM)
  ↓
[关键帧图片生成] (智谱 CogView)
  ↓
[视频生成] (智谱 CogVideoX)
  ↓
[AI 配音] (百度 TTS)
  ↓
[视频合成输出]

应用价值：
• 短视频创作：抖音/快手内容
• 产品演示：自动生成产品介绍视频
• 广告制作：快速生成广告素材
```

#### 场景 3：智能文档处理中心 📄

```
工作流设计：
[PDF 上传]
  ↓
[OCR 识别] (百度/腾讯)
  ↓
[LLM 信息提取] (Moonshot 长上下文)
  ↓
[结构化数据转换]
  ↓
[生成分析报告] (LLM)
  ↓
[导出 Excel/Word]

应用价值：
• 合同审核：自动提取关键条款
• 发票处理：批量识别和录入
• 简历筛选：自动化人才筛选
```

#### 场景 4：品牌 VI 设计生成器 🎨

```
工作流设计：
[品牌理念输入]
  ↓
[LLM 生成品牌定位]
  ↓
[并行节点]
  ├─> [Logo 生成] (DALL-E)
  ├─> [配色方案] (LLM)
  └─> [字体推荐] (LLM)
  ↓
[应用场景渲染] (图片生成)
  ↓
[品牌手册生成]

应用价值：
• 初创公司：快速建立品牌形象
• 设计师：灵感和草图生成
• 品牌升级：快速迭代方案
```

#### 场景 5：AI 客服助手 🤖

```
工作流设计：
[用户问题]
  ↓
[意图识别] (LLM)
  ↓
[条件分支]
  ├─> [知识库检索]
  ├─> [数据库查询]
  └─> [API 调用]
  ↓
[LLM 生成回答] (通义/DeepSeek)
  ↓
[情感分析]
  ↓
[TTS 语音回复]

应用价值：
• 客服中心：智能客服
• 电商售后：自动化问答
• 电话助手：AI 外呼
```

### 3.2 预设模板库

需要提供 **10-15 个** 实用模板：

```
1. 📝 小红书图文生成器
2. 🎬 短视频脚本生成器
3. 📊 数据分析报告生成器
4. 🎨 品牌 VI 生成器
5. 📄 文档智能处理
6. 🤖 智能客服助手
7. 📧 营销邮件生成器
8. 🎙️ 播客内容生成器
9. 📱 社交媒体内容日历
10. 🖼️ 产品图批量生成器
11. 📖 电子书内容生成
12. 🎓 课程内容生成器
13. 📰 新闻稿自动生成
14. 💼 商业计划书生成
15. 🎯 广告文案优化器
```

---

## 🛠️ 四、技术实施方案

### 4.1 目录结构优化

```
kkd-project/
├── api/                        # Vercel Serverless Functions
│   ├── proxy.js                # ✅ 统一代理入口
│   ├── providers/              # AI 服务商适配器
│   │   ├── index.js            # ✅ 统一路由
│   │   ├── openai.js           # ✅ OpenAI
│   │   ├── zhipu.js            # ✅ 智谱
│   │   ├── qwen.js             # ✅ 阿里通义
│   │   ├── baidu.js            # ✅ 百度文心
│   │   ├── hunyuan.js          # 🔄 腾讯混元（需完善）
│   │   ├── deepseek.js         # 🆕 DeepSeek
│   │   ├── xfyun.js            # 🆕 讯飞星火
│   │   └── moonshot.js         # 🆕 Moonshot
│   ├── workflows/              # 🆕 工作流相关 API
│   │   ├── execute.js          # 执行工作流
│   │   ├── save.js             # 保存工作流
│   │   ├── templates.js        # 模板管理
│   │   └── history.js          # 历史记录
│   └── utils/                  # 工具函数
│       ├── auth.js             # 认证工具
│       ├── cache.js            # 结果缓存
│       ├── async-task.js       # 异步任务管理
│       └── rate-limit.js       # 频率限制
│
├── src/
│   ├── views/demo/workflow/    # 工作流模块
│   │   ├── adapters/           # 前端适配器
│   │   ├── executors/          # 节点执行器
│   │   ├── engine/             # 执行引擎
│   │   ├── components/         # UI 组件
│   │   ├── config/             # 配置文件
│   │   ├── templates/          # 🆕 模板库
│   │   ├── storage/            # 🆕 本地存储
│   │   │   ├── indexedDB.js    # IndexedDB 封装
│   │   │   └── workflow-store.js
│   │   └── utils/              # 工具函数
│   │
│   └── api/                    # API 封装
│       └── workflow.js         # 工作流 API
│
├── vercel.json                 # ✅ Vercel 配置
├── .env.local                  # 本地环境变量（不提交）
└── .env.example                # 🆕 环境变量模板
```

### 4.2 关键技术实现

#### A. 统一的 API 入口

```javascript
// api/providers/index.js 完善版
import { handleOpenAIRequest } from './openai.js'
import { handleZhipuRequest } from './zhipu.js'
import { handleQwenRequest } from './qwen.js'
import { handleBaiduRequest } from './baidu.js'
import { handleHunyuanRequest } from './hunyuan.js'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { provider, action, params } = req.body
    
    // 动态导入处理器
    const { handleAIRequest } = await import('./index.js')
    const result = await handleAIRequest(provider, { action, params })
    
    res.status(200).json({
      code: 200,
      message: 'Success',
      data: result,
    })
  } catch (error) {
    console.error('API Error:', error)
    res.status(200).json({
      code: 500,
      message: error.message,
      data: null,
    })
  }
}
```

#### B. 异步任务管理（视频生成）

```javascript
// api/utils/async-task.js
export class AsyncTaskManager {
  /**
   * 轮询任务结果
   * @param {Function} getStatus - 获取状态的函数
   * @param {number} maxWait - 最大等待时间（毫秒）
   * @param {number} interval - 轮询间隔（毫秒）
   */
  static async pollTask(getStatus, maxWait = 300000, interval = 5000) {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWait) {
      const status = await getStatus()
      
      // 成功完成
      if (status.completed) {
        return status.result
      }
      
      // 失败
      if (status.failed) {
        throw new Error(status.error || '任务执行失败')
      }
      
      // 继续等待
      await new Promise(resolve => setTimeout(resolve, interval))
    }
    
    throw new Error('任务超时')
  }
  
  /**
   * 带进度的轮询
   */
  static async pollWithProgress(getStatus, onProgress, maxWait = 300000) {
    const startTime = Date.now()
    let lastProgress = 0
    
    while (Date.now() - startTime < maxWait) {
      const status = await getStatus()
      
      // 更新进度
      if (status.progress !== lastProgress) {
        lastProgress = status.progress
        onProgress?.(status.progress)
      }
      
      if (status.completed) return status.result
      if (status.failed) throw new Error(status.error)
      
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    
    throw new Error('任务超时')
  }
}
```

#### C. 工作流本地存储

```javascript
// src/views/demo/workflow/storage/workflow-store.js
import { openDB } from 'idb'

class WorkflowStore {
  constructor() {
    this.dbName = 'ai-workflow-db'
    this.version = 1
  }
  
  async init() {
    this.db = await openDB(this.dbName, this.version, {
      upgrade(db) {
        // 工作流表
        if (!db.objectStoreNames.contains('workflows')) {
          const workflowStore = db.createObjectStore('workflows', {
            keyPath: 'id',
            autoIncrement: true,
          })
          workflowStore.createIndex('name', 'name')
          workflowStore.createIndex('createdAt', 'createdAt')
        }
        
        // 执行历史表
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', {
            keyPath: 'id',
            autoIncrement: true,
          })
          historyStore.createIndex('workflowId', 'workflowId')
          historyStore.createIndex('executedAt', 'executedAt')
        }
        
        // 模板表
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id' })
        }
      },
    })
  }
  
  // 保存工作流
  async saveWorkflow(workflow) {
    const data = {
      ...workflow,
      updatedAt: Date.now(),
      createdAt: workflow.createdAt || Date.now(),
    }
    return await this.db.put('workflows', data)
  }
  
  // 获取所有工作流
  async getAllWorkflows() {
    return await this.db.getAll('workflows')
  }
  
  // 删除工作流
  async deleteWorkflow(id) {
    return await this.db.delete('workflows', id)
  }
  
  // 保存执行历史
  async saveHistory(history) {
    return await this.db.add('history', {
      ...history,
      executedAt: Date.now(),
    })
  }
  
  // 获取执行历史
  async getHistory(workflowId) {
    const index = this.db.transaction('history').store.index('workflowId')
    return await index.getAll(workflowId)
  }
}

export const workflowStore = new WorkflowStore()
```

#### D. 结果缓存机制

```javascript
// api/utils/cache.js
const cache = new Map()

export class CacheManager {
  static set(key, value, ttl = 3600000) { // 默认 1 小时
    cache.set(key, {
      value,
      expireAt: Date.now() + ttl,
    })
  }
  
  static get(key) {
    const item = cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expireAt) {
      cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  static clear() {
    cache.clear()
  }
  
  // 生成缓存键
  static generateKey(provider, action, params) {
    return `${provider}:${action}:${JSON.stringify(params)}`
  }
}

// 使用示例
export async function cachedAIRequest(provider, action, params, handler) {
  const cacheKey = CacheManager.generateKey(provider, action, params)
  
  // 尝试从缓存获取
  const cached = CacheManager.get(cacheKey)
  if (cached) {
    console.log('Cache hit:', cacheKey)
    return cached
  }
  
  // 执行请求
  const result = await handler()
  
  // 缓存结果（仅缓存成功的结果）
  CacheManager.set(cacheKey, result)
  
  return result
}
```

### 4.3 环境变量配置

创建 `.env.example`：

```bash
# ============================================
# AI 工作流项目 - 环境变量配置示例
# ============================================
# 
# 使用说明：
# 1. 复制此文件为 .env.local
# 2. 填入你的实际 API Key
# 3. 本地开发需要 VITE_ 前缀
# 4. Vercel 部署不需要 VITE_ 前缀
#
# ============================================

# OpenAI（必需，至少配置一个服务商）
VITE_OPENAI_API_KEY=sk-your-openai-key
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# 智谱 AI（推荐配置，支持视频生成）
VITE_ZHIPU_API_KEY=your-zhipu-key
VITE_ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4

# 阿里通义千问（推荐配置）
VITE_QWEN_API_KEY=sk-your-qwen-key
VITE_QWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1

# 百度文心（可选）
VITE_BAIDU_API_KEY=your-baidu-api-key
VITE_BAIDU_SECRET_KEY=your-baidu-secret-key

# 腾讯混元（可选）
VITE_HUNYUAN_SECRET_ID=your-secret-id
VITE_HUNYUAN_SECRET_KEY=your-secret-key

# DeepSeek（推荐配置，性价比高）
VITE_DEEPSEEK_API_KEY=sk-your-deepseek-key
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com

# 讯飞星火（可选）
VITE_XFYUN_APPID=your-appid
VITE_XFYUN_API_KEY=your-api-key
VITE_XFYUN_API_SECRET=your-api-secret

# Moonshot AI / Kimi（可选，支持长上下文）
VITE_MOONSHOT_API_KEY=sk-your-moonshot-key
VITE_MOONSHOT_BASE_URL=https://api.moonshot.cn/v1
```

---

## 📋 五、开发任务清单

### Phase 1: 基础完善（1-2 周）⭐⭐⭐

- [ ] **完善后端 API**
  - [ ] 创建统一的 `/api/providers/index.js` 入口
  - [ ] 完善腾讯混元适配器
  - [ ] 新增 DeepSeek 适配器
  - [ ] 新增讯飞星火适配器
  - [ ] 新增 Moonshot 适配器

- [ ] **前后端适配器统一**
  - [ ] 确保所有前端适配器都有对应的后端实现
  - [ ] 统一错误处理格式
  - [ ] 统一响应格式

- [ ] **工作流保存功能**
  - [ ] 实现 IndexedDB 存储
  - [ ] 实现导入/导出 JSON
  - [ ] 添加保存/加载 UI

- [ ] **基础模板库**
  - [ ] 设计 3-5 个实用模板
  - [ ] 实现模板导入功能
  - [ ] 模板分类和搜索

### Phase 2: 功能扩展（2-3 周）⭐⭐

- [ ] **新增节点类型**
  - [ ] Vision 图片理解节点
  - [ ] OCR 文字识别节点
  - [ ] HTTP 请求节点
  - [ ] 数据转换节点（JSON/CSV）

- [ ] **执行历史记录**
  - [ ] 记录每次执行的详细日志
  - [ ] 展示执行结果预览
  - [ ] 性能统计和分析

- [ ] **结果缓存**
  - [ ] 实现服务端缓存
  - [ ] 前端缓存管理
  - [ ] 缓存失效策略

- [ ] **批量处理**
  - [ ] 循环节点实现
  - [ ] 批量导入数据
  - [ ] 进度显示

### Phase 3: 高级特性（3-4 周）⭐

- [ ] **高级逻辑节点**
  - [ ] 并行执行节点
  - [ ] 延迟执行节点
  - [ ] 错误捕获节点

- [ ] **工作流版本控制**
  - [ ] 版本历史记录
  - [ ] 版本对比
  - [ ] 回滚功能

- [ ] **协作功能**
  - [ ] 工作流分享（生成链接）
  - [ ] 导出为图片/PDF
  - [ ] 评论和反馈

- [ ] **性能优化**
  - [ ] 懒加载优化
  - [ ] 大型工作流性能优化
  - [ ] 内存占用优化

---

## 🚀 六、部署清单

### 6.1 Vercel 环境变量

在 Vercel 项目设置中配置（**不需要** `VITE_` 前缀）：

```bash
# 基础配置（至少配置 2-3 个）
OPENAI_API_KEY=sk-xxx
ZHIPU_API_KEY=xxx
QWEN_API_KEY=sk-xxx
DEEPSEEK_API_KEY=sk-xxx

# 可选配置
BAIDU_API_KEY=xxx
BAIDU_SECRET_KEY=xxx
HUNYUAN_SECRET_ID=xxx
HUNYUAN_SECRET_KEY=xxx
XFYUN_APPID=xxx
XFYUN_API_KEY=xxx
XFYUN_API_SECRET=xxx
MOONSHOT_API_KEY=sk-xxx
```

### 6.2 部署步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 本地测试
pnpm dev

# 3. 构建
pnpm build

# 4. 部署到 Vercel
vercel --prod

# 或使用 GitHub 自动部署
git add .
git commit -m "部署 AI 工作流"
git push origin main
```

### 6.3 部署后检查

```bash
# 1. 检查前端
https://your-domain.vercel.app

# 2. 检查 API
curl -X POST https://your-domain.vercel.app/api/proxy \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.openai.com/v1/chat/completions",
    "method": "POST",
    "body": {...}
  }'

# 3. 检查各服务商
# OpenAI
curl -X POST https://your-domain.vercel.app/api/providers \
  -d '{"provider":"openai","action":"chat","params":{...}}'

# 智谱
curl -X POST https://your-domain.vercel.app/api/providers \
  -d '{"provider":"zhipu","action":"chat","params":{...}}'
```

---

## 💰 七、成本估算

### 7.1 AI 服务成本（月度估算）

假设每月 10,000 次执行：

| 服务商 | 文本 | 图片 | 视频 | 月成本 |
|--------|------|------|------|--------|
| OpenAI | $200 | $500 | - | $700 |
| 智谱 AI | ¥800 | ¥400 | ¥2000 | ¥3200 ($440) |
| 阿里通义 | ¥400 | ¥300 | - | ¥700 ($96) |
| DeepSeek | ¥200 | - | - | ¥200 ($28) |

**优化建议**：
- 优先使用 DeepSeek（性价比最高）
- 图片生成优先使用通义万相
- 视频生成使用智谱 CogVideoX
- 启用缓存机制减少重复请求

### 7.2 部署成本

**Vercel 费用**：
- Hobby 计划：$0/月（有限制）
- Pro 计划：$20/月（推荐）

**总成本估算**：
- 小规模使用：$50-100/月
- 中等规模：$200-500/月
- 大规模使用：$1000+/月

---

## 🎯 八、成功指标

### 8.1 技术指标

- ✅ 支持 6+ AI 服务商
- ✅ 15+ 节点类型
- ✅ 10+ 预设模板
- ✅ 工作流执行成功率 > 95%
- ✅ 平均响应时间 < 10s
- ✅ 系统可用性 > 99.5%

### 8.2 用户体验指标

- ✅ 页面加载时间 < 2s
- ✅ 节点添加响应 < 100ms
- ✅ 工作流保存成功率 100%
- ✅ 用户留存率 > 60%

---

## 📚 九、学习资源

### API 文档

- [OpenAI API](https://platform.openai.com/docs)
- [智谱 AI](https://open.bigmodel.cn/dev/api)
- [阿里通义](https://help.aliyun.com/zh/dashscope/)
- [DeepSeek](https://platform.deepseek.com/api-docs/)
- [腾讯混元](https://cloud.tencent.com/document/product/1729)
- [百度文心](https://cloud.baidu.com/doc/WENXINWORKSHOP/)

### 技术栈

- [Vue Flow](https://vueflow.dev/)
- [Naive UI](https://www.naiveui.com/)
- [Vercel](https://vercel.com/docs)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

## 📝 十、总结

### 核心优势 💪

1. **架构设计优秀**：模块化、可扩展
2. **多服务商支持**：避免厂商锁定
3. **实用场景丰富**：覆盖多个行业
4. **部署简单**：Vercel 一键部署

### 下一步行动 🚀

**本周重点**：
1. 完善后端适配器（DeepSeek、讯飞等）
2. 实现工作流保存功能
3. 创建 3-5 个模板

**下周目标**：
1. 新增高级节点类型
2. 执行历史记录
3. 优化用户体验

**本月目标**：
1. 支持 8+ AI 服务商
2. 15+ 节点类型
3. 10+ 实用模板
4. 生产环境稳定运行

---

**文档版本**：v1.0  
**最后更新**：2024-11-28  
**维护者**：开发团队

