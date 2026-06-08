import { fireEvent, render, screen } from '@testing-library/react'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useOutletContext, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OptimimzationDemandInput from './OptimimzationDemandInput'
import { DEMAND_REDUCER_ACTIONS } from './Optimization.functions'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// vi.mock('jotai', () => ({ useAtomValue: vi.fn() }))
vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useOutletContext: vi.fn(),
}))
vi.mock('atoms/AppAtom', () => ({ AppAtom: 'AppAtom' }))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    Optimization: {
      PlantDemandTrendIconClick: vi.fn(),
      PlantDemandInputBox: vi.fn(),
    },
  },
}))

vi.mock('config/scss/variables', () => ({
  default: { primary_blue: '#0000ff', primary_gray_2: '#aaaaaa' },
}))

vi.mock(
  'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple',
  () => ({
    default: (props) => <div data-testid='line-chart-multiple' {...props} />,
  }),
)

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, title, hideModal, show }) =>
    show ? (
      <div data-testid='custom-modal'>
        <span data-testid='modal-title'>{title}</span>
        <button data-testid='modal-close' onClick={hideModal}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

vi.mock('components/visuals/table/AccordianExpandableTable', () => ({
  default: ({ headers, data, expandedRowsKey }) => (
    <div data-testid='accordian-table'>
      <div data-testid='table-headers'>
        {headers.map((h) => (
          <span key={h.key} data-testid={`header-${h.key}`}>
            {h.label}
          </span>
        ))}
      </div>
      <div data-testid='table-data'>
        {data.map((row, rowIdx) => (
          <div key={rowIdx} data-testid={`table-row-${rowIdx}`}>
            {row.data.map((cell, cellIdx) =>
              typeof cell === 'string' || typeof cell === 'number' ? (
                <span key={cellIdx} data-testid={`cell-${rowIdx}-${cellIdx}`}>
                  {cell}
                </span>
              ) : (
                <div
                  key={cellIdx}
                  data-testid={`cell-jsx-${rowIdx}-${cellIdx}`}
                >
                  {cell}
                </div>
              ),
            )}
            {row.children?.map((child, childIdx) => (
              <div key={childIdx} data-testid={`child-${rowIdx}-${childIdx}`}>
                {child.map((c, cIdx) =>
                  typeof c === 'string' || typeof c === 'number' ? (
                    <span
                      key={cIdx}
                      data-testid={`child-cell-${rowIdx}-${childIdx}-${cIdx}`}
                    >
                      {c}
                    </span>
                  ) : (
                    <div
                      key={cIdx}
                      data-testid={`child-cell-jsx-${rowIdx}-${childIdx}-${cIdx}`}
                    >
                      {c}
                    </div>
                  ),
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  ),
}))

vi.mock('../../../../assets/sabic_new_icons/predicted_action2.svg', () => ({
  default: 'trend-icon.svg',
}))

vi.mock('./OptimimzationDemandInput.module.scss', () => ({
  default: {
    w_20: 'w_20',
    w_40: 'w_40',
    w_60: 'w_60',
    img: 'img',
    inputStyle: 'inputStyle',
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockParams = { siteId: 'site1' }
const mockAppContext = {
  caseData: { id: 'case1' },
  actualTime: '2024-01-01T00:00:00Z',
}
const mockCaseId = 'caseId123'

const makeDemandData = (overrides = []) => [
  {
    energycategory: 'Electricity',
    parameter: 'param1',
    data: [
      { plantName: 'Plant A', tagName: 'TAG_A', actual: 100, bias: 0 },
      { plantName: 'Plant B', tagName: 'TAG_B', actual: 200, bias: 5 },
    ],
    ...overrides[0],
  },
  {
    energycategory: 'Steam',
    parameter: 'param2',
    data: [{ plantName: 'Plant C', tagName: 'TAG_C', actual: null, bias: 0 }],
    ...overrides[1],
  },
]

const defaultProps = (mode = 'actual', dataOverrides = {}) => ({
  data: {
    demandData: makeDemandData(),
    modal: null,
    ...dataOverrides,
  },
  mode,
  demandInputDispatch: vi.fn(),
})

beforeEach(() => {
  vi.clearAllMocks()
  useParams.mockReturnValue(mockParams)
  useAtomValue.mockReturnValue(mockAppContext)
  useOutletContext.mockReturnValue({ caseId: mockCaseId })
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OptimimzationDemandInput', () => {
  // ── Rendering ────────────────────────────────────────────────────────────

  describe('renders AccordianExpandableTable', () => {
    it('renders the table component', () => {
      render(<OptimimzationDemandInput {...defaultProps()} />)
      expect(screen.getByTestId('accordian-table')).toBeInTheDocument()
    })

    it('does not render modal when data.modal is null', () => {
      render(<OptimimzationDemandInput {...defaultProps()} />)
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })

    it('does not render modal when data.modal is falsy (undefined)', () => {
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual', { modal: undefined })}
        />,
      )
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })
  })

  // ── Headers ──────────────────────────────────────────────────────────────

  describe('headers', () => {
    it('renders "actual" mode headers: Parameter and Actual', () => {
      render(<OptimimzationDemandInput {...defaultProps('actual')} />)
      expect(screen.getByTestId('header-parameter')).toHaveTextContent(
        'Parameter',
      )
      expect(screen.getByTestId('header-actual')).toHaveTextContent('Actual')
      expect(screen.queryByTestId('header-demand')).not.toBeInTheDocument()
      expect(screen.queryByTestId('header-bias')).not.toBeInTheDocument()
    })

    it('renders non-actual mode headers: Parameter, Demand and Bias', () => {
      render(<OptimimzationDemandInput {...defaultProps('forecast')} />)
      expect(screen.getByTestId('header-parameter')).toHaveTextContent(
        'Parameter',
      )
      expect(screen.getByTestId('header-demand')).toHaveTextContent('Demand')
      expect(screen.getByTestId('header-bias')).toHaveTextContent('Bias')
      expect(screen.queryByTestId('header-actual')).not.toBeInTheDocument()
    })
  })

  // ── getSum helper ─────────────────────────────────────────────────────────

  describe('getSum behaviour (reflected in table data cells)', () => {
    it('shows computed sum for actual mode when values exist', () => {
      render(<OptimimzationDemandInput {...defaultProps('actual')} />)
      // Row 0: Plant A (100) + Plant B (200) = 300.00
      expect(screen.getByTestId('cell-0-1')).toHaveTextContent('300.00')
    })

    it('shows "-" when all actual values are null (actual mode)', () => {
      render(<OptimimzationDemandInput {...defaultProps('actual')} />)
      // Row 1: Plant C (null) → all null → "-"
      expect(screen.getByTestId('cell-1-1')).toHaveTextContent('-')
    })

    it('shows computed sum for non-actual mode', () => {
      render(<OptimimzationDemandInput {...defaultProps('forecast')} />)
      // Row 0: 300.00 in demand column
      expect(screen.getByTestId('cell-0-1')).toHaveTextContent('300.00')
    })

    it('handles mixed null/non-null values (null treated as 0)', () => {
      const demandData = [
        {
          energycategory: 'Gas',
          parameter: 'paramX',
          data: [
            { plantName: 'P1', tagName: 'T1', actual: null, bias: 0 },
            { plantName: 'P2', tagName: 'T2', actual: 50, bias: 0 },
          ],
        },
      ]
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual', { demandData })}
        />,
      )
      expect(screen.getByTestId('cell-0-1')).toHaveTextContent('50.00')
    })
  })

  // ── Child rows – actual mode ──────────────────────────────────────────────

  describe('child rows in actual mode', () => {
    it('renders plant name in child row', () => {
      render(<OptimimzationDemandInput {...defaultProps('actual')} />)
      expect(screen.getByText('Plant A')).toBeInTheDocument()
      expect(screen.getByText('Plant B')).toBeInTheDocument()
    })

    it('renders actual value formatted to 2 decimal places', () => {
      render(<OptimimzationDemandInput {...defaultProps('actual')} />)
      expect(screen.getByTestId('child-cell-0-0-1')).toHaveTextContent('100.00')
      expect(screen.getByTestId('child-cell-0-1-1')).toHaveTextContent('200.00')
    })

    it('renders "-" for null actual value in child row', () => {
      render(<OptimimzationDemandInput {...defaultProps('actual')} />)
      // Row 1, child 0 (Plant C, actual null)
      expect(screen.getByTestId('child-cell-1-0-1')).toHaveTextContent('-')
    })

    it('renders trend icon img in actual mode child rows', () => {
      render(<OptimimzationDemandInput {...defaultProps('actual')} />)
      const imgs = screen.getAllByAltText('')
      expect(imgs.length).toBeGreaterThan(0)
    })
  })

  // ── Child rows – non-actual (forecast) mode ───────────────────────────────

  describe('child rows in non-actual mode', () => {
    it('renders plant name in child row', () => {
      render(<OptimimzationDemandInput {...defaultProps('forecast')} />)
      expect(screen.getByText('Plant A')).toBeInTheDocument()
    })

    it('renders demand value formatted to 2 decimal places', () => {
      render(<OptimimzationDemandInput {...defaultProps('forecast')} />)
      expect(screen.getByTestId('child-cell-0-0-1')).toHaveTextContent('100.00')
    })

    it('renders a bias input field per child row', () => {
      render(<OptimimzationDemandInput {...defaultProps('forecast')} />)
      const inputs = screen.getAllByRole('textbox')
      // 2 rows in first category + 1 in second = 3
      expect(inputs).toHaveLength(3)
    })

    it('input has correct initial value from row.bias', () => {
      render(<OptimimzationDemandInput {...defaultProps('forecast')} />)
      const inputs = screen.getAllByRole('textbox')
      expect(inputs[0].value).toBe('0')
      expect(inputs[1].value).toBe('5')
    })
  })

  // ── Trend icon click – actual mode ───────────────────────────────────────

  describe('trend icon click in actual mode', () => {
    it('calls TRACKEVENTOBJ.Optimization.PlantDemandTrendIconClick with correct args', () => {
      const dispatch = vi.fn()
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual')}
          demandInputDispatch={dispatch}
        />,
      )
      const imgs = screen.getAllByAltText('')
      fireEvent.click(imgs[0])
      expect(
        TRACKEVENTOBJ.Optimization.PlantDemandTrendIconClick,
      ).toHaveBeenCalledWith(
        { params: mockParams, caseData: mockAppContext.caseData },
        expect.objectContaining({ energycategory: 'Electricity' }),
        expect.objectContaining({ plantName: 'Plant A' }),
      )
    })

    it('dispatches TREND_MODAL_OPEN with the row object in actual mode', () => {
      const dispatch = vi.fn()
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual')}
          demandInputDispatch={dispatch}
        />,
      )
      const imgs = screen.getAllByAltText('')
      fireEvent.click(imgs[0])
      expect(dispatch).toHaveBeenCalledWith({
        type: DEMAND_REDUCER_ACTIONS.TREND_MODAL_OPEN,
        obj: expect.objectContaining({ plantName: 'Plant A' }),
      })
    })
  })

  // ── Trend icon click – non-actual mode ───────────────────────────────────

  describe('trend icon click in non-actual (forecast) mode', () => {
    it('calls TRACKEVENTOBJ.Optimization.PlantDemandTrendIconClick', () => {
      const dispatch = vi.fn()
      render(
        <OptimimzationDemandInput
          {...defaultProps('forecast')}
          demandInputDispatch={dispatch}
        />,
      )
      const imgs = screen.getAllByAltText('')
      fireEvent.click(imgs[0])
      expect(
        TRACKEVENTOBJ.Optimization.PlantDemandTrendIconClick,
      ).toHaveBeenCalled()
    })

    it('dispatches TREND_MODAL_OPEN with the item (category) object in forecast mode', () => {
      const dispatch = vi.fn()
      render(
        <OptimimzationDemandInput
          {...defaultProps('forecast')}
          demandInputDispatch={dispatch}
        />,
      )
      const imgs = screen.getAllByAltText('')
      fireEvent.click(imgs[0])
      expect(dispatch).toHaveBeenCalledWith({
        type: DEMAND_REDUCER_ACTIONS.TREND_MODAL_OPEN,
        obj: expect.objectContaining({ energycategory: 'Electricity' }),
      })
    })
  })

  // ── Bias input onChange ───────────────────────────────────────────────────

  describe('bias input onChange', () => {
    it('calls TRACKEVENTOBJ.Optimization.PlantDemandInputBox on change', () => {
      const dispatch = vi.fn()
      render(
        <OptimimzationDemandInput
          {...defaultProps('forecast')}
          demandInputDispatch={dispatch}
        />,
      )
      const inputs = screen.getAllByRole('textbox')
      fireEvent.change(inputs[0], { target: { value: '10' } })
      expect(
        TRACKEVENTOBJ.Optimization.PlantDemandInputBox,
      ).toHaveBeenCalledWith(
        { params: mockParams, caseData: mockAppContext.caseData },
        expect.objectContaining({ energycategory: 'Electricity' }),
        expect.objectContaining({ plantName: 'Plant A' }),
      )
    })

    it('dispatches EDIT_INPUT with correct payload on change', () => {
      const dispatch = vi.fn()
      render(
        <OptimimzationDemandInput
          {...defaultProps('forecast')}
          demandInputDispatch={dispatch}
        />,
      )
      const inputs = screen.getAllByRole('textbox')
      fireEvent.change(inputs[0], { target: { value: '42' } })
      expect(dispatch).toHaveBeenCalledWith({
        type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
        bias: '42',
        parameter: 'param1',
        row: expect.objectContaining({ plantName: 'Plant A' }),
      })
    })

    it('dispatches EDIT_INPUT for second input (Plant B) with correct row', () => {
      const dispatch = vi.fn()
      render(
        <OptimimzationDemandInput
          {...defaultProps('forecast')}
          demandInputDispatch={dispatch}
        />,
      )
      const inputs = screen.getAllByRole('textbox')
      fireEvent.change(inputs[1], { target: { value: '7' } })
      expect(dispatch).toHaveBeenCalledWith({
        type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
        bias: '7',
        parameter: 'param1',
        row: expect.objectContaining({ plantName: 'Plant B' }),
      })
    })
  })

  // ── Modal rendering ───────────────────────────────────────────────────────

  describe('modal when data.modal is set', () => {
    const modalData = {
      plantName: 'Plant A',
      tagName: 'TAG_A',
    }

    it('renders CustomModal when data.modal is truthy', () => {
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual', { modal: modalData })}
        />,
      )
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })

    it('displays the plant name as modal title', () => {
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual', { modal: modalData })}
        />,
      )
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Plant A')
    })

    it('renders LineChartMultiple inside modal', () => {
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual', { modal: modalData })}
        />,
      )
      expect(screen.getByTestId('line-chart-multiple')).toBeInTheDocument()
    })

    it('dispatches TREND_MODAL_CLOSE when modal close button is clicked', () => {
      const dispatch = vi.fn()
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual', { modal: modalData })}
          demandInputDispatch={dispatch}
        />,
      )
      fireEvent.click(screen.getByTestId('modal-close'))
      expect(dispatch).toHaveBeenCalledWith({
        type: DEMAND_REDUCER_ACTIONS.TREND_MODAL_CLOSE,
      })
    })
  })

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('renders with empty demandData array without crashing', () => {
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual', { demandData: [] })}
        />,
      )
      expect(screen.getByTestId('accordian-table')).toBeInTheDocument()
    })

    it('renders with a single category with no child rows', () => {
      const demandData = [
        {
          energycategory: 'Gas',
          parameter: 'paramG',
          data: [],
        },
      ]
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual', { demandData })}
        />,
      )
      expect(screen.getByTestId('accordian-table')).toBeInTheDocument()
    })

    it('handles actual value of 0 correctly (not treated as null)', () => {
      const demandData = [
        {
          energycategory: 'Power',
          parameter: 'paramP',
          data: [{ plantName: 'P0', tagName: 'T0', actual: 0, bias: 0 }],
        },
      ]
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual', { demandData })}
        />,
      )
      // actual 0 is not null → displayed as 0.00
      expect(screen.getByTestId('child-cell-0-0-1')).toHaveTextContent('0.00')
    })

    it('shows "-" sum when all actuals are null in actual mode', () => {
      const demandData = [
        {
          energycategory: 'Water',
          parameter: 'paramW',
          data: [
            { plantName: 'P1', tagName: 'T1', actual: null, bias: 0 },
            { plantName: 'P2', tagName: 'T2', actual: null, bias: 0 },
          ],
        },
      ]
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual', { demandData })}
        />,
      )
      expect(screen.getByTestId('cell-0-1')).toHaveTextContent('-')
    })

    it('uses correct params and caseData from context in tracker calls', () => {
      const dispatch = vi.fn()
      useParams.mockReturnValue({ siteId: 'siteXYZ' })
      useAtomValue.mockReturnValue({
        caseData: { id: 'caseABC' },
        actualTime: 'T',
      })
      render(
        <OptimimzationDemandInput
          {...defaultProps('actual')}
          demandInputDispatch={dispatch}
        />,
      )
      const imgs = screen.getAllByAltText('')
      fireEvent.click(imgs[0])
      expect(
        TRACKEVENTOBJ.Optimization.PlantDemandTrendIconClick,
      ).toHaveBeenCalledWith(
        { params: { siteId: 'siteXYZ' }, caseData: { id: 'caseABC' } },
        expect.anything(),
        expect.anything(),
      )
    })
  })
})
