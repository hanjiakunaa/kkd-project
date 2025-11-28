import { Buffer } from 'node:buffer'
import path from 'node:path'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import removeNoMatch from 'vite-plugin-router-warn'
import VueDevTools from 'vite-plugin-vue-devtools'
import { pluginIcons, pluginPagePathes } from './build/plugin-isme'

export default defineConfig(({ mode }) => {
  const viteEnv = loadEnv(mode, process.cwd())
  const { VITE_PUBLIC_PATH, VITE_PROXY_TARGET } = viteEnv

  return {
    base: VITE_PUBLIC_PATH || '/',
    plugins: [
      Vue(),
      VueJsx(),
      VueDevTools(),
      Unocss(),
      AutoImport({
        imports: ['vue', 'vue-router'],
        dts: false,
      }),
      Components({
        resolvers: [NaiveUiResolver()],
        dts: false,
        dirs: ['src/components/common'], // 自动导入 common 组件
      }),
      // 自定义插件，用于生成页面文件的path，并添加到虚拟模块
      pluginPagePathes(),
      // 自定义插件，用于生成自定义icon，并添加到虚拟模块
      pluginIcons(),
      // 移除非必要的vue-router动态路由警告: No match found for location with path
      removeNoMatch(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
        '~': path.resolve(process.cwd()),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3200,
      open: true,
      proxy: {
        '/api': {
          target: VITE_PROXY_TARGET,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
          secure: false,
          // 跳过 /api/proxy 路径，让它走自定义中间件
          bypass: (req, res, options) => {
            if (req.url?.startsWith('/api/proxy')) {
              return req.url // 返回原始路径，跳过代理
            }
          },
          configure: (proxy, options) => {
            // 配置此项可在响应头中看到请求的真实地址
            proxy.on('proxyRes', (proxyRes, req) => {
              proxyRes.headers['x-real-url'] = new URL(req.url || '', options.target)?.href || ''
            })
          },
        },
      },
    },
    configureServer: (server) => {
      server.middlewares.use('/api/proxy', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        // 读取 Body
        const buffers = []
        for await (const chunk of req) {
          buffers.push(chunk)
        }
        const data = Buffer.concat(buffers).toString()

        try {
          const { url, method = 'POST', headers = {}, body } = JSON.parse(data)

          if (!url) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing "url" in request body' }))
            return
          }

          // 移除干扰 Header
          delete headers.host
          delete headers['content-length']
          delete headers.connection

          const response = await fetch(url, {
            method,
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          })

          const responseData = await response.text()
          let jsonResponse
          try {
            const jsonData = JSON.parse(responseData)
            jsonResponse = {
              code: response.ok ? 200 : response.status,
              message: response.statusText || 'Success',
              data: jsonData,
            }
          }
          catch {
            jsonResponse = {
              code: response.ok ? 200 : response.status,
              message: response.statusText || 'Error',
              data: responseData,
            }
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(jsonResponse))
        }
        catch (e) {
          console.error('Local Proxy Error:', e)
          res.statusCode = 200
          res.end(JSON.stringify({
            code: 500,
            message: e.message,
            data: null,
          }))
        }
      })
    },
    optimizeDeps: {
      exclude: ['mammoth'], // 排除 mammoth，避免预构建错误
    },
    build: {
      chunkSizeWarningLimit: 1024, // chunk 大小警告的限制（单位kb）
    },
  }
})
