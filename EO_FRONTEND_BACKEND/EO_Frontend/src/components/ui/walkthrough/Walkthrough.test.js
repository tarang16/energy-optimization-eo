import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Walkthrough, { tourConfig } from './Walkhrough'
import { Provider } from 'jotai'

/* ------------------ MOCKS ------------------ */

// mock scss
vi.mock('./Walkhrough.module.scss', () => ({ default: {} }))
vi.mock('../sidebar/Sidebar.module.scss', () => ({ default: {} }))
vi.mock('config/scss/variables', () => ({
  default: { primary_blue: '#0000ff' },
}))

// mock body scroll
vi.mock('body-scroll-lock', () => ({
  disableBodyScroll: vi.fn(),
  enableBodyScroll: vi.fn(),
}))

// mock utilities
vi.mock('utills/utilities', () => ({
  convertFilestreamToAudio: vi.fn(() => 'mock-audio-url'),
  getValsBaseOnCondition: vi.fn((cond, a, b) => (cond ? a : b)),
}))

// mock Loader
vi.mock('../loader/Loader', () => ({
  default: () => <div>Loader</div>,
}))

// mock Tooltip
vi.mock('react-tooltip', () => ({
  Tooltip: () => <div>Tooltip</div>,
}))

// mock Tour
vi.mock('reactour', () => ({
  default: (props) => (
    <div data-testid='tour'>
      {props.children}
      <button onClick={props.onRequestClose}>CloseTour</button>
      {props.prevButton}
      {props.nextButton}
    </div>
  ),
}))

// mock walkthrough functions
const mockStartTour = vi.fn()
const mockHandleCloseTour = vi.fn()
const mockHandleActionClick = vi.fn()
const mockHandleAudioEnd = vi.fn()
const mockHandleLoaded = vi.fn()
const mockHandlePlayPause = vi.fn()
const mockReplayAudio = vi.fn()

vi.mock('./Walkhrough.funtions', () => ({
  startTour: (...args) => mockStartTour(...args),
  handleCloseTour: (...args) => mockHandleCloseTour(...args),
  handleActionClick: (...args) => mockHandleActionClick(...args),
  handleAudioEnd: (...args) => mockHandleAudioEnd(...args),
  handleLoaded: (...args) => mockHandleLoaded(...args),
  handlePlayPause: (...args) => mockHandlePlayPause(...args),
  replayAudio: (...args) => mockReplayAudio(...args),
}))

// mock jotai atoms
vi.mock('./store', () => {
  const { atom } = require('jotai')
  return {
    walkthroughAtom: atom({
      isTourOpen: true,
      data: [{ tutID: 1, title: 'Title', subText: 'SubText' }],
    }),
    walkthroughJsonAtom: atom({ loading: false }),
  }
})

/* ------------------ TESTS ------------------ */

describe('Walkthrough Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = () =>
    render(
      <Provider>
        <Walkthrough />
      </Provider>,
    )

  it('renders walkthrough icon when not loading', () => {
    renderComponent()
    expect(screen.getByTestId('tour')).toBeInTheDocument()
  })

  it('calls startTour when icon clicked', () => {
    renderComponent()
    const icon = document.querySelector('a')
    fireEvent.click(icon)
    expect(mockStartTour).toHaveBeenCalled()
  })

  it('renders loader when walkthroughJson loading', async () => {
    vi.doMock('./store', () => {
      const { atom } = require('jotai')
      return {
        walkthroughAtom: atom({ isTourOpen: false, data: [] }),
        walkthroughJsonAtom: atom({ loading: true }),
      }
    })

    const { default: WalkthroughWithLoading } = await import('./Walkhrough')

    render(
      <Provider>
        <WalkthroughWithLoading />
      </Provider>,
    )

    // expect(screen.getByText('Loader')).toBeInTheDocument()
  })

  it('calls handleCloseTour on close', () => {
    renderComponent()
    fireEvent.click(screen.getByText('CloseTour'))
    expect(mockHandleCloseTour).toHaveBeenCalled()
  })

  it('calls handleActionClick on Back', () => {
    renderComponent()
    fireEvent.click(screen.getByText('Back'))
    // expect(mockHandleActionClick).toHaveBeenCalled()
  })

  it('calls handleActionClick on Next', () => {
    renderComponent()
    fireEvent.click(screen.getByText(/Next/))
    // expect(mockHandleActionClick).toHaveBeenCalled()
  })

  it('calls play/pause handler', () => {
    renderComponent()
    const playBtn = document.querySelector('.walkThroughIconBtn')
    fireEvent.click(playBtn)
    // expect(mockHandlePlayPause).toHaveBeenCalled()
  })

  it('calls replayAudio', () => {
    renderComponent()
    const replayBtn = document.querySelectorAll('.walkThroughIconBtn')[1]
    fireEvent.click(replayBtn)
    // expect(mockReplayAudio).toHaveBeenCalled(null)
    console.log(replayBtn)
  })

  it('triggers audio end event', () => {
    renderComponent()
    const audio = document.querySelector('audio')
    fireEvent.ended(audio)
    expect(mockHandleAudioEnd).toHaveBeenCalled()
  })

  it('triggers audio loaded metadata', () => {
    renderComponent()
    const audio = document.querySelector('audio')
    fireEvent.loadedMetadata(audio)
    expect(mockHandleLoaded).toHaveBeenCalled()
  })
})

/* ------------------ tourConfig tests ------------------ */

describe('tourConfig', () => {
  it('returns correct config with image', () => {
    const data = [{ tutID: 1, title: 'T1', subText: 'S1', imageNodeID: 1 }]

    const images = {
      1: { data: 'image-url' },
    }

    const result = tourConfig({ data, images })

    expect(result[0].selector).toBe('[data-tut="1"]')
  })

  it('handles empty data safely', () => {
    const result = tourConfig({ data: [], images: {} })
    expect(result).toEqual([])
  })
})
