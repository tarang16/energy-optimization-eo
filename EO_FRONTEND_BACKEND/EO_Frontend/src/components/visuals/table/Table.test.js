import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import assert from 'assert'
import { AppAtom } from 'atoms/AppAtom'
import { Provider as JotaiProvider } from 'jotai'
import { describe, expect, it, vi } from 'vitest'
import Table from './Table'

describe('Table component', () => {
  it('renders Table with provided props', () => {
    const props = {
      caseUnderProgress: false,
      data: [
        {
          type: 'div',
          key: '45611',
          ref: null,
          props: {
            children: [
              {
                type: 'span',
                key: null,
                ref: null,
                props: {
                  dangerouslySetInnerHTML: {
                    __html: 'INTER COOLER E11 APPROACH ',
                  },
                  style: {
                    color: 'inherit',
                    lineHeight: 'inherit',
                  },
                },
                _owner: null,
                _store: {},
              },
              {
                type: 'span',
                key: null,
                ref: null,
                props: {
                  dangerouslySetInnerHTML: {
                    __html: ' (°C)',
                  },
                  style: {
                    color: 'inherit',
                    lineHeight: 'inherit',
                  },
                },
                _owner: null,
                _store: {},
              },
            ],
          },
          _owner: null,
          _store: {},
        },
        'N/A',
        '8.08',
        '2.56',
        '14.81',
        1,
        1,
        'Approach_Inter_Cooler_E11',
        {
          type: 'span',
          key: null,
          ref: null,
          props: {
            dangerouslySetInnerHTML: {
              __html:
                'if(([K1C_Comp_Suction_Temp]- [Cooling_Water_Inlet_Temp])<0,1,([K1C_Comp_Suction_Temp]- [Cooling_Water_Inlet_Temp]))',
            },
            style: {
              color: 'inherit',
              lineHeight: 'inherit',
            },
          },
          _owner: null,
          _store: {},
        },
        {
          type: 'span',
          key: null,
          ref: null,
          props: {
            dangerouslySetInnerHTML: {
              __html: '°C',
            },
            style: {
              color: 'inherit',
              lineHeight: 'inherit',
            },
          },
          _owner: null,
          _store: {},
        },
        {
          type: 'span',
          key: null,
          ref: null,
          props: {
            dangerouslySetInnerHTML: {
              __html: 'INTER COOLER E11 APPROACH ',
            },
            style: {
              color: 'inherit',
              lineHeight: 'inherit',
            },
          },
          _owner: null,
          _store: {},
        },
        {
          type: 'span',
          key: null,
          ref: null,
          props: {
            dangerouslySetInnerHTML: {
              __html:
                'INDICATES APPROACH (DIFFERENCE OF E-11 PROCESS OUTLET AND COOLING WATER INLET TEMP) FOR INTERCOOLER E-11',
            },
            style: {
              color: 'inherit',
              lineHeight: 'inherit',
            },
          },
          _owner: null,
          _store: {},
        },
      ],
      headers: [
        'PARAMETER',
        'DESIGN',
        'ACTUAL',
        'OPTIMUM',
        'CONTRIBUTION',
        'STATE',
      ],
      stateColumn: [5, 10, 11],
      displayState: 6,
      leftAlignColumns: [0],
      style: {
        width: '100%',
        height: '100%',
      },
      tooltipColumns: [7, 8, 9],
      paginatorLimit: 3,
      customColumnWidths: [44, 11, 11, 11, 15, 8],
      isAction: true,
      useRearrangedData: true,
      designColumn: [1],
    }

    const { queryAllByText } = render(<Table {...props} />)

    assert(queryAllByText != undefined)
  })
})

// Mock Modal and Tooltip
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div>Loading...</div>,
}))
vi.mock('components/ui/case_under_progress/CaseUnderProgress', () => ({
  default: () => <div>Case Under Progress</div>,
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default:
    () =>
    ({ show, children }) =>
      show ? <div data-testid='custom-modal'>{children}</div> : null,
}))

vi.mock(import('react-tooltip'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Tooltip: (props) => <div data-testid={props.id}>{props.children}</div>,
  }
})

// Sample props
const mockData = [
  ['Category A', 'Online', 'Some UOM', 'Formula1', 'Other Info'],
  ['Category A', 'Offline', 'Some UOM', 'Formula2', 'Other Info'],
]

const headers = ['Category', 'Status', 'UOM', 'Formula', 'Info']

const defaultProps = {
  data: mockData,
  headers,
  tooltipColumns: [2, 3],
  customColumnWidths: [20, 20, 20, 20, 20],
  useRearrangedData: false,
  showLoader: false,
  isModalRender: false,
  category: 'PROCESS',
}

const setup = (props = {}) =>
  render(
    <JotaiProvider initialValues={[[AppAtom, { caseData: [] }]]}>
      <Table {...defaultProps} {...props} />
    </JotaiProvider>,
  )

// Tests
describe('Table Component', () => {
  it('renders headers and rows', () => {
    setup()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('shows loader if showLoader is true', () => {
    setup({ showLoader: true })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows "No Data To Show" if data is empty', () => {
    setup({ data: [] })
    expect(screen.getByText('No Data To Show.')).toBeInTheDocument()
  })

  it('renders tooltips correctly', () => {
    setup()
    expect(screen.getAllByTestId(/tooltip-details-/i).length).toBeGreaterThan(0)
  })

  it('renders category message when caseUnderProgress is true', () => {
    setup({ caseUnderProgress: true, data: [] })
    expect(screen.getByText('Case Under Progress')).toBeInTheDocument()
  })

  it('shows alternate message when isModalRender is true and no data', () => {
    setup({ isModalRender: true, data: [] })
    expect(
      screen.getByText('No Data, Please select different date range.'),
    ).toBeInTheDocument()
  })
})
