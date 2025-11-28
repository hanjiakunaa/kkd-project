/**
 * 工作流执行结果缓存
 * 使用 IndexedDB 存储执行结果,避免重复执行相同的节点
 */

const CACHE_DB_NAME = 'WorkflowCache'
const CACHE_DB_VERSION = 1
const CACHE_STORE_NAME = 'execution_cache'

// 缓存过期时间（毫秒）
const DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 小时
const MAX_CACHE_SIZE = 100 // 最大缓存条目数

class ResultCache {
  constructor() {
    this.db = null
    this.memoryCache = new Map() // 内存缓存,用于快速访问
    this.enabled = true
  }

  /**
   * 初始化缓存数据库
   */
  async init() {
    return new Promise((resolve) => {
      const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION)

      request.onerror = () => {
        console.error('[ResultCache] 无法打开缓存数据库')
        this.enabled = false
        resolve(null)
      }

      request.onsuccess = (event) => {
        this.db = event.target.result
        console.log('[ResultCache] 缓存数据库已就绪')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
          const store = db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('nodeType', 'nodeType', { unique: false })
        }
      }
    })
  }

  /**
   * 确保数据库已初始化
   */
  async ensureDB() {
    if (!this.db) {
      await this.init()
    }
    return this.db
  }

  /**
   * 生成缓存键
   * @param {object} node - 节点配置
   * @param {any} input - 输入数据
   * @returns {string} 缓存键
   */
  generateKey(node, input) {
    const nodeData = {
      type: node.type,
      params: node.data?.params || {},
    }

    // 创建一个稳定的字符串表示
    const keyData = JSON.stringify({
      node: nodeData,
      input: this.normalizeInput(input),
    })

    // 使用简单的哈希函数
    return this.simpleHash(keyData)
  }

  /**
   * 标准化输入数据
   */
  normalizeInput(input) {
    // 对于对象,排序键以确保一致性
    if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        return input.map(item => this.normalizeInput(item))
      }
      const sorted = {}
      Object.keys(input).sort().forEach((key) => {
        sorted[key] = this.normalizeInput(input[key])
      })
      return sorted
    }
    return input
  }

  /**
   * 简单哈希函数
   */
  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `cache_${hash.toString(36)}`
  }

  /**
   * 获取缓存
   * @param {object} node - 节点配置
   * @param {any} input - 输入数据
   * @returns {Promise<any|null>} 缓存的结果或 null
   */
  async get(node, input) {
    if (!this.enabled) {
      return null
    }

    const key = this.generateKey(node, input)

    // 先检查内存缓存
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key)
      if (this.isValid(cached)) {
        console.log(`[ResultCache] 命中内存缓存: ${key}`)
        return cached.result
      }
      // 过期则删除
      this.memoryCache.delete(key)
    }

    // 检查 IndexedDB
    try {
      const db = await this.ensureDB()
      if (!db) {
        return null
      }

      const cached = await this.getFromDB(key)
      if (cached && this.isValid(cached)) {
        console.log(`[ResultCache] 命中 DB 缓存: ${key}`)
        // 添加到内存缓存
        this.memoryCache.set(key, cached)
        return cached.result
      }

      // 过期或不存在
      if (cached) {
        await this.delete(key)
      }

      return null
    }
    catch (error) {
      console.error('[ResultCache] 获取缓存失败:', error)
      return null
    }
  }

  /**
   * 从数据库获取缓存
   */
  async getFromDB(key) {
    const db = await this.ensureDB()
    if (!db) {
      return null
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CACHE_STORE_NAME], 'readonly')
      const store = transaction.objectStore(CACHE_STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 设置缓存
   * @param {object} node - 节点配置
   * @param {any} input - 输入数据
   * @param {any} result - 执行结果
   * @param {number} ttl - 过期时间（毫秒）
   */
  async set(node, input, result, ttl = DEFAULT_TTL) {
    if (!this.enabled) {
      return
    }

    const key = this.generateKey(node, input)
    const cacheEntry = {
      key,
      nodeType: node.type,
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    }

    // 保存到内存缓存
    this.memoryCache.set(key, cacheEntry)

    // 保存到 IndexedDB
    try {
      const db = await this.ensureDB()
      if (!db) {
        return
      }

      await this.saveToDB(cacheEntry)

      // 检查缓存大小,如果超出限制则清理旧条目
      await this.cleanupIfNeeded()

      console.log(`[ResultCache] 已缓存结果: ${key}`)
    }
    catch (error) {
      console.error('[ResultCache] 保存缓存失败:', error)
    }
  }

  /**
   * 保存到数据库
   */
  async saveToDB(entry) {
    const db = await this.ensureDB()
    if (!db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(CACHE_STORE_NAME)
      const request = store.put(entry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除缓存
   */
  async delete(key) {
    // 从内存删除
    this.memoryCache.delete(key)

    // 从数据库删除
    try {
      const db = await this.ensureDB()
      if (!db) {
        return
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite')
        const store = transaction.objectStore(CACHE_STORE_NAME)
        const request = store.delete(key)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
    catch (error) {
      console.error('[ResultCache] 删除缓存失败:', error)
    }
  }

  /**
   * 检查缓存是否有效
   */
  isValid(cached) {
    if (!cached) {
      return false
    }
    return Date.now() < cached.expiresAt
  }

  /**
   * 清理过期缓存
   */
  async cleanup() {
    try {
      const db = await this.ensureDB()
      if (!db) {
        return
      }

      const now = Date.now()
      const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(CACHE_STORE_NAME)
      const index = store.index('timestamp')
      const request = index.openCursor()

      let deletedCount = 0

      return new Promise((resolve) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            const entry = cursor.value
            if (now >= entry.expiresAt) {
              cursor.delete()
              this.memoryCache.delete(entry.key)
              deletedCount++
            }
            cursor.continue()
          }
          else {
            if (deletedCount > 0) {
              console.log(`[ResultCache] 已清理 ${deletedCount} 个过期缓存`)
            }
            resolve(deletedCount)
          }
        }

        request.onerror = () => {
          console.error('[ResultCache] 清理缓存失败')
          resolve(0)
        }
      })
    }
    catch (error) {
      console.error('[ResultCache] 清理缓存失败:', error)
      return 0
    }
  }

  /**
   * 如果需要则清理缓存
   */
  async cleanupIfNeeded() {
    try {
      const count = await this.count()
      if (count > MAX_CACHE_SIZE) {
        // 删除最旧的条目
        await this.deleteOldest(count - MAX_CACHE_SIZE)
      }
    }
    catch (error) {
      console.error('[ResultCache] 检查缓存大小失败:', error)
    }
  }

  /**
   * 获取缓存条目数量
   */
  async count() {
    const db = await this.ensureDB()
    if (!db) {
      return 0
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CACHE_STORE_NAME], 'readonly')
      const store = transaction.objectStore(CACHE_STORE_NAME)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 删除最旧的 N 个条目
   */
  async deleteOldest(count) {
    const db = await this.ensureDB()
    if (!db) {
      return
    }

    return new Promise((resolve) => {
      const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(CACHE_STORE_NAME)
      const index = store.index('timestamp')
      const request = index.openCursor()

      let deleted = 0

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor && deleted < count) {
          const key = cursor.value.key
          cursor.delete()
          this.memoryCache.delete(key)
          deleted++
          cursor.continue()
        }
        else {
          if (deleted > 0) {
            console.log(`[ResultCache] 已删除 ${deleted} 个最旧的缓存`)
          }
          resolve(deleted)
        }
      }

      request.onerror = () => resolve(0)
    })
  }

  /**
   * 清空所有缓存
   */
  async clear() {
    // 清空内存缓存
    this.memoryCache.clear()

    // 清空数据库
    try {
      const db = await this.ensureDB()
      if (!db) {
        return
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite')
        const store = transaction.objectStore(CACHE_STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => {
          console.log('[ResultCache] 已清空所有缓存')
          resolve()
        }
        request.onerror = () => reject(request.error)
      })
    }
    catch (error) {
      console.error('[ResultCache] 清空缓存失败:', error)
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats() {
    try {
      const totalCount = await this.count()
      const memoryCount = this.memoryCache.size

      return {
        totalCount,
        memoryCount,
        dbCount: totalCount,
        enabled: this.enabled,
      }
    }
    catch (error) {
      console.error('[ResultCache] 获取统计信息失败:', error)
      return {
        totalCount: 0,
        memoryCount: this.memoryCache.size,
        dbCount: 0,
        enabled: this.enabled,
      }
    }
  }

  /**
   * 启用缓存
   */
  enable() {
    this.enabled = true
    console.log('[ResultCache] 缓存已启用')
  }

  /**
   * 禁用缓存
   */
  disable() {
    this.enabled = false
    console.log('[ResultCache] 缓存已禁用')
  }
}

// 导出单例
export const resultCache = new ResultCache()

// 自动初始化
resultCache.init().catch((error) => {
  console.error('[ResultCache] 初始化失败:', error)
})

// 定期清理过期缓存（每小时）
setInterval(() => {
  resultCache.cleanup().catch(console.error)
}, 60 * 60 * 1000)
