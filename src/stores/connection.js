import { reactive, watch } from 'vue'

const STORAGE_KEY = 'odata:connections'

const state = reactive({
  connections: [],
  activeId: null,
  status: 'idle', // idle | connecting | connected | error
  error: null,
  showModal: false,
  modalMode: 'edit', // 'add' | 'edit'
})

// Load from localStorage
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      state.connections = data.connections || []
      state.activeId = data.activeId || (state.connections[0]?.id || null)
    }
  } catch {
    // ignore
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      connections: state.connections,
      activeId: state.activeId,
    })
  )
}

load()
watch(
  () => [state.connections, state.activeId],
  persist,
  { deep: true }
)

function createBlankConnection() {
  return {
    id: `conn-${Date.now()}`,
    name: 'New Connection',
    url: '',
    useProxy: true, // built-in proxy bypasses CORS by default
    headers: [],
    auth: { type: 'none', token: '', header: 'X-API-Key' },
  }
}

export function useConnection() {
  function getActive() {
    return state.connections.find((c) => c.id === state.activeId) || null
  }

  function addConnection() {
    const conn = createBlankConnection()
    state.connections.push(conn)
    state.activeId = conn.id
    return conn
  }

  function removeConnection(id) {
    const idx = state.connections.findIndex((c) => c.id === id)
    if (idx >= 0) {
      state.connections.splice(idx, 1)
      if (state.activeId === id) {
        state.activeId = state.connections[0]?.id || null
      }
    }
  }

  function setActive(id) {
    state.activeId = id
    state.status = 'idle'
    state.error = null
  }

  function setStatus(status, error = null) {
    state.status = status
    state.error = error
  }

  function openModal(mode = 'edit') {
    if (mode === 'add') {
      addConnection()
    }
    state.modalMode = mode
    state.showModal = true
  }

  function closeModal() {
    state.showModal = false
  }

  return {
    state,
    getActive,
    addConnection,
    removeConnection,
    setActive,
    setStatus,
    openModal,
    closeModal,
  }
}
