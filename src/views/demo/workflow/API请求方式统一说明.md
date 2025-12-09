# 🔄 AI适配器请求方式统一 - 直接调用API

> 优化时间：2025-11-29  
> 优化类型：统一请求方式  
> 状态：✅ 已完成  

---

## 🐛 问题分析

### 原问题

**智谱AI请求失败**：
- ❌ 使用 `_proxyRequest` 代理方式
- ❌ 请求地址：`http://localhost:3200/api/proxy`
- ❌ 返回 404 Not Found

**DeepSeek请求成功**：
- ✅ 直接使用 `fetch` 调用API
- ✅ 请求地址：`https://api.deepseek.com/chat/completions`
- ✅ 正常返回结果

---

### 问题根源

**不同的请求方式**：

```javascript
// ❌ 智谱AI - 使用代理（旧方式）
const response = await this._proxyRequest(url, {
  method: 'POST',
  headers: {...},
  body: payload,
})

// ✅ DeepSeek - 直接调用（新方式）
const response = await fetch(url, {
  method: 'POST',
  headers: {...},
  body: JSON.stringify(payload),
})
```

**代理方式的问题**：
1. 需要配置代理服务器
2. 开发环境可能没有代理服务
3. 增加了一层网络请求
4. 可能导致CORS问题

---

## ✅ 解决方案

### 统一所有AI适配器 - 直接调用API

**修改文件**：`src/views/demo/workflow/adapters/zhipu.js`

---

### 1️⃣ 图片生成方法

**修改前** ❌：
```javascript
async generateImage(prompt, options = {}) {
  const url = `${this.baseUrl}/images/generations`
  const payload = {
    model: options.model || 'cogview-4',
    prompt,
    size: options.size || '1024x1024',
  }

  // ❌ 使用代理
  const response = await this._proxyRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    },
    body: payload,
  })

  return response.data?.data?.[0]?.url || ''
}
```

**修改后** ✅：
```javascript
async generateImage(prompt, options = {}) {
  const url = `${this.baseUrl}/images/generations`
  const payload = {
    model: options.model || 'cogview-4',
    prompt,
    size: options.size || '1024x1024',
  }

  // ✅ 直接调用 API
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`智谱 API 错误 ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  return data.data?.[0]?.url || ''
}
```

**改进点**：
- ✅ 直接使用 `fetch`
- ✅ 添加错误处理
- ✅ 正确解析响应数据

---

### 2️⃣ 视频生成方法

**修改前** ❌：
```javascript
async generateVideo(input, options = {}) {
  const url = `${this.baseUrl}/videos/generations`
  const payload = {...}

  // ❌ 使用代理
  const response = await this._proxyRequest(url, {
    method: 'POST',
    headers: {...},
    body: payload,
  })

  return {
    taskId: response.data?.id,
    status: 'processing',
    url: response.data?.video_url,
  }
}
```

**修改后** ✅：
```javascript
async generateVideo(input, options = {}) {
  const url = `${this.baseUrl}/videos/generations`
  const payload = {
    model: options.model || 'cogvideox',
    prompt: typeof input === 'string' ? input : input.prompt,
    image_url: typeof input === 'object' ? input.imageUrl : undefined,
  }

  // ✅ 直接调用 API
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`智谱 API 错误 ${response.status}: ${errorText}`)
  }

  const data = await response.json()

  return {
    taskId: data.id,
    status: 'processing',
    url: data.video_url,
  }
}
```

---

### 3️⃣ 获取任务状态

**修改前** ❌：
```javascript
async getTaskStatus(taskId) {
  const url = `${this.baseUrl}/async-result/${taskId}`

  // ❌ 使用代理
  const response = await this._proxyRequest(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${this.apiKey}`,
    },
  })

  return {
    status: response.data?.task_status,
    url: response.data?.video_result?.[0]?.url,
    coverUrl: response.data?.video_result?.[0]?.cover_image_url,
  }
}
```

**修改后** ✅：
```javascript
async getTaskStatus(taskId) {
  const url = `${this.baseUrl}/async-result/${taskId}`

  // ✅ 直接调用 API
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${this.apiKey}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`智谱 API 错误 ${response.status}: ${errorText}`)
  }

  const data = await response.json()

  return {
    status: data.task_status,
    url: data.video_result?.[0]?.url,
    coverUrl: data.video_result?.[0]?.cover_image_url,
  }
}
```

---

## 📊 统一后的适配器对比

### 所有适配器现在都使用相同方式

| 适配器 | Chat | Image | Video | Audio | 方式 |
|--------|------|-------|-------|-------|------|
| **OpenAI** | ✅ | ✅ | ❌ | ✅ | `fetch` 直接调用 |
| **DeepSeek** | ✅ | ❌ | ❌ | ❌ | `fetch` 直接调用 |
| **智谱AI** | ✅ | ✅ | ✅ | ❌ | `fetch` 直接调用 ✅ |
| **通义千问** | ✅ | ✅ | ❌ | ✅ | `fetch` 直接调用 |
| **Moonshot** | ✅ | ❌ | ❌ | ❌ | `fetch` 直接调用 |

---

## 🎯 标准模板

### AI适配器标准写法

```javascript
/**
 * XXX AI 适配器
 */
import { BaseAdapter } from './base'

export class XXXAdapter extends BaseAdapter {
  constructor(config = {}) {
    super({
      baseUrl: config.baseUrl || 'https://api.xxx.com/v1',
      ...config,
    })
  }

  /**
   * 聊天对话
   */
  async chat(messages, options = {}) {
    const url = `${this.baseUrl}/chat/completions`
    const payload = {
      model: options.model || 'default-model',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
    }

    // ✅ 标准方式：直接调用 API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    // ✅ 标准错误处理
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`XXX API 错误 ${response.status}: ${errorText}`)
    }

    // ✅ 标准响应解析
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }

  /**
   * 图片生成
   */
  async generateImage(prompt, options = {}) {
    const url = `${this.baseUrl}/images/generations`
    const payload = {
      model: options.model || 'image-model',
      prompt,
      size: options.size || '1024x1024',
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`XXX API 错误 ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return data.data?.[0]?.url || ''
  }
}
```

---

## 💡 关键要点

### 1. 请求方式

```javascript
// ✅ 使用原生 fetch
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.apiKey}`,
  },
  body: JSON.stringify(payload),
})
```

