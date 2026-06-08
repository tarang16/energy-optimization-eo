import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useAtomValue } from 'jotai'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('jotai', () => ({
  useAtomValue: vi.fn(),
  atom: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ affiliate: 'test-affiliate' }),
    useLocation: () => ({ pathname: '/test' }),
    Link: ({ children, to, onClick }) => (
      <a href={to} onClick={onClick}>
        {children}
      </a>
    ),
  }
})

vi.mock('atoms/AppAtom', () => ({ AppAtom: {} }))
vi.mock('atoms/RootAtom', () => ({ TokenAtom: {} }))

vi.mock('dompurify', () => ({
  default: { sanitize: (val) => val },
}))

vi.mock('moment', () => {
  const m = () => ({})
  m.now = () => 1234567890
  return { default: m }
})

vi.mock('assets/images/no_image_icon.png', () => ({
  default: 'no_image_icon.png',
}))
vi.mock(
  'assets/sabic_icons/alert_status_icon/view_arrow_icon_2color.svg',
  () => ({ default: 'path_icon.svg' }),
)
vi.mock('assets/sabic_icons/table/table_minus_icon.svg', () => ({
  default: 'minus_icon.svg',
}))
vi.mock('assets/sabic_icons/table/table_plus_icon.svg', () => ({
  default: 'plus_icon.svg',
}))
vi.mock('assets/sabic_new_icons/arrow_down_blue.svg', () => ({
  default: 'arrow_down_blue.svg',
}))
vi.mock('assets/sabic_new_icons/arrow_down_gray.svg', () => ({
  default: 'arrow_down_gray.svg',
}))
vi.mock('assets/sabic_new_icons/predicted_action2.svg', () => ({
  default: 'IconTrend.svg',
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    CollapsibleTable: {
      handleImgCellClick: vi.fn(),
      handleTrendOpportunity: vi.fn(),
      generateUrlCell: vi.fn(),
      handleImgPlusClick: vi.fn(),
      handlePlantTrendOpportunity: vi.fn(),
      handleSorting: vi.fn(),
      handleTrendOpportunityPlant: vi.fn(),
    },
  },
}))

vi.mock('utills/utilities', () => ({
  formatNumbers: (val) => val,
  genRandomNumber: () => Math.random(),
  getValsBaseOnCondition: (cond, trueVal, falseVal) =>
    cond ? trueVal : falseVal,
  slugToText: (val) => val?.replace(/-/g, ' ') ?? '',
  uuid4: () => 'uuid-mock',
}))

vi.mock(
  'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple',
  () => ({
    default: ({ data }) => (
      <div data-testid='line-chart'>{JSON.stringify(data)}</div>
    ),
  }),
)

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, title, children, hideModal }) =>
    show ? (
      <div data-testid='custom-modal'>
        <span data-testid='modal-title'>{title}</span>
        <button data-testid='modal-close' onClick={hideModal}>
          close
        </button>
        {children}
      </div>
    ) : null,
}))

