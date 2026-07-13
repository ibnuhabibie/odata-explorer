<script setup>
import { computed, ref } from 'vue'
import { useQuery } from '@/stores/query.js'
import { useMetadata } from '@/stores/metadata.js'
import { prettyType } from '@/utils/odata.js'
import FilterBuilder from './FilterBuilder.vue'

const { state, toggleSelect, addOrderby, removeOrderby, addExpand, removeExpand } = useQuery()
const { state: metaState, getEntityTypeBySet } = useMetadata()

const entityType = computed(() => getEntityTypeBySet(state.entitySet))
const properties = computed(() => entityType.value?.properties || [])
const navProperties = computed(() => entityType.value?.navProperties || [])

// Collapsible sections
const openSections = ref({ select: true, filter: false, orderby: false, expand: false, options: true })

function toggle(key) {
  openSections.value[key] = !openSections.value[key]
}

const selectAll = computed({
  get: () => properties.value.length > 0 && properties.value.every((p) => state.select.includes(p.name)),
  set: (val) => {
    if (val) {
      state.select = properties.value.map((p) => p.name)
    } else {
      state.select = []
    }
  },
})
</script>

<template>
  <div class="space-y-1">
    <!-- Entity Set indicator -->
    <div class="flex items-center gap-2 px-1 py-1.5">
      <svg class="text-violet" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>
      </svg>
      <span class="text-xs text-ink-faint">Querying</span>
      <code class="text-xs font-semibold text-accent font-mono">{{ state.entitySet || '—' }}</code>
      <span v-if="entityType" class="text-[10px] text-ink-faint font-mono">({{ entityType.fullName }})</span>
    </div>

    <!-- $select -->
    <div class="border border-stroke rounded-lg overflow-hidden bg-panel/50">
      <button @click="toggle('select')" class="w-full flex items-center gap-2 px-3 py-2 hover:bg-hover transition-colors">
        <svg :class="['transition-transform text-ink-faint', openSections.select && 'rotate-90']" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
        <code class="text-xs font-mono font-semibold text-accent">$select</code>
        <span class="text-[10px] text-ink-faint">Choose fields to return</span>
        <span v-if="state.select.length > 0" class="ml-auto text-[10px] bg-accent-soft text-accent-2 px-1.5 py-0.5 rounded font-mono">{{ state.select.length }}</span>
      </button>
      <div v-show="openSections.select" class="px-3 pb-3 pt-1">
        <label class="flex items-center gap-2 mb-2 cursor-pointer">
          <input type="checkbox" v-model="selectAll" class="accent-accent w-3.5 h-3.5" />
          <span class="text-[11px] text-ink-dim">Select all</span>
        </label>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="prop in properties"
            :key="prop.name"
            @click="toggleSelect(prop.name)"
            :class="[
              'px-2 py-1 rounded text-[11px] font-mono border transition-all flex items-center gap-1',
              state.select.includes(prop.name)
                ? 'bg-accent-soft border-accent/50 text-accent-2'
                : 'bg-base border-stroke text-ink-dim hover:border-stroke-2'
            ]"
          >
            <svg v-if="prop.isKey" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-amber"><circle cx="8" cy="16" r="4"/><path d="M10.8 13.2 18 6M15 5l4 4"/></svg>
            {{ prop.name }}
            <span class="text-[9px] opacity-60">{{ prettyType(prop.type) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- $filter -->
    <div class="border border-stroke rounded-lg overflow-hidden bg-panel/50">
      <button @click="toggle('filter')" class="w-full flex items-center gap-2 px-3 py-2 hover:bg-hover transition-colors">
        <svg :class="['transition-transform text-ink-faint', openSections.filter && 'rotate-90']" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
        <code class="text-xs font-mono font-semibold text-accent">$filter</code>
        <span class="text-[10px] text-ink-faint">Filter results</span>
        <span v-if="state.filter.length > 0" class="ml-auto text-[10px] bg-accent-soft text-accent-2 px-1.5 py-0.5 rounded font-mono">{{ state.filter.length }}</span>
      </button>
      <div v-show="openSections.filter" class="px-3 pb-3 pt-1">
        <FilterBuilder />
      </div>
    </div>

    <!-- $orderby -->
    <div class="border border-stroke rounded-lg overflow-hidden bg-panel/50">
      <button @click="toggle('orderby')" class="w-full flex items-center gap-2 px-3 py-2 hover:bg-hover transition-colors">
        <svg :class="['transition-transform text-ink-faint', openSections.orderby && 'rotate-90']" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
        <code class="text-xs font-mono font-semibold text-accent">$orderby</code>
        <span class="text-[10px] text-ink-faint">Sort results</span>
        <span v-if="state.orderby.length > 0" class="ml-auto text-[10px] bg-accent-soft text-accent-2 px-1.5 py-0.5 rounded font-mono">{{ state.orderby.length }}</span>
      </button>
      <div v-show="openSections.orderby" class="px-3 pb-3 pt-1">
        <div class="space-y-1.5">
          <div v-for="(o, i) in state.orderby" :key="o.id" class="flex items-center gap-1.5">
            <span class="w-7"></span>
            <select v-model="o.field" class="flex-1 bg-base border border-stroke rounded-md px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none">
              <option value="">Field…</option>
              <option v-for="p in properties" :key="p.name" :value="p.name">{{ p.name }}</option>
            </select>
            <select v-model="o.dir" class="bg-base border border-stroke rounded-md px-2 py-1 text-xs text-ink-dim focus:border-accent focus:outline-none">
              <option value="asc">asc</option>
              <option value="desc">desc</option>
            </select>
            <button @click="removeOrderby(o.id)" class="p-1 text-ink-faint hover:text-danger transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <button @click="addOrderby" class="mt-2 text-xs text-accent hover:text-accent-2 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add sort
        </button>
      </div>
    </div>

    <!-- $expand -->
    <div class="border border-stroke rounded-lg overflow-hidden bg-panel/50">
      <button @click="toggle('expand')" class="w-full flex items-center gap-2 px-3 py-2 hover:bg-hover transition-colors">
        <svg :class="['transition-transform text-ink-faint', openSections.expand && 'rotate-90']" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
        <code class="text-xs font-mono font-semibold text-accent">$expand</code>
        <span class="text-[10px] text-ink-faint">Include related entities</span>
        <span v-if="state.expand.length > 0" class="ml-auto text-[10px] bg-accent-soft text-accent-2 px-1.5 py-0.5 rounded font-mono">{{ state.expand.length }}</span>
      </button>
      <div v-show="openSections.expand" class="px-3 pb-3 pt-1">
        <div class="space-y-1.5">
          <div v-for="(e, i) in state.expand" :key="e.id" class="flex items-center gap-1.5">
            <span class="w-7"></span>
            <select v-model="e.path" class="flex-1 bg-base border border-stroke rounded-md px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none">
              <option value="">Navigation…</option>
              <option v-for="nav in navProperties" :key="nav.name" :value="nav.name">{{ nav.name }}</option>
            </select>
            <button @click="removeExpand(e.id)" class="p-1 text-ink-faint hover:text-danger transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <button @click="addExpand" class="mt-2 text-xs text-accent hover:text-accent-2 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add expand
        </button>
        <p v-if="navProperties.length === 0" class="text-[10px] text-ink-faint mt-1.5">No navigation properties on this entity.</p>
      </div>
    </div>

    <!-- Options: $top, $skip, $count -->
    <div class="border border-stroke rounded-lg overflow-hidden bg-panel/50">
      <button @click="toggle('options')" class="w-full flex items-center gap-2 px-3 py-2 hover:bg-hover transition-colors">
        <svg :class="['transition-transform text-ink-faint', openSections.options && 'rotate-90']" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
        <span class="text-xs font-semibold text-ink-dim">Paging &amp; Options</span>
        <code class="text-[10px] text-ink-faint">$top · $skip · $count</code>
      </button>
      <div v-show="openSections.options" class="px-3 pb-3 pt-1">
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-[10px] text-ink-faint mb-1 font-mono">$top</label>
            <input
              v-model.number="state.top"
              type="number"
              min="1"
              class="w-full bg-base border border-stroke rounded-md px-2 py-1 text-xs font-mono text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-[10px] text-ink-faint mb-1 font-mono">$skip</label>
            <input
              v-model.number="state.skip"
              type="number"
              min="0"
              class="w-full bg-base border border-stroke rounded-md px-2 py-1 text-xs font-mono text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-[10px] text-ink-faint mb-1 font-mono">$count</label>
            <label class="flex items-center h-[26px] cursor-pointer">
              <input type="checkbox" v-model="state.count" class="accent-accent w-3.5 h-3.5" />
              <span class="text-[11px] text-ink-dim ml-1.5">total</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
