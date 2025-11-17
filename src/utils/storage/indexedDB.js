/**
 * IndexedDB 工具类 - 用于页面数据缓存
 */
class IndexedDBStorage {
  constructor(dbName = 'pageCache', version = 1) {
    this.dbName = dbName
    this.version = version
    this.db = null
    this.storeName = 'pageData'
  }

  /**
   * 打开数据库
   */
  async open() {
    if (this.db)
      return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error('打开 IndexedDB 失败'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        // 如果对象存储不存在，则创建
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'key' })
          objectStore.createIndex('key', 'key', { unique: true })
        }
      }
    })
  }

  /**
   * 获取数据
   */
  async get(key) {
    await this.open()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)
      const request = objectStore.get(key)

      request.onsuccess = () => {
        resolve(request.result?.data || null)
      }

      request.onerror = () => {
        reject(new Error('获取数据失败'))
      }
    })
  }

  /**
   * 设置数据
   */
  async set(key, data) {
    await this.open()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)
      const request = objectStore.put({
        key,
        data,
        timestamp: Date.now(),
      })

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('保存数据失败'))
      }
    })
  }

  /**
   * 删除数据
   */
  async remove(key) {
    await this.open()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)
      const request = objectStore.delete(key)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('删除数据失败'))
      }
    })
  }

  /**
   * 清空所有数据
   */
  async clear() {
    await this.open()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)
      const request = objectStore.clear()

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('清空数据失败'))
      }
    })
  }

  /**
   * 获取所有键
   */
  async keys() {
    await this.open()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)
      const request = objectStore.getAllKeys()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error('获取键列表失败'))
      }
    })
  }

  /**
   * 检查 IndexedDB 是否可用
   */
  isSupported() {
    return typeof indexedDB !== 'undefined'
  }
}

// 创建单例
export const pageCacheDB = new IndexedDBStorage('pageCache', 1)