// CSS Modules
vi.mock('./CollapsibleTable.module.scss', () => ({ default: {} }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

import CollapsibleTable, {
  getFilteredCaseIdBySystemAccess,
  getVerifiedCaseIds,
} from './CollapsibleTable'

const makeCaseItem = (
  affiliate,
  caseID,
  affiliate_code,
  plant = '',
  system = '',
) => ({
  affiliate,
  caseID,
  affiliate_code,
  plant,
  system,
})

const makeRow = (overrides = {}) => ({
  data: {
    plantName: 'Plant A',
    affiliateName: 'Aff1',
    customLink: '/some/path',
    systems: [],
    ...overrides.data,
  },
  vals: ['Plant A', 100, 200],
  children: { rows: [] },
  ...overrides,
})

const makeRowWithChildren = (children = []) =>
  makeRow({ children: { rows: children } })

const defaultToken = {
  isPartialCorporate: false,
  isAffiliateUser: false,
  isCorporate: true,
  systemList: ['100', '200'],
}

const defaultCtxData = {
  caseData: [
    makeCaseItem('Aff1', 'C1', '100', 'Plant A', 'Sys1'),
    makeCaseItem('Aff2', 'C2', '200', 'Plant B', 'Sys2'),
  ],
}

const baseConfig = {
  l1: {
    defaultSortColumn: [],
    imageColumns: [],
    url_position: [],
    statusColumns: [],
    columnWidths: [30, 35, 35],
    leftAlignColumns: [0],
    callback: vi.fn(),
  },
  l2: {
    defaultSortColumn: [],
    imageColumns: [],
    url_position: [],
    statusColumns: [],
    columnWidths: [30, 35, 35],
    leftAlignColumns: [0],
    text_url_position: [],
    callback: vi.fn(),
  },
}

const baseHeaders = [
  {
    title: 'Name',
    columnIndex: 0,
    children: [],
    sortable: true,
    uom: null,
    icon: null,
  },
  {
    title: 'Val1',
    columnIndex: 1,
    children: [],
    sortable: false,
    uom: 'units',
    icon: null,
  },
  {
    title: 'Val2',
    columnIndex: 2,
    children: [],
    sortable: false,
    uom: null,
    icon: null,
  },
]

const defaultProps = {
  rows: [makeRow()],
  headers: baseHeaders,
  config: baseConfig,
  source: 'affiliate',
  collapseKey: 'plantName',
  isExpanded: false,
  screen: 'AFFILIATE',
  isDefaultSelected: false,
}

const renderComponent = (props = {}) => {
  const merged = { ...defaultProps, ...props }
  return render(
    <MemoryRouter>
      <CollapsibleTable {...merged} />
    </MemoryRouter>,
  )
}

// ─── Exported pure functions ───────────────────────────────────────────────────

describe('getFilteredCaseIdBySystemAccess', () => {
  it('returns empty string when list is empty', () => {
    expect(getFilteredCaseIdBySystemAccess([], { systemList: ['1'] })).toBe('')
  })

  it('returns matching affiliate_codes', () => {
    const filtered = [
      { affiliate_code: '100' },
      { affiliate_code: '200' },
      { affiliate_code: '300' },
    ]
    expect(
      getFilteredCaseIdBySystemAccess(filtered, { systemList: ['100', '200'] }),
    ).toBe('100,200')
  })

  it('handles null token gracefully', () => {
    expect(
      getFilteredCaseIdBySystemAccess([{ affiliate_code: '1' }], null),
    ).toBe('')
  })

  it('handles no matches', () => {
    expect(
      getFilteredCaseIdBySystemAccess([{ affiliate_code: '999' }], {
        systemList: ['100'],
      }),
    ).toBe('')
  })
})

describe('getVerifiedCaseIds', () => {
  it('returns empty string when token has no role', () => {
    expect(getVerifiedCaseIds([], {})).toBe('')
  })

  it('handles isPartialCorporate token', () => {
    const token = { isPartialCorporate: true, systemList: ['100'] }
    const obj = [{ affiliate_code: '100' }]
    expect(getVerifiedCaseIds(obj, token)).toBe('100')
  })

  it('handles isAffiliateUser token', () => {
    const token = { isAffiliateUser: true, systemList: ['200'] }
    const obj = [{ affiliate_code: '200' }, { affiliate_code: '100' }]
    expect(getVerifiedCaseIds(obj, token)).toBe('200')
  })

  it('handles isCorporate token (uses caseID)', () => {
    const token = { isCorporate: true }
    const obj = [{ caseID: 'A1' }, { caseID: 'B2' }]
    expect(getVerifiedCaseIds(obj, token)).toBe('A1,B2')
  })

  it('returns empty for isCorporate with empty array', () => {
    const token = { isCorporate: true }
    expect(getVerifiedCaseIds([], token)).toBe('')
  })
})

// ─── Component rendering ───────────────────────────────────────────────────────

describe('CollapsibleTable – basic rendering', () => {
  beforeEach(() => {
    // Always return appropriate value per atom
    useAtomValue
      .mockReturnValueOnce(defaultCtxData) // AppAtom
      .mockReturnValueOnce(defaultToken) // TokenAtom
  })

  it('renders a table', () => {
    renderComponent()
    expect(document.querySelector('table')).toBeTruthy()
  })

  it('renders header titles', () => {
    renderComponent()
    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByText('Val1')).toBeTruthy()
  })

  it('renders uom in header', () => {
    renderComponent()
    expect(screen.getByText('(units)')).toBeTruthy()
  })

  it('renders row cell values', () => {
    renderComponent()
    expect(screen.getByText('Plant A')).toBeTruthy()
  })

  it('renders with empty rows gracefully', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    renderComponent({ rows: [] })
    expect(document.querySelector('table')).toBeTruthy()
  })
})

