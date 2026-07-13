/**
 * Formatting utilities for display.
 */

/**
 * Format bytes into human-readable string.
 */
export function formatBytes(bytes) {
  if (bytes === 0 || bytes == null) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Format milliseconds into human-readable string.
 */
export function formatMs(ms) {
  if (ms == null) return '—'
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

/**
 * Format a number with thousands separators.
 */
export function formatNumber(n) {
  if (n == null) return '—'
  return n.toLocaleString()
}

/**
 * Get HTTP status color class.
 */
export function statusColor(status) {
  if (status === 0) return 'text-danger'
  if (status < 300) return 'text-success'
  if (status < 400) return 'text-info'
  if (status < 500) return 'text-amber'
  return 'text-danger'
}

/**
 * Truncate a string.
 */
export function truncate(str, max = 50) {
  if (!str) return ''
  if (str.length <= max) return str
  return str.slice(0, max) + '…'
}

/**
 * Generate a unique ID.
 */
let idCounter = 0
export function uid() {
  return `${Date.now()}-${++idCounter}`
}
