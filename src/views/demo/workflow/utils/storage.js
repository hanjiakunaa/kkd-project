/**
 * IndexedDB 存储工具
 * 用于本地保存工作流、执行历史等数据
 */

const DB_NAME = 'WorkflowDB'
const DB_VERSION = 1

// 对象仓库名称
const STORE_WORKFLOWS = 'workflows'
const STORE_HISTORY = 'execution_history'
const STORE_TEMPLATES = 'templates'

class WorkflowStorage {
  constructor() {
    this.db = null
  }

  /**
   * 初始化数据库
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('无法打开 IndexedDB'))
      }

      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // 工作流存储
        if (!db.objectStoreNames.contains(STORE_WORKFLOWS)) {
          const workflowStore = db.createObjectStore(STORE_WORKFLOWS, {
            keyPath: 'id',
            autoIncrement: true,
          })
          workflowStore.createIndex('name', 'name', { unique: false })
          workflowStore.createIndex('createdAt', 'createdAt', { unique: false })
          workflowStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        // 执行历史存储
        if (!db.objectStoreNames.contains(STORE_HISTORY)) {
          const historyStore = db.createObjectStore(STORE_HISTORY, {
            keyPath: 'id',
            autoIncrement: true,
          })
          historyStore.createIndex('workflowId', 'workflowId', { unique: false })
          historyStore.createIndex('executedAt', 'executedAt', { unique: false })
          historyStore.createIndex('status', 'status', { unique: false })
        }

        // 模板存储
        if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
          const templateStore = db.createObjectStore(STORE_TEMPLATES, {
            keyPath: 'id',
            autoIncrement: true,
          })
          templateStore.createIndex('name', 'name', { unique: false })
          templateStore.createIndex('category', 'category', { unique: false })
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

  // ==================== 工作流操作 ====================

  /**
   * 保存工作流
   */
  async saveWorkflow(workflow) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_WORKFLOWS], 'readwrite')
      const store = transaction.objectStore(STORE_WORKFLOWS)

      const data = {
        ...workflow,
        updatedAt: new Date().toISOString(),
      }

      // 如果没有 createdAt，添加创建时间
      if (!data.createdAt) {
        data.createdAt = data.updatedAt
      }

      const request = data.id ? store.put(data) : store.add(data)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error('保存工作流失败'))
      }
    })
  }

  /**
   * 获取所有工作流
   */
  async getAllWorkflows() {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_WORKFLOWS], 'readonly')
      const store = transaction.objectStore(STORE_WORKFLOWS)
      const request = store.getAll()

      request.onsuccess = () => {
        // 按更新时间倒序排列
        const workflows = request.result.sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })
        resolve(workflows)
      }

      request.onerror = () => {
        reject(new Error('获取工作流列表失败'))
      }
    })
  }

  /**
   * 根据 ID 获取工作流
   */
  async getWorkflow(id) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_WORKFLOWS], 'readonly')
      const store = transaction.objectStore(STORE_WORKFLOWS)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error('获取工作流失败'))
      }
    })
  }

  /**
   * 删除工作流
   */
  async deleteWorkflow(id) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_WORKFLOWS], 'readwrite')
      const store = transaction.objectStore(STORE_WORKFLOWS)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('删除工作流失败'))
      }
    })
  }

  // ==================== 执行历史操作 ====================

  /**
   * 保存执行历史
   */
  async saveHistory(history) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_HISTORY], 'readwrite')
      const store = transaction.objectStore(STORE_HISTORY)

      const data = {
        ...history,
        executedAt: new Date().toISOString(),
      }

      const request = store.add(data)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error('保存执行历史失败'))
      }
    })
  }

  /**
   * 获取所有执行历史
   */
  async getAllHistory(limit = 50) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_HISTORY], 'readonly')
      const store = transaction.objectStore(STORE_HISTORY)
      const index = store.index('executedAt')
      const request = index.openCursor(null, 'prev') // 倒序

      const results = []
      let count = 0

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor && count < limit) {
          results.push(cursor.value)
          count++
          cursor.continue()
        }
        else {
          resolve(results)
        }
      }

      request.onerror = () => {
        reject(new Error('获取执行历史失败'))
      }
    })
  }

  /**
   * 根据工作流 ID 获取执行历史
   */
  async getHistoryByWorkflowId(workflowId, limit = 20) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_HISTORY], 'readonly')
      const store = transaction.objectStore(STORE_HISTORY)
      const index = store.index('workflowId')
      const request = index.getAll(workflowId)

      request.onsuccess = () => {
        const results = request.result
          .sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt))
          .slice(0, limit)
        resolve(results)
      }

      request.onerror = () => {
        reject(new Error('获取工作流执行历史失败'))
      }
    })
  }

  /**
   * 清理旧的执行历史（保留最近 100 条）
   */
  async cleanOldHistory(keepCount = 100) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_HISTORY], 'readwrite')
      const store = transaction.objectStore(STORE_HISTORY)
      const index = store.index('executedAt')
      const request = index.openCursor(null, 'prev')

      let count = 0
      const toDelete = []

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          count++
          if (count > keepCount) {
            toDelete.push(cursor.primaryKey)
          }
          cursor.continue()
        }
        else {
          // 删除旧记录
          toDelete.forEach((key) => {
            store.delete(key)
          })
          resolve(toDelete.length)
        }
      }

      request.onerror = () => {
        reject(new Error('清理执行历史失败'))
      }
    })
  }

  /**
   * 删除执行历史
   */
  async deleteHistory(id) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_HISTORY], 'readwrite')
      const store = transaction.objectStore(STORE_HISTORY)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('删除执行历史失败'))
      }
    })
  }

  // ==================== 模板操作 ====================

  /**
   * 保存模板
   */
  async saveTemplate(template) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_TEMPLATES], 'readwrite')
      const store = transaction.objectStore(STORE_TEMPLATES)

      const data = {
        ...template,
        createdAt: template.createdAt || new Date().toISOString(),
      }

      const request = data.id ? store.put(data) : store.add(data)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error('保存模板失败'))
      }
    })
  }

  /**
   * 获取所有模板
   */
  async getAllTemplates() {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_TEMPLATES], 'readonly')
      const store = transaction.objectStore(STORE_TEMPLATES)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error('获取模板列表失败'))
      }
    })
  }

  /**
   * 根据分类获取模板
   */
  async getTemplatesByCategory(category) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_TEMPLATES], 'readonly')
      const store = transaction.objectStore(STORE_TEMPLATES)
      const index = store.index('category')
      const request = index.getAll(category)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error('获取模板失败'))
      }
    })
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id) {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_TEMPLATES], 'readwrite')
      const store = transaction.objectStore(STORE_TEMPLATES)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('删除模板失败'))
      }
    })
  }

  // ==================== 工具方法 ====================

  /**
   * 清空所有数据
   */
  async clearAll() {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [STORE_WORKFLOWS, STORE_HISTORY, STORE_TEMPLATES],
        'readwrite',
      )

      const stores = [
        transaction.objectStore(STORE_WORKFLOWS),
        transaction.objectStore(STORE_HISTORY),
        transaction.objectStore(STORE_TEMPLATES),
      ]

      let completed = 0
      stores.forEach((store) => {
        const request = store.clear()
        request.onsuccess = () => {
          completed++
          if (completed === stores.length) {
            resolve()
          }
        }
        request.onerror = () => {
          reject(new Error('清空数据失败'))
        }
      })
    })
  }

  /**
   * 获取数据库统计信息
   */
  async getStats() {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [STORE_WORKFLOWS, STORE_HISTORY, STORE_TEMPLATES],
        'readonly',
      )

      const results = {}
      let completed = 0
      const storeNames = [STORE_WORKFLOWS, STORE_HISTORY, STORE_TEMPLATES]

      storeNames.forEach((storeName) => {
        const store = transaction.objectStore(storeName)
        const request = store.count()

        request.onsuccess = () => {
          results[storeName] = request.result
          completed++
          if (completed === storeNames.length) {
            resolve(results)
          }
        }

        request.onerror = () => {
          reject(new Error('获取统计信息失败'))
        }
      })
    })
  }
}

// 导出单例
export const workflowStorage = new WorkflowStorage()

// 自动初始化
workflowStorage.init().catch((error) => {
  console.error('[WorkflowStorage] 初始化失败:', error)
})
