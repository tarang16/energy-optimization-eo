import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider as JotaiProvider, useAtomValue } from 'jotai'
import TreeDiagram from './TreeDiagram'

vi.mock('atoms/AppAtom', () => ({
  AppAtom: 'AppAtom',
}))

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Provider: actual.Provider,
    useAtomValue: vi.fn(),
  }
})

vi.mock('react-router-dom', () => ({
  useOutletContext: vi.fn(),
}))

vi.mock('services/CurrentServices', () => ({
  getTreeDiagramByCaseId: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  groupBy: vi.fn(),
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))
vi.mock('./TreeDiagramCard', () => ({
  default: (props) => (
    <div data-testid={`card-${props.data.caseID}`}>
      Card {props.data.caseID}
    </div>
  ),
}))
vi.mock('./TreeDiagramGapCard', () => ({
  default: (props) => (
    <div data-testid={`gapcard-${props.data.caseID}`}>
      GapCard {props.data.caseID}
    </div>
  ),
}))

vi.mock('moment', () => ({
  default: (input) => 'formattedTime',
}))

import { useOutletContext } from 'react-router-dom'
import { getTreeDiagramByCaseId } from 'services/CurrentServices'
import { groupBy } from 'utills/utilities'
import { beforeEach, describe, expect, test, vi } from 'vitest'

describe('TreeDiagram Component', () => {
  const mockUseAtomValue = useAtomValue
  const mockUseOutletContext = useOutletContext

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAtomValue.mockReturnValue({ actualTime: '2025-06-05T00:00:00Z' })
    mockUseOutletContext.mockReturnValue({ caseId: 'case123' })
  })

  test('shows Loader initially when isLoading is true', () => {
    render(
      <JotaiProvider>
        <TreeDiagram
          category='catA'
          treeDiagramModal={{}}
          setTreeDiagramModal={vi.fn()}
        />
      </JotaiProvider>,
    )
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  test('uses cached data from treeDiagramModal and renders cards', async () => {
    const cachedData = {
      level1: [{ level: 'level1', caseID: 'c1' }],
      level2: [{ level: 'level2', caseID: 'c2' }],
    }
    const setTreeDiagramModal = vi.fn()
    render(
      <JotaiProvider>
        <TreeDiagram
          category='catA'
          treeDiagramModal={{ catA: cachedData }}
          setTreeDiagramModal={setTreeDiagramModal}
        />
      </JotaiProvider>,
    )

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('gapcard-c1')).toBeInTheDocument()
    expect(screen.getByTestId('card-c2')).toBeInTheDocument()
    expect(getTreeDiagramByCaseId).not.toHaveBeenCalled()
    expect(setTreeDiagramModal).not.toHaveBeenCalled()
  })

  test('fetches data when no cache, groups and updates state and renders cards', async () => {
    getTreeDiagramByCaseId.mockResolvedValue({
      data: [
        { level: 'level1', caseID: 'c1' },
        { level: 'level2', caseID: 'c2' },
      ],
    })
    groupBy.mockImplementation((array, fn) => {
      return array.reduce((acc, item) => {
        const key = fn(item)
        if (!acc[key]) acc[key] = []
        acc[key].push(item)
        return acc
      }, {})
    })
    const setTreeDiagramModal = vi.fn()

    render(
      <JotaiProvider>
        <TreeDiagram
          category='catB'
          treeDiagramModal={{}}
          setTreeDiagramModal={setTreeDiagramModal}
        />
      </JotaiProvider>,
    )

    expect(screen.getByTestId('loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(getTreeDiagramByCaseId).toHaveBeenCalledWith(
        'case123',
        'formattedTime',
        'catB',
      )
    })

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('gapcard-c1')).toBeInTheDocument()
    expect(screen.getByTestId('card-c2')).toBeInTheDocument()
    expect(setTreeDiagramModal).toHaveBeenCalledTimes(1)
    const updaterFn = setTreeDiagramModal.mock.calls[0][0]
    expect(typeof updaterFn).toBe('function')
    const newState = updaterFn({})
    expect(newState).toEqual({
      catB: {
        level1: [{ level: 'level1', caseID: 'c1' }],
        level2: [{ level: 'level2', caseID: 'c2' }],
      },
    })
  })

  test('renders fallback message when fetched data is not an array', async () => {
    getTreeDiagramByCaseId.mockResolvedValue({ data: null })
    const setTreeDiagramModal = vi.fn()

    render(
      <JotaiProvider>
        <TreeDiagram
          category='catC'
          treeDiagramModal={{}}
          setTreeDiagramModal={setTreeDiagramModal}
        />
      </JotaiProvider>,
    )
    await waitFor(() => {
      expect(getTreeDiagramByCaseId).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
    expect(
      screen.getByText('Not applicable for this case.'),
    ).toBeInTheDocument()
  })
})
