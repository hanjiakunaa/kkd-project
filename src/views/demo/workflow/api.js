/**
 * 工作流 API 调用工具
 * 用于处理外部 AI 服务请求
 */

/**
 * AI 代理请求 - 直接调用 AI 服务
 * @param {Object} config - 请求配置
 * @param {string} config.url - API 地址
 * @param {string} config.method - 请求方法
 * @param {Object} config.headers - 请求头
 * @param {Object} config.body - 请求体
 * @returns {Promise<Object>} 响应数据
 */
async function aiProxy(config) {
  const { url, method = 'POST', headers = {}, body = {} } = config

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 错误 ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return { data }
  }
  catch (error) {
    console.error('AI 请求失败:', error)
    throw error
  }
}

export default {
  aiProxy,
}

