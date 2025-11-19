import SparkMD5 from 'spark-md5'

/**
 * 将文件切割为多个分片
 * file - 待分片的文件对象
 * chunkSize - 每个分片的大小（字节）
 * 返回分片数组，包含每个分片的Blob对象和大小
 */
function createFileChunks(file, chunkSize) {
  const chunks = []
  let offset = 0 // 当前分片的起始字节位置

  // 循环切割直到覆盖整个文件
  while (offset < file.size) {
    // 使用slice方法切割文件（兼容大文件）
    const blob = file.slice(offset, offset + chunkSize)
    chunks.push({
      blob, // 分片二进制数据
      size: blob.size, // 记录分片实际大小（最后一片可能小于chunkSize）
    })
    offset += chunkSize // 移动切割位置
  }
  return chunks
}

/**
 * 计算文件哈希（基于所有分片的增量计算）
 * chunks - 分片数组
 * 返回文件的MD5哈希值（Promise）
 */
async function calcFileHash(chunks) {
  // 使用SparkMD5库进行增量哈希计算
  const spark = new SparkMD5.ArrayBuffer()
  let processedCount = 0 // 已处理分片计数

  for (let i = 0; i < chunks.length; i++) {
    const { blob } = chunks[i]
    // 将Blob转换为ArrayBuffer进行哈希计算
    const buf = await blob.arrayBuffer()
    spark.append(buf) // 增量更新哈希
    processedCount++

    // 计算并上报当前进度
    const percentage = Math.round((processedCount / chunks.length) * 100)
    globalThis.postMessage({
      type: 'progress',
      percentage, // 进度百分比（0-100）
    })
  }
  return spark.end() // 返回最终哈希值
}

// WebWorker消息处理器
globalThis.onmessage = async (e) => {
  const { file, chunkSize } = e.data // 从主线程接收的参数

  try {
    // 1. 文件分片
    const fileChunkList = createFileChunks(file, chunkSize)

    // 2. 计算文件哈希（包含进度上报）
    const fileHash = await calcFileHash(fileChunkList)

    // 处理成功，返回结果给主线程
    globalThis.postMessage({
      type: 'done',
      fileHash, // 文件完整哈希值
      fileChunkList, // 分片结果数组
    })
    globalThis.close() // 关闭Worker
  }
  catch (err) {
    // 错误处理
    globalThis.postMessage({
      type: 'error',
      error: String(err), // 错误信息转字符串
    })
    globalThis.close()
  }
}
