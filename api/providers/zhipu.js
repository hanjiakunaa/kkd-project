/**
 * 智谱 AI API 封装 (服务端)
 * 用于 Vercel Serverless Functions
 */

export async function handleZhipuRequest(body, apiKey) {
  const { action, params } = body
  const baseUrl = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'

  switch (action) {
    case 'chat':
      return await chat(params, apiKey, baseUrl)
    case 'generateImage':
      return await generateImage(params, apiKey, baseUrl)
    case 'generateVideo':
      return await generateVideo(params, apiKey, baseUrl)
    case 'getTaskStatus':
      return await getTaskStatus(params, apiKey, baseUrl)
    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

async function chat(params, apiKey, baseUrl) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model || 'glm-4-flash',
      messages: params.messages,
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Zhipu API Error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

async function generateImage(params, apiKey, baseUrl) {
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model || 'cogview-3',
      prompt: params.prompt,
      size: params.size || '1024x1024',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Zhipu API Error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

async function generateVideo(params, apiKey, baseUrl) {
  const response = await fetch(`${baseUrl}/videos/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model || 'cogvideox',
      prompt: params.prompt,
      image_url: params.imageUrl,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Zhipu API Error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

async function getTaskStatus(params, apiKey, baseUrl) {
  const response = await fetch(`${baseUrl}/async-result/${params.taskId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Zhipu API Error: ${response.status} ${errorText}`)
  }

  return await response.json()
}
