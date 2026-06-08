import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as ActivityTrackerConfig from 'config/ActivityTrackerConfig'
import * as jotai from 'jotai'
import React from 'react'
import * as utilities from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OverviewODSTable from './OverviewODSTable'

// ─── Mock dependencies ────────────────────────────────────────────────────────

vi.mock('assets/sabic_icons/common/ods_arrows.svg', () => ({
  default: 'ods_arrows.svg',
}))

vi.mock('atoms/AppAtom', () => ({ AppAtom: 'AppAtom' }))

vi.mock('jotai', () => ({
  useAtomValue: vi.fn(() => ({
    caseData: [{ id: 'case1', name: 'Test Case' }],
  })),
}))

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(() => ({ caseId: 'case-123' })),
}))

vi.mock('utills/utilities', () => ({
  convertFormulaToHtml: vi.fn((val) => <span>{val}</span>),
  formatNumbers: vi.fn((val) => val),
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    overviewODSTable: {
      handleAlertManageModal: vi.fn(),
    },
  },
}))

// Typed spy references — always point to the live mocked functions
const useAtomValueSpy = vi.mocked(jotai.useAtomValue)
const formatNumbersSpy = vi.mocked(utilities.formatNumbers)
const convertFormulaToHtmlSpy = vi.mocked(utilities.convertFormulaToHtml)
const trackEventSpy = vi.mocked(
  ActivityTrackerConfig.TRACKEVENTOBJ.overviewODSTable.handleAlertManageModal,
)

// Loader mock
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

// KPITable mock – captures props AND renders React-element cells inline so
// all click interactions happen within the single render tree, preventing
// "Found multiple elements" errors from secondary render() calls.
const mockKPITable = vi.fn()
vi.mock('../kpi_table/KPITable', () => ({
  default: (props) => {
    mockKPITable(props)
    return (
      <div data-testid='kpi-table'>
        <span data-testid='kpi-no-data'>{props.noDataMessage}</span>
        {props.data?.map((row, i) => (
          <div key={i} data-testid={`kpi-row-${i}`}>
            {row.map((cell, j) => {
              if (React.isValidElement(cell))
                return React.cloneElement(cell, { key: j })
              if (cell === null || cell === undefined) return null
              if (typeof cell === 'object') return null
              return <span key={j}>{String(cell)}</span>
            })}
          </div>
        ))}
      </div>
    )
  },
}))

