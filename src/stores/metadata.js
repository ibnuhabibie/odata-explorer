import { reactive } from 'vue'
import { parseMetadata } from '@/utils/odata.js'

const state = reactive({
  raw: null,
  parsed: null,
  loading: false,
  error: null,
  lastUrl: null,
})

export function useMetadata() {
  function load(xmlText, url) {
    state.loading = true
    state.error = null
    try {
      state.parsed = parseMetadata(xmlText)
      state.raw = xmlText
      state.lastUrl = url
    } catch (err) {
      state.error = err.message
      state.parsed = null
    } finally {
      state.loading = false
    }
  }

  function clear() {
    state.raw = null
    state.parsed = null
    state.loading = false
    state.error = null
    state.lastUrl = null
  }

  function getEntityTypeBySet(entitySetName) {
    if (!state.parsed || !entitySetName) return null
    const set = state.parsed.entitySets.find((s) => s.name === entitySetName)
    if (!set) return null
    return state.parsed.entityTypes.get(set.entityType) || null
  }

  return {
    state,
    load,
    clear,
    getEntityTypeBySet,
  }
}
