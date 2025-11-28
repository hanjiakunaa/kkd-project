/**
 * 阿里通义千问适配器
 * 支持 Qwen-Plus/Max、通义万相图片生成等
 */

/**
 * 处理通义千问请求
 */
export async function handleQwenRequest(body, apiKey) {
  const { action, params } = body

  switch (action) {
    case 'chat':
      return await handleChat(params, apiKey)
    case 'image':
      return await handleImageGeneration(params, apiKey)
    case 'audio':
      return await handleTTS(params, apiKey)
    default:
      throw new Error(`不支持的操作: ${action}`)
  }
}

/**
 * 文本生成
 */
async function handleChat(params, apiKey) {
  const {
    model = 'qwen-plus',
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    stream = false,
  } = params

  const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

  const requestBody = {
    model,
    input: {
      messages,
    },
    parameters: {
      temperature,
      max_tokens: maxTokens,
      result_format: 'message',
      incremental_output: stream,
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-SSE': stream ? 'enable' : 'disable',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`通义千问 API 错误: ${error}`)
  }

  const data = await response.json()

  if (data.code && data.code !== '200') {
    throw new Error(data.message || '通义千问请求失败')
  }

  return {
    content: data.output?.choices?.[0]?.message?.content || '',
    usage: data.usage,
  }
}

/**
 * 图片生成（通义万相）
 */
async function handleImageGeneration(params, apiKey) {
  const {
    model = 'wanx-v1',
    prompt,
    size = '1024*1024',
    n = 1,
  } = params

  const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'

  const requestBody = {
    model,
    input: {
      prompt,
    },
    parameters: {
      size,
      n,
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-Async': 'enable', // 异步模式
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`通义万相 API 错误: ${error}`)
  }

  const data = await response.json()

  if (data.code && data.code !== '200') {
    throw new Error(data.message || '图片生成失败')
  }

  // 通义万相是异步的，需要轮询
  const taskId = data.output?.task_id

  if (taskId) {
    return await pollTaskResult(taskId, apiKey)
  }

  throw new Error('未获取到任务 ID')
}

/**
 * 轮询任务结果
 */
async function pollTaskResult(taskId, apiKey, maxAttempts = 60) {
  const url = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取任务状态失败')
    }

    const data = await response.json()

    if (data.output?.task_status === 'SUCCEEDED') {
      return {
        url: data.output?.results?.[0]?.url,
        taskId,
      }
    }

    if (data.output?.task_status === 'FAILED') {
      throw new Error(data.output?.message || '图片生成失败')
    }

    // 等待 3 秒后重试
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  throw new Error('图片生成超时')
}

/**
 * 语音合成（Sambert TTS）
 */
async function handleTTS(params, apiKey) {
  const {
    text,
    voice = 'zhitian_emo',
    format = 'mp3',
    sampleRate = 16000,
  } = params

  const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2speech/synthesis'

  const requestBody = {
    model: 'sambert-zhichu-v1',
    input: {
      text,
    },
    parameters: {
      voice,
      format,
      sample_rate: sampleRate,
    },
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
    throw new Error(`TTS API 错误: ${error}`)
  }

  // 返回音频数据的 URL
  const data = await response.json()

  return {
    audioUrl: data.output?.audio_url,
    duration: data.output?.duration,
  }
}
