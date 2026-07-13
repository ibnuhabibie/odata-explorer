<script setup>
import { computed, ref } from 'vue'
import { useResponse } from '@/stores/response.js'
import { useQuery } from '@/stores/query.js'
import { formatNumber } from '@/utils/format.js'

const { state: respState } = useResponse()
const { state: queryState, setPage, setPageSize, next, prev } = useQuery()

const expandedRow = ref(null)

function toggleRow(i) {
  expandedRow.value = expandedRow.value === i ? null : i
}

const columns = computed(() => {
  if (respState.rows.length === 0) return []
  const keys = []
  const seen = new Set()
  for (const row of respState.rows) {
    if (row && typeof row === 'object') {
      for (const key of Object.keys(row)) {
        if (key.startsWith('@') || seen.has(key)) continue
        // Skip object/array values — only show scalars in main grid
        const val = row[key]
        if (val !== null && typeof val === 'object') continue
        seen.add(key)
        keys.push(key)
      }
    }
  }
  return keys
})

const totalPages = computed(() => {
  if (respState.totalCount == null) return 0
  const size = queryState.pageSize || 1
  return Math.max(1, Math.ceil(respState.totalCount / size))
})

function formatCell(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function isObject(val) {
  return val !== null && typeof val === 'object'
}

function objectPreview(val) {
  if (Array.isArray(val)) return `[${val.length}]`
  const keys = Object.keys(val).filter(k => !k.startsWith('@'))
  if (keys.length === 0) return '{}'
  const parts = keys.slice(0, 2).map(k => {
    const v = val[k]
    if (v !== null && typeof v === 'object') return `${k}: …`
    if (typeof v === 'string') return `${k}: "${v.length > 20 ? v.slice(0, 20) + '…' : v}"`
    return `${k}: ${v}`
  })
  if (keys.length > 2) parts.push(`+${keys.length - 2}`)
  return `{ ${parts.join(', ')} }`
}

function hasExpandable(row) {
  return Object.values(row).some(v => v !== null && typeof v === 'object')
}

/**
 * Derive column names from array items.
 */
function getArrayColumns(items) {
  if (!Array.isArray(items) || items.length === 0) return []
  const cols = []
  const seen = new Set()
  for (const item of items) {
    if (item && typeof item === 'object') {
      for (const key of Object.keys(item)) {
        if (!key.startsWith('@') && !seen.has(key)) {
          seen.add(key)
          cols.push(key)
        }
      }
    }
  }
  return cols
}

/**
 * Categorize row properties into scalars, objects, and arrays.
 */
function parseRow(row) {
  const scalars = []
  const objects = []
  const arrays = []
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('@')) continue
    if (value === null || value === undefined) {
      scalars.push({ key, value: '' })
    } else if (Array.isArray(value)) {
      arrays.push({ key, items: value, columns: getArrayColumns(value) })
    } else if (typeof value === 'object') {
      objects.push({ key, value })
    } else {
      scalars.push({ key, value })
    }
  }
  return { scalars, objects, arrays }
}

const expandedData = computed(() => {
  if (expandedRow.value === null) return null
  const row = respState.rows[expandedRow.value]
  if (!row) return null
  return parseRow(row)
})

const pageSizes = [10, 20, 50, 100]

