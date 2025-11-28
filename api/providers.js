/**
 * AI 服务商统一入口 - Vercel Serverless Function
 * 处理所有 AI 服务商的请求
 */

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
    res.status(405).json({
      code: 405,
      message: 'Method Not Allowed',
      data: null,
    })
    return
  }

  try {
    const { provider, action, params } = req.body

    if (!provider) {
      res.status(400).json({
        code: 400,
        message: '缺少 provider 参数',
        data: null,
      })
      return
    }

    if (!action) {
      res.status(400).json({
        code: 400,
        message: '缺少 action 参数',
        data: null,
      })
      return
    }

    // 调用具体的处理器
    const result = await handleAIRequest(provider, { action, params })

    res.status(200).json({
      code: 200,
      message: 'Success',
      data: result,
    })
  }
  catch (error) {
    console.error('Provider API Error:', error)
    res.status(200).json({
      code: 500,
      message: error.message || '请求失败',
      data: null,
    })
  }
}
