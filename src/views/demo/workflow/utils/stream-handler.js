/**
 * 流式输出处理工具
 * 处理 SSE (Server-Sent Events) 和流式响应
 */

/**
 * 创建流式文本处理器
 * @param {Function} onChunk - 接收每个文本块的回调
 * @param {Function} onComplete - 完成时的回调
 * @param {Function} onError - 错误时的回调
 * @returns {Object} - 处理器对象
 */
export function createStreamHandler(onChunk, onComplete, onError) {
  let fullText = ''
  let isClosed = false

  return {
    /**
     * 处理文本块
     */
    handleChunk(chunk) {
      if (isClosed)
        return

      fullText += chunk

      try {
        onChunk(chunk, fullText)
      }
      catch (error) {
        console.error('Stream chunk handler error:', error)
      }
    },

    /**
     * 完成流式输出
     */
    complete() {
      if (isClosed)
        return

      isClosed = true

      try {
        if (onComplete) {
          onComplete(fullText)
        }
      }
      catch (error) {
        console.error('Stream complete handler error:', error)
      }
    },

    /**
     * 处理错误
     */
    error(err) {
      if (isClosed)
        return

      isClosed = true

      try {
        if (onError) {
          onError(err)
        }
      }
      catch (error) {
        console.error('Stream error handler error:', error)
      }
    },

    /**
     * 获取完整文本
     */
    getFullText() {
      return fullText
    },

    /**
     * 重置
     */
    reset() {
      fullText = ''
      isClosed = false
    },
  }
}

/**
 * 解析 SSE 数据
 * @param {string} chunk - SSE 数据块
 * @returns {Array<Object>} - 解析后的事件数组
 */
export function parseSSE(chunk) {
  const lines = chunk.split('\n')
  const events = []
  let currentEvent = {}

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6)

      if (data === '[DONE]') {
        events.push({ type: 'done' })
        continue
      }

      try {
        currentEvent.data = JSON.parse(data)
        events.push({ ...currentEvent })
        currentEvent = {}
      }
      catch (e) {
        // 忽略解析错误
      }
    }
    else if (line.startsWith('event: ')) {
      currentEvent.type = line.slice(7)
    }
    else if (line.startsWith('id: ')) {
      currentEvent.id = line.slice(4)
    }
  }

  return events
}

/**
 * 创建流式输出的进度条文本
 * @param {number} current - 当前进度
 * @param {number} total - 总数
 * @param {number} width - 进度条宽度
 * @returns {string}
 */
export function createProgressBar(current, total, width = 20) {
  const percentage = Math.floor((current / total) * 100)
  const filled = Math.floor((current / total) * width)
  const empty = width - filled

  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`
}

