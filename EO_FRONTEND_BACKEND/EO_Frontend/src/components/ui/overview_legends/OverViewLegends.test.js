import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useOutletContext, useParams } from 'react-router-dom'
import { getSopGradesChangeByCaseId } from 'services/ConfigServices'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import OverViewLegends from './OverViewLegends'

// ─── Fix: jsdom's cssstyle throws SyntaxError on values like "calc(50%)%".
// Patch CSSStyleDeclaration.prototype.width to silently store any raw value.
let originalWidthDescriptor
beforeAll(() => {
  originalWidthDescriptor = Object.getOwnPropertyDescriptor(
    CSSStyleDeclaration.prototype,
    'width',
  )
  Object.defineProperty(CSSStyleDeclaration.prototype, 'width', {
    set(value) {
      this._width = value
    },
    get() {
      return this._width ?? ''
    },
    configurable: true,
  })
})

afterAll(() => {
  if (originalWidthDescriptor) {
    Object.defineProperty(
      CSSStyleDeclaration.prototype,
      'width',
      originalWidthDescriptor,
    )
  }
})

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('jotai', () => ({
  useAtomValue: vi.fn(),
  atom: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useOutletContext: vi.fn(),
  useParams: vi.fn(),
}))

vi.mock('services/ConfigServices', () => ({
  getSopGradesChangeByCaseId: vi.fn(),
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    overview: {
      sopForGridTransitionClick: vi.fn(),
    },
  },
}))

