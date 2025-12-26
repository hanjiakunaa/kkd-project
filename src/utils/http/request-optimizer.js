/**
 * HTTP 请求优化器
 * 实现请求缓存、并发控制、请求去重等企业级功能
 */

/**
 * 请求缓存管理器
 */
class RequestCache {
  constructor(options = {}) {
    this.cache = new Map()
    this.maxSize = options.maxSize || 100
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000 // 默认5分钟
  }

  /**
   * 生成缓存键
   */
  generateKey(config) {
    const { method, url, params, data } = config
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
  }

  /**
   * 获取缓存
   */
  get(config) {
    const key = this.generateKey(config)
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    // 检查是否过期
    if (Date.now() > cached.expireTime) {
      this.cache.delete(key)
      return null
    }

    console.log('[RequestCache] 使用缓存:', key)
    return cached.data
  }

  /**
   * 设置缓存
   */
  set(config, data, ttl) {
    const key = this.generateKey(config)

    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      expireTime: Date.now() + (ttl || this.defaultTTL),
    })
  }

  /**
   * 清除缓存
   */
  clear(pattern) {
    if (pattern) {
      // 清除匹配的缓存
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    }
    else {
      // 清除所有缓存
      this.cache.clear()
    }
  }

  /**
   * 清除过期缓存
   */
  clearExpired() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expireTime) {
        this.cache.delete(key)
      }
    }
  }
}

/**
 * 请求去重管理器
 */
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map()
  }

  /**
   * 生成请求键
   */
  generateKey(config) {
    const { method, url, params, data } = config
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
  }

  /**
   * 检查是否有相同的请求正在进行
   */
  getPending(config) {
    const key = this.generateKey(config)
    return this.pendingRequests.get(key)
  }

  /**
   * 添加待处理请求
   */
  addPending(config, promise) {
    const key = this.generateKey(config)
    this.pendingRequests.set(key, promise)

    // 请求完成后删除
    promise.finally(() => {
      this.pendingRequests.delete(key)
    })
  }

  /**
   * 取消待处理请求
   */
  removePending(config) {
    const key = this.generateKey(config)
    this.pendingRequests.delete(key)
  }
}

/**
 * 并发控制器
 */
class ConcurrencyController {
  constructor(maxConcurrent = 6) {
    this.maxConcurrent = maxConcurrent
    this.currentConcurrent = 0
    this.queue = []
  }

  /**
   * 执行请求（带并发控制）
   */
  async execute(requestFn) {
    // 如果达到最大并发数，加入队列等待
    if (this.currentConcurrent >= this.maxConcurrent) {
      await new Promise((resolve) => {
        this.queue.push(resolve)
      })
    }

    this.currentConcurrent++

    try {
      const result = await requestFn()
      return result
    }
    finally {
      this.currentConcurrent--

      // 处理队列中的下一个请求
      if (this.queue.length > 0) {
        const resolve = this.queue.shift()
        resolve()
      }
    }
  }
}

/**
 * 请求重试器
 */
class RequestRetrier {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
    this.retryCondition = options.retryCondition || this.defaultRetryCondition
  }

  /**
   * 默认重试条件
   */
  defaultRetryCondition(error) {
    // 网络错误或5xx服务器错误才重试
    return (
      !error.response
      || (error.response.status >= 500 && error.response.status < 600)
    )
  }

  /**
   * 执行带重试的请求
   */
  async execute(requestFn, config) {
    let lastError = null

    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        return await requestFn()
      }
      catch (error) {
        lastError = error

        // 检查是否应该重试
        if (i < this.maxRetries && this.retryCondition(error)) {
          const delay = this.retryDelay * 2 ** i // 指数退避
          console.warn(`[RequestRetrier] 请求失败，${delay}ms 后重试 (${i + 1}/${this.maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        else {
          break
        }
      }
    }

    throw lastError
  }
}

/**
 * 请求优化器
 */
export class RequestOptimizer {
  constructor(options = {}) {
    this.cache = new RequestCache(options.cache)
    this.deduplicator = new RequestDeduplicator()
    this.concurrencyController = new ConcurrencyController(options.maxConcurrent)
    this.retrier = new RequestRetrier(options.retry)

    // 定期清理过期缓存
    setInterval(() => {
      this.cache.clearExpired()
    }, 60000) // 每分钟清理一次
  }

  /**
   * 优化请求
   */
  async optimizeRequest(axiosInstance, config) {
    const {
      useCache = config.method?.toLowerCase() === 'get', // GET 请求默认启用缓存
      cacheTTL,
      deduplicate = true, // 默认启用去重
      useConcurrencyControl = true, // 默认启用并发控制
      useRetry = true, // 默认启用重试
    } = config

    // 1. 检查缓存
    if (useCache) {
      const cached = this.cache.get(config)
      if (cached) {
        return Promise.resolve(cached)
      }
    }

    // 2. 请求去重
    if (deduplicate) {
      const pending = this.deduplicator.getPending(config)
      if (pending) {
        console.log('[RequestOptimizer] 复用进行中的请求')
        return pending
      }
    }

    // 3. 创建请求函数
    const requestFn = () => axiosInstance.request(config)

    // 4. 执行请求
    const executeRequest = async () => {
      let promise

      if (useConcurrencyControl) {
        // 使用并发控制
        promise = this.concurrencyController.execute(requestFn)
      }
      else {
        promise = requestFn()
      }

      // 请求去重：记录进行中的请求
      if (deduplicate) {
        this.deduplicator.addPending(config, promise)
      }

      try {
        const response = useRetry
          ? await this.retrier.execute(requestFn, config)
          : await promise

        // 缓存响应
        if (useCache) {
          this.cache.set(config, response, cacheTTL)
        }

        return response
      }
      catch (error) {
        throw error
      }
    }

    return executeRequest()
  }

  /**
   * 清除缓存
   */
  clearCache(pattern) {
    this.cache.clear(pattern)
  }
}

/**
 * 创建请求优化器实例
 */
export function createRequestOptimizer(options = {}) {
  return new RequestOptimizer({
    cache: {
      maxSize: 100,
      defaultTTL: 5 * 60 * 1000, // 5分钟
      ...options.cache,
    },
    maxConcurrent: 6,
    retry: {
      maxRetries: 2,
      retryDelay: 1000,
      ...options.retry,
    },
    ...options,
  })
}

/**
 * 为 axios 实例添加优化器拦截器
 */
export function setupRequestOptimizer(axiosInstance, optimizer) {
  // 请求拦截器
  axiosInstance.interceptors.request.use(
    (config) => {
      // 标记优化器配置
      config._optimizer = optimizer
      return config
    },
    error => Promise.reject(error),
  )
}
