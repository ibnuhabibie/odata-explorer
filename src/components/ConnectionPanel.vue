<script setup>
import { computed } from 'vue'
import { useConnection } from '@/stores/connection.js'

const { state, getActive } = useConnection()
const conn = computed(() => getActive())

const authTypes = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apikey', label: 'API Key' },
]

function addHeader() {
  conn.value?.headers.push({ key: '', value: '' })
}

function removeHeader(i) {
  conn.value?.headers.splice(i, 1)
}
</script>

<template>
  <div v-if="conn" class="space-y-4">
    <!-- Connection name -->
    <div>
      <label class="block text-[11px] font-medium text-ink-dim uppercase tracking-wider mb-1.5">Connection Name</label>
      <input
        v-model="conn.name"
        type="text"
        class="w-full bg-base border border-stroke rounded-md px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
      />
    </div>

    <!-- Service URL -->
    <div>
      <label class="block text-[11px] font-medium text-ink-dim uppercase tracking-wider mb-1.5">Service URL</label>
      <input
        v-model="conn.url"
        type="text"
        placeholder="https://services.odata.org/V4/OData/OData.svc/"
        class="w-full bg-base border border-stroke rounded-md px-3 py-1.5 text-sm font-mono text-ink focus:border-accent focus:outline-none"
      />
    </div>

    <!-- CORS Proxy -->
    <div class="flex items-start gap-2.5 p-2.5 rounded-md bg-elevated border border-stroke">
      <label class="flex items-center cursor-pointer pt-0.5">
        <input type="checkbox" v-model="conn.useProxy" class="accent-accent w-3.5 h-3.5" />
      </label>
      <div>
        <div class="text-xs font-medium text-ink">
          Bypass CORS
        </div>
        <p class="text-[11px] text-ink-faint mt-0.5 leading-relaxed">Route requests through a CORS proxy to bypass browser restrictions. Uses the Cloudflare Worker proxy when configured.</p>
      </div>
    </div>

    <!-- Custom Headers -->
    <div>
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-[11px] font-medium text-ink-dim uppercase tracking-wider">Custom Headers</label>
        <button @click="addHeader" class="text-xs text-accent hover:text-accent-2 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add
        </button>
      </div>
      <div v-if="conn.headers.length === 0" class="text-xs text-ink-faint italic py-2">No custom headers</div>
      <div class="space-y-1.5">
        <div v-for="(h, i) in conn.headers" :key="i" class="flex gap-1.5">
          <input
            v-model="h.key"
            placeholder="Header name"
            class="flex-1 bg-base border border-stroke rounded-md px-2 py-1.5 text-xs font-mono text-ink focus:border-accent focus:outline-none"
          />
          <input
            v-model="h.value"
            placeholder="Value"
            class="flex-1 bg-base border border-stroke rounded-md px-2 py-1.5 text-xs font-mono text-ink-dim focus:border-accent focus:outline-none"
          />
          <button @click="removeHeader(i)" class="p-1.5 text-ink-faint hover:text-danger transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Authentication -->
    <div>
      <label class="block text-[11px] font-medium text-ink-dim uppercase tracking-wider mb-1.5">Authentication</label>
      <select
        v-model="conn.auth.type"
        class="w-full bg-base border border-stroke rounded-md px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none cursor-pointer mb-2"
      >
        <option v-for="t in authTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>

      <div v-if="conn.auth.type === 'bearer'">
        <input
          v-model="conn.auth.token"
          type="password"
          placeholder="Bearer token"
          class="w-full bg-base border border-stroke rounded-md px-3 py-1.5 text-sm font-mono text-ink-dim focus:border-accent focus:outline-none"
        />
      </div>

      <div v-else-if="conn.auth.type === 'basic'">
        <input
          v-model="conn.auth.token"
          type="text"
          placeholder="Base64(user:pass)"
          class="w-full bg-base border border-stroke rounded-md px-3 py-1.5 text-sm font-mono text-ink-dim focus:border-accent focus:outline-none"
        />
        <p class="text-[11px] text-ink-faint mt-1">Enter base64-encoded credentials.</p>
      </div>

      <div v-else-if="conn.auth.type === 'apikey'" class="space-y-1.5">
        <input
          v-model="conn.auth.header"
          type="text"
          placeholder="Header name (e.g. X-API-Key)"
          class="w-full bg-base border border-stroke rounded-md px-3 py-1.5 text-sm font-mono text-ink-dim focus:border-accent focus:outline-none"
        />
        <input
          v-model="conn.auth.token"
          type="password"
          placeholder="API key value"
          class="w-full bg-base border border-stroke rounded-md px-3 py-1.5 text-sm font-mono text-ink-dim focus:border-accent focus:outline-none"
        />
      </div>
    </div>

  </div>
</template>
