<script setup>
import { onMounted, onUnmounted } from 'vue'
import ConnectionPanel from './ConnectionPanel.vue'

const emit = defineEmits(['close', 'connect', 'delete'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[8vh]">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="emit('close')"
        ></div>

        <!-- Modal panel -->
        <div class="relative bg-panel border border-stroke rounded-xl shadow-2xl w-full max-w-lg max-h-[82vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-stroke shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-accent">
                  <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <h2 class="text-sm font-semibold">Connection Settings</h2>
            </div>
            <button
              @click="emit('close')"
              class="p-1 text-ink-faint hover:text-ink transition-colors rounded-md hover:bg-hover"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-5">
            <ConnectionPanel />
          </div>

          <!-- Footer -->
          <div class="flex items-center gap-2 px-5 py-3 border-t border-stroke shrink-0">
            <button
              @click="emit('delete')"
              class="px-2.5 py-1.5 rounded-md text-xs font-medium text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
              Delete
            </button>

            <div class="flex-1"></div>

            <button
              @click="emit('close')"
              class="px-3 py-1.5 rounded-md text-sm font-medium text-ink-dim hover:text-ink hover:bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              @click="emit('connect')"
              class="px-3 py-1.5 rounded-md text-sm font-medium bg-accent text-base hover:bg-accent-2 transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
              Save &amp; Connect
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
