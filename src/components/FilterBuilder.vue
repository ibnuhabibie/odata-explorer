<script setup>
import { computed } from 'vue'
import { useQuery } from '@/stores/query.js'
import { useMetadata } from '@/stores/metadata.js'
import { FILTER_OPERATORS, isNumericType, isStringType, isDateType, isBooleanType } from '@/utils/odata.js'

const { state, addFilter, removeFilter } = useQuery()
const { getEntityTypeBySet } = useMetadata()

const entityType = computed(() => getEntityTypeBySet(state.entitySet))
const properties = computed(() => entityType.value?.properties || [])

function operatorsForType(type) {
  if (!type) return FILTER_OPERATORS
  if (isNumericType(type) || isDateType(type)) {
    return FILTER_OPERATORS.filter((o) => o.types.includes('all') || o.types.includes(type.includes('Date') || type.includes('Time') ? 'date' : 'number'))
  }
  return FILTER_OPERATORS
}

function onFieldChange(filter) {
  const prop = properties.value.find((p) => p.name === filter.field)
  if (prop) {
    filter.type = prop.type
    // Reset operator if not valid for type
    const valid = operatorsForType(prop.type)
    if (!valid.find((o) => o.value === filter.operator)) {
      filter.operator = 'eq'
    }
  }
}

function inputTypeFor(filter) {
  if (isBooleanType(filter.type)) return 'select'
  if (isNumericType(filter.type)) return 'number'
  if (isDateType(filter.type)) return filter.type === 'Edm.Date' ? 'date' : 'datetime-local'
  return 'text'
}
</script>

<template>
  <div class="space-y-2">
    <!-- Filter rows -->
    <div v-for="(f, i) in state.filter" :key="f.id" class="flex items-center gap-1.5">
      <!-- Conjunction -->
      <span v-if="i > 0" class="text-[10px] font-mono font-semibold text-amber uppercase w-7 text-center">AND</span>
      <span v-else class="w-7"></span>

      <!-- Field -->
      <select
        v-model="f.field"
        @change="onFieldChange(f)"
        class="bg-base border border-stroke rounded-md px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none min-w-[110px] max-w-[140px]"
      >
        <option value="">Field…</option>
        <option v-for="p in properties" :key="p.name" :value="p.name">{{ p.name }}</option>
      </select>

      <!-- Operator -->
      <select
        v-model="f.operator"
        class="bg-base border border-stroke rounded-md px-2 py-1 text-xs text-ink-dim focus:border-accent focus:outline-none"
      >
        <option v-for="op in operatorsForType(f.type)" :key="op.value" :value="op.value">{{ op.label }}</option>
      </select>

      <!-- Value -->
      <template v-if="inputTypeFor(f) === 'select'">
        <select
          v-model="f.value"
          class="flex-1 bg-base border border-stroke rounded-md px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none"
        >
          <option value="">Select…</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </template>
      <template v-else>
        <input
          v-model="f.value"
          :type="inputTypeFor(f)"
          placeholder="Value"
          class="flex-1 bg-base border border-stroke rounded-md px-2 py-1 text-xs font-mono text-ink-dim focus:border-accent focus:outline-none"
        />
      </template>

      <!-- Remove -->
      <button
        @click="removeFilter(f.id)"
        class="p-1 text-ink-faint hover:text-danger transition-colors shrink-0"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Add button -->
    <button
      @click="addFilter"
      class="text-xs text-accent hover:text-accent-2 flex items-center gap-1 transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
      Add condition
    </button>
  </div>
</template>
