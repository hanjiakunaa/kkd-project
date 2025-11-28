import { handleAIRequest } from './providers/index.js'

export default async function handler(req, res) {
  // 处理 CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  try {
    const { provider, url, method = 'POST', headers = {}, body } = req.body

    // 新的模式：通过 provider 参数使用服务端 API Key
    if (provider) {
      try {
        const result = await handleAIRequest(provider, body)
        res.status(200).json({
          code: 200,
          message: 'Success',
          data: result,
        })
        return
      }
      catch (error) {
        console.error(`${provider} API Error:`, error)
        res.status(200).json({
          code: 500,
          message: error.message,
          data: null,
        })
        return
      }
    }

    // 兼容旧模式：直接代理请求
    if (!url) {
      res.status(400).json({ error: 'Missing "url" or "provider" in request body' })
      return
    }

    // 移除可能导致问题的 header
    delete headers.host
    delete headers['content-length']
    delete headers.connection

    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.text()

    // 尝试解析 JSON，如果不是 JSON 则直接返回文本
    try {
      const jsonData = JSON.parse(data)
      // 包装成项目统一的响应格式
      res.status(200).json({
        code: response.ok ? 200 : response.status,
        message: response.statusText || 'Success',
        data: jsonData,
      })
    }
    catch {
      res.status(200).json({
        code: response.ok ? 200 : response.status,
        message: response.statusText || 'Error',
        data,
      })
    }
  }
  catch (error) {
    console.error('Proxy Error:', error)
    res.status(200).json({
      code: 500,
      message: error.message,
      data: null,
    })
  }
}
