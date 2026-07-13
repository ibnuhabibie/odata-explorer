<script setup>
import { computed } from 'vue'
import { useHistory } from '@/stores/history.js'
import { useQuery } from '@/stores/query.js'
import { useResponse } from '@/stores/response.js'
import { executeRequest } from '@/utils/request.js'
import { useConnection } from '@/stores/connection.js'
import { formatMs, statusColor as getStatusColor } from '@/utils/format.js'

const { state: histState, clearHistory, removeHistory } = useHistory()
const { loadFromSnapshot, snapshot } = useQuery()
const { setStart, setResult } = useResponse()
const { getActive } = useConnection()

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function statusColor(s) {
  return getStatusColor(s)
}

function restore(entry) {
  if (entry.snapshot) {
    loadFromSnapshot(entry.snapshot)
  }
}

async function rerun(entry) {
  if (entry.snapshot) {
    loadFromSnapshot(entry.snapshot)
  }
  const conn = getActive()
  setStart()
  const result = await executeRequest({
    url: entry.url,
    headers: conn?.headers ? Object.fromEntries(conn.headers.filter(h => h.key && h.value).map(h => [h.key, h.value])) : {},
    auth: conn?.auth?.type !== 'none' ? conn.auth : null,
    useProxy: conn?.useProxy || false,
  })
  setResult(result, entry.url)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-3 py-2 border-b border-stroke">
      <span class="text-[10px] font-medium text-ink-dim uppercase tracking-wider">History</span>
      <button
        v-if="histState.history.length > 0"
        @click="clearHistory"
        class="text-[10px] text-ink-faint hover:text-danger transition-colors"
      >Clear all</button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="histState.history.length === 0" class="p-4 text-center text-xs text-ink-faint">
        No requests yet
      </div>

      <div v-else class="py-1">
        <div
          v-for="entry in histState.history"
          :key="entry.id"
          class="group px-3 py-2 hover:bg-hover border-b border-stroke/30 transition-colors"
        >
          <div class="flex items-center gap-2 mb-1">
            <span :class="['text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0',
              entry.status < 300 ? 'bg-success/10 text-success' :
              entry.status < 400 ? 'bg-info/10 text-info' :
              entry.status < 500 ? 'bg-amber/10 text-amber' : 'bg-danger/10 text-danger'
            ]">
              {{ entry.status }}
            </span>
            <code class="text-[10px] font-mono text-ink-faint shrink-0">{{ formatMs(entry.elapsedMs) }}</code>
            <span class="text-[10px] text-ink-faint ml-auto">{{ timeAgo(entry.timestamp) }}</span>
          </div>
          <div class="text-[11px] text-ink-dim font-mono truncate mb-1">{{ entry.entitySet || '—' }}</div>
          <div class="text-[10px] text-ink-faint font-mono truncate" :title="entry.url">{{ entry.url }}</div>

          <div class="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click="restore(entry)"
              class="text-[10px] text-accent hover:text-accent-2 font-medium"
            >Load query</button>
            <button
              @click="rerun(entry)"
              class="text-[10px] text-ink-dim hover:text-ink font-medium"
            >Re-run</button>
            <button
              @click="removeHistory(entry.id)"
              class="ml-auto text-[10px] text-ink-faint hover:text-danger"
            >Remove</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
