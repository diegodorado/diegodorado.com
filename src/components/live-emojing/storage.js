// Inline replacement for reactjs-localstorage.
// Strings are stored and returned as-is (raw), so string comparisons like
// get('showInstructions', 'true') === 'true' keep working. Non-string values
// (numbers, booleans, objects) are JSON round-tripped; reads with a non-string
// default parse the stored value, falling back to the raw value on parse error.

export const set = (key, value) => {
  const stored = typeof value === 'string' ? value : JSON.stringify(value)
  localStorage.setItem(key, stored)
}

export const get = (key, defaultVal) => {
  const stored = localStorage.getItem(key)
  if (stored === null || stored === '') return defaultVal
  if (typeof defaultVal === 'string') return stored
  try {
    return JSON.parse(stored)
  } catch (e) {
    return stored
  }
}