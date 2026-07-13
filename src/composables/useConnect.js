import { useConnection } from '@/stores/connection.js'
import { useMetadata } from '@/stores/metadata.js'
import { fetchMetadata } from '@/utils/request.js'

/**
 * Shared connect/disconnect logic.
 * Used by TopBar and any other component that needs to trigger a connection.
 */
export function useConnect() {
  const { getActive, setStatus } = useConnection()
  const metadata = useMetadata()

  async function connect() {
    const conn = getActive()
    if (!conn || !conn.url) {
      setStatus('error', 'Enter a service URL first')
      return
    }

    setStatus('connecting')
    metadata.state.loading = true
    metadata.state.error = null

    try {
      const headers = {}
      for (const h of conn.headers || []) {
        if (h.key && h.value) headers[h.key] = h.value
      }

      const result = await fetchMetadata(conn.url, headers, conn.auth, null, conn.useProxy)
      if (result.ok) {
        metadata.load(result.data, `${conn.url.replace(/\/+$/, '')}/$metadata`)
        setStatus('connected')
      } else {
        setStatus('error', result.error || `HTTP ${result.status}`)
        metadata.state.error = result.error
      }
    } catch (err) {
      setStatus('error', err.message)
    } finally {
      metadata.state.loading = false
    }
  }

  function disconnect() {
    metadata.clear()
    setStatus('idle')
  }

  return { connect, disconnect }
}
