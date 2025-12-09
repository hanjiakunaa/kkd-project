import path from 'node:path'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import { visualizer } from 'rollup-plugin-visualizer'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import removeNoMatch from 'vite-plugin-router-warn'
import VueDevTools from 'vite-plugin-vue-devtools'
import { pluginIcons, pluginPagePathes } from './build/plugin-isme'
import { getDevProxyConfig } from './build/proxy-config'
import { registerLocalProxy } from './build/server-proxy'

export default defineConfig(({ mode }) => {
  const viteEnv = loadEnv(mode, process.cwd())
  const { VITE_PUBLIC_PATH, VITE_PROXY_TARGET, VITE_ANALYZE } = viteEnv
  const isDev = mode === 'development'
  const isProd = mode === 'production'

  return {
    base: VITE_PUBLIC_PATH || '/',
    filenameHashing: true,
    plugins: [
      Vue(),
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
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
        '~': path.resolve(process.cwd()),
      },
      dedupe: ['vue', 'vue-router'],
    },
    define: {
      __VUE_PROD_DEVTOOLS__: false,
    },
    esbuild: {
      target: 'es2019',
      ...(isProd ? { drop: ['console', 'debugger'] } : {}),
    },
    server: {
      host: '0.0.0.0',
      port: 3200,
      open: true,
      proxy: {
        '/api': getDevProxyConfig(VITE_PROXY_TARGET),
      },
    },
    configureServer: (server) => {
      registerLocalProxy(server, { route: '/api/proxy' })
    },
    optimizeDeps: {
      exclude: ['mammoth'],
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
      ],
      esbuildOptions: {
        target: 'es2019',
      },
    },
    build: {
      chunkSizeWarningLimit: 1024, // chunk 大小警告的限制（单位kb）
      rollupOptions: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/vue/') || id.includes('vue-router') || id.includes('/pinia/'))
              return 'vue'
            if (id.includes('naive-ui'))
              return 'naive'
            if (id.includes('/echarts') || id.includes('vue-echarts'))
              return 'echarts'
            if (id.includes('codemirror') || id.includes('@codemirror'))
              return 'codemirror'
            if (id.includes('pdfjs-dist'))
              return 'pdf'
            if (id.includes('xlsx'))
              return 'xlsx'
            if (id.includes('lodash-es'))
              return 'lodash'
            if (id.includes('dayjs'))
              return 'dayjs'
            if (id.includes('/axios'))
              return 'axios'
            if (id.includes('@vueuse'))
              return 'vueuse'
            if (id.includes('oh-vue-icons'))
              return 'icons'
            if (id.includes('@vue-flow'))
              return 'flow'
            return 'vendor'
          }
        },
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
        external: ['mammoth'], // 排除 mammoth，避免预构建错误
      },
      target: 'es2019',
      minify: 'esbuild',
      modulePreload: { polyfill: true },
    },
  }
})
