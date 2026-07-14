/**
 * Cloudflare Worker — CORS proxy for OData Explorer.
 *
 * Deploy:
 *   npx wrangler deploy
 *
 * Usage:
 *   GET https://<your-worker>.workers.dev?url=<encoded-target-url>
 */

const SKIP_HEADERS = new Set([
  'host', 'connection', 'content-length', 'origin',
  'referer', 'accept-encoding', 'cookie',
  'cf-connecting-ip', 'cf-ipcountry', 'cf-ray',
  'cf-visitor', 'cf-worker', 'x-forwarded-for',
  'x-forwarded-proto', 'x-real-ip',
])

const STRIP_RESPONSE = new Set([
  'transfer-encoding', 'content-encoding',
  'connection', 'content-length',
])

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': '*',
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }

    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')

    if (!targetUrl) {
      return jsonError('Missing "url" query parameter', 400)
    }

    const forwardHeaders = {}
    for (const [key, value] of request.headers) {
      if (!SKIP_HEADERS.has(key.toLowerCase())) {
        forwardHeaders[key] = value
      }
    }

    try {
      const targetRes = await fetch(targetUrl, {
        method: request.method,
        headers: forwardHeaders,
        redirect: 'follow',
      })

      const responseHeaders = { ...CORS }
      targetRes.headers.forEach((v, k) => {
        if (!STRIP_RESPONSE.has(k.toLowerCase())) {
          responseHeaders[k] = v
        }
      })

      const body = await targetRes.arrayBuffer()
      return new Response(body, {
        status: targetRes.status,
        statusText: targetRes.statusText,
        headers: responseHeaders,
      })
    } catch (err) {
      return jsonError(err.message, 502)
    }
  },
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  })
}
