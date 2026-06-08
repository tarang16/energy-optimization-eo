import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test, vi } from 'vitest'
import { initialAppContextTest } from '../../../index.test'
import DownloadOptions from './DownloadOptions'

describe('DownloadOptions', () => {
  const setShowDownloadUnitModal = vi.fn()
  const setShowDownloadModal = vi.fn()
  const setShowOverlay = vi.fn()

  const contextValue = initialAppContextTest

  test('renders correctly', () => {
    render(
      <MemoryRouter>
        <Provider value={contextValue}>
          <DownloadOptions
            setShowDownloadUnitModal={setShowDownloadUnitModal}
            setShowDownloadModal={setShowDownloadModal}
            setShowOverlay={setShowOverlay}
          />
        </Provider>
      </MemoryRouter>,
    )

    expect(screen.getByText(/case level/i)).toBeInTheDocument()
    expect(screen.getByText(/plant level/i)).toBeInTheDocument()
  })

  test('clicking the Case Level button calls the correct functions', () => {
    render(
      <MemoryRouter>
        <Provider value={contextValue}>
          <DownloadOptions
            setShowDownloadUnitModal={setShowDownloadUnitModal}
            setShowDownloadModal={setShowDownloadModal}
            setShowOverlay={setShowOverlay}
          />
        </Provider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText(/case level/i))
    expect(setShowDownloadUnitModal).toHaveBeenCalledWith(true)
    expect(setShowOverlay).toHaveBeenCalledWith(false)
  })

  test('clicking the Plant Level button calls the correct functions', () => {
    render(
      <MemoryRouter>
        <Provider value={contextValue}>
          <DownloadOptions
            setShowDownloadUnitModal={setShowDownloadUnitModal}
            setShowDownloadModal={setShowDownloadModal}
            setShowOverlay={setShowOverlay}
          />
        </Provider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText(/plant level/i))
    expect(setShowDownloadModal).toHaveBeenCalledWith(true)
    expect(setShowOverlay).toHaveBeenCalledWith(false)
  })
})
