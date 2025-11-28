/**
 * OpenAI API 封装 (服务端)
 * 用于 Vercel Serverless Functions
 */

export async function handleOpenAIRequest(body, apiKey) {
  const { action, params } = body
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

  switch (action) {
    case 'chat':
      return await chat(params, apiKey, baseUrl)
    case 'generateImage':
      return await generateImage(params, apiKey, baseUrl)
    case 'generateAudio':
      return await generateAudio(params, apiKey, baseUrl)
    case 'embedding':
      return await embedding(params, apiKey, baseUrl)
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
      model: params.model || 'gpt-4o-mini',
      messages: params.messages,
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API Error: ${response.status} ${errorText}`)
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
      model: params.model || 'dall-e-3',
      prompt: params.prompt,
      n: params.n || 1,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API Error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

async function generateAudio(params, apiKey, baseUrl) {
  const response = await fetch(`${baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model || 'tts-1',
      input: params.text,
      voice: params.voice || 'alloy',
      speed: params.speed || 1.0,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API Error: ${response.status} ${errorText}`)
  }

  // 返回音频 URL
  return { url: response.url }
}

async function embedding(params, apiKey, baseUrl) {
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model || 'text-embedding-3-small',
      input: params.input,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API Error: ${response.status} ${errorText}`)
  }

  return await response.json()
}
