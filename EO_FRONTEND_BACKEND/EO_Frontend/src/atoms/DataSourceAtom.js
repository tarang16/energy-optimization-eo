import { atomWithStorage } from 'jotai/utils'

// Persisted toggle controlling which source the EO API calls request:
//   'db'     — production EO pipeline rows (default; existing behavior)
//   'python' — rows written by the local Python pipeline tagged source='python'
//
// Stored in localStorage under 'eo_data_source' so:
//   1. The choice survives page reloads.
//   2. The non-React `_post` axios wrapper can read it synchronously and append
//      ?source=<value> to every backend call without needing React context.
export const DATA_SOURCE_STORAGE_KEY = 'eo_data_source'

export const DATA_SOURCE = Object.freeze({
  DB: 'db',
  PYTHON: 'python',
})

export const DataSourceAtom = atomWithStorage(
  DATA_SOURCE_STORAGE_KEY,
  DATA_SOURCE.DB,
)

export function getDataSourceFromStorage() {
  try {
    const raw = window.localStorage.getItem(DATA_SOURCE_STORAGE_KEY)
    if (!raw) return DATA_SOURCE.DB
    // atomWithStorage serializes via JSON, but a plain-string fallback keeps this
    // resilient if the value was set by code that wrote a raw string.
    const parsed = raw.startsWith('"') ? JSON.parse(raw) : raw
    return parsed === DATA_SOURCE.PYTHON ? DATA_SOURCE.PYTHON : DATA_SOURCE.DB
  } catch {
    return DATA_SOURCE.DB
  }
}
