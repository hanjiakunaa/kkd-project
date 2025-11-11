import { request } from '@/utils'

// 开启 Mock 模式（调试时设置为 true）
const USE_MOCK = true

// ================== Mock 数据存储 ==================
const mockStorage = {
  uploadedChunks: new Map(), // 存储已上传的切片: fileHash -> Set<chunkHash>
  uploadedFiles: new Set(), // 存储已完成的文件 fileHash
}

// ================== Mock 工具函数 ==================
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function mockResponse(data, success = true) {
  return {
    code: success ? 0 : 1,
    data,
    message: success ? '操作成功' : '操作失败',
  }
}

// ================== Mock 接口实现 ==================

// Mock: 秒传/断点续传 预检查
async function mockCheckFile(params) {
  const { fileHash, fileName } = params
  await delay(200) // 模拟网络延迟

  // 检查文件是否已完全上传（秒传）
  if (mockStorage.uploadedFiles.has(fileHash)) {
    // eslint-disable-next-line no-console
    console.log(`[Mock] 文件 ${fileName} 已存在，启用秒传`)
    return mockResponse({
      shouldUpload: false, // 不需要上传
      uploadedList: [],
    })
  }

  // 检查是否有已上传的切片（断点续传）
  const uploadedChunks = mockStorage.uploadedChunks.get(fileHash) || new Set()
  const uploadedList = Array.from(uploadedChunks)

  // eslint-disable-next-line no-console
  console.log(`[Mock] 文件 ${fileName} 检查完成，已上传切片数: ${uploadedList.length}`)

  return mockResponse({
    shouldUpload: true, // 需要上传
    uploadedList, // 已上传的切片列表
  })
}

// Mock: 上传切片
async function mockUploadChunk(data, signal) {
  // 模拟上传耗时（根据切片大小动态调整）
  const uploadTime = Math.min(100 + Math.random() * 300, 500) // 100-400ms 随机延迟

  await delay(uploadTime)

  // 检查是否被取消
  if (signal?.aborted) {
    throw new Error('Upload aborted')
  }

  const fileHash = data.get('fileHash')
  const chunkHash = data.get('chunkHash')
  const index = data.get('index')
  const fileName = data.get('fileName')

  // 模拟随机失败（5% 概率，用于测试重试机制）
  if (Math.random() < 0.05) {
    console.error(`[Mock] 切片 ${index} 上传失败（模拟网络错误）`)
    throw new Error('Network error')
  }

  // 存储已上传的切片
  if (!mockStorage.uploadedChunks.has(fileHash)) {
    mockStorage.uploadedChunks.set(fileHash, new Set())
  }
  mockStorage.uploadedChunks.get(fileHash).add(chunkHash)

  // eslint-disable-next-line no-console
  console.log(`[Mock] 切片 ${index} 上传成功 (${fileName})`)

  return mockResponse({
    uploaded: true,
    chunkHash,
  })
}

// Mock: 合并切片
async function mockMergeChunk(params) {
  const { fileHash, fileName } = params
  await delay(500) // 模拟合并耗时

  // 标记文件为已完成
  mockStorage.uploadedFiles.add(fileHash)

  // eslint-disable-next-line no-console
  console.log(`[Mock] 文件 ${fileName} 合并成功`)

  return mockResponse({
    merged: true,
    url: `/uploads/${fileName}`, // 模拟文件地址
  })
}

// ================== 导出接口（自动切换 Mock/真实） ==================

// 秒传/断点续传 预检查
export async function checkFile(params) {
  if (USE_MOCK) {
    return mockCheckFile(params)
  }
  const { fileHash, fileName } = params
  const res = await request.post('/api/checkFile', { fileHash, fileName })
  return res.data
}

// 上传切片
export async function uploadChunk(data, signal) {
  if (USE_MOCK) {
    return mockUploadChunk(data, signal)
  }
  const res = await request.post('/api/uploadChunk', data, { signal })
  return res.data
}

// 合并切片
export async function mergeChunk(params) {
  if (USE_MOCK) {
    return mockMergeChunk(params)
  }
  const { fileHash, fileName, chunkSize } = params
  const res = await request.post('/api/mergeChunk', { fileHash, fileName, chunkSize })
  return res.data
}

// ================== 工具方法 ==================

// 清空 Mock 数据（用于测试）
export function clearMockData() {
  mockStorage.uploadedChunks.clear()
  mockStorage.uploadedFiles.clear()
  // eslint-disable-next-line no-console
  console.log('[Mock] 已清空所有 Mock 数据')
}

// 查看 Mock 数据（调试用）
export function getMockData() {
  return {
    uploadedChunks: Array.from(mockStorage.uploadedChunks.entries()).map(([key, value]) => ({
      fileHash: key,
      chunks: Array.from(value),
    })),
    uploadedFiles: Array.from(mockStorage.uploadedFiles),
  }
}
