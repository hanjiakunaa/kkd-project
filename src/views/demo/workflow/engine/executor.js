/**
 * 工作流执行引擎
 * 负责执行整个工作流
 */

import { getExecutor } from '../executors'
import { resultCache } from '../utils/cache'
import { getUserFriendlyMessage, logError, WorkflowError } from '../utils/error-handler'
import { retry } from '../utils/retry'

export class WorkflowExecutor {
  constructor(options = {}) {
    this.options = {
      maxConcurrency: 3, // 最大并发数
      enableRetry: true, // 启用重试
      enableStream: false, // 启用流式输出
      enableCache: true, // 启用结果缓存
      timeout: 60000, // 超时时间（毫秒）
      ...options,
    }

    this.isRunning = false
    this.isPaused = false
    this.nodeOutputs = new Map() // 存储节点输出
    this.executionLogs = [] // 执行日志
    this.listeners = new Map() // 事件监听器
    this.cacheHits = 0 // 缓存命中次数
    this.cacheMisses = 0 // 缓存未命中次数
  }

  /**
   * 执行工作流
   * @param {Array} nodes - 节点列表
   * @param {Array} edges - 连线列表
   * @param {Object} context - 执行上下文
   * @returns {Promise<Object>} - 执行结果
   */
  async execute(nodes, edges, context) {
    if (this.isRunning) {
      throw new Error('工作流正在运行中')
    }

    this.isRunning = true
    this.isPaused = false
    this.nodeOutputs.clear()
    this.executionLogs = []
    this.cacheHits = 0
    this.cacheMisses = 0

    try {
      // 1. 查找起始节点
      const startNodes = this._findStartNodes(nodes)
      if (startNodes.length === 0) {
        throw new Error('没有找到起始节点（输入节点）')
      }

      this._emit('start', { startNodes })

      // 2. 初始化起始节点的输出
      startNodes.forEach((node) => {
        const input = node.data.variables?.input || context.defaultInput || '默认输入内容'
        this.nodeOutputs.set(node.id, input)
      })

      // 3. 使用 BFS 执行工作流
      const queue = startNodes.map(n => n.id)
      const visited = new Set()

      while (queue.length > 0 && !this.isPaused) {
        const nodeId = queue.shift()

        if (visited.has(nodeId)) {
          continue
        }

        visited.add(nodeId)

        const node = nodes.find(n => n.id === nodeId)
        if (!node) {
          continue
        }

        // 执行节点
        try {
          await this._executeNode(node, nodes, edges, context)

          // 将下游节点加入队列
          const outgoingEdges = this._getOutgoingEdges(nodeId, edges)
          outgoingEdges.forEach((edge) => {
            queue.push(edge.target)
          })
        }
        catch (error) {
          // 节点执行失败，记录错误但继续执行
          logError(error, { nodeId, nodeType: node.data.type })
          this._emit('nodeError', { nodeId, error })

          // 如果配置了严格模式，则停止执行
          if (context.strictMode) {
            throw error
          }
        }
      }

      this._emit('complete', { logs: this.executionLogs })

      return {
        success: true,
        logs: this.executionLogs,
        outputs: Object.fromEntries(this.nodeOutputs),
        cacheStats: {
          hits: this.cacheHits,
          misses: this.cacheMisses,
          hitRate: this.cacheHits + this.cacheMisses > 0
            ? (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(2) + '%'
            : '0%',
        },
      }
    }
    catch (error) {
      this._emit('error', { error })
      throw error
    }
    finally {
      this.isRunning = false
    }
  }

  /**
   * 执行单个节点
   * @private
   */
  async _executeNode(node, nodes, edges, context) {
    // 更新节点状态
    node.data.status = 'running'
    this._emit('nodeStart', { nodeId: node.id, node })

    // 获取上游输入
    const input = this._getNodeInput(node.id, edges)

    // 记录日志
    const log = {
      id: node.id,
      title: node.data.title,
      type: node.data.type,
      startTime: new Date().toISOString(),
      input,
      params: node.data.params,
      output: null,
      error: null,
      duration: 0,
    }

    const startTimestamp = Date.now()

    try {
      // 检查缓存
      let output
      let fromCache = false

      if (this.options.enableCache && this._isCacheable(node)) {
        const cachedOutput = await resultCache.get(node, input)
        if (cachedOutput !== null) {
          output = cachedOutput
          fromCache = true
          this.cacheHits++
          log.cached = true
          this._emit('cacheHit', { nodeId: node.id })
          console.log(`[WorkflowExecutor] 使用缓存结果: ${node.id}`)
        }
        else {
          this.cacheMisses++
        }
      }

      // 如果没有缓存,则执行节点
      if (!fromCache) {
        // 获取执行器
        const executor = getExecutor(node.data.type)

        // 创建执行上下文
        const execContext = {
          ...context,
          // 如果 context 中已经提供了 getApiKey 和 getBaseUrl 函数，使用它们
          // 否则使用默认实现
          getApiKey: context.getApiKey || (provider => context.apiKeys?.[provider] || ''),
          getBaseUrl: context.getBaseUrl || (provider => context.baseUrls?.[provider] || ''),
          useStream: this.options.enableStream,
          onStreamChunk: (nodeId, chunk) => {
            this._emit('streamChunk', { nodeId, chunk })
          },
          onStatusUpdate: (nodeId, status) => {
            this._emit('statusUpdate', { nodeId, status })
          },
          getNodeInputs: nodeId => this._getNodeInputs(nodeId, edges),
        }

        // 执行节点逻辑（带重试）
        if (this.options.enableRetry) {
          output = await retry(
            () => executor.execute(node, input, execContext),
            { maxRetries: 2 },
            (attempt, error, delay) => {
              this._emit('nodeRetry', { nodeId: node.id, attempt, error, delay })
            },
          )
        }
        else {
          output = await executor.execute(node, input, execContext)
        }

        // 保存到缓存
        if (this.options.enableCache && this._isCacheable(node)) {
          await resultCache.set(node, input, output)
        }
      }

      // 保存输出
      this.nodeOutputs.set(node.id, output)

      // 更新节点状态和变量
      node.data.status = 'done'
      if (!node.data.variables) {
        node.data.variables = {}
      }
      node.data.variables.output = this._formatOutputForDisplay(output)

      // 记录执行时间
      log.duration = Date.now() - startTimestamp
      log.output = output

      // 更新连线状态
      const incomingEdges = this._getIncomingEdges(node.id, edges)
      incomingEdges.forEach(edge => (edge.data.status = 'success'))

      this._emit('nodeComplete', { nodeId: node.id, node, output })
    }
    catch (error) {
      // 执行失败
      node.data.status = 'failed'
      log.error = error.message
      log.duration = Date.now() - startTimestamp

      // 更新连线状态
      const incomingEdges = this._getIncomingEdges(node.id, edges)
      incomingEdges.forEach(edge => (edge.data.status = 'error'))

      const friendlyMessage = getUserFriendlyMessage(error)
      throw new WorkflowError(friendlyMessage, node.id)
    }
    finally {
      this.executionLogs.push(log)
    }
  }

  /**
   * 查找起始节点
   * @private
   */
  _findStartNodes(nodes) {
    return nodes.filter(n => n.data.type === 'input-node' && !n.parentNode)
  }

  /**
   * 获取节点的输入数据
   * @private
   */
  _getNodeInput(nodeId, edges) {
    const incomingEdges = this._getIncomingEdges(nodeId, edges)

    if (incomingEdges.length === 0) {
      return ''
    }

    if (incomingEdges.length === 1) {
      return this.nodeOutputs.get(incomingEdges[0].source) || ''
    }

    // 多个输入，拼接
    return incomingEdges
      .map(e => this.nodeOutputs.get(e.source))
      .filter(Boolean)
      .join('\n')
  }

  /**
   * 获取节点的所有输入（用于 merge 节点）
   * @private
   */
  _getNodeInputs(nodeId, edges) {
    const incomingEdges = this._getIncomingEdges(nodeId, edges)
    return incomingEdges.map(e => this.nodeOutputs.get(e.source)).filter(Boolean)
  }

  /**
   * 获取入边
   * @private
   */
  _getIncomingEdges(nodeId, edges) {
    return edges.filter(e => e.target === nodeId)
  }

  /**
   * 获取出边
   * @private
   */
  _getOutgoingEdges(nodeId, edges) {
    return edges.filter(e => e.source === nodeId)
  }

  /**
   * 判断节点是否可缓存
   * @private
   */
  _isCacheable(node) {
    // 以下节点类型可以缓存
    const cacheableTypes = [
      'llm-node',
      'image-gen-node',
      'video-gen-node',
      'audio-gen-node',
      'vision-node',
      'ocr-node',
      'text-process-node',
    ]

    return cacheableTypes.includes(node.data.type)
  }

  /**
   * 格式化输出用于显示
   * @private
   */
  _formatOutputForDisplay(output) {
    if (typeof output === 'string') {
      return output.length > 50 ? `${output.slice(0, 50)}...` : output
    }
    if (typeof output === 'object') {
      return JSON.stringify(output).slice(0, 50) + '...'
    }
    return String(output)
  }

  /**
   * 事件监听
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return
    }
    const callbacks = this.listeners.get(event)
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }

  /**
   * 触发事件
   * @private
   */
  _emit(event, data) {
    if (!this.listeners.has(event)) {
      return
    }
    this.listeners.get(event).forEach((callback) => {
      try {
        callback(data)
      }
      catch (error) {
        console.error(`Event handler error (${event}):`, error)
      }
    })
  }

  /**
   * 暂停执行
   */
  pause() {
    this.isPaused = true
  }

  /**
   * 恢复执行
   */
  resume() {
    this.isPaused = false
  }

  /**
   * 停止执行
   */
  stop() {
    this.isPaused = true
    this.isRunning = false
  }

  /**
   * 启用缓存
   */
  enableCache() {
    this.options.enableCache = true
    resultCache.enable()
  }

  /**
   * 禁用缓存
   */
  disableCache() {
    this.options.enableCache = false
    resultCache.disable()
  }

  /**
   * 清空缓存
   */
  async clearCache() {
    await resultCache.clear()
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats() {
    return await resultCache.getStats()
  }
}