### 2. 错误处理

```javascript
// ✅ 检查响应状态
if (!response.ok) {
  const errorText = await response.text()
  throw new Error(`API 错误 ${response.status}: ${errorText}`)
}
```

### 3. 数据解析

```javascript
// ✅ 解析 JSON 响应
const data = await response.json()
return data.choices?.[0]?.message?.content || ''
```

### 4. Headers 格式

```javascript
// ✅ 正确的 headers（无多余引号）
headers: {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${this.apiKey}`,  // ✅ 无引号
}
```

---

## 🚀 优势

### 统一方式的好处

**1. 简化架构**
- ✅ 不需要代理服务器
- ✅ 减少网络层级
- ✅ 降低维护成本

**2. 提升性能**
- ✅ 减少一次网络请求
- ✅ 降低延迟
- ✅ 提高响应速度

**3. 更好的错误处理**
- ✅ 直接获取API错误信息
- ✅ 更准确的状态码
- ✅ 便于调试

**4. 统一的代码风格**
- ✅ 所有适配器使用相同模式
- ✅ 易于维护和扩展
- ✅ 降低学习成本

---

## 🔍 CORS处理

### 如果遇到跨域问题

**方案1：开发环境代理（Vite配置）**
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://open.bigmodel.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
}
```

**方案2：生产环境API网关**
- 使用 Vercel Serverless Functions
- 使用 Cloudflare Workers
- 使用自己的后端服务

**方案3：API直接支持CORS**
- 智谱AI、DeepSeek等都已支持CORS
- 可以直接从前端调用

---

## ✅ 验证测试

### 测试清单

**1. 智谱AI图片生成**
```
运行工作流 → 查看Network
✅ 请求地址：https://open.bigmodel.cn/api/paas/v4/images/generations
✅ 状态码：200
✅ 返回图片URL
```

**2. 智谱AI视频生成**
```
运行工作流 → 查看Network
✅ 请求地址：https://open.bigmodel.cn/api/paas/v4/videos/generations
✅ 状态码：200
✅ 返回任务ID
```

**3. 任务状态查询**
```
查询任务状态 → 查看Network
✅ 请求地址：https://open.bigmodel.cn/api/paas/v4/async-result/{taskId}
✅ 状态码：200
✅ 返回任务状态
```

---

## 📝 修改文件清单

**修改的文件**：
- ✅ `src/views/demo/workflow/adapters/zhipu.js`

**修改的方法**：
- ✅ `generateImage()` - 图片生成
- ✅ `generateVideo()` - 视频生成
- ✅ `getTaskStatus()` - 任务状态查询

**修改行数**：约 60 行

**Linter错误**：已全部修复 ✅

---

## 🎉 总结

### 完成内容

✅ **统一请求方式** - 所有AI适配器都使用 `fetch` 直接调用  
✅ **移除代理依赖** - 不再需要 `_proxyRequest` 方法  
✅ **改进错误处理** - 更准确的错误信息  
✅ **优化数据解析** - 直接使用API响应数据  

### 效果对比

**修改前**：
```
智谱AI → _proxyRequest → proxy服务器 → 智谱API
         (可能404)
```

**修改后**：
```
智谱AI → fetch → 智谱API ✅
         (直接成功)
```

---

**优化完成时间**：2025-11-29  
**优化文件**：`adapters/zhipu.js`  
**请求方式**：统一为 `fetch` 直接调用  
**状态**：✅ 完美完成

🚀 **从代理到直接，从失败到成功！**

