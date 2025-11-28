/**
 * DeepSeek 适配器
 * DeepSeek API 兼容 OpenAI 格式，直接使用 OpenAI 处理器
 */

/**
 * 处理 DeepSeek 请求
 * DeepSeek 完全兼容 OpenAI 格式
 */
export async function handleDeepSeekRequest(body, apiKey) {
  const { action, params } = body

  switch (action) {
    case 'chat':
      return await handleChat(params, apiKey)
    default:
      throw new Error(`DeepSeek 不支持的操作: ${action}`)
  }
}

/**
 * 文本生成（兼容 OpenAI 格式）
 */
async function handleChat(params, apiKey) {
  const {
    model = 'deepseek-chat',
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    stream = false,
  } = params

  const url = 'https://api.deepseek.com/v1/chat/completions'

  const requestBody = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API 错误: ${error}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || 'DeepSeek 请求失败')
  }

  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
    model: data.model,
  }
}