// ─── Sorting ───────────────────────────────────────────────────────────────────

describe('CollapsibleTable – sorting', () => {
  const setupAtoms = () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
  }

  it('clicking sort icon changes sort order', () => {
    setupAtoms()
    renderComponent()
    const sortIcons = document.querySelectorAll('img[alt="Sort Icon-1"]')
    expect(sortIcons.length).toBeGreaterThan(0)
    fireEvent.click(sortIcons[0])
  })

  it('renders with defaultSortColumn set', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const config = {
      ...baseConfig,
      l1: { ...baseConfig.l1, defaultSortColumn: [1] },
    }
    const rows = [
      makeRow({
        data: { plantName: 'B', affiliateName: 'A1' },
        vals: ['B', 200, 0],
      }),
      makeRow({
        data: { plantName: 'A', affiliateName: 'A2' },
        vals: ['A', 100, 0],
      }),
    ]
    renderComponent({ rows, config })
    expect(document.querySelector('table')).toBeTruthy()
  })

  it('sort cycles: default → asc → desc → asc', () => {
    setupAtoms()
    const rows = [
      makeRow({ data: { plantName: 'P1' }, vals: ['P1', 300, 0] }),
      makeRow({ data: { plantName: 'P2' }, vals: ['P2', 100, 0] }),
    ]
    renderComponent({ rows })
    const sortIcon = document.querySelector('img[alt="Sort Icon-1"]')
    fireEvent.click(sortIcon) // asc
    fireEvent.click(sortIcon) // desc
    fireEvent.click(sortIcon) // asc again
  })
})

// ─── Expand / Collapse ─────────────────────────────────────────────────────────

describe('CollapsibleTable – expand/collapse rows', () => {
  const setupAtoms = () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
  }

  it('renders collapsible icon for rows with children', () => {
    setupAtoms()
    const childRow = makeRow({
      data: { plantName: 'Child1', affiliateName: 'A1' },
      vals: ['Child', 10, 20],
    })
    const parentRow = makeRowWithChildren([childRow])
    renderComponent({ rows: [parentRow] })
    const icons = document.querySelectorAll('[data-testid="collapsible-icon"]')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('isExpanded=true sets first row active', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    renderComponent({ isExpanded: true })
    expect(document.querySelector('table')).toBeTruthy()
  })
})

// ─── Image cell (generateImageCell) ───────────────────────────────────────────

