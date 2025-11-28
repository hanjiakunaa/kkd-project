/**
 * 腾讯混元适配器
 * 支持混元大模型、混元图片生成等
 */

import crypto from 'crypto'

/**
 * 处理混元请求
 */
export async function handleHunyuanRequest(body, secretId, secretKey) {
  const { action, params } = body

  switch (action) {
    case 'chat':
      return await handleChat(params, secretId, secretKey)
    case 'image':
      return await handleImageGeneration(params, secretId, secretKey)
    default:
      throw new Error(`不支持的操作: ${action}`)
  }
}

/**
 * 生成腾讯云签名
 */
function generateSignature(params, secretId, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = Math.floor(Math.random() * 1000000)

  const signParams = {
    Action: params.Action,
    Nonce: nonce,
    Region: params.Region || 'ap-guangzhou',
    SecretId: secretId,
    Timestamp: timestamp,
    Version: params.Version || '2023-09-01',
    ...params,
  }

  // 对参数按 key 排序
  const sortedKeys = Object.keys(signParams).sort()
  const queryString = sortedKeys
    .map(key => `${key}=${signParams[key]}`)
    .join('&')

  // 生成签名
  const signStr = `POSThcdn.tencentcloudapi.com/?${queryString}`
  const hmac = crypto.createHmac('sha256', secretKey)
  const signature = hmac.update(signStr).digest('base64')

  return {
    ...signParams,
    Signature: signature,
  }
}

/**
 * 文本生成
 */
async function handleChat(params, secretId, secretKey) {
  const {
    model = 'hunyuan-pro',
    messages,
    temperature = 0.7,
    maxTokens = 2000,
  } = params

  const url = 'https://hunyuan.tencentcloudapi.com'

  // 构建请求参数
  const requestParams = {
    Model: model,
    Messages: messages,
    Temperature: temperature,
    TopP: 1.0,
  }

  if (maxTokens) {
    requestParams.MaxTokens = maxTokens
  }

  // 生成签名
  const signedParams = generateSignature(
    {
      Action: 'ChatCompletions',
      Version: '2023-09-01',
      Region: 'ap-guangzhou',
    },
    secretId,
    secretKey,
  )

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-TC-Action': 'ChatCompletions',
      'X-TC-Version': '2023-09-01',
      'X-TC-Region': 'ap-guangzhou',
      'X-TC-Timestamp': signedParams.Timestamp.toString(),
    },
    body: JSON.stringify({
      ...signedParams,
      ...requestParams,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`混元 API 错误: ${error}`)
  }

  const data = await response.json()

  if (data.Response?.Error) {
    throw new Error(data.Response.Error.Message)
  }

  return {
    content: data.Response?.Choices?.[0]?.Message?.Content || '',
    usage: data.Response?.Usage,
  }
}

/**
 * 图片生成（混元生图）
 */
async function handleImageGeneration(params, secretId, secretKey) {
  const {
    prompt,
    resolution = '1024:1024',
    style = 'auto',
    n = 1,
  } = params

  const url = 'https://hunyuan.tencentcloudapi.com'

  const requestParams = {
    Prompt: prompt,
    Resolution: resolution,
    Style: style,
    Number: n,
  }

  const signedParams = generateSignature(
    {
      Action: 'TextToImage',
      Version: '2023-09-01',
      Region: 'ap-guangzhou',
    },
    secretId,
    secretKey,
  )

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-TC-Action': 'TextToImage',
      'X-TC-Version': '2023-09-01',
      'X-TC-Region': 'ap-guangzhou',
      'X-TC-Timestamp': signedParams.Timestamp.toString(),
    },
    body: JSON.stringify({
      ...signedParams,
      ...requestParams,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`混元生图 API 错误: ${error}`)
  }

  const data = await response.json()

  if (data.Response?.Error) {
    throw new Error(data.Response.Error.Message)
  }

  return {
    url: data.Response?.ResultImage,
    taskId: data.Response?.TaskId,
  }
}

