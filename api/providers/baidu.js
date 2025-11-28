/**
 * 百度文心适配器
 * 支持文心一言、文心一格图片生成等
 */

/**
 * 获取百度 Access Token
 */
async function getAccessToken(apiKey, secretKey) {
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('获取百度 Access Token 失败')
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`百度认证错误: ${data.error_description}`)
  }

  return data.access_token
}

/**
 * 处理文心请求
 */
export async function handleBaiduRequest(body, apiKey, secretKey) {
  const { action, params } = body

  // 先获取 Access Token
  const accessToken = await getAccessToken(apiKey, secretKey)

  switch (action) {
    case 'chat':
      return await handleChat(params, accessToken)
    case 'image':
      return await handleImageGeneration(params, accessToken)
    case 'audio':
      return await handleTTS(params, accessToken)
    default:
      throw new Error(`不支持的操作: ${action}`)
  }
}

/**
 * 文本生成（文心一言）
 */
async function handleChat(params, accessToken) {
  const {
    model = 'ernie-4.0-8k',
    messages,
    temperature = 0.7,
    maxTokens = 2000,
  } = params

  // 根据模型选择不同的端点
  const modelEndpoints = {
    'ernie-4.0-8k': 'completions_pro',
    'ernie-3.5-8k': 'completions',
    'ernie-speed-8k': 'ernie_speed',
    'ernie-lite-8k': 'ernie-lite-8k',
  }

  const endpoint = modelEndpoints[model] || 'completions_pro'
  const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${endpoint}?access_token=${accessToken}`

  const requestBody = {
    messages,
    temperature,
    max_output_tokens: maxTokens,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`文心一言 API 错误: ${error}`)
  }

  const data = await response.json()

  if (data.error_code) {
    throw new Error(data.error_msg || '文心一言请求失败')
  }

  return {
    content: data.result || '',
    usage: data.usage,
  }
}

/**
 * 图片生成（文心一格）
 */
async function handleImageGeneration(params, accessToken) {
  const {
    prompt,
    size = '1024x1024',
    n = 1,
    style = 'base',
  } = params

  const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/text2image/sd_xl?access_token=${accessToken}`

  const requestBody = {
    prompt,
    size,
    n,
    style,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`文心一格 API 错误: ${error}`)
  }

  const data = await response.json()

  if (data.error_code) {
    throw new Error(data.error_msg || '图片生成失败')
  }

  // 文心一格返回 base64 编码的图片
  return {
    images: data.data?.map(item => ({
      b64_image: item.b64_image,
      // 可以转换为 data URL
      url: `data:image/png;base64,${item.b64_image}`,
    })),
    taskId: data.log_id,
  }
}

/**
 * 语音合成
 */
async function handleTTS(params, accessToken) {
  const {
    text,
    voice = 'zh_DuXiaoyao', // 度小瑶
    speed = 5,
    pitch = 5,
    volume = 5,
    format = 'mp3',
  } = params

  const url = `https://tsn.baidu.com/text2audio?access_token=${accessToken}`

  const requestBody = new URLSearchParams({
    tex: text,
    tok: accessToken,
    cuid: 'baidu_workshop',
    ctp: 1,
    lan: 'zh',
    spd: speed,
    pit: pitch,
    vol: volume,
    per: getVoiceId(voice),
    aue: format === 'mp3' ? 3 : 6, // 3=mp3, 6=wav
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: requestBody.toString(),
  })

  if (!response.ok) {
    throw new Error('语音合成失败')
  }

  // 检查是否返回错误（文心会在音频二进制中返回 JSON 错误）
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    const error = await response.json()
    throw new Error(error.err_msg || '语音合成失败')
  }

  // 返回音频 buffer 的 base64
  const audioBuffer = await response.arrayBuffer()
  const base64Audio = Buffer.from(audioBuffer).toString('base64')

  return {
    audioData: `data:audio/${format};base64,${base64Audio}`,
    format,
  }
}

/**
 * 获取音色 ID
 */
function getVoiceId(voice) {
  const voiceMap = {
    zh_DuXiaoyao: 1, // 度小瑶
    zh_DuYaya: 0, // 度丫丫
    zh_DuXiaomei: 5003, // 度小美
    zh_DuXiaojiao: 5118, // 度小娇
    zh_DuMimi: 106, // 度米米
    zh_DuXiaotong: 110, // 度小童
    zh_DuXiaomeng: 111, // 度小萌
    zh_Boyin: 103, // 度逍遥（磁性男声）
    zh_DuBoshi: 5, // 度博文（情感男声）
  }

  return voiceMap[voice] || 1
}