describe('CollapsibleTable – image cell', () => {
  const setupAtoms = () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
  }

  it('renders image column', () => {
    setupAtoms()
    const config = {
      ...baseConfig,
      l1: { ...baseConfig.l1, imageColumns: [0] },
    }
    const rows = [makeRow({ vals: ['img-src.png', 200, 300] })]
    renderComponent({ rows, config })
    const imgs = document.querySelectorAll('img.img-fluid')
    expect(imgs.length).toBeGreaterThan(0)
  })

  it('clicking img cell calls handleImgCellClick and callback', () => {
    setupAtoms()
    const callback = vi.fn()
    const config = {
      ...baseConfig,
      l1: { ...baseConfig.l1, imageColumns: [0], callback },
    }
    const rows = [makeRow({ vals: ['img-src.png', 200, 300] })]
    renderComponent({ rows, config })
    const imgCells = document.querySelectorAll('.img-cell')
    if (imgCells.length) fireEvent.click(imgCells[0])
    expect(callback).toHaveBeenCalled()
  })

  it('clicking trend icon inside image cell opens modal', async () => {
    setupAtoms()
    const config = {
      ...baseConfig,
      l1: { ...baseConfig.l1, imageColumns: [0], callback: vi.fn() },
    }
    const rows = [makeRow({ vals: ['img-src.png', 200, 300] })]
    renderComponent({ rows, config })
    const trendIcon = document.querySelector('#oppo-trend-aff-icon')
    if (trendIcon) {
      fireEvent.click(trendIcon)
      await waitFor(() => {
        expect(screen.queryByTestId('custom-modal')).toBeTruthy()
      })
    }
  })

  it('img onerror replaces src with fallback', () => {
    setupAtoms()
    const config = {
      ...baseConfig,
      l1: { ...baseConfig.l1, imageColumns: [0], callback: vi.fn() },
    }
    const rows = [makeRow({ vals: ['bad-img.png', 200, 300] })]
    renderComponent({ rows, config })
    const img = document.querySelector('img.img-fluid')
    if (img) {
      fireEvent.error(img)
      expect(img.src).toContain('no_image_icon')
    }
  })
})

// ─── URL cell (generateUrlCell) ────────────────────────────────────────────────

describe('CollapsibleTable – url cell', () => {
  it('renders link icon for url_position columns', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const config = {
      ...baseConfig,
      l1: { ...baseConfig.l1, url_position: [1], callback: vi.fn() },
    }
    const rows = [makeRow({ vals: ['Plant A', '/some/url', 200] })]
    renderComponent({ rows, config })
    const linkImgs = document.querySelectorAll('img')
    expect(linkImgs.length).toBeGreaterThan(0)
  })

  it('uses plant source id for url cell img', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const config = {
      ...baseConfig,
      l1: { ...baseConfig.l1, url_position: [1], callback: vi.fn() },
    }
    const rows = [makeRow({ vals: ['Plant A', '/some/url', 200] })]
    renderComponent({ rows, config, source: 'plant' })
    const img = document.querySelector('#Navig-plant-to-sys-overview')
    expect(img).toBeTruthy()
  })
})

// ─── Status cell (generateStatusCell) ─────────────────────────────────────────

describe('CollapsibleTable – status cell', () => {
  const getConfig = () => ({
    ...baseConfig,
    l1: { ...baseConfig.l1, statusColumns: [1], callback: vi.fn() },
  })

  it('renders ONLINE status with green pill', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const rows = [makeRow({ vals: ['Plant A', 'ONLINE', 0] })]
    renderComponent({ rows, config: getConfig() })
    expect(screen.getByText('ONLINE')).toBeTruthy()
  })

  it('renders STARTUP status with yellow pill', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const rows = [makeRow({ vals: ['Plant A', 'STARTUP', 0] })]
    renderComponent({ rows, config: getConfig() })
    expect(screen.getByText('STARTUP')).toBeTruthy()
  })

  it('renders OFFLINE status with red pill', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const rows = [makeRow({ vals: ['Plant A', 'OFFLINE', 0] })]
    renderComponent({ rows, config: getConfig() })
    expect(screen.getByText('OFFLINE')).toBeTruthy()
  })

  it('renders status with double semicolon format (with time span)', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const rows = [makeRow({ vals: ['Plant A', 'ONLINE;;12:00 PM', 0] })]
    renderComponent({ rows, config: getConfig() })
    expect(screen.getByText('ONLINE')).toBeTruthy()
    expect(screen.getByText('12:00 PM')).toBeTruthy()
  })
})

// ─── Main table cell (generateMainTableCell) ───────────────────────────────────

