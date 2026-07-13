import { reactive, computed } from 'vue'
import { uid } from '@/utils/format.js'

/**
 * Query builder state — the heart of the visual query builder.
 * Every change here flows into the live URL preview.
 */
const state = reactive({
  entitySet: '',
  // $select: array of property names
  select: [],
  // $filter: array of conditions
  filter: [],
  // $orderby: array of { field, dir }
  orderby: [],
  // $expand: array of { path, select, filter, expand }
  expand: [],
  // pagination / options
  top: 20,
  skip: 0,
  count: true,
  search: '',
  apply: '',
  // key access (single entity by key)
  key: '',
  // pagination UI state
  currentPage: 1,
  pageSize: 20,
})

export function useQuery() {
  const hasFilter = computed(() => state.filter.some((f) => f.field && f.operator))
  const hasSelect = computed(() => state.select.length > 0)
  const hasOrderby = computed(() => state.orderby.some((o) => o.field))
  const hasExpand = computed(() => state.expand.some((e) => e.path))
  const hasQuery = computed(() =>
    hasFilter.value || hasSelect.value || hasOrderby.value || hasExpand.value ||
    state.search || state.apply
  )

  function addFilter() {
    state.filter.push({
      id: uid(),
      field: '',
      operator: 'eq',
      value: '',
      type: 'Edm.String',
      conjunction: state.filter.length > 0 ? 'and' : 'and',
    })
  }

  function removeFilter(id) {
    state.filter = state.filter.filter((f) => f.id !== id)
  }

  function addOrderby() {
    state.orderby.push({ id: uid(), field: '', dir: 'asc' })
  }

  function removeOrderby(id) {
    state.orderby = state.orderby.filter((o) => o.id !== id)
  }

  function addExpand() {
    state.expand.push({ id: uid(), path: '', select: [], filter: '', expand: '' })
  }

  function removeExpand(id) {
    state.expand = state.expand.filter((e) => e.id !== id)
  }

  function toggleSelect(prop) {
    const idx = state.select.indexOf(prop)
    if (idx >= 0) {
      state.select.splice(idx, 1)
    } else {
      state.select.push(prop)
    }
  }

  function setEntitySet(name) {
    state.entitySet = name
    // Reset query when entity changes
    state.select = []
    state.filter = []
    state.orderby = []
    state.expand = []
    state.key = ''
    state.search = ''
    state.apply = ''
    state.skip = 0
    state.currentPage = 1
  }

  function setPage(page) {
    state.currentPage = page
    state.skip = (page - 1) * state.pageSize
    state.top = state.pageSize
  }

  function setPageSize(size) {
    state.pageSize = size
    state.top = size
    state.skip = (state.currentPage - 1) * size
  }

  function next() {
    setPage(state.currentPage + 1)
  }

  function prev() {
    if (state.currentPage > 1) setPage(state.currentPage - 1)
  }

  function reset() {
    state.select = []
    state.filter = []
    state.orderby = []
    state.expand = []
    state.top = state.pageSize
    state.skip = 0
    state.count = true
    state.search = ''
    state.apply = ''
    state.key = ''
    state.currentPage = 1
  }

  function loadFromSnapshot(snap) {
    state.entitySet = snap.entitySet || ''
    state.select = snap.select || []
    state.filter = snap.filter || []
    state.orderby = snap.orderby || []
    state.expand = snap.expand || []
    state.top = snap.top ?? state.pageSize
    state.skip = snap.skip ?? 0
    state.count = snap.count ?? true
    state.search = snap.search || ''
    state.apply = snap.apply || ''
    state.key = snap.key || ''
    state.currentPage = snap.currentPage ?? Math.floor((snap.skip ?? 0) / (snap.pageSize ?? 20)) + 1
    state.pageSize = snap.pageSize ?? state.pageSize
  }

  function snapshot() {
    return JSON.parse(JSON.stringify({
      entitySet: state.entitySet,
      select: state.select,
      filter: state.filter,
      orderby: state.orderby,
      expand: state.expand,
      top: state.top,
      skip: state.skip,
      count: state.count,
      search: state.search,
      apply: state.apply,
      key: state.key,
      currentPage: state.currentPage,
      pageSize: state.pageSize,
    }))
  }

  return {
    state,
    hasFilter,
    hasSelect,
    hasOrderby,
    hasExpand,
    hasQuery,
    addFilter,
    removeFilter,
    addOrderby,
    removeOrderby,
    addExpand,
    removeExpand,
    toggleSelect,
    setEntitySet,
    setPage,
    setPageSize,
    next,
    prev,
    reset,
    loadFromSnapshot,
    snapshot,
  }
}
