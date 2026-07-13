<script setup>
import { computed, ref } from 'vue'
import { useConnection } from '@/stores/connection.js'
import { useQuery } from '@/stores/query.js'
import { useResponse } from '@/stores/response.js'
import { useHistory } from '@/stores/history.js'
import { buildODataUrl, highlightUrl } from '@/utils/urlBuilder.js'
import { toCurl, toFetch, toAxios } from '@/utils/copyFormats.js'
import { executeRequest } from '@/utils/request.js'

const { getActive } = useConnection()
const { state: queryState, snapshot } = useQuery()
const { setStart, setResult, state: respState } = useResponse()
const { addHistory } = useHistory()

const conn = computed(() => getActive())

const fullUrl = computed(() => {
  if (!conn.value || !conn.value.url || !queryState.entitySet) return ''
  return buildODataUrl({
    baseUrl: conn.value.url,
    entitySet: queryState.entitySet,
    query: queryState,
  })
})

const highlightedUrl = computed(() => highlightUrl(fullUrl.value))

// Copy state
const copied = ref('')
const showCodeMenu = ref(false)
const codeFormat = ref('curl')

const codeOutput = computed(() => {
  if (!fullUrl.value) return ''
  const ctx = {
    url: fullUrl.value,
    method: 'GET',
    headers: headersObj(),
    auth: conn.value?.auth?.type !== 'none' ? conn.value.auth : null,
  }
  switch (codeFormat.value) {
    case 'curl': return toCurl(ctx)
    case 'fetch': return toFetch(ctx)
    case 'axios': return toAxios(ctx)
    default: return fullUrl.value
  }
})

function headersObj() {
  const obj = {}
  for (const h of conn.value?.headers || []) {
    if (h.key && h.value) obj[h.key] = h.value
  }
  return obj
}

async function copy(text, label) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = label
    setTimeout(() => (copied.value = ''), 1500)
  } catch {
    // ignore
  }
}

async function execute() {
  if (!fullUrl.value) return
  setStart()
  const url = fullUrl.value
  const result = await executeRequest({
    url,
    headers: headersObj(),
    auth: conn.value?.auth?.type !== 'none' ? conn.value.auth : null,
    signal: respState.abortController?.signal,
    useProxy: conn.value?.useProxy || false,
  })
  setResult(result, url)
  addHistory({
    url,
    method: 'GET',
    status: result.status,
    entitySet: queryState.entitySet,
    elapsedMs: result.elapsedMs,
    sizeBytes: result.sizeBytes,
    snapshot: snapshot(),
  })
}

const codeFormats = [
  { value: 'curl', label: 'cURL' },
  { value: 'fetch', label: 'Fetch' },
  { value: 'axios', label: 'Axios' },
  { value: 'url', label: 'URL' },
]
</script>

<template>
  <div class="border-t border-stroke bg-panel">
    <!-- Action bar -->
    <div class="flex items-stretch gap-0">
      <!-- Execute -->
      <button
        @click="execute"
        :disabled="!fullUrl || respState.loading"
        class="px-4 flex items-center gap-1.5 text-sm font-semibold bg-accent text-base hover:bg-accent-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <svg v-if="respState.loading" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        {{ respState.loading ? 'Running' : 'Run' }}
      </button>

      <!-- URL text (truncated, click to copy) -->
      <div
        class="flex-1 overflow-hidden px-3 flex items-center min-h-[38px] cursor-pointer group"
        @click="copy(fullUrl, 'url')"
        :title="fullUrl"
      >
        <code v-if="fullUrl" class="text-[10px] font-mono text-ink-faint group-hover:text-accent transition-colors truncate block max-w-full">{{ fullUrl }}</code>
        <span v-else class="text-xs text-ink-faint italic">Select an entity set…</span>
      </div>

      <!-- Copy buttons -->
      <div class="flex items-center gap-1 px-2 border-l border-stroke shrink-0">
        <button
          @click="copy(fullUrl, 'url')"
          class="p-1.5 text-ink-faint hover:text-accent transition-colors relative"
          title="Copy URL"
        >
          <svg v-if="copied !== 'url'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-success"><path d="M20 6 9 17l-5-5"/></svg>
        </button>
        <button
          @click="showCodeMenu = !showCodeMenu"
          :class="['p-1.5 transition-colors relative', showCodeMenu ? 'text-accent' : 'text-ink-faint hover:text-ink']"
          title="Copy as code"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>
        </button>
      </div>
    </div>

    <!-- Code snippet panel -->
    <transition name="fade">
      <div v-if="showCodeMenu" class="border-t border-stroke bg-base">
        <div class="flex items-center gap-1 px-3 py-1.5 border-b border-stroke">
          <button
            v-for="fmt in codeFormats"
            :key="fmt.value"
            @click="codeFormat = fmt.value"
            :class="[
              'px-2 py-0.5 rounded text-[10px] font-medium font-mono transition-colors',
              codeFormat === fmt.value ? 'bg-accent-soft text-accent-2' : 'text-ink-faint hover:text-ink'
            ]"
          >{{ fmt.label }}</button>
          <button
            @click="copy(codeOutput, codeFormat)"
            class="ml-auto p-1 text-ink-faint hover:text-accent transition-colors"
            title="Copy"
          >
            <svg v-if="copied !== codeFormat" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-success"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
        </div>
        <pre class="px-3 py-2 text-[11px] font-mono text-ink-dim overflow-x-auto whitespace-pre max-h-40"><code>{{ codeOutput }}</code></pre>
      </div>
    </transition>
  </div>
</template>