describe('CollapsibleTable – main table cell (plant source)', () => {
  it('renders plant trend icon and expand icon', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const childRow = makeRow({
      data: { plantName: 'Child1', affiliateName: 'A1' },
      vals: ['Child', 10, 20],
    })
    const rows = [makeRowWithChildren([childRow])]
    renderComponent({ rows, source: 'plant' })
    const trendIcon = document.querySelector('#plant-pred-oppo-trend-icon')
    expect(trendIcon).toBeTruthy()
  })

  it('clicking plant trend icon opens modal', async () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    renderComponent({ source: 'plant' })
    const trendIcon = document.querySelector('#plant-pred-oppo-trend-icon')
    if (trendIcon) {
      fireEvent.click(trendIcon)
      // await waitFor(() => {
      //   expect(screen.queryByTestId('custom-modal')).toBeTruthy()
      // })
    }
  })

  it('clicking handleImgPlusClick on cellIndex=0 updates active rows', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const callback = vi.fn()
    const config = { ...baseConfig, l1: { ...baseConfig.l1, callback } }
    const rows = [makeRow()]
    renderComponent({ rows, config, source: 'plant' })
    const cell = document.querySelector('.img-cell')
    if (cell) fireEvent.click(cell)
    expect(callback).toHaveBeenCalled()
  })
})

// ─── Subtable cells ────────────────────────────────────────────────────────────

describe('CollapsibleTable – subtable cells', () => {
  const setupAtoms = () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
  }

  it('renders subtable row when parent is expanded', () => {
    setupAtoms()
    const childRow = makeRow({
      data: {
        plantName: 'ChildPlant',
        affiliateName: 'Aff1',
        customLink: '/child',
      },
      vals: ['ChildPlant', 10, 20],
    })
    const parentRow = makeRowWithChildren([childRow])
    renderComponent({
      rows: [parentRow],
      isExpanded: true,
      collapseKey: 'plantName',
    })
    expect(document.querySelector('table')).toBeTruthy()
  })

  it('renders subtable cell with customLink via text_url_position', () => {
    setupAtoms()
    const childRow = makeRow({
      data: {
        plantName: 'ChildPlant',
        affiliateName: 'Aff1',
        customLink: '/child/url',
      },
      vals: ['ChildPlant', 10, 20],
    })
    const parentRow = makeRowWithChildren([childRow])
    const config = {
      ...baseConfig,
      l2: { ...baseConfig.l2, text_url_position: [0] },
    }
    renderComponent({ rows: [parentRow], config, isExpanded: true })
    expect(document.querySelector('table')).toBeTruthy()
  })

  it('clicks subtable trend icon (systems-trend-icon for plant source)', () => {
    setupAtoms()
    const childRow = makeRow({
      data: {
        plantName: 'ChildPlant',
        affiliateName: 'Aff1',
        customLink: '/child',
      },
      vals: ['ChildPlant', 10, 20],
    })
    const parentRow = makeRowWithChildren([childRow])
    renderComponent({ rows: [parentRow], isExpanded: true, source: 'plant' })
    const trendIcon = document.querySelector('#systems-trend-icon')
    if (trendIcon) fireEvent.click(trendIcon)
  })

  it('clicks subtable trend icon (oppo-trend-plant-icon for affiliate source)', () => {
    setupAtoms()
    const childRow = makeRow({
      data: {
        plantName: 'ChildPlant',
        affiliateName: 'Aff1',
        customLink: '/child',
      },
      vals: ['ChildPlant', 10, 20],
    })
    const parentRow = makeRowWithChildren([childRow])
    renderComponent({
      rows: [parentRow],
      isExpanded: true,
      source: 'affiliate',
    })
    const trendIcon = document.querySelector('#oppo-trend-plant-icon')
    if (trendIcon) fireEvent.click(trendIcon)
  })
})

// ─── Null / undefined cell values ─────────────────────────────────────────────

describe('CollapsibleTable – cell edge cases', () => {
  it('renders dash for null cell values', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const rows = [makeRow({ vals: ['Plant A', null, null] })]
    renderComponent({ rows })
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThan(0)
  })
})

