<script setup>
import { computed } from 'vue'
import { useResponse } from '@/stores/response.js'
import { formatMs, formatBytes, statusColor } from '@/utils/format.js'

const { state: respState } = useResponse()

const statusCls = computed(() => statusColor(respState.status))
</script>

<template>
  <div class="flex items-center gap-4 px-3 py-1.5 border-t border-stroke bg-panel text-[11px] shrink-0">
    <!-- Status -->
    <div class="flex items-center gap-1.5">
      <span
        v-if="respState.hasRun"
        :class="['font-mono font-semibold', statusCls]"
      >{{ respState.status }} {{ respState.statusText }}</span>
      <span v-else class="text-ink-faint">Ready</span>
    </div>

    <div v-if="respState.hasRun" class="w-px h-3 bg-stroke"></div>

    <!-- Timing -->
    <div v-if="respState.hasRun" class="flex items-center gap-1.5 text-ink-faint">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <span class="font-mono">{{ formatMs(respState.elapsedMs) }}</span>
    </div>

    <div v-if="respState.hasRun" class="w-px h-3 bg-stroke"></div>

    <!-- Size -->
    <div v-if="respState.hasRun" class="flex items-center gap-1.5 text-ink-faint">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
      <span class="font-mono">{{ formatBytes(respState.sizeBytes) }}</span>
    </div>

    <div v-if="respState.hasRun" class="w-px h-3 bg-stroke"></div>

    <!-- Row count -->
    <div v-if="respState.hasRun && respState.ok" class="text-ink-faint">
      <span class="font-mono text-ink-dim">{{ respState.rows.length }}</span> rows
    </div>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Executed URL (truncated) -->
    <div v-if="respState.executedUrl" class="flex items-center gap-1.5 min-w-0 max-w-[40%]">
      <span class="text-ink-faint shrink-0">Last:</span>
      <span class="font-mono text-ink-faint truncate text-[10px]">{{ respState.executedUrl }}</span>
    </div>
  </div>
</template>
