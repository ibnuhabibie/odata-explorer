import { reactive, watch } from 'vue'
import { uid } from '@/utils/format.js'

const HISTORY_KEY = 'odata:history'
const SAVED_KEY = 'odata:saved'

const state = reactive({
  history: [],
  saved: [],
})

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) state.history = JSON.parse(raw)
  } catch { /* ignore */ }
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    if (raw) state.saved = JSON.parse(raw)
  } catch { /* ignore */ }
}

loadHistory()
loadSaved()

watch(
  () => state.history,
  (val) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(val))
  },
  { deep: true }
)

watch(
  () => state.saved,
  (val) => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(val))
  },
  { deep: true }
)

export function useHistory() {
  function addHistory(entry) {
    state.history.unshift({
      id: uid(),
      timestamp: Date.now(),
      ...entry,
    })
    // Keep last 100
    if (state.history.length > 100) {
      state.history = state.history.slice(0, 100)
    }
  }

  function clearHistory() {
    state.history = []
  }

  function removeHistory(id) {
    state.history = state.history.filter((h) => h.id !== id)
  }

  function saveQuery(name, snapshot, url) {
    state.saved.unshift({
      id: uid(),
      name,
      timestamp: Date.now(),
      entitySet: snapshot.entitySet,
      url,
      snapshot,
    })
  }

  function removeSaved(id) {
    state.saved = state.saved.filter((s) => s.id !== id)
  }

  return {
    state,
    addHistory,
    clearHistory,
    removeHistory,
    saveQuery,
    removeSaved,
  }
}