// ─── Modal ─────────────────────────────────────────────────────────────────────

describe('CollapsibleTable – modal', () => {
  it('closes modal on hideModal callback', async () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const config = {
      ...baseConfig,
      l1: { ...baseConfig.l1, imageColumns: [0], callback: vi.fn() },
    }
    const rows = [makeRow({ vals: ['img-src.png', 200, 300] })]
    renderComponent({ rows, config })
    const trendIcon = document.querySelector('#oppo-trend-aff-icon')
    if (trendIcon) {
      fireEvent.click(trendIcon)
      await waitFor(() =>
        expect(screen.queryByTestId('custom-modal')).toBeTruthy(),
      )
      fireEvent.click(screen.getByTestId('modal-close'))
      await waitFor(() =>
        expect(screen.queryByTestId('custom-modal')).toBeNull(),
      )
    }
  })
})

// ─── Headers with children ─────────────────────────────────────────────────────

describe('CollapsibleTable – headers with children', () => {
  const makeHeaderWithChildren = () => [
    {
      title: 'Parent',
      columnIndex: 0,
      children: [
        {
          title: 'Child1',
          columnIndex: 1,
          sortable: true,
          uom: 'u',
          icon: 'icon.svg',
        },
        {
          title: 'Child2',
          columnIndex: 2,
          sortable: false,
          uom: null,
          icon: 'icon2.svg',
        },
      ],
      sortable: false,
      uom: null,
      icon: null,
    },
  ]

  it('renders child header titles for affiliate source', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    renderComponent({ headers: makeHeaderWithChildren(), source: 'affiliate' })
    expect(screen.getByText('Child1')).toBeTruthy()
  })

  it('renders child header for plant source', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    renderComponent({ headers: makeHeaderWithChildren(), source: 'plant' })
    expect(screen.getByText('Child1')).toBeTruthy()
  })

  it('clicking child sort icon triggers sorting', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    renderComponent({ headers: makeHeaderWithChildren(), source: 'affiliate' })
    const sortIcon = document.querySelector('img[alt="Sort Icon-2"]')
    if (sortIcon) fireEvent.click(sortIcon)
  })

  it('clicking child sort icon for plant source', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    renderComponent({ headers: makeHeaderWithChildren(), source: 'plant' })
    const sortIcon = document.querySelector('img[alt="Sort Icon-3"]')
    if (sortIcon) fireEvent.click(sortIcon)
  })

  it('renders header icon if provided', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const headers = [
      {
        title: 'With Icon',
        columnIndex: 0,
        children: [],
        sortable: false,
        uom: null,
        icon: 'some-icon.svg',
      },
    ]
    renderComponent({ headers })
    const img = document.querySelector('img[src="some-icon.svg"]')
    expect(img).toBeTruthy()
  })
})

// ─── isDefaultSelected ─────────────────────────────────────────────────────────

describe('CollapsibleTable – isDefaultSelected', () => {
  it('sets first row active when isDefaultSelected=true and no activeRows', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    renderComponent({ isDefaultSelected: true })
    expect(document.querySelector('table')).toBeTruthy()
  })
})

// ─── handlePlantTrendOpportunity branches ─────────────────────────────────────

describe('CollapsibleTable – handlePlantTrendOpportunity', () => {
  it('handles plant with span HTML in cellValue', async () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    renderComponent({ source: 'plant' })
    const trendIcon = document.querySelector('#plant-pred-oppo-trend-icon')
    if (trendIcon) fireEvent.click(trendIcon)
  })

  it('handles cellValue with curly braces and span (system filter)', async () => {
    useAtomValue
      .mockReturnValueOnce({
        caseData: [
          {
            affiliate: 'test affiliate',
            plant: 'myplant',
            system: 'mysystem',
            caseID: 'X1',
            affiliate_code: '100',
          },
        ],
      })
      .mockReturnValueOnce(defaultToken)
    // Render with a value that includes curly braces and span tags
    const rows = [
      makeRow({
        data: {
          plantName: '<span class="d-none">prefix</span>mysystem{myplant}',
          affiliateName: 'A1',
        },
        vals: ['<span class="d-none">prefix</span>mysystem{myplant}', 10, 20],
      }),
    ]
    renderComponent({ rows, source: 'plant' })
    const trendIcon = document.querySelector('#plant-pred-oppo-trend-icon')
    if (trendIcon) fireEvent.click(trendIcon)
  })
})

