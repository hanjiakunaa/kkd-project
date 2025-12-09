export function getDevProxyConfig(target) {
  return {
    target,
    changeOrigin: true,
    rewrite: path => path.replace(/^\/api/, ''),
    secure: false,
    bypass: (req) => {
      if (req.url?.startsWith('/api/proxy'))
        return req.url
    },
    configure: (proxy, options) => {
      proxy.on('proxyRes', (proxyRes, req) => {
        proxyRes.headers['x-real-url'] = new URL(req.url || '', options.target)?.href || ''
      })
    },
  }
}
