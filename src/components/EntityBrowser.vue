<script setup>
import { computed, ref } from 'vue'
import { useMetadata } from '@/stores/metadata.js'
import { useQuery } from '@/stores/query.js'
import { prettyType } from '@/utils/odata.js'

const { state: metaState, getEntityTypeBySet } = useMetadata()
const { setEntitySet, state: queryState } = useQuery()

const search = ref('')
const expandedSet = ref(null)

const filteredSets = computed(() => {
  if (!metaState.parsed) return []
  const term = search.value.toLowerCase().trim()
  if (!term) return metaState.parsed.entitySets
  return metaState.parsed.entitySets.filter(
    (s) => s.name.toLowerCase().includes(term) || (s.entityTypeName || '').toLowerCase().includes(term)
  )
})

function selectSet(name) {
  setEntitySet(name)
  expandedSet.value = expandedSet.value === name ? null : name
}

const currentType = computed(() => {
  if (!expandedSet.value) return null
  return getEntityTypeBySet(expandedSet.value)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Search -->
    <div class="p-2.5 border-b border-stroke">
      <div class="relative">
        <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          v-model="search"
          placeholder="Search entity sets…"
          class="w-full bg-base border border-stroke rounded-md pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
      </div>
    </div>

    <!-- Entity set list -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="metaState.loading" class="p-4 text-center text-xs text-ink-faint">Loading metadata…</div>
      <div v-else-if="metaState.error" class="p-4 text-center text-xs text-danger">{{ metaState.error }}</div>
      <div v-else-if="filteredSets.length === 0" class="p-4 text-center text-xs text-ink-faint">
        No entity sets found
      </div>

      <div v-else class="py-1">
        <div v-for="set in filteredSets" :key="set.name">
          <!-- Entity set row -->
          <button
            @click="selectSet(set.name)"
            :class="[
              'w-full flex items-center gap-1.5 px-3 py-1.5 text-left transition-colors group',
              queryState.entitySet === set.name
                ? 'bg-accent-soft text-accent-2'
                : 'hover:bg-hover text-ink-dim'
            ]"
          >
            <svg
              :class="['shrink-0 transition-transform text-ink-faint', expandedSet === set.name && 'rotate-90']"
              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            >
              <path d="M9 18l6-6-6-6"/>
            </svg>
            <svg class="shrink-0" :class="queryState.entitySet === set.name ? 'text-accent' : 'text-violet'" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>
            </svg>
            <span class="flex-1 text-xs font-medium truncate">{{ set.name }}</span>
          </button>

          <!-- Expanded property list -->
          <div v-if="expandedSet === set.name" class="ml-7 mr-2 mb-1.5 border-l border-stroke pl-2.5">
            <div v-if="getEntityTypeBySet(set.name)" class="space-y-0.5 py-1">
              <div
                v-for="prop in getEntityTypeBySet(set.name).properties"
                :key="prop.name"
                class="flex items-center gap-2 text-[11px] py-0.5"
              >
                <svg
                  v-if="prop.isKey"
                  width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  class="text-amber shrink-0"
                ><circle cx="8" cy="16" r="4"/><path d="M10.8 13.2 18 6M15 5l4 4"/></svg>
                <span v-else class="w-[9px] shrink-0"></span>
                <span class="text-ink-dim truncate">{{ prop.name }}</span>
                <span class="text-ink-faint font-mono ml-auto text-[10px]">{{ prettyType(prop.type) }}</span>
              </div>
              <div
                v-for="nav in getEntityTypeBySet(set.name).navProperties"
                :key="nav.name"
                class="flex items-center gap-2 text-[11px] py-0.5"
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-info shrink-0"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></svg>
                <span class="text-info/80 truncate">{{ nav.name }}</span>
                <span class="text-ink-faint font-mono ml-auto text-[10px]">nav</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer stats -->
    <div v-if="metaState.parsed" class="px-3 py-1.5 border-t border-stroke text-[10px] text-ink-faint flex items-center gap-3">
      <span>{{ metaState.parsed.entitySets.length }} entity sets</span>
    </div>
  </div>
</template>
