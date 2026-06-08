import '@testing-library/jest-dom'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { getViewportForBounds, useReactFlow } from '@xyflow/react'
import { toPng } from 'html-to-image'
import { useAtom } from 'jotai'
import { useLocation } from 'react-router-dom'
import * as utilities from 'utills/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DownloadButton from './DownloadButton'

// Mock assets and styles
vi.mock('assets/sabic_icons/sidebar/download_icon.svg', () => ({
  default: 'mocked-download-icon',
}))
vi.mock('./Network.module.scss', () => ({
  default: {
    downloadDropdownContainer: 'downloadDropdownContainer',
    showMoreOptionImage: 'showMoreOptionImage',
  },
}))

// Mock React Router location
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(),
}))

// Mock jotai

vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtom: vi.fn(),
  }
})

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  getViewportForBounds: vi.fn(),
  useReactFlow: vi.fn(),
}))

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  getFileNameFromUrl: vi.fn(),
  hideOverlay: vi.fn(),
  showOverlay: vi.fn(),
}))
vi.mock('assets/sabic_icons/sidebar/download_icon.svg', () => ({
  default: 'download-icon.svg',
}))
vi.mock('./Network.module.scss', () => ({
  default: {
    downloadDropdownContainer: 'download-dropdown-container',
    showMoreOptionImage: 'show-more-option-image',
  },
}))

// Mock utilities
vi.mock('utills/utilities', () => ({
  __esModule: true,
  default: {}, // if needed for compatibility
  showOverlay: vi.fn(),
  hideOverlay: vi.fn(),
  getFileNameFromUrl: vi.fn(() => 'download.png'),
}))

describe('DownloadButton', () => {
  const mockSetAtom = vi.fn()
  const mockGetNodes = vi.fn(() => [{ id: '1' }])
  const mockGetNodesBounds = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  }))

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    useAtom.mockReturnValue([
      { type: 'png', isDownloading: false },
      mockSetAtom,
    ])

    useLocation.mockReturnValue({
      pathname: '/mock/path',
    })

    useReactFlow.mockReturnValue({
      getNodes: mockGetNodes,
      getNodesBounds: mockGetNodesBounds,
    })

    // Ensure DOM element exists
    const div = document.createElement('div')
    div.className = 'react-flow__viewport'
    document.body.appendChild(div)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders download button correctly', () => {
    render(<DownloadButton />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
    expect(screen.getByAltText('Network download icon')).toBeInTheDocument()
  })

  it('disables button when downloading', () => {
    useAtom.mockReturnValueOnce([
      { type: 'png', isDownloading: true },
      mockSetAtom,
    ])
    render(<DownloadButton />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('calls toPng and downloads image on click', async () => {
    utilities.showOverlay.mockReturnValue({
      overlay: 'mockOverlay',
      loadingMessage: 'mockMessage',
    })
    useReactFlow().getNodesBounds.mockReturnValue({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })

    getViewportForBounds.mockReturnValue({ x: 10, y: 10, zoom: 1 })

    const mockDataUrl = 'data:image/png;base64,mockImage'
    toPng.mockResolvedValueOnce(mockDataUrl)
    render(<DownloadButton />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      expect(toPng).toHaveBeenCalled()
      expect(utilities.getFileNameFromUrl).toHaveBeenCalledWith(
        '/mock/path',
        'png',
        undefined,
      )
    })
  })

  it('handles error if toPng fails', async () => {
    toPng.mockRejectedValueOnce(new Error('Failed to generate image'))

    utilities.showOverlay.mockReturnValue({
      overlay: 'mockOverlay',
      loadingMessage: 'mockMessage',
    })
    useReactFlow().getNodesBounds.mockReturnValue({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })

    getViewportForBounds.mockReturnValue({ x: 10, y: 10, zoom: 1 })

    render(<DownloadButton />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(toPng).toHaveBeenCalled()
      expect(mockSetAtom).toHaveBeenCalledWith({
        type: 'png',
        isDownloading: false,
      })
      expect(utilities.hideOverlay).toHaveBeenCalled()
    })
  })
})
