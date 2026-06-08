import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
globalThis.window = globalThis.window ?? {}
vi.stubGlobal('document', window.document)
window.scrollTo = vi.fn()
if (typeof window === 'undefined' || typeof document === 'undefined') {
  const { JSDOM } = await import('jsdom')
  const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`)
  // @ts-ignore
  global.document = dom.window.document
  global.HTMLElement = dom.window.HTMLElement
}

// @ts-ignore
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
  }
vi.mock('ag-grid-community', async () => {
  const actual = vi.importActual('ag-grid-community')
  return {
    ...actual,
    LocalEventService: {
      dispatchEvent: vi.fn(),
    },
  }
})
const root = document.createElement('div')
root.id = 'root'
document.body.appendChild(root)
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.clearAllTimers()
  window.setTimeout = window.setTimeout
})
vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    // @ts-ignore
    ...actual,
    // mock functions here if needed
  }
})