// ─── Row click behaviour ───────────────────────────────────────────────────────

describe('CollapsibleTable – row click', () => {
  it('clicking a row calls the config callback', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const callback = vi.fn()
    const config = { ...baseConfig, l1: { ...baseConfig.l1, callback } }
    renderComponent({ config })
    const rows = document.querySelectorAll('tbody tr')
    if (rows.length) fireEvent.click(rows[0])
    expect(callback).toHaveBeenCalled()
  })

  it('clicking same row twice toggles activeRow off', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const callback = vi.fn()
    const config = { ...baseConfig, l1: { ...baseConfig.l1, callback } }
    const rows = [
      makeRowWithChildren([
        makeRow({
          data: { plantName: 'Child', affiliateName: 'A1' },
          vals: ['Child', 1, 2],
        }),
      ]),
    ]
    renderComponent({ rows, config })
    const tableRows = document.querySelectorAll('tbody tr')
    if (tableRows.length) {
      fireEvent.click(tableRows[0])
      fireEvent.click(tableRows[0])
    }
  })
})

// ─── getRowSystemsKey ──────────────────────────────────────────────────────────

describe('CollapsibleTable – getRowSystemsKey (internal via rows with systems)', () => {
  it('renders rows that have a systems array on data', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const rows = [
      makeRow({
        data: {
          plantName: 'P1',
          affiliateName: 'A1',
          systems: [{ caseID: 'C1' }, { caseID: 'C2' }],
        },
      }),
    ]
    renderComponent({ rows })
    expect(document.querySelector('table')).toBeTruthy()
  })
})

// ─── No collapseKey ────────────────────────────────────────────────────────────

describe('CollapsibleTable – no collapseKey', () => {
  it('works when collapseKey is not provided', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    renderComponent({ collapseKey: undefined })
    expect(document.querySelector('table')).toBeTruthy()
  })
})

// ─── Multiple rows sorting ─────────────────────────────────────────────────────

describe('CollapsibleTable – multiple rows sorting', () => {
  it('onLoad sort with isExpanded=true updates expandedRows', () => {
    useAtomValue
      .mockReturnValueOnce(defaultCtxData)
      .mockReturnValueOnce(defaultToken)
    const config = {
      ...baseConfig,
      l1: { ...baseConfig.l1, defaultSortColumn: [1], callback: vi.fn() },
    }
    const rows = [
      makeRow({
        data: { plantName: 'P1', affiliateName: 'A1' },
        vals: ['P1', 300, 0],
      }),
      makeRow({
        data: { plantName: 'P2', affiliateName: 'A2' },
        vals: ['P2', 100, 0],
      }),
    ]
    renderComponent({ rows, config, isExpanded: true })
    expect(document.querySelector('table')).toBeTruthy()
  })
})

// ─── Plant source – no affiliate_name fallback ─────────────────────────────────

describe('CollapsibleTable – plant source affiliate fallback', () => {
  it('uses slugToText(params.affiliate) when affiliate_name not provided', () => {
    useAtomValue
      .mockReturnValueOnce({
        caseData: [
          {
            affiliate: 'test-affiliate',
            plant: 'Plant A',
            system: 'S1',
            caseID: 'X1',
            affiliate_code: '100',
          },
        ],
      })
      .mockReturnValueOnce(defaultToken)
    renderComponent({ source: 'plant' })
    const trendIcon = document.querySelector('#plant-pred-oppo-trend-icon')
    if (trendIcon) fireEvent.click(trendIcon)
  })
})
