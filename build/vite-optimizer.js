/**
 * Vite 性能优化配置
 * 企业级优化策略：提升开发和生产环境的响应速度到毫秒级
 */

import path from 'node:path'

/**
 * 创建优化的依赖预构建配置
 */
export function createOptimizedDeps() {
  return {
    // 排除不需要预构建的模块
    exclude: ['mammoth'],
    // 明确包含需要预构建的依赖，提升首次加载速度
    include: [
      'lodash-es',
      'dayjs',
      'axios',
      'pinia',
      '@vueuse/core',
      'naive-ui',
      'echarts',
      'vue-echarts',
      'codemirror',
      'pdfjs-dist',
      'xlsx',
      'oh-vue-icons',
      'vue',
      'vue-router',
      '@vue-flow/core',
      '@vue-flow/background',
    ],
    esbuildOptions: {
      target: 'es2020',
      // 启用 esbuild 优化
      minify: false,
      treeShaking: true,
    },
    // 强制预构建
    force: false,
  }
}

/**
 * 创建优化的构建配置
 */
export function createOptimizedBuild(isProd) {
  return {
    // 启用 Rollup 的多线程构建
    rollupOptions: {
      output: {
        // 手动代码分割策略 - 按框架、UI库、工具库分组
        manualChunks(id) {
          // 核心框架 - 最高优先级缓存
          if (id.includes('/vue/') || id.includes('vue-router') || id.includes('/pinia/')) {
            return 'vue-core'
          }
          // UI 组件库
          if (id.includes('naive-ui')) {
            return 'naive-ui'
          }
          // 图表库
          if (id.includes('/echarts') || id.includes('vue-echarts')) {
            return 'echarts'
          }
          // 代码编辑器
          if (id.includes('codemirror') || id.includes('@codemirror')) {
            return 'codemirror'
          }
          // 流程图
          if (id.includes('@vue-flow')) {
            return 'vue-flow'
          }
          // 文档处理
          if (id.includes('pdfjs-dist')) {
            return 'pdf'
          }
          if (id.includes('xlsx') || id.includes('luckyexcel')) {
            return 'xlsx'
          }
          if (id.includes('docx-preview')) {
            return 'docx'
          }
          // 工具库
          if (id.includes('lodash-es')) {
            return 'lodash'
          }
          if (id.includes('dayjs')) {
            return 'dayjs'
          }
          if (id.includes('/axios')) {
            return 'axios'
          }
          if (id.includes('@vueuse')) {
            return 'vueuse'
          }
          if (id.includes('oh-vue-icons')) {
            return 'icons'
          }
          // 其他 node_modules
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        // 优化文件命名，利用浏览器缓存
        entryFileNames: 'assets/js/[name].[hash].js',
        chunkFileNames: 'assets/js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          let extType = info[info.length - 1]
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            extType = 'images'
          }
          else if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            extType = 'fonts'
          }
          else if (/\.(css)$/i.test(assetInfo.name)) {
            return 'assets/css/[name].[hash].[ext]'
          }
          return `assets/${extType}/[name].[hash].[ext]`
        },
        // 启用更高效的格式
        format: 'es',
        // 减小输出体积
        compact: isProd,
        // 启用代码分割
        inlineDynamicImports: false,
      },
      external: ['mammoth'],
      // 优化 treeshake
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false,
      },
    },
    target: 'es2020',
    // 生产环境启用压缩
    minify: isProd ? 'esbuild' : false,
    // CSS 代码分割
    cssCodeSplit: true,
    // 启用 CSS 压缩
    cssMinify: isProd,
    // chunk 大小警告限制
    chunkSizeWarningLimit: 1024,
    // 启用 sourcemap 用于生产环境调试（可选）
    sourcemap: false,
    // 减少 modulePreload 的开销
    modulePreload: {
      polyfill: false,
    },
    // 启用更好的压缩
    reportCompressedSize: false, // 禁用压缩大小报告，加快构建
    // 分离 CSS
    cssTarget: 'chrome90',
  }
}

/**
 * 创建优化的服务器配置
 */
export function createOptimizedServer(proxyTarget) {
  return {
    host: '0.0.0.0',
    port: 3200,
    open: true,
    // 启用 HTTP/2
    https: false,
    // 开发服务器性能优化
    hmr: {
      // 使用 WebSocket 而不是轮询
      protocol: 'ws',
      // 减少 HMR 延迟
      overlay: true,
    },
    // 预热常用文件，加速首次访问
    warmup: {
      clientFiles: [
        './src/main.js',
        './src/App.vue',
        './src/router/index.js',
        './src/store/index.js',
      ],
    },
    // 代理配置
    proxy: proxyTarget
      ? {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
            rewrite: path => path.replace(/^\/api/, ''),
          },
        }
      : undefined,
    // 开发服务器缓存
    fs: {
      // 允许访问的目录
      allow: ['.'],
      // 严格模式
      strict: false,
    },
    // 监听文件变化优化
    watch: {
      // 忽略不需要监听的文件
      ignored: ['**/node_modules/**', '**/dist/**', '**/dev-dist/**', '**/.git/**'],
      // 使用原生文件系统事件
      usePolling: false,
    },
  }
}

/**
 * 创建 Vite 优化器实例
 */
export function createViteOptimizer(env, mode) {
  const isDev = mode === 'development'
  const isProd = mode === 'production'

  return {
    // 开发服务器优化
    server: createOptimizedServer(env.VITE_PROXY_TARGET),

    // 依赖预构建优化
    optimizeDeps: createOptimizedDeps(),

    // 构建优化
    build: createOptimizedBuild(isProd),

    // esbuild 优化
    esbuild: {
      target: 'es2020',
      // 生产环境移除 console 和 debugger
      drop: isProd ? ['console', 'debugger'] : [],
      // 启用更好的压缩
      legalComments: 'none',
      // 优化标识符
      minifyIdentifiers: isProd,
      minifySyntax: isProd,
      minifyWhitespace: isProd,
    },

    // 解析优化
    resolve: {
      // 减少解析时间
      extensions: ['.js', '.jsx', '.vue', '.json', '.mjs'],
      // 别名
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
        '~': path.resolve(process.cwd()),
      },
      // 去重依赖
      dedupe: ['vue', 'vue-router', 'pinia'],
    },

    // 启用 worker 优化
    worker: {
      format: 'es',
      plugins: [],
      rollupOptions: {
        output: {
          format: 'es',
        },
      },
    },

    // 实验性功能
    experimental: {
      // 启用渲染内置组件优化
      renderBuiltUrl(filename) {
        return { runtime: `window.__assetsPath(${JSON.stringify(filename)})` }
      },
    },
  }
}
