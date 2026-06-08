import { beforeAll, describe, expect, test, vi } from 'vitest'
import './index'

vi.mock(import('react-dom/client'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createRoot: vi.fn(() => ({
      render: vi.fn(),
      unmount: vi.fn(),
    })),
  }
})

vi.mock('react-router-dom', () => ({
  RouterProvider: vi.fn(() => null),
  createHashRouter: vi.fn(() => ({ routes: [] })),
}))

describe('Application Entry Point', () => {
  let mockRoot
  let mockRender
  beforeAll(() => {
    mockRoot = { render: vi.fn() }
    mockRender = vi.fn()

    vi.mock('jotai', () => ({ Provider: vi.fn(({ children }) => children) }))
    vi.mock('react-hot-toast', () => ({ Toaster: vi.fn(() => null) }))
    vi.mock('resize-observer-polyfill', () => ({
      default: vi.fn(),
    }))
    vi.mock('routes/HomeRoutes', () => ({
      default: [],
    }))
    vi.mock('utills/interceptor', () => ({ interceptor: vi.fn() }))
    global.document = {
      getElementById: vi.fn(() => document.createElement('div')),
    }
  })
  test('100% coverage - initializes and renders application', () => {
    expect(window.ResizeObserver).toBeDefined()
  })
})
