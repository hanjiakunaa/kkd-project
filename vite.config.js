import path from 'node:path'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import { visualizer } from 'rollup-plugin-visualizer'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import removeNoMatch from 'vite-plugin-router-warn'
import VueDevTools from 'vite-plugin-vue-devtools'
import { pluginIcons, pluginPagePathes } from './build/plugin-isme'
import { getDevProxyConfig } from './build/proxy-config'
import { registerLocalProxy } from './build/server-proxy'
import { createViteOptimizer } from './build/vite-optimizer'

export default defineConfig(({ mode }) => {
  const viteEnv = loadEnv(mode, process.cwd())
  const { VITE_PUBLIC_PATH, VITE_PROXY_TARGET, VITE_ANALYZE } = viteEnv
  const isDev = mode === 'development'
  const isProd = mode === 'production'

  // 使用优化器配置
  const optimizer = createViteOptimizer(viteEnv, mode)

  return {
    base: VITE_PUBLIC_PATH || '/',
    plugins: [
      Vue({
        script: {
          // 启用响应式语法糖
          defineModel: true,
          propsDestructure: true,
        },
      }),
      VueJsx(),
      ...(isDev ? [VueDevTools()] : []),
      Unocss(),
      AutoImport({
        imports: ['vue', 'vue-router'],
        dts: false,
      }),
      Components({
        resolvers: [NaiveUiResolver()],
        dts: false,
        dirs: ['src/components/common'],
      }),
      pluginPagePathes(),
      pluginIcons(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          maximumFileSizeToCacheInBytes: 10485760,
          clientsClaim: true,
          skipWaiting: true,
          // 添加运行时缓存策略
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5, // 5分钟
                },
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
        includeAssets: ['favicon.png'],
        manifest: {
          name: 'KK',
          short_name: 'KK',
          description: 'KK Vue3 应用',
          theme_color: '#ffffff',
          display: 'standalone',
          background_color: '#ffffff',
          icons: [
            {
              src: 'favicon.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'favicon.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
      ...(isDev ? [removeNoMatch()] : []),
      ...(VITE_ANALYZE === 'true'
        ? [visualizer({
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
            open: true,
          })]
        : []),
    ],
    // 使用优化器的配置
    resolve: optimizer.resolve,
    define: {
      __VUE_PROD_DEVTOOLS__: false,
    },
    esbuild: optimizer.esbuild,
    server: optimizer.server,
    configureServer: (server) => {
      registerLocalProxy(server, { route: '/api/proxy' })
    },
    optimizeDeps: optimizer.optimizeDeps,
    build: optimizer.build,
    worker: optimizer.worker,
  }
})
