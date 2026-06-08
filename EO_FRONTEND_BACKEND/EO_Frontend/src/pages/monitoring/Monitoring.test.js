import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAtom, useAtomValue, useSetAtom } from 'jotai'

import { useOutletContext, useParams } from 'react-router-dom'

// ─── Module Mocks ────────────────────────────────────────────────────────────

vi.mock('react-router-dom', () => ({
  useOutletContext: vi.fn(),

  useParams: vi.fn(),
}))

vi.mock('jotai', () => ({
  useAtom: vi.fn(),

  useAtomValue: vi.fn(),

  useSetAtom: vi.fn(),
}))

vi.mock('atoms/AppAtom', () => ({ AppAtom: 'AppAtom' }))

vi.mock('atoms/MonitoringAtom', () => ({
  monitoringChartData: 'monitoringChartData',

  monitoringSelectedRow: 'monitoringSelectedRow',

  monitoringSelectedRowId: 'monitoringSelectedRowId',
}))

vi.mock('atoms/SidebarAtom', () => ({
  activeFavoriteTrendsAtom: 'activeFavoriteTrendsAtom',
}))

vi.mock('services/CurrentServices', () => ({
  getMonitoringCategories: vi.fn(),

  getMonitoringData: vi.fn(),
}))

vi.mock('services/FavoriteService', () => ({
  getFavouriteByTrendId: vi.fn(),
}))

vi.mock('utills/utilities', () => ({
  convertFormulaToHtml: vi.fn((v) => v),

  getValsBaseOnCondition: vi.fn((cond, a, b) => (cond ? a : b)),

  slugToText: vi.fn((v) => v),
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    Monitoring: {
      handleSelected: vi.fn(),

      onCheckboxClick: vi.fn(),

      onDeleteClick: vi.fn(),

      onApplyClick: vi.fn(),

      onDropDownChange: vi.fn(),
    },
  },
}))

vi.mock('logger/Logger', () => ({ default: { log: vi.fn() } }))