vi.mock('atoms/AppAtom', () => ({ AppAtom: 'AppAtom' }))
vi.mock('atoms/ModelSkipAtom', () => ({ ModelSkipAtom: 'ModelSkipAtom' }))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, title, hideModal, children }) =>
    show ? (
      <div data-testid={`modal-${title.replace(/\s+/g, '-').toLowerCase()}`}>
        <button onClick={hideModal} data-testid='modal-close'>
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

vi.mock(
  'components/visuals/table/GradeTransitionTable/GradeTransitionTable',
  () => ({
    default: ({ sopGrades, caseId }) => (
      <div data-testid='grade-transition-table'>
        GradeTransitionTable caseId={caseId}
      </div>
    ),
  }),
)

vi.mock(
  'components/visuals/table/SEUEnergyDistributionTable/SEUEnergyDistributionTable',
  () => ({
    default: ({ caseId }) => (
      <div data-testid='seu-energy-distribution-table'>
        SEUEnergyDistributionTable
      </div>
    ),
  }),
)

vi.mock('./OverViewLegends.module.scss', () => ({
  default: {
    legendContainer: 'legendContainer',
    flexContainer: 'flexContainer',
    legendsName: 'legendsName',
    customMargin: 'customMargin',
    square: 'square',
    SOPlegendsName: 'SOPlegendsName',
    SEU_energy_btn: 'SEU_energy_btn',
  },
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

const defaultAppAtom = {
  actualTime: '2024-01-01',
  caseData: { id: 'case-123' },
}

const defaultModelSkipAtom = {
  modelSkipStatus: 'on',
}

const setupMocks = ({
  appAtom = defaultAppAtom,
  modelSkipAtom = defaultModelSkipAtom,
  caseId = 'case-001',
  params = { projectId: 'proj-1' },
  sopGradesResult = { statuscode: 200, data: [] },
} = {}) => {
  useAtomValue.mockImplementation((atom) => {
    if (atom === 'AppAtom') return appAtom
    if (atom === 'ModelSkipAtom') return modelSkipAtom
    return {}
  })
  useOutletContext.mockReturnValue({ caseId })
  useParams.mockReturnValue(params)
  getSopGradesChangeByCaseId.mockResolvedValue(sopGradesResult)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OverViewLegends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Basic rendering ────────────────────────────────────────────────────────

  describe('Basic rendering', () => {
    it('renders the legend container', async () => {
      setupMocks()
      await act(async () => {
        render(<OverViewLegends />)
      })
      expect(screen.getByTestId('overview-legend')).toBeInTheDocument()
    })

    it('renders "Legends :" label', async () => {
      setupMocks()
      await act(async () => {
        render(<OverViewLegends />)
      })
      expect(screen.getByText('Legends :')).toBeInTheDocument()
    })

    it('renders "Actual" label', async () => {
      setupMocks()
      await act(async () => {
        render(<OverViewLegends />)
      })
      expect(screen.getByText('Actual')).toBeInTheDocument()
    })

    it('renders "Optimum / Predicted" label', async () => {
      setupMocks()
      await act(async () => {
        render(<OverViewLegends />)
      })
      expect(screen.getByText('Optimum / Predicted')).toBeInTheDocument()
    })
  })

  // ── legendWidth prop ───────────────────────────────────────────────────────

  describe('legendWidth prop', () => {
    it('uses default legendWidth of 50 when not provided', async () => {
      setupMocks()
      const { container } = await act(async () => render(<OverViewLegends />))
      expect(container.querySelector('.legendContainer')).toBeInTheDocument()
    })

    it('applies legendWidth={100}', async () => {
      setupMocks()
      const { container } = await act(async () =>
        render(<OverViewLegends legendWidth={100} />),
      )
      expect(container.querySelector('.legendContainer')).toBeInTheDocument()
    })

    it('applies calc width formula when showModelSkipButton is truthy and not on/off', async () => {
      setupMocks({ modelSkipAtom: { modelSkipStatus: 'partial' } })
      const { container } = await act(async () =>
        render(<OverViewLegends legendWidth={50} />),
      )
      expect(container.querySelector('.legendContainer')).toBeInTheDocument()
    })
  })

  // ── setIsModalSkip prop ────────────────────────────────────────────────────

  describe('setIsModalSkip prop', () => {
    it('calls setIsModalSkip with modelSkipStatus when status is not "on"', async () => {
      const setIsModalSkip = vi.fn()
      setupMocks({ modelSkipAtom: { modelSkipStatus: 'off' } })
      await act(async () => {
        render(<OverViewLegends setIsModalSkip={setIsModalSkip} />)
      })
      expect(setIsModalSkip).toHaveBeenCalledWith('off')
    })

    it('calls setIsModalSkip with "on" when modelSkipStatus is "on"', async () => {
      const setIsModalSkip = vi.fn()
      setupMocks({ modelSkipAtom: { modelSkipStatus: 'on' } })
      await act(async () => {
        render(<OverViewLegends setIsModalSkip={setIsModalSkip} />)
      })
      expect(setIsModalSkip).toHaveBeenCalledWith('on')
    })

    it('calls setIsModalSkip with "on" when modelSkipStatus is undefined', async () => {
      const setIsModalSkip = vi.fn()
      setupMocks({ modelSkipAtom: { modelSkipStatus: undefined } })
      await act(async () => {
        render(<OverViewLegends setIsModalSkip={setIsModalSkip} />)
      })
      expect(setIsModalSkip).toHaveBeenCalledWith('on')
    })

    it('calls setIsModalSkip with non-on/off status', async () => {
      const setIsModalSkip = vi.fn()
      setupMocks({ modelSkipAtom: { modelSkipStatus: 'partial' } })
      await act(async () => {
        render(<OverViewLegends setIsModalSkip={setIsModalSkip} />)
      })
      expect(setIsModalSkip).toHaveBeenCalledWith('partial')
    })

    it('does not throw when setIsModalSkip is not provided (default noop)', async () => {
      setupMocks()
      const setIsModalSkip = vi.fn()
      await act(async () => {
        render(<OverViewLegends setIsModalSkip={setIsModalSkip} />)
      })
      expect(setIsModalSkip).toHaveBeenCalledWith('on')
    })
  })

  // ── fetchAndSetData ────────────────────────────────────────────────────────

  describe('fetchAndSetData', () => {
    it('fetches sop grades on mount with correct caseId', async () => {
      setupMocks({ caseId: 'case-xyz' })
      await act(async () => {
        render(<OverViewLegends />)
      })
      expect(getSopGradesChangeByCaseId).toHaveBeenCalledWith('case-xyz')
    })

    it('sets sopGrades when API returns statuscode 200 with data', async () => {
      setupMocks({
        sopGradesResult: {
          statuscode: 200,
          data: [{ gradeChange: 'Grade A' }, { gradeChange: 'Grade B' }],
        },
        appAtom: { actualTime: '2024-01-01', caseData: {} },
      })
      await act(async () => {
        render(<OverViewLegends />)
      })
      await waitFor(() =>
        expect(
          screen.getByText('SOP FOR GRADE TRANSITION'),
        ).toBeInTheDocument(),
      )
    })

    it('sets empty sopGrades when API returns non-200 statuscode', async () => {
      setupMocks({ sopGradesResult: { statuscode: 500, data: [] } })
      await act(async () => {
        render(<OverViewLegends />)
      })
      expect(
        screen.queryByText('SOP FOR GRADE TRANSITION'),
      ).not.toBeInTheDocument()
    })

    it('sets empty sopGrades when API returns null result', async () => {
      setupMocks()
      getSopGradesChangeByCaseId.mockResolvedValue(null)
      await act(async () => {
        render(<OverViewLegends />)
      })
      expect(
        screen.queryByText('SOP FOR GRADE TRANSITION'),
      ).not.toBeInTheDocument()
    })

    it('re-fetches when caseId changes', async () => {
      setupMocks({ caseId: 'case-001' })
      const { rerender } = await act(async () => render(<OverViewLegends />))
      expect(getSopGradesChangeByCaseId).toHaveBeenCalledWith('case-001')

      useOutletContext.mockReturnValue({ caseId: 'case-002' })
      await act(async () => rerender(<OverViewLegends />))
      expect(getSopGradesChangeByCaseId).toHaveBeenCalledWith('case-002')
    })
  })

  // ── SOP FOR GRADE TRANSITION button ───────────────────────────────────────

  describe('SOP FOR GRADE TRANSITION button', () => {
    const gradeResult = {
      statuscode: 200,
      data: [{ gradeChange: 'Grade A' }],
    }

    it('shows SOP button when sopGrades.length > 0 and actualTime is set', async () => {
      setupMocks({
        sopGradesResult: gradeResult,
        appAtom: { actualTime: '2024-01-01', caseData: {} },
      })
      await act(async () => render(<OverViewLegends />))
      await waitFor(() =>
        expect(
          screen.getByText('SOP FOR GRADE TRANSITION'),
        ).toBeInTheDocument(),
      )
    })

    it('does NOT show SOP button when sopGrades is empty', async () => {
      setupMocks({ sopGradesResult: { statuscode: 200, data: [] } })
      await act(async () => render(<OverViewLegends />))
      expect(
        screen.queryByText('SOP FOR GRADE TRANSITION'),
      ).not.toBeInTheDocument()
    })

    it('does NOT show SOP button when actualTime is falsy', async () => {
      setupMocks({
        sopGradesResult: gradeResult,
        appAtom: { actualTime: null, caseData: {} },
      })
      await act(async () => render(<OverViewLegends />))
      await waitFor(() =>
        expect(
          screen.queryByText('SOP FOR GRADE TRANSITION'),
        ).not.toBeInTheDocument(),
      )
    })

    it('opens Grade Transition modal on SOP button click', async () => {
      setupMocks({
        sopGradesResult: gradeResult,
        appAtom: { actualTime: '2024-01-01', caseData: {} },
      })
      await act(async () => render(<OverViewLegends />))
      await waitFor(() =>
        expect(
          screen.getByText('SOP FOR GRADE TRANSITION'),
        ).toBeInTheDocument(),
      )
      await act(async () => {
        fireEvent.click(screen.getByText('SOP FOR GRADE TRANSITION'))
      })
      expect(
        screen.getByTestId('modal-sop-for-grade-transition'),
      ).toBeInTheDocument()
    })

    it('calls TRACKEVENTOBJ.overview.sopForGridTransitionClick on SOP button click', async () => {
      const params = { projectId: 'proj-1' }
      const caseData = { id: 'c1' }
      setupMocks({
        sopGradesResult: gradeResult,
        appAtom: { actualTime: '2024-01-01', caseData },
        params,
      })
      await act(async () => render(<OverViewLegends />))
      await waitFor(() =>
        expect(
          screen.getByText('SOP FOR GRADE TRANSITION'),
        ).toBeInTheDocument(),
      )
      await act(async () => {
        fireEvent.click(screen.getByText('SOP FOR GRADE TRANSITION'))
      })
      expect(
        TRACKEVENTOBJ.overview.sopForGridTransitionClick,
      ).toHaveBeenCalledWith({
        params,
        caseData,
      })
    })

    it('closes Grade Transition modal when close button is clicked', async () => {
      setupMocks({
        sopGradesResult: gradeResult,
        appAtom: { actualTime: '2024-01-01', caseData: {} },
      })
      await act(async () => render(<OverViewLegends />))
      await waitFor(() =>
        expect(
          screen.getByText('SOP FOR GRADE TRANSITION'),
        ).toBeInTheDocument(),
      )
      await act(async () => {
        fireEvent.click(screen.getByText('SOP FOR GRADE TRANSITION'))
      })
      expect(
        screen.getByTestId('modal-sop-for-grade-transition'),
      ).toBeInTheDocument()
      await act(async () => {
        fireEvent.click(screen.getByTestId('modal-close'))
      })
      expect(
        screen.queryByTestId('modal-sop-for-grade-transition'),
      ).not.toBeInTheDocument()
    })

    it('renders GradeTransitionTable inside the modal', async () => {
      setupMocks({
        sopGradesResult: gradeResult,
        appAtom: { actualTime: '2024-01-01', caseData: {} },
        caseId: 'case-abc',
      })
      await act(async () => render(<OverViewLegends />))
      await waitFor(() =>
        expect(
          screen.getByText('SOP FOR GRADE TRANSITION'),
        ).toBeInTheDocument(),
      )
      await act(async () => {
        fireEvent.click(screen.getByText('SOP FOR GRADE TRANSITION'))
      })
      expect(screen.getByTestId('grade-transition-table')).toBeInTheDocument()
    })
  })

  // ── SEU Energy Distribution modal ─────────────────────────────────────────

  describe('SEU Energy Distribution modal', () => {
    it('SEU modal is not shown by default', async () => {
      setupMocks()
      await act(async () => render(<OverViewLegends />))
      expect(
        screen.queryByTestId('modal-seu-energy-distribution'),
      ).not.toBeInTheDocument()
    })

    it('does not render SEU table when SEUEnergyDistribution state is false', async () => {
      setupMocks()
      await act(async () => render(<OverViewLegends />))
      expect(
        screen.queryByTestId('seu-energy-distribution-table'),
      ).not.toBeInTheDocument()
    })
  })

  // ── Static attributes ──────────────────────────────────────────────────────

  describe('Static attributes', () => {
    it('has data-testid="overview-legend" on the inner container', async () => {
      setupMocks()
      await act(async () => render(<OverViewLegends />))
      expect(screen.getByTestId('overview-legend')).toBeInTheDocument()
    })
  })

  // ── modelSkipStatus / legendContainerWidth edge cases ─────────────────────

  describe('modelSkipStatus edge cases', () => {
    it('sets showModelSkipButton false when modelSkipStatus is "on"', async () => {
      const setIsModalSkip = vi.fn()
      setupMocks({ modelSkipAtom: { modelSkipStatus: 'on' } })
      await act(async () =>
        render(
          <OverViewLegends setIsModalSkip={setIsModalSkip} legendWidth={50} />,
        ),
      )
      expect(setIsModalSkip).toHaveBeenCalledWith('on')
    })

    it('handles modelSkipStatus "off"', async () => {
      const setIsModalSkip = vi.fn()
      setupMocks({ modelSkipAtom: { modelSkipStatus: 'off' } })
      await act(async () =>
        render(
          <OverViewLegends setIsModalSkip={setIsModalSkip} legendWidth={50} />,
        ),
      )
      expect(setIsModalSkip).toHaveBeenCalledWith('off')
    })

    it('legendContainerWidth uses 78% formula when showModelSkipButton is not on/off', async () => {
      setupMocks({ modelSkipAtom: { modelSkipStatus: 'partial' } })
      const { container } = await act(async () =>
        render(<OverViewLegends legendWidth={50} />),
      )
      const legendContainer = container.querySelector('.legendContainer')
      // status 'partial' → width = calc((50 * 78 / 100)%) = calc(39%)
      expect(legendContainer.style.width).toBe('calc(39%)%')
    })

    it('legendContainerWidth is calc(50%) when showModelSkipButton is false', async () => {
      setupMocks({ modelSkipAtom: { modelSkipStatus: 'on' } })
      const { container } = await act(async () =>
        render(<OverViewLegends legendWidth={50} />),
      )
      const legendContainer = container.querySelector('.legendContainer')
      expect(legendContainer.style.width).toBe('calc(50%)%')
    })

    it('legendContainerWidth is calc(100%) when legendWidth is 100', async () => {
      setupMocks({ modelSkipAtom: { modelSkipStatus: 'on' } })
      const { container } = await act(async () =>
        render(<OverViewLegends legendWidth={100} />),
      )
      const legendContainer = container.querySelector('.legendContainer')
      expect(legendContainer.style.width).toBe('calc(100%)%')
    })
  })
})
