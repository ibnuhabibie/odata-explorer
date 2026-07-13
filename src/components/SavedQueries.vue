<script setup>
import { ref, computed } from 'vue'
import { useHistory } from '@/stores/history.js'
import { useQuery } from '@/stores/query.js'
import { useResponse } from '@/stores/response.js'
import { executeRequest } from '@/utils/request.js'
import { useConnection } from '@/stores/connection.js'
import { buildODataUrl } from '@/utils/urlBuilder.js'

const { state: histState, saveQuery, removeSaved } = useHistory()
const { snapshot, loadFromSnapshot, state: queryState } = useQuery()
const { setStart, setResult } = useResponse()
const { getActive } = useConnection()

const showSaveDialog = ref(false)
const saveName = ref('')

const currentUrl = computed(() => {
  const conn = getActive()
  if (!conn?.url || !queryState.entitySet) return ''
  return buildODataUrl({
    baseUrl: conn.url,
    entitySet: queryState.entitySet,
    query: queryState,
  })
})

function openSaveDialog() {
  saveName.value = queryState.entitySet || ''
  showSaveDialog.value = true
}

function confirmSave() {
  if (!saveName.value.trim()) return
  saveQuery(saveName.value.trim(), snapshot(), currentUrl.value)
  showSaveDialog.value = false
}

function load(saved) {
  loadFromSnapshot(saved.snapshot)
}

async function run(saved) {
  loadFromSnapshot(saved.snapshot)
  const conn = getActive()
  setStart()
  const result = await executeRequest({
    url: saved.url,
    headers: conn?.headers ? Object.fromEntries(conn.headers.filter(h => h.key && h.value).map(h => [h.key, h.value])) : {},
    auth: conn?.auth?.type !== 'none' ? conn.auth : null,
    useProxy: conn?.useProxy || false,
  })
  setResult(result, saved.url)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-3 py-2 border-b border-stroke">
      <span class="text-[10px] font-medium text-ink-dim uppercase tracking-wider">Saved Queries</span>
      <button
        @click="openSaveDialog"
        class="text-[10px] text-accent hover:text-accent-2 font-medium flex items-center gap-1"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        Save current
      </button>
    </div>

    <!-- Save dialog -->
    <div v-if="showSaveDialog" class="p-3 border-b border-stroke bg-elevated space-y-2">
      <input
        v-model="saveName"
        placeholder="Query name…"
        class="w-full bg-base border border-stroke rounded-md px-2.5 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
        @keydown.enter="confirmSave"
        autofocus
      />
      <div class="text-[10px] font-mono text-ink-faint bg-base border border-stroke rounded-md px-2.5 py-1.5 break-all max-h-16 overflow-y-auto">
        {{ currentUrl || 'No query active' }}
      </div>
      <div class="flex gap-2">
        <button @click="confirmSave" :disabled="!currentUrl" class="px-2.5 py-1 rounded-md text-[10px] font-medium bg-accent text-base disabled:opacity-40 disabled:cursor-not-allowed">Save</button>
        <button @click="showSaveDialog = false" class="px-2.5 py-1 rounded-md text-[10px] text-ink-dim hover:text-ink">Cancel</button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="histState.saved.length === 0" class="p-4 text-center text-xs text-ink-faint">
        No saved queries
      </div>

      <div v-else class="py-1">
        <div
          v-for="saved in histState.saved"
          :key="saved.id"
          class="group px-3 py-2 hover:bg-hover border-b border-stroke/30 transition-colors"
        >
          <div class="text-xs text-ink font-medium mb-0.5">{{ saved.name }}</div>
          <div class="text-[10px] text-violet font-mono truncate mb-1">{{ saved.entitySet || '—' }}</div>
          <div class="text-[10px] text-ink-faint font-mono truncate" :title="saved.url">{{ saved.url }}</div>

          <div class="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="load(saved)" class="text-[10px] text-accent hover:text-accent-2 font-medium">Load</button>
            <button @click="run(saved)" class="text-[10px] text-ink-dim hover:text-ink font-medium">Run</button>
            <button @click="removeSaved(saved.id)" class="ml-auto text-[10px] text-ink-faint hover:text-danger">Remove</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