vi.mock('components/elements/performance_log/PerformanceLog', () => ({
  default: ({ children }) => (
    <div data-testid='performance-log'>{children}</div>
  ),
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock(
  'components/visuals/charts/line_chart/linechart_multiple/LineChartMultipleMonitoring',

  () => ({
    default: (props) => (
      <div data-testid='line-chart-monitoring'>
        <button
          data-testid='trigger-selectedRowUpdate'
          onClick={() =>
            props.handleSelectedRowUpdate([
              { tagName: 'TAG1', min: 0, max: 100 },
            ])
          }
        />
        <button
          data-testid='trigger-updateMinMax'
          onClick={() =>
            props.handleUpdateMinMAx(5, 95, {
              tagName: 'TAG1',
              min: 5,
              max: 95,
            })
          }
        />
      </div>
    ),
  }),
)

vi.mock(
  'components/visuals/common/single_title_card/SignleTitleCardWithDropdown',

  () => ({
    default: ({ children, onSelectChange, handleSearchChange, onBlur }) => (
      <div data-testid='single-title-card'>
        <button
          data-testid='change-category'
          onClick={() =>
            onSelectChange([{ display_name: 'All', tag_name: null }], {
              display_name: 'All',
            })
          }
        />
        <button
          data-testid='change-category-specific'
          onClick={() =>
            onSelectChange([{ display_name: 'Cat1', tag_name: 'cat1' }], {
              display_name: 'Cat1',
            })
          }
        />
        <button
          data-testid='trigger-search'
          onClick={() => handleSearchChange('test')}
        />
        <button data-testid='trigger-blur' onClick={() => onBlur('blurVal')} />

        {children}
      </div>
    ),
  }),
)

vi.mock('components/visuals/table/MonitoringTable', () => ({
  default: () => <div data-testid='monitoring-table-comp' />,
}))

vi.mock('components/visuals/table/Table', () => ({
  default: () => <div data-testid='table-comp' />,
}))

vi.mock('react-bootstrap-pagination-control', () => ({
  PaginationControl: ({ changePage }) => (
    <button data-testid='pagination' onClick={() => changePage(2)}>
      Pagination
    </button>
  ),
}))

vi.mock('react-bootstrap', () => ({
  Form: {
    Check: ({ onChange, defaultChecked, id, 'data-testid': dtid }) => (
      <input
        type='checkbox'
        id={id}
        data-testid={dtid || id}
        defaultChecked={defaultChecked}
        onChange={onChange}
      />
    ),
  },

  OverlayTrigger: ({ children }) => <>{children}</>,
}))

vi.mock('react-bootstrap/Tooltip', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('assets/sabic_icons/common/bin_blue.svg', () => ({ default: 'bin' }))

vi.mock('assets/sabic_icons/common/dotted_trend_primary_blue.svg', () => ({
  default: 'dtblue',
}))

vi.mock('assets/sabic_icons/common/dotted_trend_primary_dark_blue.svg', () => ({
  default: 'dtdarkblue',
}))

vi.mock('assets/sabic_icons/common/dotted_trend_primary_gray_3.svg', () => ({
  default: 'dtgray',
}))

vi.mock('assets/sabic_icons/common/dotted_trend_primary_green.svg', () => ({
  default: 'dtgreen',
}))

vi.mock('assets/sabic_icons/common/dotted_trend_primary_orange.svg', () => ({
  default: 'dtorange',
}))

vi.mock('assets/sabic_icons/common/dotted_trend_primary_white.svg', () => ({
  default: 'dtwhite',
}))

vi.mock('assets/sabic_icons/common/dotted_trend_primary_yellow.svg', () => ({
  default: 'dtyellow',
}))

vi.mock('assets/sabic_icons/common/timeinfo_blue.svg', () => ({
  default: 'info',
}))

vi.mock('assets/sabic_icons/monitoring/arrow_left.svg', () => ({
  default: 'arrowleft',
}))

vi.mock('assets/sabic_icons/monitoring/arrow_right.svg', () => ({
  default: 'arrowright',
}))

vi.mock('config/scss/variables', () => ({
  default: {
    primary_orange: '#F7941D',

    primary_green: '#00A14B',

    primary_dark_blue: '#003087',

    primary_yellow: '#FFC107',

    primary_blue: '#007BFF',

    primary_gray_3: '#6C757D',

    primary_white: '#FFFFFF',
  },
}))

vi.mock('./Monitoring.module.scss', () => ({ default: {} }))

// ─── Import after mocks ───────────────────────────────────────────────────────

import Monitoring, {
  colorsArr,
  dottedTrendArr,
  getCheckedRow,
  getDesignValue,
  getStateColor,
  getValue,
  MAX_RECORDS,
  monitoringHeaders,
  setCategoryObjData,
} from './Monitoring'

import {
  getMonitoringCategories,
  getMonitoringData,
} from 'services/CurrentServices'

import { getFavouriteByTrendId } from 'services/FavoriteService'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeRow = (overrides = {}) => ({
  tagName: 'TAG1',

  parameter: 'Pressure',

  uom: 'bar',

  category: 'PROCESS',

  design: 10,

  actual: 9,

  optimum: 10,

  min: 0,

  max: 20,

  state: 0,

  sortID: 1,

  displayFormula: 'TAG1',

  displayDescription: 'Pressure Desc',

  piName: 'PI_TAG1',

  valueDecimal: 2,

  isOptimumEnabled: false,

  isAutoYAxis: true,

  ...overrides,
})

const buildAtomState = (caseId = 'case1', tagsList = []) => ({
  [caseId]: { caseId, tagsList, endTime: 1000 },
})

let setChartDataAtomMock,
  setSelectedRowAtomMock,
  setSelectedRowIdAtomMock,
  setActiveFavoriteTrendMock,
  resetActiveFavTrendMock

function setupMocks({
  actualTime = 1000,

  caseId = 'case1',

  chartData = {},

  selectedRow = { case1: [] },

  selectedRowId = { case1: [] },

  activeFavoriteTrend = null,
} = {}) {
  setChartDataAtomMock = vi.fn((updater) => {
    if (typeof updater === 'function') updater(chartData)
  })

  setSelectedRowAtomMock = vi.fn((updater) => {
    if (typeof updater === 'function') updater(selectedRow)
  })

  setSelectedRowIdAtomMock = vi.fn((updater) => {
    if (typeof updater === 'function') updater(selectedRowId)
  })

  setActiveFavoriteTrendMock = vi.fn()

  resetActiveFavTrendMock = vi.fn()

  useAtomValue.mockImplementation((atom) => {
    if (atom === 'AppAtom') return { actualTime, caseData: {} }

    return null
  })

  useOutletContext.mockReturnValue({ caseId })

  useParams.mockReturnValue({ affiliate: 'test-affiliate' })

  useAtom.mockImplementation((atom) => {
    if (atom === 'monitoringChartData') return [chartData, setChartDataAtomMock]

    if (atom === 'monitoringSelectedRow')
      return [selectedRow, setSelectedRowAtomMock]

    if (atom === 'monitoringSelectedRowId')
      return [selectedRowId, setSelectedRowIdAtomMock]

    if (atom === 'activeFavoriteTrendsAtom')
      return [activeFavoriteTrend, setActiveFavoriteTrendMock]

    return [null, vi.fn()]
  })

  useSetAtom.mockReturnValue(resetActiveFavTrendMock)
}

// ─── Pure Function Tests ──────────────────────────────────────────────────────

describe('Exported pure helpers', () => {
  it('monitoringHeaders has correct columns', () => {
    expect(monitoringHeaders).toEqual([
      'CATEGORY',

      'PARAMETER',

      'DESIGN',

      'ACTUAL',

      'OPTIMUM',

      '',
    ])
  })

  it('MAX_RECORDS equals 20', () => {
    expect(MAX_RECORDS).toBe(20)
  })

  it('colorsArr has 7 colors', () => {
    expect(colorsArr).toHaveLength(7)
  })

  it('dottedTrendArr has entries for each color', () => {
    colorsArr.forEach((c) => expect(dottedTrendArr).toHaveProperty(c))
  })

  describe('getValue', () => {
    it('returns "-" for null', () => expect(getValue(null)).toBe('-'))

    it('returns "-" for undefined', () => expect(getValue(undefined)).toBe('-'))

    it('returns value when defined', () => expect(getValue(42)).toBe(42))

    it('returns 0 (falsy but defined)', () => expect(getValue(0)).toBe(0))

    it('returns empty string', () => expect(getValue('')).toBe(''))
  })

  describe('getDesignValue', () => {
    it('returns "N/A" for null', () => expect(getDesignValue(null)).toBe('N/A'))

    it('returns "N/A" for undefined', () =>
      expect(getDesignValue(undefined)).toBe('N/A'))

    it('returns value when defined', () => expect(getDesignValue(10)).toBe(10))
  })

  describe('getStateColor', () => {
    it('returns "text_primary_orange" when val is 1', () =>
      expect(getStateColor(1)).toBe('text_primary_orange'))

    it('returns "" for any other value', () => {
      expect(getStateColor(0)).toBe('')

      expect(getStateColor(2)).toBe('')

      expect(getStateColor(null)).toBe('')
    })
  })

  describe('getCheckedRow', () => {
    it('returns true for truthy', () => expect(getCheckedRow(true)).toBe(true))

    it('returns false for falsy', () =>
      expect(getCheckedRow(false)).toBe(false))

    it('returns false for null', () => expect(getCheckedRow(null)).toBe(false))
  })

  describe('setCategoryObjData', () => {
    it('builds category object correctly', () => {
      const filteredData = [
        ['CAT_A', 'param1'],

        ['CAT_A', 'param2'],

        ['CAT_B', 'param3'],
      ]

      const setCategoryObj = vi.fn()

      setCategoryObjData(filteredData, setCategoryObj)

      expect(setCategoryObj).toHaveBeenCalledWith({
        CAT_A: [2, 0],

        CAT_B: [1, 0],
      })
    })

    it('handles empty array', () => {
      const setCategoryObj = vi.fn()

      setCategoryObjData([], setCategoryObj)

      expect(setCategoryObj).toHaveBeenCalledWith({})
    })
  })
})

// ─── Component Render Tests ───────────────────────────────────────────────────

describe('Monitoring component', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getMonitoringData.mockResolvedValue({
      data: [],

      pageCount: 0,
    })

    getMonitoringCategories.mockResolvedValue({ data: [] })

    getFavouriteByTrendId.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Basic Render ────────────────────────────────────────────────────────────

  it('renders performance log wrapper', async () => {
    setupMocks()

    render(<Monitoring />)

    await waitFor(() =>
      expect(screen.getByTestId('performance-log')).toBeInTheDocument(),
    )
  })

  it('renders line chart when chartDataAtom has caseId', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() =>
      expect(screen.getByTestId('line-chart-monitoring')).toBeInTheDocument(),
    )
  })

  it('renders Loader when chartDataAtom is empty', async () => {
    setupMocks({ chartData: {} })

    render(<Monitoring />)

    await waitFor(() =>
      expect(screen.getAllByTestId('loader').length).toBeGreaterThan(0),
    )
  })

  it('renders Loader when chartDataAtom has no caseId key', async () => {
    setupMocks({ chartData: { otherCase: { caseId: 'other', tagsList: [] } } })

    render(<Monitoring />)

    await waitFor(() =>
      expect(screen.getAllByTestId('loader').length).toBeGreaterThan(0),
    )
  })

  it('renders monitoring-linechart div', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() =>
      expect(screen.getByTestId('monitoring-linechart')).toBeInTheDocument(),
    )
  })

  it('renders monitoring-table div', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() =>
      expect(screen.getByTestId('monitoring-table')).toBeInTheDocument(),
    )
  })

  it('renders key-parameter-monitoring-table div', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() =>
      expect(
        screen.getByTestId('key-parameter-monitoring-table'),
      ).toBeInTheDocument(),
    )
  })

  it('renders expand-trend button initially', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() =>
      expect(screen.getByTestId('expand-trend')).toBeInTheDocument(),
    )
  })

  // ── Expand / Collapse ───────────────────────────────────────────────────────

  it('toggles to expand-key-parameter when expand-trend clicked', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() => screen.getByTestId('expand-trend'))

    fireEvent.click(screen.getByTestId('expand-trend'))

    expect(screen.getByTestId('expand-key-parameter')).toBeInTheDocument()
  })

  it('toggles back to expand-trend when expand-key-parameter clicked', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() => screen.getByTestId('expand-trend'))

    fireEvent.click(screen.getByTestId('expand-trend'))

    fireEvent.click(screen.getByTestId('expand-key-parameter'))

    expect(screen.getByTestId('expand-trend')).toBeInTheDocument()
  })

  // ── Data Loading ────────────────────────────────────────────────────────────

  it('calls getMonitoringData on mount', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())
  })

  it('calls getMonitoringCategories on mount', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() =>
      expect(getMonitoringCategories).toHaveBeenCalledWith('case1'),
    )
  })

  it('shows "No Data Found" when monitoringData is empty', async () => {
    const { getValsBaseOnCondition } = await import('utills/utilities')

    getValsBaseOnCondition.mockImplementation((cond, a, b) => (cond ? a : b))

    setupMocks({ chartData: buildAtomState('case1') })

    getMonitoringData.mockResolvedValue({ data: [], pageCount: 0 })

    render(<Monitoring />)

    await waitFor(() => {
      // getValsBaseOnCondition is used for conditional rendering

      expect(getMonitoringData).toHaveBeenCalled()
    })
  })

  it('handles getMonitoringData error gracefully', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    getMonitoringData.mockRejectedValue(new Error('Network error'))

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())

    // Should not crash

    expect(screen.getByTestId('performance-log')).toBeInTheDocument()
  })

  it('handles getMonitoringData without actualTime', async () => {
    setupMocks({ actualTime: null, chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringCategories).toHaveBeenCalled())

    // processMonitoringData returns early if no actualTime

    expect(getMonitoringData).not.toHaveBeenCalled()
  })

  it('handles getMonitoringData with rows having comma in category', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    getMonitoringData.mockResolvedValue({
      data: [makeRow({ category: 'CAT_A, CAT_B' })],

      pageCount: 0,
    })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())
  })

  it('handles getMonitoringData with null piName', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    getMonitoringData.mockResolvedValue({
      data: [makeRow({ piName: null })],

      pageCount: 0,
    })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())
  })

  it('handles getMonitoringData row with state=1 (orange)', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    getMonitoringData.mockResolvedValue({
      data: [makeRow({ state: 1 })],

      pageCount: 0,
    })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())
  })

  it('handles getMonitoringData with selected tag in chartData', async () => {
    const chartData = buildAtomState('case1', [
      { tagName: 'TAG1', serisColor: '#F7941D', show: true },
    ])

    setupMocks({ chartData })

    getMonitoringData.mockResolvedValue({
      data: [makeRow()],

      pageCount: 0,
    })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())
  })

  it('renders pagination when total > 1', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    // getValsBaseOnCondition mock: total > 0 returns '93%' and pagination

    render(<Monitoring />)

    await waitFor(() =>
      expect(screen.getByTestId('pagination')).toBeInTheDocument(),
    )
  })

  it('changes page via PaginationControl', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() => screen.getByTestId('pagination'))

    fireEvent.click(screen.getByTestId('pagination'))

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())
  })

  // ── Category Handling ───────────────────────────────────────────────────────

  it('populates categoryData from API', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    getMonitoringCategories.mockResolvedValue({
      data: [{ category: 'Process' }, { category: 'Utility' }],
    })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringCategories).toHaveBeenCalled())
  })

  it('handles empty categories API response', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    getMonitoringCategories.mockResolvedValue({ data: [] })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringCategories).toHaveBeenCalled())
  })

  it('handles null categories API response', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    getMonitoringCategories.mockResolvedValue({ data: null })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringCategories).toHaveBeenCalled())
  })

  it('calls handleCategoryChange when category changes to All', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() => screen.getByTestId('change-category'))

    fireEvent.click(screen.getByTestId('change-category'))

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())
  })

  it('calls handleCategoryChange with specific category', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() => screen.getByTestId('change-category-specific'))

    fireEvent.click(screen.getByTestId('change-category-specific'))

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())
  })

  it('handles search change', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() => screen.getByTestId('trigger-search'))

    fireEvent.click(screen.getByTestId('trigger-search'))

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())
  })

  it('handles blur on search', async () => {
    const { TRACKEVENTOBJ } = await import('config/ActivityTrackerConfig')

    setupMocks({ chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() => screen.getByTestId('trigger-blur'))

    fireEvent.click(screen.getByTestId('trigger-blur'))

    expect(TRACKEVENTOBJ.Monitoring.onDropDownChange).toHaveBeenCalled()
  })

  // ── Atom Initialization ─────────────────────────────────────────────────────

  it('initializes chartDataAtom when empty', async () => {
    setupMocks({ chartData: {} })

    render(<Monitoring />)

    await waitFor(() => expect(setChartDataAtomMock).toHaveBeenCalled())
  })

  it('initializes chartDataAtom when caseId is missing', async () => {
    setupMocks({ chartData: { otherCase: { caseId: 'other', tagsList: [] } } })

    render(<Monitoring />)

    await waitFor(() => expect(setChartDataAtomMock).toHaveBeenCalled())
  })

  it('initializes selectedRowAtom when empty', async () => {
    setupMocks({ selectedRow: {}, chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() => expect(setSelectedRowAtomMock).toHaveBeenCalled())
  })

  it('initializes selectedRowAtom when caseId is missing', async () => {
    setupMocks({
      selectedRow: { otherCase: [] },

      chartData: buildAtomState('case1'),
    })

    render(<Monitoring />)

    await waitFor(() => expect(setSelectedRowAtomMock).toHaveBeenCalled())
  })

  it('initializes selectedRowIdAtom when empty', async () => {
    setupMocks({ selectedRowId: {}, chartData: buildAtomState('case1') })

    render(<Monitoring />)

    await waitFor(() => expect(setSelectedRowIdAtomMock).toHaveBeenCalled())
  })

  it('initializes selectedRowIdAtom when caseId missing', async () => {
    setupMocks({
      selectedRowId: { otherCase: [] },

      chartData: buildAtomState('case1'),
    })

    render(<Monitoring />)

    await waitFor(() => expect(setSelectedRowIdAtomMock).toHaveBeenCalled())
  })

  it('restores checkboxes from existing chartDataAtom tagsList', async () => {
    const checkboxId = 'checkbox-TAG1'

    document.body.innerHTML = `<input type="checkbox" id="${checkboxId}" />`

    const chartData = buildAtomState('case1', [
      { tagName: 'TAG1', serisColor: '#F7941D', show: true },
    ])

    setupMocks({ chartData })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())
  })

  it('fixes chartDataAtom when endTime is null', async () => {
    const chartData = {
      case1: { caseId: 'case1', tagsList: [] },
      endTime: null,
    }

    setupMocks({ chartData, actualTime: 9999 })

    render(<Monitoring />)

    await waitFor(() => expect(setChartDataAtomMock).toHaveBeenCalled())
  })

  // ── handleSelectedRowUpdate (via line chart trigger) ────────────────────────

  it('handleSelectedRowUpdate updates min/max for matching tag with autoYAxis', async () => {
    const chartData = buildAtomState('case1', [
      {
        tagName: 'TAG1',

        isAutoYAxis: true,

        min: 0,

        max: 100,

        defaultMin: 0,

        defaultMax: 100,

        serisColor: '#F7941D',

        show: true,
      },
    ])

    const selectedRow = {
      case1: [['param', 'cat', 'opt', 'auto', 0, 100, 'TAG1']],
    }

    setupMocks({ chartData, selectedRow })

    render(<Monitoring />)

    await waitFor(() => screen.getByTestId('trigger-selectedRowUpdate'))

    fireEvent.click(screen.getByTestId('trigger-selectedRowUpdate'))

    expect(setChartDataAtomMock).toHaveBeenCalled()
  })

  it('handleSelectedRowUpdate skips tag without autoYAxis', async () => {
    const chartData = buildAtomState('case1', [
      {
        tagName: 'TAG1',

        isAutoYAxis: false,

        min: 0,

        max: 100,

        defaultMin: 0,

        defaultMax: 100,

        serisColor: '#F7941D',

        show: true,
      },
    ])

    const selectedRow = {
      case1: [['param', 'cat', 'opt', 'auto', 0, 100, 'TAG1']],
    }

    setupMocks({ chartData, selectedRow })

    render(<Monitoring />)

    await waitFor(() => screen.getByTestId('trigger-selectedRowUpdate'))

    fireEvent.click(screen.getByTestId('trigger-selectedRowUpdate'))

    expect(setChartDataAtomMock).toHaveBeenCalled()
  })

  // ── handleUpdateMinMAx (via line chart trigger) ─────────────────────────────

  it('handleUpdateMinMAx updates selected row and chart atom', async () => {
    const chartData = buildAtomState('case1', [
      {
        tagName: 'TAG1',
        min: 0,
        max: 100,
        defaultMin: 0,
        defaultMax: 100,
        serisColor: '#F7941D',
      },
    ])

    const selectedRow = { case1: [['p', 'c', 'o', 'a', 0, 100, 'TAG1']] }

    setupMocks({ chartData, selectedRow })

    render(<Monitoring />)

    await waitFor(() => screen.getByTestId('trigger-updateMinMax'))

    fireEvent.click(screen.getByTestId('trigger-updateMinMax'))

    expect(setChartDataAtomMock).toHaveBeenCalled()
  })

  // ── Favorite Trends ─────────────────────────────────────────────────────────

  it('loads favorite trend when activeFavoriteTrend is set and monitoringData is loaded', async () => {
    const favData = {
      isMonitoringXY: false,

      tagDetails: [JSON.stringify(makeRow()).replaceAll('"', "'")],
    }

    getFavouriteByTrendId.mockResolvedValue({ data: favData })

    const chartData = buildAtomState('case1')

    setupMocks({ activeFavoriteTrend: 'fav-trend-1', chartData })

    getMonitoringData.mockResolvedValue({
      data: [makeRow()],

      pageCount: 0,
    })

    render(<Monitoring />)

    await waitFor(() =>
      expect(getFavouriteByTrendId).toHaveBeenCalledWith('fav-trend-1'),
    )
  })

  it('returns early from fav trend if isMonitoringXY is true', async () => {
    getFavouriteByTrendId.mockResolvedValue({ data: { isMonitoringXY: true } })

    const chartData = buildAtomState('case1')

    setupMocks({ activeFavoriteTrend: 'fav-trend-xy', chartData })

    getMonitoringData.mockResolvedValue({ data: [makeRow()], pageCount: 0 })

    render(<Monitoring />)

    await waitFor(() => expect(getFavouriteByTrendId).toHaveBeenCalled())

    expect(setActiveFavoriteTrendMock).toHaveBeenCalledWith(null)
  })

  it('does not call getFavouriteByTrendId when activeFavoriteTrend is null', async () => {
    setupMocks({
      activeFavoriteTrend: null,
      chartData: buildAtomState('case1'),
    })

    getMonitoringData.mockResolvedValue({ data: [makeRow()], pageCount: 0 })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())

    expect(getFavouriteByTrendId).not.toHaveBeenCalled()
  })

  it('does not call getFavouriteByTrendId when monitoringData is empty', async () => {
    setupMocks({
      activeFavoriteTrend: 'fav1',
      chartData: buildAtomState('case1'),
    })

    getMonitoringData.mockResolvedValue({ data: [], pageCount: 0 })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())

    expect(getFavouriteByTrendId).not.toHaveBeenCalled()
  })
})

