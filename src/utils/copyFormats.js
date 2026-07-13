/**
 * Generate code snippets for copying requests in different formats.
 */

/**
 * @typedef {Object} CopyContext
 * @property {string} url - full request URL
 * @property {string} method - HTTP method
 * @property {Object.<string, string>} headers - request headers
 * @property {{type: string, token: string}|null} auth - auth config
 */

/**
 * Build headers object including auth.
 */
function resolveHeaders({ headers = {}, auth = null }) {
  const result = { ...headers }
  if (auth) {
    if (auth.type === 'bearer' && auth.token) {
      result['Authorization'] = `Bearer ${auth.token}`
    } else if (auth.type === 'basic' && auth.token) {
      result['Authorization'] = `Basic ${auth.token}`
    }
  }
  // Remove empty headers
  for (const key of Object.keys(result)) {
    if (!result[key]) delete result[key]
  }
  return result
}

/**
 * Generate cURL command.
 */
export function toCurl({ url, method = 'GET', headers = {}, auth = null }) {
  const resolved = resolveHeaders({ headers, auth })
  const parts = [`curl -X ${method}`]

  for (const [key, value] of Object.entries(resolved)) {
    parts.push(`  -H '${key}: ${value}'`)
  }

  parts.push(`  '${url}'`)

  return parts.join(' \\\n')
}

/**
 * Generate fetch() code.
 */
export function toFetch({ url, method = 'GET', headers = {}, auth = null }) {
  const resolved = resolveHeaders({ headers, auth })
  const headerEntries = Object.entries(resolved)
    .map(([k, v]) => `    '${k}': '${v}'`)
    .join(',\n')

  if (headerEntries) {
    return `const res = await fetch('${url}', {
  method: '${method}',
  headers: {
${headerEntries}
  }
});

const data = await res.json();`
  }

  return `const res = await fetch('${url}', {
  method: '${method}'
});

const data = await res.json();`
}

/**
 * Generate Axios code.
 */
export function toAxios({ url, method = 'GET', headers = {}, auth = null }) {
  const resolved = resolveHeaders({ headers, auth })
  method = method.toLowerCase()

  const configParts = []
  for (const [key, value] of Object.entries(resolved)) {
    configParts.push(`    headers: { '${key}': '${value}' }`)
    break
  }
  // If multiple headers, format properly
  if (Object.keys(resolved).length > 0) {
    const headerStr = Object.entries(resolved)
      .map(([k, v]) => `      '${k}': '${v}'`)
      .join(',\n')
    configParts.length = 0
    configParts.push(`  headers: {\n${headerStr}\n  }`)
  }

  const config = configParts.length > 0 ? `,\n{\n${configParts.join(',\n')}\n}` : ''

  return `const { data } = await axios.${method}('${url}'${config});`
}

/**
 * Plain URL.
 */
export function toUrl({ url }) {
  return url
}
