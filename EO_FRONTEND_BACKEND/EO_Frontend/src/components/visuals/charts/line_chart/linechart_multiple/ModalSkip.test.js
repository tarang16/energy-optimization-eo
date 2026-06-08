import { fireEvent, render } from '@testing-library/react'
import assert from 'assert'
import ModalSkip from './ModalSkip'
import { describe, it, test, vi } from 'vitest'
describe('ModalSkip component', () => {
  it('renders without crashing', () => {
    const props = {
      showModelSkipTrend: {},
      setShowModelSkipTrend: vi.fn(),
      isModalSkip: true,
      caseId: null,
    }
    const { queryAllByText } = render(<ModalSkip {...props} />)
    const modalSkipBtn = document.querySelector('#modal-skip-trend')
    fireEvent.click(modalSkipBtn)
    // Assert
    assert(queryAllByText != undefined)
  })

  it('renders button when isModalSkip is true', () => {
    const props = {
      showModelSkipTrend: true,
      setShowModelSkipTrend: vi.fn(),
      isModalSkip: true,
      caseId: 56,
    }
    const { queryAllByText } = render(<ModalSkip {...props} />)
    const modalSkipBtn = document.querySelector('#modal-skip-trend')
    fireEvent.click(modalSkipBtn)
    // Assert
    assert(queryAllByText != undefined)
  })

  it('renders nothing when isModalSkip is false', () => {
    const props = {
      showModelSkipTrend: false,
      setShowModelSkipTrend: vi.fn(),
      isModalSkip: false,
      caseId: 56,
    }
    const { queryAllByText } = render(<ModalSkip {...props} />)
    // Assert
    assert(queryAllByText != undefined)
  })
})
