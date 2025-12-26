/**
 * 性能监控工具
 * 监控页面性能指标，提供优化建议
 */

/**
 * Web Vitals 监控
 */
export class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enableLogging: import.meta.env.DEV || options.enableLogging,
      reportEndpoint: options.reportEndpoint,
      sampleRate: options.sampleRate || 1, // 采样率
      ...options,
    }

    this.metrics = {
      navigation: {},
      resources: [],
      vitals: {},
      custom: {},
    }

    this.init()
  }

  /**
   * 初始化性能监控
   */
  init() {
    if (typeof window === 'undefined') {
      return
    }

    // 监听页面加载完成
    if (document.readyState === 'complete') {
      this.collectMetrics()
    }
    else {
      window.addEventListener('load', () => {
        // 延迟收集，确保所有资源加载完成
        setTimeout(() => this.collectMetrics(), 0)
      })
    }

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportMetrics()
      }
    })

    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      this.reportMetrics()
    })

    // 监听 Web Vitals
    this.observeWebVitals()

    // 监听长任务
    this.observeLongTasks()

    // 监听资源加载
    this.observeResources()
  }

  /**
   * 收集性能指标
   */
  collectMetrics() {
    if (!window.performance) {
      return
    }

    // 1. 导航计时
    const navigation = performance.getEntriesByType('navigation')[0]
    if (navigation) {
      this.metrics.navigation = {
        // DNS 查询时间
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        // TCP 连接时间
        tcp: navigation.connectEnd - navigation.connectStart,
        // SSL 握手时间
        ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
        // 请求时间
        request: navigation.responseStart - navigation.requestStart,
        // 响应时间
        response: navigation.responseEnd - navigation.responseStart,
        // DOM 解析时间
        domParse: navigation.domInteractive - navigation.responseEnd,
        // 资源加载时间
        resourceLoad: navigation.loadEventStart - navigation.domContentLoadedEventEnd,
        // 总加载时间
        total: navigation.loadEventEnd - navigation.fetchStart,
        // 首字节时间 (TTFB)
        ttfb: navigation.responseStart - navigation.requestStart,
        // DOM Ready 时间
        domReady: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        // Load 完成时间
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      }
    }

    // 2. Paint 计时
    const paintEntries = performance.getEntriesByType('paint')
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-paint') {
        this.metrics.navigation.fp = entry.startTime
      }
      else if (entry.name === 'first-contentful-paint') {
        this.metrics.navigation.fcp = entry.startTime
      }
    })

    // 3. 内存信息
    if (performance.memory) {
      this.metrics.memory = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usage: `${(performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2)}%`,
      }
    }

    this.analyzeMetrics()
  }

  /**
   * 观察 Web Vitals
   */
  observeWebVitals() {
    // LCP (Largest Contentful Paint)
    this.observeLCP()

    // FID (First Input Delay)
    this.observeFID()

    // CLS (Cumulative Layout Shift)
    this.observeCLS()
  }

  /**
   * 观察 LCP
   */
  observeLCP() {
    if (!('PerformanceObserver' in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.vitals.lcp = lastEntry.renderTime || lastEntry.loadTime
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    }
    catch (e) {
      // 忽略不支持的浏览器
    }
  }

  /**
   * 观察 FID
   */
  observeFID() {
    if (!('PerformanceObserver' in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.metrics.vitals.fid = entry.processingStart - entry.startTime
        })
      })
      observer.observe({ entryTypes: ['first-input'] })
    }
    catch (e) {
      // 忽略不支持的浏览器
    }
  }

  /**
   * 观察 CLS
   */
  observeCLS() {
    if (!('PerformanceObserver' in window)) {
      return
    }

    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            this.metrics.vitals.cls = clsValue
          }
        })
      })
      observer.observe({ entryTypes: ['layout-shift'] })
    }
    catch (e) {
      // 忽略不支持的浏览器
    }
  }

  /**
   * 观察长任务
   */
  observeLongTasks() {
    if (!('PerformanceObserver' in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (this.options.enableLogging) {
            console.warn('[性能警告] 检测到长任务:', {
              duration: entry.duration,
              startTime: entry.startTime,
            })
          }
        })
      })
      observer.observe({ entryTypes: ['longtask'] })
    }
    catch (e) {
      // 忽略不支持的浏览器
    }
  }

  /**
   * 观察资源加载
   */
  observeResources() {
    if (!('PerformanceObserver' in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          // 记录慢资源
          if (entry.duration > 1000) {
            this.metrics.resources.push({
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize,
              type: entry.initiatorType,
            })

            if (this.options.enableLogging) {
              console.warn('[性能警告] 资源加载缓慢:', {
                url: entry.name,
                duration: entry.duration,
                size: entry.transferSize,
              })
            }
          }
        })
      })
      observer.observe({ entryTypes: ['resource'] })
    }
    catch (e) {
      // 忽略不支持的浏览器
    }
  }

  /**
   * 分析性能指标并给出建议
   */
  analyzeMetrics() {
    if (!this.options.enableLogging) {
      return
    }

    const { navigation, vitals } = this.metrics
    const suggestions = []

    // 分析 TTFB
    if (navigation.ttfb > 600) {
      suggestions.push({
        metric: 'TTFB',
        value: navigation.ttfb,
        level: 'error',
        suggestion: 'TTFB 过高，建议优化服务器响应时间、使用 CDN 或启用缓存',
      })
    }
    else if (navigation.ttfb > 300) {
      suggestions.push({
        metric: 'TTFB',
        value: navigation.ttfb,
        level: 'warning',
        suggestion: 'TTFB 偏高，可以考虑优化服务器响应',
      })
    }

    // 分析 FCP
    if (navigation.fcp > 2500) {
      suggestions.push({
        metric: 'FCP',
        value: navigation.fcp,
        level: 'error',
        suggestion: 'FCP 过高，建议优化首屏渲染、减少阻塞资源、启用代码分割',
      })
    }
    else if (navigation.fcp > 1800) {
      suggestions.push({
        metric: 'FCP',
        value: navigation.fcp,
        level: 'warning',
        suggestion: 'FCP 偏高，可以考虑优化首屏加载',
      })
    }

    // 分析 LCP
    if (vitals.lcp > 4000) {
      suggestions.push({
        metric: 'LCP',
        value: vitals.lcp,
        level: 'error',
        suggestion: 'LCP 过高，建议优化最大内容渲染、预加载关键资源、优化图片',
      })
    }
    else if (vitals.lcp > 2500) {
      suggestions.push({
        metric: 'LCP',
        value: vitals.lcp,
        level: 'warning',
        suggestion: 'LCP 偏高，可以考虑优化主要内容的加载',
      })
    }

    // 分析 CLS
    if (vitals.cls > 0.25) {
      suggestions.push({
        metric: 'CLS',
        value: vitals.cls,
        level: 'error',
        suggestion: 'CLS 过高，建议为图片/视频设置尺寸、避免动态插入内容',
      })
    }
    else if (vitals.cls > 0.1) {
      suggestions.push({
        metric: 'CLS',
        value: vitals.cls,
        level: 'warning',
        suggestion: 'CLS 偏高，可以考虑优化布局稳定性',
      })
    }

    // 输出性能报告
    console.group('📊 性能监控报告')
    console.log('📈 性能指标:', this.metrics)
    if (suggestions.length > 0) {
      console.warn('⚠️  优化建议:')
      suggestions.forEach((s) => {
        const icon = s.level === 'error' ? '❌' : '⚡'
        console.log(`${icon} ${s.metric}: ${s.value.toFixed(2)}ms - ${s.suggestion}`)
      })
    }
    else {
      console.log('✅ 性能表现良好！')
    }
    console.groupEnd()
  }

  /**
   * 上报性能指标
   */
  reportMetrics() {
    if (!this.options.reportEndpoint) {
      return
    }

    // 采样控制
    if (Math.random() > this.options.sampleRate) {
      return
    }

    // 使用 sendBeacon 确保数据发送
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        metrics: this.metrics,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        url: location.href,
      })
      navigator.sendBeacon(this.options.reportEndpoint, data)
    }
  }

  /**
   * 记录自定义性能指标
   */
  mark(name) {
    if (window.performance && performance.mark) {
      performance.mark(name)
    }
  }

  /**
   * 测量自定义性能指标
   */
  measure(name, startMark, endMark) {
    if (window.performance && performance.measure) {
      try {
        performance.measure(name, startMark, endMark)
        const measures = performance.getEntriesByName(name)
        const measure = measures[measures.length - 1]
        this.metrics.custom[name] = measure.duration

        if (this.options.enableLogging) {
          console.log(`[性能测量] ${name}: ${measure.duration.toFixed(2)}ms`)
        }

        return measure.duration
      }
      catch (e) {
        console.error('性能测量失败:', e)
      }
    }
  }
}

/**
 * 创建性能监控实例
 */
let monitor = null

export function setupPerformanceMonitor(options = {}) {
  if (!monitor) {
    monitor = new PerformanceMonitor(options)
  }
  return monitor
}

export function getPerformanceMonitor() {
  return monitor
}

/**
 * 性能装饰器 - 用于测量函数执行时间
 */
export function measurePerformance(name) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args) {
      const startMark = `${name}-start`
      const endMark = `${name}-end`

      monitor?.mark(startMark)
      const result = await originalMethod.apply(this, args)
      monitor?.mark(endMark)
      monitor?.measure(name, startMark, endMark)

      return result
    }

    return descriptor
  }
}
