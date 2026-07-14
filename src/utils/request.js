/**
 * HTTP request execution with timing and size tracking.
 */

/**
 * Execute an OData GET request.
 *
 * @param {object} opts
 * @param {string} opts.url - full request URL
 * @param {Object.<string,string>} opts.headers - request headers
 * @param {{type:string, token:string}|null} opts.auth - auth config
 * @param {AbortSignal|null} [opts.signal] - abort signal
 * @returns {Promise<{data:any, status:number, statusText:string, elapsedMs:number, sizeBytes:number, ok:boolean, error:string|null}>}
 */
export async function executeRequest({ url, headers = {}, auth = null, signal = null, useProxy = false }) {
  const start = performance.now()

  const finalHeaders = { ...headers }
  if (auth) {
    if (auth.type === 'bearer' && auth.token) {
      finalHeaders['Authorization'] = `Bearer ${auth.token}`
    } else if (auth.type === 'basic' && auth.token) {
      finalHeaders['Authorization'] = `Basic ${auth.token}`
    } else if (auth.type === 'apikey' && auth.token && auth.header) {
      finalHeaders[auth.header] = auth.token
    }
  }

  try {
    // Prefer Cloudflare Worker if VITE_PROXY_URL is set (works in dev + prod)
    // Fallback to Vite middleware in dev when no Worker URL configured
    const proxyBase = import.meta.env.VITE_PROXY_URL
      ? `${import.meta.env.VITE_PROXY_URL}?url=`
      : import.meta.env.DEV
        ? '/proxy?url='
        : ''
    const fetchUrl = useProxy
      ? `${proxyBase}${encodeURIComponent(url)}`
      : url

    let res
    try {
      res = await fetch(fetchUrl, {
        method: 'GET',
        headers: finalHeaders,
        signal,
      })
    } catch (proxyErr) {
      // If proxy fetch fails, fall back to direct request
      if (useProxy) {
        res = await fetch(url, { method: 'GET', headers: finalHeaders, signal })
      } else {
        throw proxyErr
      }
    }

    const text = await res.text()
    const elapsedMs = performance.now() - start
    const sizeBytes = new Blob([text]).size

    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }

    // OData error response
    if (!res.ok) {
      let errorMsg = `HTTP ${res.status} ${res.statusText}`
      if (data && data.error && data.error.message) {
        errorMsg = data.error.message
      }
      return {
        data,
        status: res.status,
        statusText: res.statusText,
        elapsedMs,
        sizeBytes,
        ok: false,
        error: errorMsg,
      }
    }

    return {
      data,
      status: res.status,
      statusText: res.statusText,
      elapsedMs,
      sizeBytes,
      ok: true,
      error: null,
    }
  } catch (err) {
    const elapsedMs = performance.now() - start
    const isAbort = err.name === 'AbortError'

    return {
      data: null,
      status: 0,
      statusText: '',
      elapsedMs,
      sizeBytes: 0,
      ok: false,
      error: isAbort
        ? 'Request cancelled'
        : err.message.includes('Failed to fetch')
          ? 'Network error — check CORS policy or service availability'
          : err.message,
    }
  }
}

/**
 * Fetch $metadata document.
 */
export async function fetchMetadata(baseUrl, headers = {}, auth = null, signal = null, useProxy = false) {
  const metaUrl = `${baseUrl.replace(/\/+$/, '')}/$metadata`
  return executeRequest({ url: metaUrl, headers, auth, signal, useProxy })
}
