import { Buffer } from 'node:buffer'

export function registerLocalProxy(server, opts = {}) {
  const route = opts.route || '/api/proxy'

  server.middlewares.use(route, async (req, res, next) => {
    if (req.method !== 'POST') {
      next()
      return
    }

    const buffers = []
    for await (const chunk of req) buffers.push(chunk)
    const data = Buffer.concat(buffers).toString()

    try {
      const { url, method = 'POST', headers = {}, body } = JSON.parse(data)

      if (!url) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'Missing "url" in request body' }))
        return
      }

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
}