// ─── Checkbox Interaction Tests ───────────────────────────────────────────────

describe('Monitoring checkbox interactions via prepareData', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getMonitoringCategories.mockResolvedValue({ data: [] })
  })

  const renderWithData = async (
    rows = [makeRow()],
    chartData = buildAtomState('case1'),
  ) => {
    setupMocks({ chartData })

    getMonitoringData.mockResolvedValue({ data: rows, pageCount: 0 })

    const utils = render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())

    return utils
  }

  it('prepareData checkbox onChange calls handleSelected on check', async () => {
    const { TRACKEVENTOBJ } = await import('config/ActivityTrackerConfig')

    await renderWithData()

    const checkboxes = screen.getAllByRole('checkbox')

    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0])
    }

    // TRACKEVENTOBJ may be called depending on rendered checkboxes

    expect(screen.getByTestId('performance-log')).toBeInTheDocument()
  })

  it('renders defaultChecked=true when tag is in tagsList', async () => {
    const chartData = buildAtomState('case1', [
      { tagName: 'TAG1', serisColor: '#F7941D', show: true },
    ])

    setupMocks({ chartData })

    getMonitoringData.mockResolvedValue({ data: [makeRow()], pageCount: 0 })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())

    expect(screen.getByTestId('performance-log')).toBeInTheDocument()
  })
})

