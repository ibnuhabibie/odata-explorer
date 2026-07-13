<script setup>
import { useConnection } from '@/stores/connection.js'
import { useMetadata } from '@/stores/metadata.js'
import { fetchMetadata } from '@/utils/request.js'
import { computed } from 'vue'
import ConnectionModal from './ConnectionModal.vue'

const { state, getActive, setActive, addConnection, removeConnection, setStatus, openModal, closeModal } = useConnection()
const metadata = useMetadata()

const activeConn = computed(() => getActive())

async function connect() {
  const conn = activeConn.value
  if (!conn || !conn.url) {
    openModal('edit')
    return
  }

  setStatus('connecting')
  metadata.state.loading = true
  metadata.state.error = null

  try {
    const result = await fetchMetadata(conn.url, headersObj(conn), conn.auth, null, conn.useProxy)
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

function saveAndConnect() {
  closeModal()
  connect()
}

function handleDelete() {
  if (activeConn.value) {
    removeConnection(activeConn.value.id)
    closeModal()
  }
}

function headersObj(conn) {
  const obj = {}
  for (const h of conn.headers || []) {
    if (h.key && h.value) obj[h.key] = h.value
  }
  return obj
}

const statusInfo = computed(() => {
  switch (state.status) {
    case 'connected': return { dot: 'bg-success', text: 'Connected', color: 'text-success' }
    case 'connecting': return { dot: 'bg-amber animate-pulse', text: 'Connecting…', color: 'text-amber' }
    case 'error': return { dot: 'bg-danger', text: 'Error', color: 'text-danger' }
    default: return { dot: 'bg-ink-faint', text: 'Not connected', color: 'text-ink-faint' }
  }
})
</script>

<template>
  <header class="flex items-center gap-2.5 px-4 h-12 border-b border-stroke bg-panel shrink-0">
    <!-- Logo -->
    <div class="flex items-center gap-2 mr-1">
      <svg width="22" height="22" viewBox="0 0 32 32" class="shrink-0">
        <rect width="32" height="32" rx="7" fill="#0c0f14"/>
        <circle cx="16" cy="16" r="9" fill="none" stroke="#2dd4bf" stroke-width="2.5"/>
        <circle cx="16" cy="16" r="3" fill="#2dd4bf"/>
      </svg>
      <span class="font-semibold text-[15px] tracking-tight">OData Explorer</span>
    </div>

    <div class="w-px h-5 bg-stroke"></div>

    <!-- Connection selector -->
    <select
      :value="state.activeId"
      @change="setActive($event.target.value)"
      :disabled="state.connections.length === 0"
      class="bg-elevated border border-stroke rounded-md pl-2.5 pr-7 py-1.5 text-sm text-ink focus:border-accent focus:outline-none cursor-pointer min-w-[130px] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option v-if="state.connections.length === 0" value="" disabled>No connections</option>
      <option v-for="c in state.connections" :key="c.id" :value="c.id">{{ c.name }}</option>
    </select>

    <!-- Add -->
    <button
      @click="openModal('add')"
      class="p-1.5 hover:bg-hover rounded-md text-ink-dim hover:text-accent transition-colors"
      title="Add connection"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </button>

    <!-- Edit -->
    <button
      v-if="activeConn"
      @click="openModal('edit')"
      class="p-1.5 hover:bg-hover rounded-md text-ink-dim hover:text-ink transition-colors"
      title="Edit connection"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      </svg>
    </button>

    <!-- URL hint -->
    <div v-if="activeConn?.url" class="flex-1 min-w-0 mx-1 overflow-hidden">
      <span class="text-[11px] font-mono text-ink-faint truncate block">{{ activeConn.url }}</span>
    </div>
    <div v-else class="flex-1"></div>

    <!-- Status badge -->
    <div class="flex items-center gap-1.5 text-xs font-medium shrink-0">
      <span :class="['w-2 h-2 rounded-full', statusInfo.dot]"></span>
      <span :class="statusInfo.color">{{ statusInfo.text }}</span>
    </div>

    <!-- Connect/Disconnect -->
    <button
      v-if="state.status !== 'connected'"
      @click="connect"
      :disabled="state.status === 'connecting'"
      class="px-3 py-1.5 rounded-md text-sm font-medium bg-accent text-base hover:bg-accent-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 12h14M13 6l6 6-6 6"/>
      </svg>
      Connect
    </button>
    <button
      v-else
      @click="disconnect"
      class="px-3 py-1.5 rounded-md text-sm font-medium border border-stroke text-ink-dim hover:text-danger hover:border-danger/50 transition-colors shrink-0"
    >
      Disconnect
    </button>

    <!-- Connection modal -->
    <ConnectionModal
      v-if="state.showModal"
      @close="closeModal"
      @connect="saveAndConnect"
      @delete="handleDelete"
    />
  </header>
</template>
