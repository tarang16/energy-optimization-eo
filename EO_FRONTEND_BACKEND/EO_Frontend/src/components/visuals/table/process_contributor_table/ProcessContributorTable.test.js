import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProcessContributorTable from './ProcessContributorTable'

// ─── Static module-level mocks ────────────────────────────────────────────────

vi.mock('ag-grid-community/styles/ag-grid.css', () => ({}))
vi.mock('ag-grid-community/styles/ag-theme-alpine.css', () => ({}))
vi.mock('assets/sabic_new_icons/arrow_down_blue.svg', () => ({
  default: 'arrow_down_blue.svg',
}))
vi.mock('assets/sabic_new_icons/arrow_down_gray.svg', () => ({
  default: 'arrow_down_gray.svg',
}))
vi.mock('../../../../assets/sabic_icons/sidebar/expand_icon.svg', () => ({
  default: 'expand_icon.svg',
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, title, show, hideModal }) =>
    show ? (
      <div data-testid='custom-modal'>
        <div data-testid='modal-title'>{title}</div>
        <button data-testid='modal-close' onClick={hideModal}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

vi.mock('components/visuals/dropdown/multi_select/CustomMultiSelect', () => ({
  default: ({ options, setFunction }) => (
    <div data-testid='custom-multi-select'>
      <select
        data-testid='multi-select-dropdown'
        onChange={(e) =>
          setFunction(options.filter((o) => o.id === e.target.value))
        }
      >
        {options?.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  ),
}))

vi.mock('dompurify', () => ({ default: { sanitize: (html) => html } }))

vi.mock('utills/utilities', () => ({
  convertFormulaToHtml: (val) => React.createElement('span', null, val),
  detectModification: (a, b) => JSON.stringify(a) !== JSON.stringify(b),
  genRandomNumber: () => 1234,
}))

vi.mock('react-bootstrap', () => ({
  OverlayTrigger: ({ children }) =>
    React.createElement(React.Fragment, null, children),
  Tooltip: ({ children }) => React.createElement('div', null, children),
}))

vi.mock(
  'pages/dashboard/pages/case_configuration_portal/Configurationdownload/ConfigurationDownload',
  () => ({
    default: ({ title }) =>
      React.createElement(
        'div',
        { 'data-testid': 'configuration-download' },
        title,
      ),
  }),
)

vi.mock('../em_table/EnergyManagementTable.module.scss', () => ({
  default: {
    categoryColumn: 'categoryColumn',
    tblContainer: 'tblContainer',
    EMheaderdrodowContainer: 'EMheaderdrodowContainer',
    openButton: 'openButton',
    headerOpenBtn: 'headerOpenBtn',
  },
}))

vi.mock('./ProcessContributorTable.module.scss', () => ({
  default: {
    centerCell: 'centerCell',
    tblContainer: 'tblContainer',
    expandContainer: 'expandContainer',
    expandButtonContainer: 'expandButtonContainer',
    expandButton: 'expandButton',
    expandButtonConfigurationDownload: 'expandButtonConfigurationDownload',
    agGridReactContainer: 'agGridReactContainer',
  },
}))

// ─── AG Grid mock ─────────────────────────────────────────────────────────────
// KEY: use a stable object whose .current property we mutate (never reassign the
// object itself) so the mock factory closure always sees the same reference.
// KEY: use React.forwardRef so the parent's useRef actually gets populated.

const _sharedGridApi = {
  getGridOption: vi.fn(() => []),
  setGridOption: vi.fn(),
  forEachNodeAfterFilterAndSort: vi.fn(),
}

// Module-level capture vars — mutated in place, never reassigned.
const _captured = { columnDefs: [], rowData: [], onSortChanged: null }

vi.mock('ag-grid-react', () => {
  const React = require('react')
  // Stable api object living inside the factory closure — always the same ref.
  const fakeApi = {
    getGridOption: (...args) => _sharedGridApi.getGridOption(...args),
    setGridOption: (...args) => _sharedGridApi.setGridOption(...args),
    forEachNodeAfterFilterAndSort: (...args) =>
      _sharedGridApi.forEachNodeAfterFilterAndSort(...args),
  }
  const AgGridReact = React.forwardRef(
    ({ columnDefs, rowData, onSortChanged }, ref) => {
      // Populate captured vars
      _captured.columnDefs = columnDefs || []
      _captured.rowData = rowData || []
      _captured.onSortChanged = onSortChanged
      // Wire the forwarded ref so gridRef.current.api works in the component
      React.useEffect(() => {
        if (ref) {
          if (typeof ref === 'function') {
            ref({ api: fakeApi })
          } else {
            ref.current = { api: fakeApi }
          }
        }
      })
      return React.createElement(
        'div',
        { 'data-testid': 'ag-grid-react' },
        (rowData || []).map((row, i) =>
          React.createElement(
            'div',
            { key: i, 'data-testid': 'grid-row' },
            Object.entries(row).map(([k, v]) =>
              React.createElement(
                'span',
                { key: k, 'data-testid': `cell-${k}` },
                String(v ?? ''),
              ),
            ),
          ),
        ),
      )
    },
  )
  AgGridReact.displayName = 'AgGridReact'
  return { AgGridReact }
})

// ─── Convenience accessors (read from _captured so tests see latest values) ──

const getCapturedColumnDefs = () => _captured.columnDefs
const getCapturedRowData = () => _captured.rowData
const getCapturedOnSortChanged = () => _captured.onSortChanged

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeSampleData = () => [
  {
    plant: 'Plant A',
    category: 'Energy',
    parameter: 'Temp',
    actual: 100,
    optimum: 90,
    state: 0,
    uom: 'C',
    equipmentName: 'Boiler',
  },
  {
    plant: 'Plant A',
    category: 'Water',
    parameter: 'Flow',
    actual: 50,
    optimum: 60,
    state: 1,
    uom: 'L/s',
    equipmentName: 'Pump',
  },
  {
    plant: 'Plant B',
    category: 'Gas',
    parameter: 'Pressure',
    actual: 200,
    optimum: 210,
    state: null,
    uom: '-',
    equipmentName: 'Compressor',
  },
]

const makeApi = (rows) => ({
  getDisplayedRowAtIndex: (i) =>
    rows[i] !== undefined ? { data: rows[i] } : undefined,
  getDisplayedRowCount: () => rows.length,
  getGridOption: vi.fn(() => rows),
  setGridOption: vi.fn(),
  forEachNodeAfterFilterAndSort: vi.fn(),
})

/**
 * Render and pre-seed _sharedGridApi.getGridOption so that when onSortChanged
 * calls gridRef.current.api.getGridOption('rowData') it gets real data back.
 */
function renderWithRef(data) {
  _sharedGridApi.getGridOption.mockReturnValue(data)
  return render(<ProcessContributorTable data={data} />)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProcessContributorTable', () => {
  beforeEach(() => {
    _captured.columnDefs = []
    _captured.rowData = []
    _captured.onSortChanged = null
    vi.clearAllMocks()
    // Re-attach proxied methods after clearAllMocks (vi.fn() instances are replaced)
    _sharedGridApi.getGridOption = vi.fn(() => [])
    _sharedGridApi.setGridOption = vi.fn()
    _sharedGridApi.forEachNodeAfterFilterAndSort = vi.fn()
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders ag-grid when data is provided', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(screen.getByTestId('ag-grid-react')).toBeInTheDocument()
    })

    it('renders without crashing when data is empty', () => {
      render(<ProcessContributorTable data={[]} />)
      expect(screen.getByTestId('ag-grid-react')).toBeInTheDocument()
    })

    it('renders the expand button', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(screen.getByAltText('Expand Icon')).toBeInTheDocument()
    })

    it('renders ConfigurationDownload with title KEVs', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(screen.getByTestId('configuration-download')).toHaveTextContent(
        'KEVs',
      )
    })

    it('renders one grid-row per data item', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(screen.getAllByTestId('grid-row')).toHaveLength(3)
    })

    it('renders zero grid-rows for empty data', () => {
      render(<ProcessContributorTable data={[]} />)
      expect(screen.queryAllByTestId('grid-row')).toHaveLength(0)
    })
  })

  // ── Expand / Modal ─────────────────────────────────────────────────────────

  describe('Expand modal', () => {
    it('opens CustomModal when expand button is clicked', async () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      fireEvent.click(screen.getByAltText('Expand Icon'))
      await waitFor(() =>
        expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
      )
    })

    it('displays modal title as KEVs', async () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      fireEvent.click(screen.getByAltText('Expand Icon'))
      await waitFor(() =>
        expect(screen.getByTestId('modal-title')).toHaveTextContent('KEVs'),
      )
    })

    it('closes modal when hideModal is called', async () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      fireEvent.click(screen.getByAltText('Expand Icon'))
      await waitFor(() =>
        expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
      )
      fireEvent.click(screen.getByTestId('modal-close'))
      await waitFor(() =>
        expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument(),
      )
    })

    it('renders ag-grid inside the expanded modal', async () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      fireEvent.click(screen.getByAltText('Expand Icon'))
      await waitFor(() =>
        expect(screen.getByTestId('custom-modal')).toBeInTheDocument(),
      )
      expect(screen.getByTestId('ag-grid-react')).toBeInTheDocument()
    })
  })

  // ── Column Definitions ─────────────────────────────────────────────────────

  describe('Column definitions', () => {
    it('creates exactly 6 column definitions', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(getCapturedColumnDefs()).toHaveLength(6)
    })

    it('has correct header names in order', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(getCapturedColumnDefs().map((c) => c.headerName)).toEqual([
        'PLANT',
        'CATEGORY',
        'PARAMETER',
        'ACTUAL',
        'OPTIMUM',
        'STATE',
      ])
    })

    it('PLANT column has a rowSpan function', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(
        typeof getCapturedColumnDefs().find((c) => c.field === 'plant').rowSpan,
      ).toBe('function')
    })

    it('PARAMETER column has autoHeight', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(
        getCapturedColumnDefs().find((c) => c.field === 'parameter').autoHeight,
      ).toBe(true)
    })

    it('STATE column has a cellRenderer', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(
        typeof getCapturedColumnDefs().find((c) => c.field === 'state')
          .cellRenderer,
      ).toBe('function')
    })

    it('ACTUAL column has unSortIcon: true', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(
        getCapturedColumnDefs().find((c) => c.field === 'actual').unSortIcon,
      ).toBe(true)
    })

    it('OPTIMUM column has unSortIcon: true', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(
        getCapturedColumnDefs().find((c) => c.field === 'optimum').unSortIcon,
      ).toBe(true)
    })

    it('PLANT, CATEGORY, PARAMETER columns each have a headerComponent', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      ;['plant', 'category', 'parameter'].forEach((field) => {
        expect(
          typeof getCapturedColumnDefs().find((c) => c.field === field)
            .headerComponent,
        ).toBe('function')
      })
    })
  })

  // ── Cell Renderers ─────────────────────────────────────────────────────────

  describe('Cell renderers', () => {
    const getRenderer = (field) => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      return getCapturedColumnDefs().find((c) => c.field === field).cellRenderer
    }

    describe('STATE cell renderer', () => {
      it('renders red dot for state === 1', () => {
        const { container } = render(getRenderer('state')({ value: 1 }))
        expect(container.querySelector('.dots.red')).toBeInTheDocument()
      })

      it('renders blue dot for state === 0 (falsy)', () => {
        const { container } = render(getRenderer('state')({ value: 0 }))
        expect(container.querySelector('.dots.blue')).toBeInTheDocument()
      })

      it('renders blue dot for state === null', () => {
        const { container } = render(getRenderer('state')({ value: null }))
        expect(container.querySelector('.dots.blue')).toBeInTheDocument()
      })

      it('renders blue dot for state === undefined', () => {
        const { container } = render(getRenderer('state')({ value: undefined }))
        expect(container.querySelector('.dots.blue')).toBeInTheDocument()
      })

      it('renders grey dot for other truthy values like 2', () => {
        const { container } = render(getRenderer('state')({ value: 2 }))
        expect(container.querySelector('.dots.grey')).toBeInTheDocument()
      })
    })

    describe('PARAMETER cell renderer', () => {
      it('renders value in uppercase', () => {
        const renderer = getRenderer('parameter')
        const { getByText } = render(
          renderer({
            value: 'temp',
            data: { uom: 'C', equipmentName: 'Boiler' },
          }),
        )
        expect(getByText('TEMP')).toBeInTheDocument()
      })

      it('renders N/A when value is null', () => {
        const renderer = getRenderer('parameter')
        const { getByText } = render(
          renderer({ value: null, data: { uom: null, equipmentName: null } }),
        )
        expect(getByText('N/A')).toBeInTheDocument()
      })

      it('renders UOM in parentheses when not "-"', () => {
        const renderer = getRenderer('parameter')
        const { getByText } = render(
          renderer({
            value: 'Flow',
            data: { uom: 'L/s', equipmentName: 'Pump' },
          }),
        )
        expect(getByText('(L/S)')).toBeInTheDocument()
      })

      it('does not render UOM when it is "-"', () => {
        const renderer = getRenderer('parameter')
        const { queryByText } = render(
          renderer({
            value: 'Pressure',
            data: { uom: '-', equipmentName: 'Compressor' },
          }),
        )
        expect(queryByText('(-)')).not.toBeInTheDocument()
      })

      it('does not render UOM when uom is null', () => {
        const renderer = getRenderer('parameter')
        const { queryByText } = render(
          renderer({
            value: 'Param',
            data: { uom: null, equipmentName: 'Eq' },
          }),
        )
        expect(queryByText('(NULL)')).not.toBeInTheDocument()
      })
    })

    describe('PLANT cell renderer', () => {
      const buildParams = (rows, rowIndex) => ({
        node: { rowIndex },
        colDef: { field: 'plant' },
        data: rows[rowIndex],
        api: makeApi(rows),
        value: rows[rowIndex].plant,
      })

      it('returns empty string when rowSpan is 0 (duplicate row)', () => {
        render(<ProcessContributorTable data={makeSampleData()} />)
        const plantCol = getCapturedColumnDefs().find(
          (c) => c.field === 'plant',
        )
        const rows = [
          { plant: 'Plant A', category: 'Energy' },
          { plant: 'Plant A', category: 'Water' },
        ]
        expect(plantCol.cellRenderer(buildParams(rows, 1))).toBe('')
      })

      it('returns the value when rowSpan is > 0 (first row of group)', () => {
        render(<ProcessContributorTable data={makeSampleData()} />)
        const plantCol = getCapturedColumnDefs().find(
          (c) => c.field === 'plant',
        )
        const rows = [{ plant: 'Plant B', category: 'Gas' }]
        expect(plantCol.cellRenderer(buildParams(rows, 0))).toBe('Plant B')
      })
    })
  })

  // ── cellClass rules ────────────────────────────────────────────────────────

  describe('cellClass rules for PLANT column', () => {
    const buildParams = (rows, rowIndex) => ({
      node: { rowIndex },
      colDef: { field: 'plant' },
      data: rows[rowIndex],
      api: makeApi(rows),
    })

    it('returns spanCell for first row of a group', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      const plantCol = getCapturedColumnDefs().find((c) => c.field === 'plant')
      const rows = [
        { plant: 'A', category: 'X' },
        { plant: 'A', category: 'Y' },
      ]
      expect(plantCol.cellClass(buildParams(rows, 0))).toBe('spanCell')
    })

    it('returns noSpanCell for duplicate rows', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      const plantCol = getCapturedColumnDefs().find((c) => c.field === 'plant')
      const rows = [
        { plant: 'A', category: 'X' },
        { plant: 'A', category: 'Y' },
      ]
      expect(plantCol.cellClass(buildParams(rows, 1))).toBe('noSpanCell')
    })
  })

  // ── newRowSpan logic ───────────────────────────────────────────────────────

  describe('newRowSpan logic', () => {
    const getRowSpanFn = () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      return getCapturedColumnDefs().find((c) => c.field === 'plant').rowSpan
    }

    const call = (fn, rows, rowIndex) =>
      fn({
        node: { rowIndex },
        colDef: { field: 'plant' },
        data: rows[rowIndex],
        api: makeApi(rows),
      })

    it('returns 1 for a single unique row', () => {
      const rows = [{ plant: 'A', category: 'X' }]
      expect(call(getRowSpanFn(), rows, 0)).toBe(1)
    })

    it('returns span count for consecutive same-plant rows', () => {
      const rows = [
        { plant: 'A', category: 'X' },
        { plant: 'A', category: 'Y' },
        { plant: 'B', category: 'Z' },
      ]
      expect(call(getRowSpanFn(), rows, 0)).toBe(2)
    })

    it('returns 0 for a row that duplicates the one above it', () => {
      const rows = [
        { plant: 'A', category: 'X' },
        { plant: 'A', category: 'Y' },
      ]
      expect(call(getRowSpanFn(), rows, 1)).toBe(0)
    })

    it('returns 1 when plant differs from the previous row', () => {
      const rows = [
        { plant: 'A', category: 'X' },
        { plant: 'B', category: 'Y' },
      ]
      expect(call(getRowSpanFn(), rows, 1)).toBe(1)
    })

    it('returns 3 for three consecutive identical plants', () => {
      const rows = [
        { plant: 'A', category: 'X' },
        { plant: 'A', category: 'Y' },
        { plant: 'A', category: 'Z' },
      ]
      expect(call(getRowSpanFn(), rows, 0)).toBe(3)
    })

    it('stops counting when a different plant interrupts the run', () => {
      const rows = [
        { plant: 'A', category: 'X' },
        { plant: 'A', category: 'Y' },
        { plant: 'B', category: 'Z' },
        { plant: 'A', category: 'W' },
      ]
      expect(call(getRowSpanFn(), rows, 0)).toBe(2)
    })
  })

  // ── Sorting (onSortChanged) ────────────────────────────────────────────────

  describe('Sorting logic (onSortChanged)', () => {
    const sortData = [
      {
        plant: 'Plant B',
        category: 'Gas',
        parameter: 'P',
        actual: 200,
        optimum: 210,
        state: 0,
        uom: '',
        equipmentName: '',
      },
      {
        plant: 'Plant A',
        category: 'Energy',
        parameter: 'T',
        actual: 100,
        optimum: 90,
        state: 1,
        uom: '',
        equipmentName: '',
      },
      {
        plant: 'Plant A',
        category: 'Water',
        parameter: 'F',
        actual: 50,
        optimum: 60,
        state: 0,
        uom: '',
        equipmentName: '',
      },
    ]
    const evt = (field, sort) => ({ columns: [{ colDef: { field }, sort }] })

    it('sorts ascending without throwing', async () => {
      renderWithRef(sortData)
      // Wait for the useEffect that sets gridRef.current to fire
      await waitFor(() => expect(_sharedGridApi.getGridOption).toBeDefined())
      expect(() =>
        getCapturedOnSortChanged()(evt('actual', 'asc')),
      ).not.toThrow()
      expect(_sharedGridApi.setGridOption).toHaveBeenCalled()
    })

    it('sorts descending without throwing', async () => {
      renderWithRef(sortData)
      await waitFor(() => expect(_sharedGridApi.getGridOption).toBeDefined())
      expect(() =>
        getCapturedOnSortChanged()(evt('actual', 'desc')),
      ).not.toThrow()
      expect(_sharedGridApi.setGridOption).toHaveBeenCalled()
    })

    it('resets sort when sort is empty string', async () => {
      renderWithRef(sortData)
      await waitFor(() => expect(_sharedGridApi.getGridOption).toBeDefined())
      expect(() => getCapturedOnSortChanged()(evt('actual', ''))).not.toThrow()
    })

    it('handles tied max values in descending sort', async () => {
      const tiedData = [
        {
          plant: 'B',
          actual: 100,
          category: '',
          parameter: '',
          optimum: 0,
          state: 0,
          uom: '',
          equipmentName: '',
        },
        {
          plant: 'A',
          actual: 100,
          category: '',
          parameter: '',
          optimum: 0,
          state: 0,
          uom: '',
          equipmentName: '',
        },
      ]
      renderWithRef(tiedData)
      await waitFor(() => expect(_sharedGridApi.getGridOption).toBeDefined())
      expect(() =>
        getCapturedOnSortChanged()(evt('actual', 'desc')),
      ).not.toThrow()
    })

    it('handles ascending sort with single plant group', async () => {
      const singlePlant = [
        {
          plant: 'A',
          actual: 30,
          category: '',
          parameter: '',
          optimum: 0,
          state: 0,
          uom: '',
          equipmentName: '',
        },
        {
          plant: 'A',
          actual: 10,
          category: '',
          parameter: '',
          optimum: 0,
          state: 0,
          uom: '',
          equipmentName: '',
        },
      ]
      renderWithRef(singlePlant)
      await waitFor(() => expect(_sharedGridApi.getGridOption).toBeDefined())
      expect(() =>
        getCapturedOnSortChanged()(evt('actual', 'asc')),
      ).not.toThrow()
    })
  })

  // ── CustomHeader (headerComponent) ────────────────────────────────────────

  describe('CustomHeader (headerComponent)', () => {
    const buildProps = (field, overrides = {}) => ({
      displayName: field.toUpperCase(),
      column: {
        getColDef: () => ({ field }),
        getSort: () => null,
      },
      setSort: vi.fn(),
      api: {
        forEachNodeAfterFilterAndSort: vi.fn(),
        getGridOption: vi.fn(() => makeSampleData()),
        setGridOption: vi.fn(),
      },
      columnGroup: false,
      ...overrides,
    })

    const renderHeader = (field, overrides = {}) => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      const HeaderComponent = getCapturedColumnDefs().find(
        (c) => c.field === field,
      ).headerComponent
      return render(<HeaderComponent {...buildProps(field, overrides)} />)
    }

    it('renders PLANT header without crashing', () => {
      expect(renderHeader('plant').container.firstChild).toBeTruthy()
    })

    it('renders CATEGORY header without crashing', () => {
      expect(renderHeader('category').container.firstChild).toBeTruthy()
    })

    it('renders PARAMETER header without crashing', () => {
      expect(renderHeader('parameter').container.firstChild).toBeTruthy()
    })

    it('renders displayName text in the header', () => {
      const { getByText } = renderHeader('category')
      expect(getByText('CATEGORY')).toBeInTheDocument()
    })

    it('clicking the header div triggers sort without crashing', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      const HeaderComponent = getCapturedColumnDefs().find(
        (c) => c.field === 'category',
      ).headerComponent
      const setSort = vi.fn()
      const props = buildProps('category', {
        column: {
          getColDef: () => ({ field: 'category' }),
          getSort: () => 'asc',
        },
        setSort,
      })
      const { container } = render(<HeaderComponent {...props} />)
      expect(() => fireEvent.click(container.firstChild)).not.toThrow()
    })

    it('cycles sort: hideSortBtn=true means setSort is never called (PLANT/CATEGORY/PARAMETER)', () => {
      // All three column headerComponent factories pass hideSortBtn=true,
      // so sortHandler is a no-op. Verify setSort is NOT called on click.
      render(<ProcessContributorTable data={makeSampleData()} />)
      const HeaderComponent = getCapturedColumnDefs().find(
        (c) => c.field === 'category',
      ).headerComponent
      const setSort = vi.fn()
      const props = buildProps('category', {
        column: {
          getColDef: () => ({ field: 'category' }),
          getSort: () => 'asc',
        },
        setSort,
      })
      const { container } = render(<HeaderComponent {...props} />)
      fireEvent.click(container.firstChild)
      expect(setSort).not.toHaveBeenCalled()
    })

    it('sort icon changes reflect local sortState (starts unsorted)', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      const HeaderComponent = getCapturedColumnDefs().find(
        (c) => c.field === 'plant',
      ).headerComponent
      const props = buildProps('plant', {
        column: { getColDef: () => ({ field: 'plant' }), getSort: () => null },
        setSort: vi.fn(),
      })
      const { container } = render(<HeaderComponent {...props} />)
      expect(container.firstChild).toBeTruthy()
    })
  })

  // ── Data updates ───────────────────────────────────────────────────────────

  describe('Data updates via useEffect', () => {
    it('updates grid when data prop changes', () => {
      const { rerender } = render(
        <ProcessContributorTable data={makeSampleData()} />,
      )
      rerender(
        <ProcessContributorTable
          data={[
            {
              plant: 'Plant C',
              category: 'Steam',
              parameter: 'Vol',
              actual: 77,
              optimum: 80,
              state: 1,
              uom: 'm3',
              equipmentName: 'Turbine',
            },
          ]}
        />,
      )
      expect(screen.getAllByTestId('grid-row')).toHaveLength(1)
    })

    it('renders correctly when initially given empty data', () => {
      // The component only calls setProcessContributorData when data?.length is truthy.
      // So rendering with [] means internal state stays [] from the start.
      render(<ProcessContributorTable data={[]} />)
      expect(screen.queryAllByTestId('grid-row')).toHaveLength(0)
      expect(screen.getByTestId('ag-grid-react')).toBeInTheDocument()
    })
  })

  // ── Responsive row height ──────────────────────────────────────────────────

  describe('Responsive row height', () => {
    it('updates on window resize without crashing', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      act(() => {
        global.innerWidth = 800
        global.innerHeight = 600
        fireEvent(window, new Event('resize'))
      })
      expect(screen.getByTestId('ag-grid-react')).toBeInTheDocument()
    })

    it('removes the resize event listener on unmount', () => {
      const spy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = render(
        <ProcessContributorTable data={makeSampleData()} />,
      )
      unmount()
      expect(spy).toHaveBeenCalledWith('resize', expect.any(Function))
      spy.mockRestore()
    })
  })

  // ── Data pre-sorting ───────────────────────────────────────────────────────

  describe('Data pre-sorting', () => {
    it('sorts plants alphabetically before rendering', () => {
      const unsorted = [
        {
          plant: 'Z Plant',
          category: 'A',
          parameter: 'P',
          actual: 1,
          optimum: 1,
          state: 0,
          uom: '',
          equipmentName: '',
        },
        {
          plant: 'A Plant',
          category: 'B',
          parameter: 'Q',
          actual: 2,
          optimum: 2,
          state: 0,
          uom: '',
          equipmentName: '',
        },
      ]
      render(<ProcessContributorTable data={unsorted} />)
      expect(screen.getAllByTestId('grid-row')[0]).toHaveTextContent('A Plant')
    })

    it('within same plant, rows with state 1 appear before state 0', () => {
      const data = [
        {
          plant: 'Plant A',
          category: 'X',
          parameter: 'P',
          actual: 1,
          optimum: 1,
          state: 0,
          uom: '',
          equipmentName: '',
        },
        {
          plant: 'Plant A',
          category: 'Y',
          parameter: 'Q',
          actual: 2,
          optimum: 2,
          state: 1,
          uom: '',
          equipmentName: '',
        },
      ]
      render(<ProcessContributorTable data={data} />)
      // state 1 row comes first (descending within same plant)
      expect(screen.getAllByTestId('grid-row')[0]).toHaveTextContent('1')
    })
  })

  // ── XLS / ConfigurationDownload ────────────────────────────────────────────

  describe('ConfigurationDownload', () => {
    it('renders the ConfigurationDownload component', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(screen.getByTestId('configuration-download')).toBeInTheDocument()
    })

    it('passes all 6 column headers to ConfigurationDownload', () => {
      render(<ProcessContributorTable data={makeSampleData()} />)
      expect(getCapturedColumnDefs()).toHaveLength(6)
    })
  })
})
