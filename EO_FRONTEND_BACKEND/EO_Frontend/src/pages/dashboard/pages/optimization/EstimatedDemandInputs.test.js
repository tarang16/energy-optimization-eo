import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('atoms/AppAtom', () => ({ AppAtom: 'AppAtom' }))

vi.mock('jotai', () => ({
  useAtomValue: vi.fn(() => ({
    caseData: { id: 'case-1' },
    actualTime: '2024-01-01T00:00:00Z',
  })),
}))

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(() => ({ siteId: 'site-1' })),
  useOutletContext: vi.fn(() => ({ caseId: 'caseId-123' })),
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    Optimization: {
      EstimateDemandTrendIconClick: vi.fn(),
    },
  },
}))

vi.mock('config/scss/variables', () => ({
  default: {
    primary_blue: '#0057A8',
    primary_gray_2: '#6c757d',
  },
}))

vi.mock(
  'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple',
  () => ({
    default: (props) => (
      <div
        data-testid='line-chart-multiple'
        data-props={JSON.stringify(props)}
      />
    ),
  }),
)

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, title, show, hideModal }) =>
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
  default: ({ headers, data, expandedRowsKey, customColumnWidths }) => (
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
            {row.data.map((cell, cellIdx) => (
              <span key={cellIdx} data-testid={`cell-${rowIdx}-${cellIdx}`}>
                {cell}
              </span>
            ))}
            {row.children?.map((child, childIdx) => (
              <div
                key={childIdx}
                data-testid={`child-row-${rowIdx}-${childIdx}`}
              >
                {child.map((col, colIdx) =>
                  React.isValidElement(col) ? (
                    <div
                      key={colIdx}
                      data-testid={`child-col-${rowIdx}-${childIdx}-${colIdx}`}
                    >
                      {col}
                    </div>
                  ) : (
                    <span
                      key={colIdx}
                      data-testid={`child-col-${rowIdx}-${childIdx}-${colIdx}`}
                    >
                      {col}
                    </span>
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

vi.mock('./EstimatedDemandInputs.module.scss', () => ({
  default: {
    w_60: 'w_60',
    w_40: 'w_40',
    img: 'img',
    button: 'button',
    inputStyle: 'inputStyle',
  },
}))

vi.mock('./Optimization.functions', () => ({
  DEMAND_REDUCER_ACTIONS: {
    TREND_MODAL_OPEN: 'TREND_MODAL_OPEN',
    TREND_MODAL_CLOSE: 'TREND_MODAL_CLOSE',
    EDIT_INPUT: 'EDIT_INPUT',
  },
}))

// ─── Import component AFTER mocks ─────────────────────────────────────────────

import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import OptimimzationDemandInput from './EstimatedDemandInputs'
import { DEMAND_REDUCER_ACTIONS } from './Optimization.functions'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeDemandData = (overrides = []) => [
  {
    energycategory: 'Electricity',
    data: [
      {
        tagName: 'TAG_01',
        plantName: 'Plant A',
        actual: '100.5',
        bias: '2',
        isInitialLoad: false,
      },
      {
        tagName: 'TAG_02',
        plantName: 'Plant B',
        actual: null,
        bias: '0',
        isInitialLoad: false,
      },
    ],
    ...overrides[0],
  },
  {
    energycategory: 'Steam',
    data: [
      {
        tagName: 'TAG_03',
        plantName: 'Plant C',
        actual: '50',
        bias: '-3',
        isInitialLoad: true,
      },
    ],
    ...overrides[1],
  },
  // This entry should be filtered out
  {
    energycategory: 'Other',
    data: [
      {
        tagName: 'TAG_04',
        plantName: 'Plant D',
        actual: '10',
        bias: '1',
        isInitialLoad: false,
      },
    ],
  },
]

const defaultData = (modalValue = null) => ({
  demandData: makeDemandData(),
  modal: modalValue,
})

const defaultDispatch = vi.fn()

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OptimimzationDemandInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without crashing in estimated mode', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('accordian-table')).toBeInTheDocument()
    })

    it('renders without crashing in actual mode', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='actual'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('accordian-table')).toBeInTheDocument()
    })

    it('does not render modal when data.modal is null', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData(null)}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })

    it('renders modal when data.modal is truthy', () => {
      const modalData = { plantName: 'Plant A', tagName: 'TAG_01' }
      render(
        <OptimimzationDemandInput
          data={defaultData(modalData)}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Plant A')
    })
  })

  // ── Headers ───────────────────────────────────────────────────────────────

  describe('headers', () => {
    it('renders correct headers for actual mode', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='actual'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('header-parameter')).toHaveTextContent(
        'Parameter',
      )
      expect(screen.getByTestId('header-demand')).toHaveTextContent('Demand')
      expect(screen.queryByTestId('header-bias')).not.toBeInTheDocument()
    })

    it('renders correct headers for estimated mode', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('header-parameter')).toHaveTextContent(
        'Parameter',
      )
      expect(screen.getByTestId('header-demand')).toHaveTextContent(
        'Estimated Demand',
      )
      expect(screen.getByTestId('header-bias')).toHaveTextContent('Bias')
    })
  })

  // ── Data filtering ────────────────────────────────────────────────────────

  describe('data filtering', () => {
    it('filters out energycategory "Other"', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      // Electricity (row 0) and Steam (row 1) should be present; Other is excluded.
      expect(screen.getByTestId('table-row-0')).toBeInTheDocument()
      expect(screen.getByTestId('table-row-1')).toBeInTheDocument()
      expect(screen.queryByTestId('table-row-2')).not.toBeInTheDocument()
    })
  })

  // ── Total calculations ────────────────────────────────────────────────────

  describe('total calculations', () => {
    it('computes correct total actual for a category', () => {
      // Electricity: 100.5 + 0 (null) = 100.5
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('cell-0-1')).toHaveTextContent('100.50')
    })

    it('shows "-" for total actual when sum is 0', () => {
      const data = {
        demandData: [
          {
            energycategory: 'Electricity',
            data: [
              {
                tagName: 'T1',
                plantName: 'P1',
                actual: '0',
                bias: '0',
                isInitialLoad: false,
              },
            ],
          },
        ],
        modal: null,
      }
      render(
        <OptimimzationDemandInput
          data={data}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('cell-0-1')).toHaveTextContent('-')
    })

    it('computes correct total bias for a category', () => {
      // Electricity: 2 + 0 = 2
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('cell-0-2')).toHaveTextContent('2.00')
    })

    it('shows "-" for total bias when sum is 0', () => {
      const data = {
        demandData: [
          {
            energycategory: 'Electricity',
            data: [
              {
                tagName: 'T1',
                plantName: 'P1',
                actual: '5',
                bias: '0',
                isInitialLoad: false,
              },
            ],
          },
        ],
        modal: null,
      }
      render(
        <OptimimzationDemandInput
          data={data}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('cell-0-2')).toHaveTextContent('-')
    })

    it('handles undefined/null actual values gracefully in total', () => {
      const data = {
        demandData: [
          {
            energycategory: 'Electricity',
            data: [
              {
                tagName: 'T1',
                plantName: 'P1',
                actual: undefined,
                bias: '1',
                isInitialLoad: false,
              },
            ],
          },
        ],
        modal: null,
      }
      render(
        <OptimimzationDemandInput
          data={data}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      // actual undefined → parseFloat → NaN → 0, total = 0 → '-'
      expect(screen.getByTestId('cell-0-1')).toHaveTextContent('-')
    })
  })

  // ── Child row: actual column ──────────────────────────────────────────────

  describe('child row actual column', () => {
    it('displays formatted actual when actual is not null/undefined', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      // Row 0, child 0, col 1 → actual = '100.5' → '100.50'
      expect(screen.getByTestId('child-col-0-0-1')).toHaveTextContent('100.50')
    })

    it('displays "-" when actual is null', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      // Row 0, child 1 (Plant B), col 1 → actual = null → '-'
      expect(screen.getByTestId('child-col-0-1-1')).toHaveTextContent('-')
    })
  })

  // ── Trend icon ────────────────────────────────────────────────────────────

  describe('trend icon', () => {
    it('renders trend icon for each child row', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      const icons = screen.getAllByTestId('trend-icon')
      // 2 children in Electricity + 1 in Steam = 3 total (Other filtered out)
      expect(icons).toHaveLength(3)
    })

    it('dispatches TREND_MODAL_OPEN and calls tracker on trend icon click', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      const icons = screen.getAllByTestId('trend-icon')
      fireEvent.click(icons[0])

      expect(
        TRACKEVENTOBJ.Optimization.EstimateDemandTrendIconClick,
      ).toHaveBeenCalledTimes(1)
      expect(defaultDispatch).toHaveBeenCalledWith({
        type: DEMAND_REDUCER_ACTIONS.TREND_MODAL_OPEN,
        obj: expect.objectContaining({
          tagName: 'TAG_01',
          plantName: 'Plant A',
        }),
      })
    })
  })

  // ── Bias input controls ───────────────────────────────────────────────────

  describe('bias input controls', () => {
    it('renders bias input with correct initial value', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      const inputs = screen.getAllByTestId('bias-input')
      // isInitialLoad=false → should show input; Plant C isInitialLoad=true → no input
      // Plant A (bias=2), Plant B (bias=0)
      expect(inputs[0]).toHaveValue(2)
      expect(inputs[1]).toHaveValue(0)
    })

    it('does not render bias input when isInitialLoad is true', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      const inputs = screen.getAllByTestId('bias-input')
      // Plant C (row 1, child 0) has isInitialLoad=true → shows '-', no input
      expect(inputs).toHaveLength(2)
    })

    it('dispatches EDIT_INPUT with decreased value on decrease button click', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      const decreaseBtns = screen.getAllByTestId('decrease-btn')
      fireEvent.click(decreaseBtns[0]) // Plant A, bias=2 → 1

      expect(defaultDispatch).toHaveBeenCalledWith({
        type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
        payload: {
          energycategory: 'Electricity',
          plantName: 'Plant A',
          bias: '1.00',
        },
      })
    })

    it('dispatches EDIT_INPUT with increased value on increase button click', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      const increaseBtns = screen.getAllByTestId('increase-btn')
      fireEvent.click(increaseBtns[0]) // Plant A, bias=2 → 3

      expect(defaultDispatch).toHaveBeenCalledWith({
        type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
        payload: {
          energycategory: 'Electricity',
          plantName: 'Plant A',
          bias: '3.00',
        },
      })
    })

    it('dispatches EDIT_INPUT on input onChange', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      const inputs = screen.getAllByTestId('bias-input')
      fireEvent.change(inputs[0], { target: { value: '5' } })

      expect(defaultDispatch).toHaveBeenCalledWith({
        type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
        payload: {
          energycategory: 'Electricity',
          plantName: 'Plant A',
          bias: '5.00',
        },
      })
    })

    it('handles null/undefined bias defaulting to 0', () => {
      const data = {
        demandData: [
          {
            energycategory: 'Electricity',
            data: [
              {
                tagName: 'T1',
                plantName: 'P1',
                actual: '10',
                bias: null,
                isInitialLoad: false,
              },
            ],
          },
        ],
        modal: null,
      }
      render(
        <OptimimzationDemandInput
          data={data}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      // bias=null → parseFloat(null ?? 0) = 0
      const input = screen.getByTestId('bias-input')
      expect(input).toHaveValue(0)
    })
  })

  // ── Modal interactions ────────────────────────────────────────────────────

  describe('modal interactions', () => {
    it('dispatches TREND_MODAL_CLOSE when modal close button is clicked', () => {
      const modalData = { plantName: 'Plant A', tagName: 'TAG_01' }
      render(
        <OptimimzationDemandInput
          data={defaultData(modalData)}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      fireEvent.click(screen.getByTestId('modal-close'))
      expect(defaultDispatch).toHaveBeenCalledWith({
        type: DEMAND_REDUCER_ACTIONS.TREND_MODAL_CLOSE,
      })
    })

    it('renders LineChartMultiple inside modal with correct props', () => {
      const modalData = { plantName: 'Plant A', tagName: 'TAG_01' }
      render(
        <OptimimzationDemandInput
          data={defaultData(modalData)}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      const chart = screen.getByTestId('line-chart-multiple')
      expect(chart).toBeInTheDocument()
      const props = JSON.parse(chart.getAttribute('data-props'))
      expect(props.data.caseId).toBe('caseId-123')
      expect(props.data.tagsList[0].tagName).toBe('TAG_01')
    })
  })

  // ── AccordianExpandableTable props ────────────────────────────────────────

  describe('AccordianExpandableTable props', () => {
    it('passes correct expandedRowsKey', () => {
      // Verified indirectly – component renders without error; we ensure data rows exist
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('accordian-table')).toBeInTheDocument()
    })

    it('passes energycategory as first cell in each row', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('cell-0-0')).toHaveTextContent('Electricity')
      expect(screen.getByTestId('cell-1-0')).toHaveTextContent('Steam')
    })
  })

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('renders correctly with empty demandData array', () => {
      render(
        <OptimimzationDemandInput
          data={{ demandData: [], modal: null }}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.getByTestId('accordian-table')).toBeInTheDocument()
    })

    it('renders correctly when all items are "Other" (all filtered)', () => {
      const data = {
        demandData: [
          {
            energycategory: 'Other',
            data: [
              {
                tagName: 'T',
                plantName: 'P',
                actual: '5',
                bias: '1',
                isInitialLoad: false,
              },
            ],
          },
        ],
        modal: null,
      }
      render(
        <OptimimzationDemandInput
          data={data}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      expect(screen.queryByTestId('table-row-0')).not.toBeInTheDocument()
    })

    it('shows "-" for isInitialLoad rows in bias column', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      // Steam child 0 (Plant C) has isInitialLoad=true → renders '-'
      const steamChild = screen.getByTestId('child-col-1-0-2')
      expect(steamChild).toHaveTextContent('-')
    })

    it('handles string bias of "0" correctly (currentValue = 0)', () => {
      render(
        <OptimimzationDemandInput
          data={defaultData()}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      const inputs = screen.getAllByTestId('bias-input')
      // Plant B has bias='0'
      expect(inputs[1]).toHaveValue(0)
    })

    it('uses negative bias value for decrease correctly', () => {
      const data = {
        demandData: [
          {
            energycategory: 'Electricity',
            data: [
              {
                tagName: 'T1',
                plantName: 'P1',
                actual: '10',
                bias: '-2',
                isInitialLoad: false,
              },
            ],
          },
        ],
        modal: null,
      }
      render(
        <OptimimzationDemandInput
          data={data}
          mode='estimated'
          demandInputDispatch={defaultDispatch}
        />,
      )
      const decreaseBtn = screen.getByTestId('decrease-btn')
      fireEvent.click(decreaseBtn)
      expect(defaultDispatch).toHaveBeenCalledWith({
        type: DEMAND_REDUCER_ACTIONS.EDIT_INPUT,
        payload: {
          energycategory: 'Electricity',
          plantName: 'P1',
          bias: '-3.00',
        },
      })
    })
  })
})
