/**
 * 路由优化工具
 * 实现智能预加载和懒加载策略
 */

/**
 * 创建预加载的路由组件
 * @param {Function} importFunc - 动态导入函数
 * @param {object} options - 配置选项
 * @returns {Function} 优化后的组件加载函数
 */
export function createLazyComponent(importFunc, options = {}) {
  const {
    // 是否启用预加载
    preload = false,
    // 预加载延迟（毫秒）
    preloadDelay = 2000,
    // 加载超时时间
    timeout = 10000,
    // 重试次数
    retry = 3,
  } = options

  let componentPromise = null

  // 预加载函数
  const preloadComponent = () => {
    if (!componentPromise) {
      componentPromise = importFunc()
    }
    return componentPromise
  }

  // 如果启用预加载，延迟一段时间后预加载
  if (preload && typeof window !== 'undefined') {
    setTimeout(() => {
      preloadComponent()
    }, preloadDelay)
  }

  // 带重试的加载函数
  const loadWithRetry = async (retryCount = 0) => {
    try {
      if (componentPromise) {
        return await componentPromise
      }
      componentPromise = importFunc()
      return await componentPromise
    }
    catch (error) {
      // 重置 promise 以便重试
      componentPromise = null

      if (retryCount < retry) {
        console.warn(`路由组件加载失败，正在重试 (${retryCount + 1}/${retry})...`)
        // 指数退避重试
        await new Promise(resolve => setTimeout(resolve, 2 ** retryCount * 1000))
        return loadWithRetry(retryCount + 1)
      }
      else {
        console.error('路由组件加载失败，已达到最大重试次数', error)
        throw error
      }
    }
  }

  // 返回带超时控制的加载函数
  return () => {
    return Promise.race([
      loadWithRetry(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('组件加载超时')), timeout),
      ),
    ])
  }
}

/**
 * 智能预加载路由
 * 根据用户行为预测并预加载可能访问的路由
 */
export class RoutePreloader {
  constructor(router) {
    this.router = router
    this.preloadedRoutes = new Set()
    this.preloadQueue = []
    this.isPreloading = false
  }

  /**
   * 预加载指定路由
   */
  async preload(routeName) {
    if (this.preloadedRoutes.has(routeName)) {
      return
    }

    const route = this.router.getRoutes().find(r => r.name === routeName)
    if (!route || !route.component) {
      return
    }

    try {
      // 检查是否为懒加载组件
      if (typeof route.component === 'function') {
        await route.component()
        this.preloadedRoutes.add(routeName)
        console.log(`[RoutePreloader] 预加载路由: ${routeName}`)
      }
    }
    catch (error) {
      console.warn(`[RoutePreloader] 预加载路由失败: ${routeName}`, error)
    }
  }

  /**
   * 批量预加载路由
   */
  async preloadBatch(routeNames) {
    for (const name of routeNames) {
      this.preloadQueue.push(name)
    }
    this.processQueue()
  }

  /**
   * 处理预加载队列
   */
  async processQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return
    }

    this.isPreloading = true

    // 使用 requestIdleCallback 在浏览器空闲时预加载
    const processNext = () => {
      if (this.preloadQueue.length === 0) {
        this.isPreloading = false
        return
      }

      const routeName = this.preloadQueue.shift()
      this.preload(routeName).finally(() => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(processNext, { timeout: 2000 })
        }
        else {
          setTimeout(processNext, 100)
        }
      })
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(processNext, { timeout: 2000 })
    }
    else {
      setTimeout(processNext, 0)
    }
  }

  /**
   * 根据当前路由预加载相关路由
   */
  preloadRelated(currentRouteName) {
    // 预加载策略：预加载同级路由和子路由
    const routes = this.router.getRoutes()
    const currentRoute = routes.find(r => r.name === currentRouteName)

    if (!currentRoute) {
      return
    }

    const relatedRoutes = []

    // 预加载同级路由
    const parentPath = currentRoute.path.split('/').slice(0, -1).join('/')
    routes.forEach((route) => {
      const routeParentPath = route.path.split('/').slice(0, -1).join('/')
      if (routeParentPath === parentPath && route.name !== currentRouteName) {
        relatedRoutes.push(route.name)
      }
    })

    // 预加载常用路由
    const commonRoutes = ['Home', 'Profile']
    commonRoutes.forEach((name) => {
      if (!relatedRoutes.includes(name) && name !== currentRouteName) {
        relatedRoutes.push(name)
      }
    })

    this.preloadBatch(relatedRoutes)
  }
}

/**
 * 初始化路由优化
 */
export function setupRouteOptimizer(router) {
  const preloader = new RoutePreloader(router)

  // 在路由跳转后预加载相关路由
  router.afterEach((to) => {
    if (to.name) {
      // 延迟预加载，避免影响当前页面渲染
      setTimeout(() => {
        preloader.preloadRelated(to.name)
      }, 1000)
    }
  })

  // 监听鼠标悬停事件，预加载链接对应的路由
  if (typeof window !== 'undefined') {
    let hoverTimer = null
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[href]')
      if (!link) {
        return
      }

      const href = link.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('//')) {
        return
      }

      // 延迟预加载，避免鼠标快速划过时触发
      clearTimeout(hoverTimer)
      hoverTimer = setTimeout(() => {
        try {
          const route = router.resolve(href)
          if (route && route.name) {
            preloader.preload(route.name)
          }
        }
        catch (error) {
          // 忽略无效路由
        }
      }, 300)
    }, true)
  }

  return preloader
}