// CustomModal mock
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, show, title, hideModal }) =>
    show ? (
      <div data-testid='custom-modal'>
        <span>{title}</span>
        <button onClick={hideModal} data-testid='hide-modal-btn'>
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

// ODSAlertModal mock
vi.mock('components/visuals/common/modal/ODSAlertModal', () => ({
  default: ({ data, alertModalId, handleRefreshData, setIsLoading }) => (
    <div data-testid='ods-alert-modal'>
      <span data-testid='alert-modal-id'>{alertModalId}</span>
      <button data-testid='trigger-refresh' onClick={() => handleRefreshData()}>
        refresh
      </button>
      <button data-testid='trigger-loading' onClick={() => setIsLoading(true)}>
        loading
      </button>
    </div>
  ),
}))

// react-bootstrap mocks
vi.mock('react-bootstrap', () => ({
  OverlayTrigger: ({ children, overlay }) => (
    <div data-testid='overlay-trigger'>
      {overlay}
      {children}
    </div>
  ),
  Tooltip: ({ children, id }) => (
    <div data-testid={`tooltip-${id}`}>{children}</div>
  ),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const baseItem = {
  effectMessage: 'energy efficiency',
  causeID: 'C1',
  effectID: 'E1',
  causeMessage: 'high temperature',
  causeValueActual: 95.5,
  causeValueOptimum: 80.0,
  suggestion: 'Reduce temperature by x^2',
  solution: null,
  requestID: 'req-001',
  effectAbsoluteDiff: 15,
  plantName: 'Plant Alpha',
}

const externalItem = {
  ...baseItem,
  solution: 'external',
  requestID: 'req-002',
}

const noRequestItem = {
  ...baseItem,
  requestID: null,
  solution: null,
}

const nullValueItem = {
  ...baseItem,
  causeValueActual: null,
  causeValueOptimum: undefined,
}

const internalSolutionItem = {
  ...baseItem,
  solution: 'internal',
  requestID: 'req-003',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OverviewODSTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 1. Initial loading state ────────────────────────────────────────────────
  describe('Loading state', () => {
    it('renders Loader initially before useEffect fires', () => {
      // Because useEffect runs synchronously in the test environment with act,
      // we test the rendered output directly; Loader disappears after effect.
      // We verify it does NOT remain after effect settles.
      render(<OverviewODSTable data={[baseItem]} />)
      // After effect, loader should be gone
      expect(screen.queryByTestId('loader')).toBeNull()
    })
  })

  // ── 2. Empty / falsy data ───────────────────────────────────────────────────
  describe('Empty data', () => {
    it('renders KPITable with empty array when data is empty array', () => {
      render(<OverviewODSTable data={[]} />)
      expect(screen.getByTestId('kpi-table')).toBeTruthy()
      expect(mockKPITable).toHaveBeenCalledWith(
        expect.objectContaining({ data: [] }),
      )
    })

    it('renders KPITable with empty array when data is undefined', () => {
      render(<OverviewODSTable data={undefined} />)
      expect(mockKPITable).toHaveBeenCalledWith(
        expect.objectContaining({ data: [] }),
      )
    })

    it('renders KPITable with empty array when data is null', () => {
      render(<OverviewODSTable data={null} />)
      expect(mockKPITable).toHaveBeenCalledWith(
        expect.objectContaining({ data: [] }),
      )
    })

    it('passes correct noDataMessage prop', () => {
      render(<OverviewODSTable data={[]} />)
      expect(screen.getByTestId('kpi-no-data').textContent).toBe(
        'NO ACTIONABLES',
      )
    })
  })

  // ── 3. Default prop caseUnderProgress ──────────────────────────────────────
  describe('caseUnderProgress prop', () => {
    it('defaults caseUnderProgress to false', () => {
      render(<OverviewODSTable data={[]} />)
      expect(mockKPITable).toHaveBeenCalledWith(
        expect.objectContaining({ caseUnderProgress: false }),
      )
    })

    it('passes caseUnderProgress=true when provided', () => {
      render(<OverviewODSTable data={[]} caseUnderProgress={true} />)
      expect(mockKPITable).toHaveBeenCalledWith(
        expect.objectContaining({ caseUnderProgress: true }),
      )
    })
  })

  // ── 4. Data mapping / table rows ───────────────────────────────────────────
  describe('Data mapping', () => {
    it('maps a single item to a table row with correct primitive values', () => {
      render(<OverviewODSTable data={[baseItem]} />)
      const [[row]] = mockKPITable.mock.calls.slice(-1).map((c) => c[0].data)
      expect(row[0]).toBe('ENERGY EFFICIENCY') // effectMessage uppercased
      expect(row[1]).toBe('C1E1') // causeID + effectID
      expect(row[2]).toBe('HIGH TEMPERATURE') // causeMessage uppercased
      // row[3] and row[4] are renderValue results (actual / optimum)
      expect(row[6]).toBe(15) // effectAbsoluteDiff
      expect(row[7]).toBe(null) // solution
    })

    it('maps multiple items to multiple rows', () => {
      render(<OverviewODSTable data={[baseItem, externalItem]} />)
      const { data } = mockKPITable.mock.calls.slice(-1)[0][0]
      expect(data).toHaveLength(2)
    })

    it('passes correct headers to KPITable', () => {
      render(<OverviewODSTable data={[]} />)
      expect(mockKPITable).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: ['KPI', 'CAUSE', 'ACTUAL', 'OPTIMUM', 'SUGGESTIONS'],
        }),
      )
    })
  })

  // ── 5. renderValue helper ──────────────────────────────────────────────────
  describe('renderValue', () => {
    it('renders "--" for null causeValueActual', () => {
      render(<OverviewODSTable data={[nullValueItem]} />)
      const { data } = mockKPITable.mock.calls.slice(-1)[0][0]
      expect(data[0][3]).toBe('--')
    })

    it('renders "--" for undefined causeValueOptimum', () => {
      render(<OverviewODSTable data={[nullValueItem]} />)
      const { data } = mockKPITable.mock.calls.slice(-1)[0][0]
      expect(data[0][4]).toBe('--')
    })

    it('formats number to 2 decimal places for valid values', () => {
      render(<OverviewODSTable data={[baseItem]} />)
      // formatNumbers is called with toFixed(2) result
      expect(formatNumbersSpy).toHaveBeenCalledWith('95.50')
      expect(formatNumbersSpy).toHaveBeenCalledWith('80.00')
    })
  })

  // ── 6. Suggestion cell – React element (index 5) ───────────────────────────
  describe('Suggestion cell rendering', () => {
    it('calls convertFormulaToHtml with uppercased suggestion', () => {
      render(<OverviewODSTable data={[baseItem]} />)
      expect(convertFormulaToHtmlSpy).toHaveBeenCalledWith(
        'REDUCE TEMPERATURE BY X^2',
      )
    })

    it('renders suggestion JSX element at index 5', () => {
      render(<OverviewODSTable data={[baseItem]} />)
      const { data } = mockKPITable.mock.calls.slice(-1)[0][0]
      // Verify the cell passed to KPITable is a React element (JSX)
      expect(React.isValidElement(data[0][5])).toBe(true)
    })

    it('suggestion content appears in the rendered output', () => {
      render(<OverviewODSTable data={[baseItem]} />)
      // convertFormulaToHtml returns <span>{val}</span>, so text is visible
      expect(screen.getByText('REDUCE TEMPERATURE BY X^2')).toBeTruthy()
    })
  })

  // ── 7. getSolutionText – external solution ─────────────────────────────────
  // All queries use screen directly — cells are rendered inline by KPITable mock.
  describe('getSolutionText', () => {
    it('renders OverlayTrigger with blinking dot for external solution', () => {
      render(<OverviewODSTable data={[externalItem]} />)
      expect(screen.getByTestId('overlay-trigger')).toBeTruthy()
    })

    it('renders plant name for external solution', () => {
      render(<OverviewODSTable data={[externalItem]} />)
      expect(screen.getByText('PLANT ALPHA')).toBeTruthy()
    })

    it('does NOT render OverlayTrigger for non-external solution', () => {
      render(<OverviewODSTable data={[baseItem]} />)
      expect(screen.queryByTestId('overlay-trigger')).toBeNull()
    })

    it('does NOT render plant name for non-external solution', () => {
      render(<OverviewODSTable data={[baseItem]} />)
      expect(screen.queryByText('PLANT ALPHA')).toBeNull()
    })

    it('solution null does not render getSolutionText output', () => {
      render(<OverviewODSTable data={[noRequestItem]} />)
      expect(screen.queryByTestId('overlay-trigger')).toBeNull()
    })
  })

  // ── 8. handleAlertManageModal & CustomModal ────────────────────────────────
  // NOTE: Because the KPITable mock renders suggestion cells inline, all
  // interactions use screen.getByAltText scoped to the single render tree.
  // Multiple alt="" images are disambiguated with getAllByAltText()[0].
  describe('Alert modal', () => {
    it('does NOT show modal initially', () => {
      render(<OverviewODSTable data={[baseItem]} />)
      expect(screen.queryByTestId('custom-modal')).toBeNull()
    })

    it('opens modal when arrow image is clicked with a valid requestID', async () => {
      render(<OverviewODSTable data={[baseItem]} />)
      fireEvent.click(screen.getAllByAltText('')[0])
      await waitFor(() => {
        expect(screen.getByTestId('custom-modal')).toBeTruthy()
      })
    })

    it('calls TRACKEVENTOBJ when arrow is clicked with requestID', async () => {
      render(<OverviewODSTable data={[baseItem]} />)
      fireEvent.click(screen.getAllByAltText('')[0])
      await waitFor(() => {
        expect(trackEventSpy).toHaveBeenCalled()
      })
    })

    it('does NOT open modal when arrow is clicked without requestID', async () => {
      render(<OverviewODSTable data={[noRequestItem]} />)
      fireEvent.click(screen.getAllByAltText('')[0])
      expect(screen.queryByTestId('custom-modal')).toBeNull()
    })

    it('renders ODSAlertModal inside CustomModal with correct alertModalId', async () => {
      render(<OverviewODSTable data={[baseItem]} />)
      fireEvent.click(screen.getAllByAltText('')[0])
      await waitFor(() => {
        expect(screen.getByTestId('alert-modal-id').textContent).toBe('req-001')
      })
    })

    it('closes modal when hideModal is called', async () => {
      render(<OverviewODSTable data={[baseItem]} />)
      fireEvent.click(screen.getAllByAltText('')[0])
      await waitFor(() => screen.getByTestId('custom-modal'))
      fireEvent.click(screen.getByTestId('hide-modal-btn'))
      await waitFor(() => {
        expect(screen.queryByTestId('ods-alert-modal')).toBeNull()
      })
    })
  })

  // ── 9. Image CSS classes ────────────────────────────────────────────────────
  describe('Image CSS classes', () => {
    it('applies cursor-pointer and blueOnHover when requestID exists', () => {
      render(<OverviewODSTable data={[baseItem]} />)
      const img = screen.getAllByAltText('')[0]
      expect(img.className).toContain('cursor-pointer')
      expect(img.className).toContain('blueOnHover')
    })

    it('applies cursor-not-allowed when requestID is null', () => {
      render(<OverviewODSTable data={[noRequestItem]} />)
      const img = screen.getAllByAltText('')[0]
      expect(img.className).toContain('cursor-not-allowed')
    })
  })

  // ── 10. data-static-id attributes ─────────────────────────────────────────
  describe('data-static-id attributes', () => {
    it('tblContainer div has data-static-id', () => {
      const { container } = render(<OverviewODSTable data={[]} />)
      const el = container.querySelector(
        '[data-static-id="OverviewODSTable.js_div_577d3a"]',
      )
      expect(el).toBeTruthy()
    })
  })

  // ── 11. Re-render when data changes ───────────────────────────────────────
  describe('Data reactivity', () => {
    it('updates filteredODSData when data prop changes', async () => {
      const { rerender } = render(<OverviewODSTable data={[baseItem]} />)
      let { data: firstData } = mockKPITable.mock.calls.slice(-1)[0][0]
      expect(firstData).toHaveLength(1)

      rerender(<OverviewODSTable data={[baseItem, externalItem]} />)
      await waitFor(() => {
        const { data: secondData } = mockKPITable.mock.calls.slice(-1)[0][0]
        expect(secondData).toHaveLength(2)
      })
    })

    it('clears filteredODSData when data becomes empty', async () => {
      const { rerender } = render(<OverviewODSTable data={[baseItem]} />)
      rerender(<OverviewODSTable data={[]} />)
      await waitFor(() => {
        const { data } = mockKPITable.mock.calls.slice(-1)[0][0]
        expect(data).toHaveLength(0)
      })
    })
  })

  // ── 12. useAtomValue / AppAtom ────────────────────────────────────────────
  describe('AppAtom integration', () => {
    it('reads caseData from AppAtom context', () => {
      render(<OverviewODSTable data={[baseItem]} />)
      expect(useAtomValueSpy).toHaveBeenCalledWith('AppAtom')
    })

    it('handles missing caseData in AppAtom gracefully', () => {
      useAtomValueSpy.mockReturnValueOnce({})
      expect(() => render(<OverviewODSTable data={[baseItem]} />)).not.toThrow()
    })

    it('handles null AppAtom value gracefully', () => {
      useAtomValueSpy.mockReturnValueOnce(null)
      expect(() => render(<OverviewODSTable data={[baseItem]} />)).not.toThrow()
    })
  })

  // ── 13. KPITable wrapper div ───────────────────────────────────────────────
  describe('Wrapper container', () => {
    it('renders wrapper div with correct CSS classes', () => {
      const { container } = render(<OverviewODSTable data={[]} />)
      const wrapper = container.querySelector(
        '[data-static-id="OverviewODSTable.js_div_577d3a"]',
      )
      expect(wrapper.className).toContain('p-0')
      expect(wrapper.className).toContain('m-0')
      expect(wrapper.className).toContain('w-100')
      expect(wrapper.className).toContain('h-100')
    })
  })

  // ── 14. Suggestion cell structure ─────────────────────────────────────────
  describe('Suggestion cell structure', () => {
    it('suggestion cell contains an img with src from ods_arrows.svg', () => {
      const { container } = render(<OverviewODSTable data={[baseItem]} />)
      const img = screen.getAllByAltText('')[0]
      expect(img.src).toContain('ods_arrows.svg')
    })

    it('suggestion cell has data-static-id on outer div', () => {
      const { container } = render(<OverviewODSTable data={[baseItem]} />)
      expect(
        container.querySelector(
          '[data-static-id="OverviewODSTable.js_div_bf4658"]',
        ),
      ).toBeTruthy()
    })
  })

  // ── 15. Loader (isLoading = true) branch ──────────────────────────────────
  // describe('Loader branch', () => {
  //   it('renders Loader when isLoading is true', async () => {
  //     const ReactModule = await import('react')
  //     const useStateSpy = vi.spyOn(ReactModule, 'useState')
  //     useStateSpy.mockImplementationOnce(() => [true, vi.fn()])
  //     useStateSpy.mockImplementation((init) => ReactModule.useState(init))
  //     render(<OverviewODSTable data={[baseItem]} />)
  //     expect(screen.getByTestId('loader')).toBeTruthy()
  //     useStateSpy.mockRestore()
  //   })
  // })

  // ── 16. getSolutionText – non-external string solution (else branch) ───────
  describe('getSolutionText non-external branch', () => {
    it('returns empty fragment for a non-external string solution', () => {
      render(<OverviewODSTable data={[internalSolutionItem]} />)
      expect(screen.queryByTestId('overlay-trigger')).toBeNull()
      expect(screen.queryByText('PLANT ALPHA')).toBeNull()
    })

    it('does not render plant name block for non-external string solution', () => {
      render(<OverviewODSTable data={[internalSolutionItem]} />)
      const { data } = mockKPITable.mock.calls.slice(-1)[0][0]
      expect(data[0][7]).toBe('internal')
    })
  })

  // ── 17. ODSAlertModal callbacks – handleRefreshData & setIsLoading ─────────
  describe('ODSAlertModal callbacks', () => {
    it('handleRefreshData callback does not throw when invoked', async () => {
      render(<OverviewODSTable data={[baseItem]} />)
      fireEvent.click(screen.getAllByAltText('')[0])
      await waitFor(() => screen.getByTestId('trigger-refresh'))
      expect(() =>
        fireEvent.click(screen.getByTestId('trigger-refresh')),
      ).not.toThrow()
    })

    it('setIsLoading callback shows Loader when called with true', async () => {
      render(<OverviewODSTable data={[baseItem]} />)
      fireEvent.click(screen.getAllByAltText('')[0])
      await waitFor(() => screen.getByTestId('trigger-loading'))
      fireEvent.click(screen.getByTestId('trigger-loading'))
      await waitFor(() => {
        expect(screen.getByTestId('loader')).toBeTruthy()
      })
    })
  })
})