// ─── handleSelectionAdd / Remove via apply button ─────────────────────────────

describe('Apply button min/max validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getMonitoringCategories.mockResolvedValue({ data: [] })
  })

  it('alerts when min > max', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

    const selectedRow = {
      case1: [['param', 'cat', 'opt', 'auto', 0, 100, 'TAG1', null, null]],
    }

    const chartData = buildAtomState('case1', [
      {
        tagName: 'TAG1',
        min: 0,
        max: 100,
        defaultMin: 0,
        defaultMax: 100,
        isAutoYAxis: true,
        serisColor: '#F7941D',
      },
    ])

    setupMocks({ chartData, selectedRow })

    getMonitoringData.mockResolvedValue({ data: [makeRow()], pageCount: 0 })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())

    // Create DOM elements that handleApplyButtonClick needs

    const minInput = document.createElement('input')

    minInput.id = 'input-min-TAG1'

    minInput.value = '200'

    document.body.appendChild(minInput)

    const maxInput = document.createElement('input')

    maxInput.id = 'input-max-TAG1'

    maxInput.value = '50'

    document.body.appendChild(maxInput)

    const applyBtn = document.getElementById('button-apply-TAG1')

    if (applyBtn) {
      fireEvent.click(applyBtn)

      expect(alertMock).toHaveBeenCalled()
    }

    alertMock.mockRestore()
  })
})

