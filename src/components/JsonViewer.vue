<script setup>
import { computed, ref } from 'vue'
import { useResponse } from '@/stores/response.js'
import { formatBytes } from '@/utils/format.js'

const { state: respState } = useResponse()

const prettyJson = computed(() => {
  if (!respState.data) return ''
  try {
    return JSON.stringify(respState.data, null, 2)
  } catch {
    return String(respState.data)
  }
})

const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(prettyJson.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch { /* ignore */ }
}

function syntaxHighlight(json) {
  if (!json) return ''
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-amber' // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-accent' // key
        } else {
          cls = 'text-success' // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-violet' // boolean
      } else if (/null/.test(match)) {
        cls = 'text-ink-faint' // null
      }
      return `<span class="${cls}">${match}</span>`
    }
  )
}

const highlighted = computed(() => syntaxHighlight(prettyJson.value))
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 px-3 py-1.5 border-b border-stroke bg-panel shrink-0">
      <span class="text-[10px] text-ink-faint font-mono">{{ formatBytes(respState.sizeBytes) }}</span>
      <div class="ml-auto flex items-center gap-1">
        <button
          @click="copy"
          class="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
          :class="copied ? 'text-success' : 'text-ink-faint hover:text-accent'"
        >
          <svg v-if="!copied" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
    </div>

    <!-- JSON content -->
    <div class="flex-1 overflow-auto">
      <div v-if="respState.error && !respState.data" class="flex items-center justify-center h-full p-8">
        <p class="text-xs text-danger font-mono">{{ respState.error }}</p>
      </div>
      <div v-else-if="!respState.data" class="flex items-center justify-center h-full p-8">
        <p class="text-sm text-ink-faint">No response data</p>
      </div>
      <pre v-else class="text-[11px] font-mono leading-relaxed p-3 whitespace-pre"><code v-html="highlighted"></code></pre>
    </div>
  </div>
</template>
