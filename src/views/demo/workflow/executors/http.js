/**
 * HTTP 请求节点执行器
 * 支持各种 HTTP 方法和请求配置
 */

import { BaseExecutor } from './base'

export class HttpExecutor extends BaseExecutor {
  constructor() {
    super()
    this.type = 'http-node'
  }

  /**
   * 执行 HTTP 请求
   * @param {Object} node - 节点配置
   * @param {any} input - 输入数据
   * @param {Object} context - 执行上下文
   * @returns {Promise<any>} 输出数据
   */
  async execute(node, input, context) {
    const params = node.data.params || {}
    const {
      method = 'GET',
      url = '',
      headers = {},
      body = '',
      timeout = 30000,
      responseType = 'json', // json, text, blob
      extractPath = '', // JSON 路径提取，如 data.result
    } = params

    console.log(`[HttpExecutor] 发起请求: ${method} ${url}`)

    try {
      // 验证 URL
      if (!url) {
        throw new Error('请求 URL 不能为空')
      }

      // 处理 URL 中的变量替换
      const processedUrl = this.processUrl(url, input, context)

      // 处理请求头
      const processedHeaders = this.processHeaders(headers, input, context)

      // 处理请求体
      const processedBody = this.processBody(body, input, method)

      // 构建请求选项
      const options = {
        method: method.toUpperCase(),
        headers: processedHeaders,
        signal: AbortSignal.timeout(timeout),
      }

      // 添加请求体（GET/HEAD 方法不能有 body）
      if (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
        options.body = processedBody
      }

      // 发起请求
      const response = await fetch(processedUrl, options)

      // 检查响应状态
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // 解析响应
      let result
      switch (responseType) {
        case 'json':
          result = await response.json()
          break
        case 'text':
          result = await response.text()
          break
        case 'blob':
          result = await response.blob()
          break
        default:
          result = await response.text()
      }

      // 提取指定路径的数据
      if (extractPath && typeof result === 'object') {
        result = this.extractByPath(result, extractPath)
      }

      console.log('[HttpExecutor] 请求成功:', typeof result === 'string' ? result.slice(0, 100) : result)
      return result
    }
    catch (error) {
      console.error('[HttpExecutor] 请求失败:', error)
      throw new Error(`HTTP 请求失败: ${error.message}`)
    }
  }

  /**
   * 处理 URL，替换变量
   */
  processUrl(url, input, context) {
    let processedUrl = url

    // 替换 {{input}} 占位符
    if (typeof input === 'string') {
      processedUrl = processedUrl.replace(/\{\{input\}\}/g, encodeURIComponent(input))
    }

    // 替换 {{variable.xxx}} 占位符
    const variablePattern = /\{\{variable\.(\w+)\}\}/g
    processedUrl = processedUrl.replace(variablePattern, (match, key) => {
      const value = context.variables?.[key] || ''
      return encodeURIComponent(String(value))
    })

    // 替换 {{env.xxx}} 占位符（环境变量）
    const envPattern = /\{\{env\.(\w+)\}\}/g
    processedUrl = processedUrl.replace(envPattern, (match, key) => {
      const value = import.meta.env?.[key] || process.env?.[key] || ''
      return encodeURIComponent(String(value))
    })

    return processedUrl
  }

  /**
   * 处理请求头
   */
  processHeaders(headers, input, context) {
    const processedHeaders = {}

    // 默认请求头
    processedHeaders['Content-Type'] = 'application/json'
    processedHeaders['Accept'] = 'application/json'

    // 合并自定义请求头
    if (typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        if (value) {
          processedHeaders[key] = String(value)
        }
      })
    }
    else if (typeof headers === 'string') {
      // 支持字符串格式的请求头（每行一个）
      headers.split('\n').forEach((line) => {
        const [key, ...valueParts] = line.split(':')
        if (key && valueParts.length > 0) {
          processedHeaders[key.trim()] = valueParts.join(':').trim()
        }
      })
    }

    return processedHeaders
  }

  /**
   * 处理请求体
   */
  processBody(body, input, method) {
    // GET 和 HEAD 方法不需要 body
    if (method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD') {
      return undefined
    }

    // 如果 body 为空，使用 input 作为 body
    if (!body && input) {
      if (typeof input === 'object') {
        return JSON.stringify(input)
      }
      return String(input)
    }

    // 如果 body 是对象，转为 JSON
    if (typeof body === 'object') {
      return JSON.stringify(body)
    }

    // 替换 body 中的 {{input}} 占位符
    if (typeof body === 'string' && typeof input === 'string') {
      return body.replace(/\{\{input\}\}/g, input)
    }

    return body
  }

  /**
   * 按路径提取数据
   * 支持点号路径，如 'data.result.items'
   */
  extractByPath(obj, path) {
    if (!path) {
      return obj
    }

    const keys = path.split('.')
    let result = obj

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      }
      else {
        console.warn(`[HttpExecutor] 路径 "${path}" 不存在`)
        return obj
      }
    }

    return result
  }

  /**
   * 验证参数
   */
  validateParams(params) {
    const errors = []

    if (!params.url) {
      errors.push('URL 不能为空')
    }

    // 验证 URL 格式
    try {
      new URL(params.url.replace(/\{\{.*?\}\}/g, 'test'))
    }
    catch {
      errors.push('URL 格式不正确')
    }

    if (params.timeout && (params.timeout < 1000 || params.timeout > 300000)) {
      errors.push('超时时间应在 1-300 秒之间')
    }

    if (errors.length > 0) {
      throw new Error(`参数验证失败: ${errors.join(', ')}`)
    }

    return true
  }

  /**
   * 获取支持的参数
   */
  getSupportedParams() {
    return {
      method: {
        type: 'select',
        label: '请求方法',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
          { label: 'PATCH', value: 'PATCH' },
        ],
        default: 'GET',
      },
      url: {
        type: 'text',
        label: '请求 URL',
        placeholder: 'https://api.example.com/data',
        required: true,
      },
      headers: {
        type: 'object',
        label: '请求头',
        placeholder: '{\n  "Authorization": "Bearer token",\n  "Custom-Header": "value"\n}',
      },
      body: {
        type: 'textarea',
        label: '请求体',
        placeholder: '{\n  "key": "value"\n}',
        visible: params => !['GET', 'HEAD'].includes(params.method),
      },
      timeout: {
        type: 'number',
        label: '超时时间（毫秒）',
        min: 1000,
        max: 300000,
        default: 30000,
      },
      responseType: {
        type: 'select',
        label: '响应类型',
        options: [
          { label: 'JSON', value: 'json' },
          { label: '文本', value: 'text' },
          { label: '二进制', value: 'blob' },
        ],
        default: 'json',
      },
      extractPath: {
        type: 'text',
        label: '提取路径',
        placeholder: 'data.result',
        description: '从响应中提取指定路径的数据',
      },
    }
  }
}