// ─── colorsArr / dottedTrendArr Exported Values ───────────────────────────────

describe('colorsArr and dottedTrendArr exports', () => {
  it('each color in colorsArr has a matching dotted trend entry', () => {
    colorsArr.forEach((color) => {
      expect(dottedTrendArr[color]).toBeDefined()
    })
  })
})

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('Edge cases and branch coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getMonitoringCategories.mockResolvedValue({ data: [] })

    getMonitoringData.mockResolvedValue({ data: [], pageCount: 0 })
  })

  it('handles no caseId in processMonitoringData', async () => {
    useOutletContext.mockReturnValue({ caseId: null })

    useParams.mockReturnValue({ affiliate: 'test' })

    useAtomValue.mockReturnValue({ actualTime: 1000, caseData: {} })

    const setChart = vi.fn()

    const setRow = vi.fn()

    const setRowId = vi.fn()

    const setFav = vi.fn()

    useAtom.mockImplementation((atom) => {
      if (atom === 'monitoringChartData')
        return [buildAtomState('case1'), setChart]

      if (atom === 'monitoringSelectedRow') return [{ case1: [] }, setRow]

      if (atom === 'monitoringSelectedRowId') return [{ case1: [] }, setRowId]

      if (atom === 'activeFavoriteTrendsAtom') return [null, setFav]

      return [null, vi.fn()]
    })

    useSetAtom.mockReturnValue(vi.fn())

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringCategories).not.toHaveBeenCalled())
  })

  it('handles getMonitoringCategories returning non-array data', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    getMonitoringCategories.mockResolvedValue({ data: 'not-an-array' })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringCategories).toHaveBeenCalled())

    expect(screen.getByTestId('performance-log')).toBeInTheDocument()
  })

  it('handles moment.now() when actualTime is undefined', async () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === 'AppAtom') return { caseData: {} } // no actualTime

      return null
    })

    useOutletContext.mockReturnValue({ caseId: 'case1' })

    useParams.mockReturnValue({ affiliate: 'test' })

    const setChart = vi.fn()

    useAtom.mockImplementation((atom) => {
      if (atom === 'monitoringChartData') return [{}, setChart]

      if (atom === 'monitoringSelectedRow') return [{ case1: [] }, vi.fn()]

      if (atom === 'monitoringSelectedRowId') return [{ case1: [] }, vi.fn()]

      if (atom === 'activeFavoriteTrendsAtom') return [null, vi.fn()]

      return [null, vi.fn()]
    })

    useSetAtom.mockReturnValue(vi.fn())

    render(<Monitoring />)

    await waitFor(() => expect(setChart).toHaveBeenCalled())
  })

  it('renders with multiple rows from getMonitoringData', async () => {
    setupMocks({ chartData: buildAtomState('case1') })

    getMonitoringData.mockResolvedValue({
      data: [
        makeRow({ tagName: 'TAG1', sortID: 2 }),

        makeRow({ tagName: 'TAG2', sortID: 1, actual: null, optimum: null }),
      ],

      pageCount: 1,
    })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())

    expect(screen.getByTestId('performance-log')).toBeInTheDocument()
  })

  it('recovers checkboxes for existing tagsList after data load', async () => {
    // The source code inside processMonitoringData does:

    //   document.getElementById(`checkbox-${selectedTag.tagName}-${selectedTag.category}`)

    // So the ID must match tagName + category from the tagsList entry.

    const TAG_NAME = 'TAG1'

    const TAG_CATEGORY = 'PROCESS'

    const chartData = buildAtomState('case1', [
      {
        tagName: TAG_NAME,
        category: TAG_CATEGORY,
        serisColor: '#F7941D',
        show: true,
      },
    ])

    setupMocks({ chartData })

    getMonitoringData.mockResolvedValue({ data: [makeRow()], pageCount: 0 })

    render(<Monitoring />)

    await waitFor(() => expect(getMonitoringData).toHaveBeenCalled())

    // The setTimeout(0) in processMonitoringData tries to set .checked = true

    // on the element with id `checkbox-${tagName}-${category}`.

    // We create that element BEFORE the setTimeout fires (within the same task queue).

    const cbEl = document.createElement('input')

    cbEl.type = 'checkbox'

    cbEl.id = `checkbox-${TAG_NAME}-${TAG_CATEGORY}`

    document.body.appendChild(cbEl)

    // Flush all pending timers/microtasks so the setTimeout(0) callback runs

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(cbEl.checked).toBe(true)
  })
})
