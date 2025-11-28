/**
 * Moonshot AI (Kimi) 适配器
 * Moonshot API 兼容 OpenAI 格式
 */

/**
 * 处理 Moonshot 请求
 */
export async function handleMoonshotRequest(body, apiKey) {
  const { action, params } = body

  switch (action) {
    case 'chat':
      return await handleChat(params, apiKey)
    default:
      throw new Error(`Moonshot 不支持的操作: ${action}`)
  }
}

/**
 * 文本生成（兼容 OpenAI 格式）
 * Kimi 的特点是支持超长上下文（200k tokens）
 */
async function handleChat(params, apiKey) {
  const {
    model = 'moonshot-v1-8k',
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    stream = false,
  } = params

  const url = 'https://api.moonshot.cn/v1/chat/completions'

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
    throw new Error(`Moonshot API 错误: ${error}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || 'Moonshot 请求失败')
  }

  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
    model: data.model,
  }
}
