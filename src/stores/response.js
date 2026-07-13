import { reactive } from 'vue'

const state = reactive({
  loading: false,
  data: null,
  rows: [],
  totalCount: null,
  status: 0,
  statusText: '',
  elapsedMs: 0,
  sizeBytes: 0,
  ok: false,
  error: null,
  executedUrl: null,
  hasRun: false,
  abortController: null,
})

export function useResponse() {
  function setStart() {
    cancel()
    state.loading = true
    state.error = null
    state.abortController = new AbortController()
  }

  function setResult(result, url) {
    state.loading = false
    state.data = result.data
    state.status = result.status
    state.statusText = result.statusText
    state.elapsedMs = result.elapsedMs
    state.sizeBytes = result.sizeBytes
    state.ok = result.ok
    state.error = result.error
    state.executedUrl = url
    state.hasRun = true
    state.abortController = null

    // Extract rows and count from OData response
    if (result.ok && result.data) {
      if (Array.isArray(result.data.value)) {
        state.rows = result.data.value
      } else if (Array.isArray(result.data)) {
        state.rows = result.data
      } else {
        state.rows = [result.data]
      }

      // @odata.count
      if (result.data['@odata.count'] != null) {
        state.totalCount = result.data['@odata.count']
      } else {
        state.totalCount = state.rows.length
      }
    } else {
      state.rows = []
      state.totalCount = null
    }
  }

  function cancel() {
    if (state.abortController) {
      state.abortController.abort()
      state.abortController = null
    }
    state.loading = false
  }

  function clear() {
    state.loading = false
    state.data = null
    state.rows = []
    state.totalCount = null
    state.status = 0
    state.statusText = ''
    state.elapsedMs = 0
    state.sizeBytes = 0
    state.ok = false
    state.error = null
    state.executedUrl = null
    state.hasRun = false
  }

  return {
    state,
    setStart,
    setResult,
    cancel,
    clear,
  }
}
