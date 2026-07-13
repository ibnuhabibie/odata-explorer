import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * Built-in CORS proxy plugin.
 * Routes GET /proxy?url=<encoded-target> through the server (Node fetch),
 * bypassing browser CORS restrictions entirely.
 * Works in both dev and preview servers.
 */
function corsProxy() {
  const handler = (server) => {
    server.middlewares.use('/proxy', async (req, res) => {
      const parsed = new URL(req.url, `http://${req.headers.host}`)
      const targetUrl = parsed.searchParams.get('url')

      if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Missing "url" query parameter' }))
        return
      }

      // Forward request headers, skip hop-by-hop and encoding
      const skip = new Set([
        'host', 'connection', 'content-length', 'origin',
        'referer', 'accept-encoding', 'cookie',
      ])
      const forwardHeaders = {}
      for (const [key, value] of Object.entries(req.headers)) {
        if (!skip.has(key.toLowerCase())) {
          forwardHeaders[key] = value
        }
      }

      try {
        const targetRes = await fetch(targetUrl, {
          method: req.method || 'GET',
          headers: forwardHeaders,
          redirect: 'follow',
        })

        const buf = Buffer.from(await targetRes.arrayBuffer())

        const responseHeaders = { 'access-control-allow-origin': '*' }
        targetRes.headers.forEach((v, k) => {
          if (!['transfer-encoding', 'content-encoding', 'connection', 'content-length'].includes(k.toLowerCase())) {
            responseHeaders[k] = v
          }
        })

        res.writeHead(targetRes.status, responseHeaders)
        res.end(buf)
      } catch (err) {
        res.writeHead(502, {
          'Content-Type': 'application/json',
          'access-control-allow-origin': '*',
        })
        res.end(JSON.stringify({ error: err.message }))
      }
    })
  }

  return {
    name: 'cors-proxy',
    configureServer: handler,
    configurePreviewServer: handler,
  }
}

export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss(), corsProxy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