const pageNumbers = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = queryState.currentPage
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('…')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('…')
    pages.push(total)
  }
  return pages
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Grid -->
    <div class="flex-1 overflow-auto">
      <div v-if="respState.error && !respState.ok" class="flex items-center justify-center h-full p-8">
        <div class="text-center max-w-md">
          <svg class="mx-auto mb-3 text-danger" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <p class="text-sm text-danger font-medium mb-1">Request failed</p>
          <p class="text-xs text-ink-faint font-mono break-all">{{ respState.error }}</p>
        </div>
      </div>

      <div v-else-if="!respState.hasRun" class="flex items-center justify-center h-full p-8">
        <div class="text-center">
          <svg class="mx-auto mb-3 text-ink-faint opacity-50" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 3h18v18H3zM3 9h18M9 21V9"/>
          </svg>
          <p class="text-sm text-ink-faint">Run a query to see results</p>
        </div>
      </div>

      <div v-else-if="columns.length === 0" class="flex items-center justify-center h-full p-8">
        <p class="text-sm text-ink-faint">No data returned</p>
      </div>

      <table v-else class="w-full text-xs">
        <thead class="sticky top-0 bg-panel-2 border-b border-stroke z-10">
          <tr>
            <th class="px-2 py-2 text-left font-medium text-ink-faint w-24 border-r border-stroke">Row</th>
            <th
              v-for="col in columns"
              :key="col"
              class="px-3 py-2 text-left font-medium text-ink-dim whitespace-nowrap"
            >{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, i) in respState.rows" :key="i">
            <!-- Data row -->
            <tr
              :class="[
                'border-b border-stroke/50 transition-colors',
                expandedRow === i ? 'bg-accent-soft/30' : 'hover:bg-hover/50'
              ]"
            >
              <!-- Row number + expand button -->
              <td class="px-2 py-1.5 border-r border-stroke/50">
                <div class="flex items-center gap-1.5">
                  <span class="text-ink-faint font-mono text-[10px]">{{ (queryState.currentPage - 1) * queryState.pageSize + i + 1 }}</span>
                  <button
                    v-if="hasExpandable(row)"
                    @click="toggleRow(i)"
                    :class="[
                      'text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors',
                      expandedRow === i
                        ? 'text-accent-2 bg-accent/20'
                        : 'text-accent hover:bg-accent/10'
                    ]"
                  >{{ expandedRow === i ? 'Collapse' : 'Expand' }}</button>
                </div>
              </td>
              <!-- Data cells -->
              <td
                v-for="col in columns"
                :key="col"
                class="px-3 py-1.5 max-w-[220px]"
              >
                <span
                  v-if="isObject(row[col])"
                  class="text-violet font-mono text-[10px] bg-violet/10 px-1.5 py-0.5 rounded inline-block max-w-[200px] truncate"
                  :title="formatCell(row[col])"
                >{{ objectPreview(row[col]) }}</span>
                <span
                  v-else
                  class="text-ink-dim font-mono truncate inline-block max-w-[200px]"
                  :title="formatCell(row[col])"
                >{{ formatCell(row[col]) }}</span>
              </td>
            </tr>

            <!-- Expanded row: nested data as tables -->
            <tr v-if="expandedRow === i && expandedData">
              <td :colspan="columns.length + 1" class="p-0">
                <div class="bg-base border-b border-stroke p-4 space-y-4">

                  <!-- Object properties (e.g. City) as key-value table -->
                  <div
                    v-for="obj in expandedData.objects"
                    :key="obj.key"
                    class="border border-stroke rounded-lg overflow-hidden"
                  >
                    <div class="flex items-center gap-2 px-3 py-1.5 bg-elevated border-b border-stroke">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-violet"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                      <span class="text-violet text-[11px] font-mono font-medium">{{ obj.key }}</span>
                      <span class="text-[9px] text-ink-faint uppercase tracking-wider">object</span>
                    </div>
                    <table class="w-full text-[11px]">
                      <tbody>
                        <tr
                          v-for="(val, key) in obj.value"
                          :key="key"
                          class="border-b border-stroke/30 last:border-0"
                        >
                          <td class="px-3 py-1 text-ink-faint font-mono w-1/3 align-top">{{ key }}</td>
                          <td class="px-3 py-1 font-mono">
                            <span v-if="val !== null && typeof val === 'object'" class="text-violet">{{ objectPreview(val) }}</span>
                            <span v-else-if="val === null" class="text-ink-faint italic">null</span>
                            <span v-else class="text-ink-dim">{{ val }}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Array properties (e.g. VendorContacts) as data table -->
                  <div
                    v-for="arr in expandedData.arrays"
                    :key="arr.key"
                    class="border border-stroke rounded-lg overflow-hidden"
                  >
                    <div class="flex items-center gap-2 px-3 py-1.5 bg-elevated border-b border-stroke">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-info"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                      <span class="text-info text-[11px] font-mono font-medium">{{ arr.key }}</span>
                      <span class="text-[9px] text-ink-faint uppercase tracking-wider">{{ arr.items.length }} items</span>
                    </div>
                    <div class="overflow-auto max-h-[240px]">
                      <table v-if="arr.columns.length" class="w-full text-[11px]">
                        <thead class="sticky top-0 bg-panel-2">
                          <tr>
                            <th class="px-2 py-1.5 text-left font-medium text-ink-faint w-6 border-r border-stroke/50">#</th>
                            <th
                              v-for="col in arr.columns"
                              :key="col"
                              class="px-3 py-1.5 text-left font-medium text-ink-dim whitespace-nowrap"
                            >{{ col }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(item, idx) in arr.items"
                            :key="idx"
                            class="border-b border-stroke/30 hover:bg-hover/30 last:border-0"
                          >
                            <td class="px-2 py-1 text-ink-faint font-mono text-[10px] border-r border-stroke/50">{{ idx + 1 }}</td>
                            <td
                              v-for="col in arr.columns"
                              :key="col"
                              class="px-3 py-1 max-w-[200px]"
                            >
                              <span
                                v-if="item[col] !== null && typeof item[col] === 'object'"
                                class="text-violet font-mono text-[10px] bg-violet/10 px-1 py-0.5 rounded"
                              >{{ objectPreview(item[col]) }}</span>
                              <span
                                v-else-if="item[col] === null"
                                class="text-ink-faint italic"
                              >null</span>
                              <span
                                v-else
                                class="text-ink-dim font-mono truncate inline-block max-w-[180px]"
                              >{{ item[col] }}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div v-else class="px-3 py-2 text-[11px] text-ink-faint italic">Empty array or primitive items</div>
                    </div>
                  </div>

                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination footer -->
    <div v-if="respState.hasRun && !respState.error" class="flex items-center gap-3 px-3 py-2 border-t border-stroke bg-panel shrink-0 text-xs">
      <span class="text-ink-faint">
        {{ formatNumber(respState.rows.length) }} rows
        <span v-if="respState.totalCount != null" class="text-ink-faint">of {{ formatNumber(respState.totalCount) }}</span>
      </span>

      <div class="flex items-center gap-1 ml-auto">
        <button
          @click="prev"
          :disabled="queryState.currentPage <= 1"
          class="p-1 text-ink-faint hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <button
          v-for="(p, i) in pageNumbers"
          :key="i"
          @click="typeof p === 'number' && setPage(p)"
          :disabled="p === '…'"
          :class="[
            'min-w-[24px] h-6 px-1.5 rounded text-[11px] font-mono transition-colors',
            p === queryState.currentPage
              ? 'bg-accent text-base font-semibold'
              : p === '…'
                ? 'text-ink-faint cursor-default'
                : 'text-ink-dim hover:bg-hover'
          ]"
        >{{ p }}</button>

        <button
          @click="next"
          :disabled="queryState.currentPage >= totalPages"
          class="p-1 text-ink-faint hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <select
        :value="queryState.pageSize"
        @change="setPageSize(Number($event.target.value))"
        class="bg-elevated border border-stroke rounded px-1.5 py-1 text-[11px] text-ink-dim focus:border-accent focus:outline-none cursor-pointer"
      >
        <option v-for="s in pageSizes" :key="s" :value="s">{{ s }} / page</option>
      </select>
    </div>
  </div>
</template>
