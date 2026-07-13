import { buildFilterString } from './odata.js'

/**
 * Build the full OData query URL from base URL, entity set, and query state.
 *
 * @param {object} opts
 * @param {string} opts.baseUrl - service root URL
 * @param {string} opts.entitySet - entity set name
 * @param {object} opts.query - query state: { select, filter, orderby, expand, top, skip, count, search, apply, key }
 * @param {string|null} opts.proxyUrl - optional proxy prefix
 * @returns {string} full URL
 */
export function buildODataUrl({ baseUrl, entitySet, query = {} }) {
  if (!baseUrl) return ''
  if (!entitySet) return joinUrl(baseUrl, '')

  let path
  if (query.key !== undefined && query.key !== null && query.key !== '') {
    path = `${entitySet}(${query.key})`
  } else {
    path = entitySet
  }

  const params = []

  // $select
  if (query.select && query.select.length > 0) {
    params.push(`$select=${query.select.join(',')}`)
  }

  // $filter
  const filterStr = buildFilterString(query.filter)
  if (filterStr) {
    params.push(`$filter=${encodeURIComponent(filterStr)}`)
  }

  // $orderby
  if (query.orderby && query.orderby.length > 0) {
    const orderParts = query.orderby
      .filter((o) => o.field)
      .map((o) => `${o.field} ${o.dir || 'asc'}`)
    if (orderParts.length > 0) {
      params.push(`$orderby=${orderParts.join(',')}`)
    }
  }

  // $expand
  if (query.expand && query.expand.length > 0) {
    const expandParts = query.expand
      .filter((e) => e.path)
      .map((e) => {
        let expr = e.path
        const subParams = []
        if (e.select && e.select.length > 0) {
          subParams.push(`$select=${e.select.join(',')}`)
        }
        if (e.filter) {
          subParams.push(`$filter=${encodeURIComponent(e.filter)}`)
        }
        if (e.expand) {
          subParams.push(`$expand=${encodeURIComponent(e.expand)}`)
        }
        if (subParams.length > 0) {
          expr += `(${subParams.join(';')})`
        }
        return expr
      })
    if (expandParts.length > 0) {
      params.push(`$expand=${expandParts.join(',')}`)
    }
  }

  // $top
  if (query.top !== undefined && query.top !== null && query.top !== '') {
    params.push(`$top=${query.top}`)
  }

  // $skip
  if (query.skip !== undefined && query.skip !== null && query.skip !== '') {
    params.push(`$skip=${query.skip}`)
  }

  // $count
  if (query.count === true) {
    params.push('$count=true')
  }

  // $search
  if (query.search) {
    params.push(`$search=${encodeURIComponent(query.search)}`)
  }

  // $apply
  if (query.apply) {
    params.push(`$apply=${encodeURIComponent(query.apply)}`)
  }

  let url = joinUrl(baseUrl, path)
  if (params.length > 0) {
    url += `?${params.join('&')}`
  }

  return url
}

/**
 * Join a base URL with a path segment.
 */
function joinUrl(base, path) {
  const cleanBase = base.replace(/\/+$/, '')
  const cleanPath = path ? path.replace(/^\/+/, '') : ''
  if (!cleanPath) return cleanBase
  return `${cleanBase}/${cleanPath}`
}

/**
 * Split a URL into base and entity set + query params for display.
 */
export function parseUrlSegments(url) {
  try {
    const u = new URL(url)
    return {
      protocol: u.protocol,
      host: u.host,
      pathname: u.pathname,
      search: u.search,
    }
  } catch {
    return null
  }
}

/**
 * Format URL with HTML spans for syntax highlighting.
 * Returns HTML string with .url-* classes.
 */
export function highlightUrl(url) {
  if (!url) return ''
  try {
    const u = new URL(url)
    const scheme = `<span class="url-scheme">${u.protocol}//</span>`
    const host = `<span class="url-host">${u.host}</span>`
    const path = `<span class="url-path">${u.pathname}</span>`

    let search = ''
    if (u.search) {
      const params = u.search.slice(1).split('&')
      search = params
        .map((p, i) => {
          const [key, ...valParts] = p.split('=')
          const val = valParts.join('=')
          const prefix = i === 0 ? '<span class="url-punct">?</span>' : '<span class="url-punct">&</span>'
          return `${prefix}<span class="url-param-key">${decodeURIComponent(key)}</span><span class="url-punct">=</span><span class="url-param-val">${decodeURIComponent(val)}</span>`
        })
        .join('')
    }

    return `${scheme}${host}${path}${search}`
  } catch {
    return escapeHtml(url)
  }
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
