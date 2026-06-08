import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppAtom } from 'atoms/AppAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { Provider as JotaiProvider, createStore } from 'jotai'
import { useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ToggleButton from './ToggleButton'

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: vi.fn(),
  }
})

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    Optimization: {
      ActualModeClick: vi.fn(),
      WhatIfModeClick: vi.fn(),
    },
  },
}))

describe('ToggleButton', () => {
  const mockHandleSelectedMode = vi.fn()
  const mockParams = { caseId: '123' }
  const mockAppContext = {
    caseData: { id: 'case123', name: 'Test Case' },
  }

  const renderWithJotai = (defaultSelected = 'actual') => {
    const store = createStore()
    store.set(AppAtom, mockAppContext)
    useParams.mockReturnValue(mockParams)

    return render(
      <JotaiProvider store={store}>
        <ToggleButton
          handleSelectedMode={mockHandleSelectedMode}
          defaultSelected={defaultSelected}
        />
      </JotaiProvider>,
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Actual and What If mode buttons', () => {
    renderWithJotai()
    expect(screen.getByTestId('actual-mode-button')).toBeInTheDocument()
    expect(screen.getByTestId('whatif-mode-button')).toBeInTheDocument()
  })

  it('sets default selected mode based on props', () => {
    renderWithJotai('whatIf')
    const whatIfButton = screen.getByTestId('whatif-mode-button')
    expect(whatIfButton.className).toContain('active')
  })

  it('calls handleSelectedMode and ActualModeClick on Actual mode click', () => {
    renderWithJotai('whatIf')

    const actualButton = screen.getByTestId('actual-mode-button')
    fireEvent.click(actualButton)

    expect(mockHandleSelectedMode).toHaveBeenCalledWith('actual')
    expect(TRACKEVENTOBJ.Optimization.ActualModeClick).toHaveBeenCalledWith({
      params: mockParams,
      caseData: mockAppContext.caseData,
    })
  })

  it('calls handleSelectedMode and WhatIfModeClick on What If mode click', () => {
    renderWithJotai()

    const whatIfButton = screen.getByTestId('whatif-mode-button')
    fireEvent.click(whatIfButton)

    expect(mockHandleSelectedMode).toHaveBeenCalledWith('whatIf')
    expect(TRACKEVENTOBJ.Optimization.WhatIfModeClick).toHaveBeenCalledWith({
      params: mockParams,
      caseData: mockAppContext.caseData,
    })
  })
})
