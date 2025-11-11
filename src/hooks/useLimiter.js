// 严格限制"所有文件的切片总并发"不超过上限；支持暂停时移除某文件的待执行项。

/**
 * 并发限制器，用于控制同时执行的任务数量。
 * 当达到最大并发数时，新任务会进入队列等待。
 */
export class ConcurrencyLimiter {
  /**
   * @param {number} maxConcurrent - 最大并发任务数
   */
  constructor(maxConcurrent) {
    // 最大并发任务数
    this.maxConcurrent = maxConcurrent
    // 当前正在执行的任务数
    this.activeCount = 0
    // 等待队列，存储尚未执行的任务
    // 每个队列项包含：
    // - runTask: () => Promise - 任务执行函数
    // - resolve: (value) => void - 任务成功回调
    // - reject: (error) => void - 任务失败回调
    // - fileId: string - 任务关联的文件ID（用于取消）
    this.pendingQueue = []
  }

  /**
   * 将任务加入队列，并返回一个 Promise。
   * 当任务开始执行时，Promise 会根据任务结果 resolve/reject。
   * @param {() => Promise<any>} runTask - 待执行的任务函数
   * @param {string} fileId - 关联的文件ID（用于后续取消）
   * @returns {Promise<any>} 返回任务执行的 Promise
   */
  enqueue(runTask, fileId) {
    return new Promise((resolve, reject) => {
      // 将任务推入等待队列
      this.pendingQueue.push({ runTask, resolve, reject, fileId })
      // 尝试启动下一个任务（如果未达到并发上限）
      this.tryStartNext()
    })
  }

  /**
   * 根据文件ID移除队列中的待执行任务（例如取消上传）。
   * @param {string} fileId - 要移除的任务关联的文件ID
   */
  removePendingByFileId(fileId) {
    this.pendingQueue = this.pendingQueue.filter(item => item.fileId !== fileId)
  }

  /**
   * 尝试从队列中启动下一个任务（如果未达到并发上限）。
   * @private
   */
  tryStartNext() {
    // 只要当前活跃任务数未达上限且队列非空，就继续启动任务
    while (this.activeCount < this.maxConcurrent && this.pendingQueue.length > 0) {
      const next = this.pendingQueue.shift() // 从队列头部取出任务
      this.activeCount++ // 增加活跃任务计数

      // 立即执行任务（包装在 Promise.resolve 中以捕获同步错误）
      Promise.resolve()
        .then(() => next.runTask()) // 执行任务函数
        .then((res) => {
          this.activeCount-- // 任务完成，减少活跃计数
          next.resolve(res) // 通知外部任务成功
          this.tryStartNext() // 递归检查是否能启动新任务
        })
        .catch((err) => {
          this.activeCount-- // 任务失败，减少活跃计数
          next.reject(err) // 通知外部任务失败
          this.tryStartNext() // 递归检查是否能启动新任务
        })
    }
  }
}
