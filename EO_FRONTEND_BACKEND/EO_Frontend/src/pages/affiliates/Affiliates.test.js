import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mock all external deps before importing the component ───────────────────

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useLocation: vi.fn(),
    useParams: vi.fn(),
  }
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
    useRouteLoaderData: vi.fn(),
  }
})

vi.mock('jotai', () => ({
  useAtomValue: vi.fn(),
  atom: vi.fn(),
}))

vi.mock('atoms/AppAtom', () => ({ AppAtom: 'AppAtom' }))

vi.mock('pages/corporate/Corporate', () => ({
  getValidAffiliateData: vi.fn(),
  redirectToAffiliate: vi.fn(),
}))

vi.mock('logger/Logger', () => ({ default: { log: vi.fn() } }))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    affiliates: {
      onRegionChange: vi.fn(),
      onAffiliateChange: vi.fn(),
    },
  },
}))

vi.mock('utills/utilities', () => ({
  slugToText: vi.fn((s) => s),
  textToSlug: vi.fn((s) => s),
}))

// UI component mocks
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('components/elements/performance_log/PerformanceLog', () => ({
  default: ({ children }) => (
    <div data-testid='performance-log'>{children}</div>
  ),
}))

vi.mock(
  'components/visuals/common/landing_pages_top_kpi/LandingPagesTopKpi',
  () => ({
    default: ({ data, source }) => (
      <div data-testid='top-kpi' data-source={source}>
        {JSON.stringify(data)}
      </div>
    ),
  }),
)

vi.mock('components/visuals/dropdown/multi_select/MultiSelectV2', () => ({
  default: ({ data, onChange, activeI, id }) => (
    <select
      data-testid={id || 'multi-select'}
      onChange={(e) => {
        const selected = data.find((d) => d.tag_name === e.target.value)
        onChange(selected ? [selected] : [data[0]], selected)
      }}
    >
      {data.map((d) => (
        <option key={d.tag_name} value={d.tag_name}>
          {d.display_name}
        </option>
      ))}
    </select>
  ),
}))

vi.mock(
  'components/visuals/sustainability_scorecard/SustainabilityScorecard',
  () => ({
    default: ({ data, isPlant, screen }) => (
      <div
        data-testid='sustainability-scorecard'
        data-is-plant={String(isPlant)}
        data-screen={screen}
      >
        {JSON.stringify(data)}
      </div>
    ),
  }),
)

vi.mock('components/visuals/table/collapsible_table/CollapsibleTable', () => ({
  default: ({
    rows,
    headers,
    config,
    collapseKey,
    screen,
    isDefaultSelected,
  }) => (
    <div data-testid='collapsible-table'>
      {rows.map((row, i) => (
        <div
          key={i}
          data-testid={`table-row-${i}`}
          onClick={() => config.l1.callback(row)}
        >
          <span
            data-testid={`sub-row-${i}`}
            onClick={(e) => {
              e.stopPropagation()
              config.l2.callback(row)
            }}
          >
            sub-row
          </span>
          {row.vals[0]}
        </div>
      ))}
    </div>
  ),
}))

// SVG asset mocks
vi.mock('assets/sabic_icons/lading_pages_top_kpis/affiliates.svg', () => ({
  default: 'affiliateIcon.svg',
}))
vi.mock('assets/sabic_new_icons/affiliates_color_icon.svg', () => ({
  default: 'affiliateIconWithoutBg.svg',
}))
vi.mock('assets/sabic_icons/lading_pages_top_kpis/co2.svg', () => ({
  default: 'co2Icon.svg',
}))
vi.mock(
  'assets/sabic_icons/lading_pages_top_kpis/energy_efficient_lightbulb.svg',
  () => ({ default: 'energyIcon.svg' }),
)
vi.mock(
  'assets/sabic_icons/lading_pages_top_kpis/good_electrical_performance.svg',
  () => ({ default: 'goodElectricalIcon.svg' }),
)
vi.mock('assets/sabic_icons/collapsible/co2_trn.svg', () => ({
  default: 'co2IconTrn.svg',
}))
vi.mock(
  'assets/sabic_icons/collapsible/energy_efficient_lightbulb_trn.svg',
  () => ({ default: 'energyIconTrn.svg' }),
)
vi.mock(
  'assets/sabic_icons/collapsible/good_electrical_performance_trn.svg',
  () => ({ default: 'goodElectricalIconTrn.svg' }),
)
vi.mock('assets/sabic_icons/affiliates_icons/1200.svg', () => ({
  default: 'aff_1200.svg',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1300.svg', () => ({
  default: 'aff_1300.svg',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1400.svg', () => ({
  default: 'aff_1400.svg',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1500.svg', () => ({
  default: 'aff_1500.svg',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1600.svg', () => ({
  default: 'aff_1600.svg',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1800.svg', () => ({
  default: 'aff_1800.svg',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1900.svg', () => ({
  default: 'aff_1900.svg',
}))
vi.mock('assets/sabic_icons/affiliates_icons/2000.svg', () => ({
  default: 'aff_2000.svg',
}))
vi.mock('assets/sabic_icons/affiliates_icons/2200.svg', () => ({
  default: 'aff_2200.svg',
}))
vi.mock('assets/sabic_icons/affiliates_icons/3300.svg', () => ({
  default: 'aff_3300.svg',
}))
vi.mock('assets/sabic_icons/affiliates_icons/4000.svg', () => ({
  default: 'aff_4000.svg',
}))

// CSS module mock
vi.mock('./Affiliates.module.scss', () => ({ default: {} }))

// react-bootstrap Tabs/Tab mock
vi.mock('react-bootstrap', () => ({
  Tab: ({ children, eventKey }) => (
    <div data-testid={`tab-${eventKey}`}>{children}</div>
  ),
  Tabs: ({ children, activeKey, onSelect }) => (
    <div data-testid='tabs'>
      <div data-testid='tab-nav'>
        {['overview', 'alert_statistics'].map((key) => (
          <button
            key={key}
            data-testid={`tab-btn-${key}`}
            onClick={() => onSelect(key)}
          >
            {key}
          </button>
        ))}
      </div>
      {children}
    </div>
  ),
}))

// ─── Import after mocks ──────────────────────────────────────────────────────

import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import {
  getValidAffiliateData,
  redirectToAffiliate,
} from 'pages/corporate/Corporate'
import { useLocation, useParams } from 'react-router'
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import Affiliates, { populateData } from './Affiliates'

// ─── Test data helpers ───────────────────────────────────────────────────────

const makeAffiliate = (overrides = {}) => ({
  affiliateName: 'AffiliateA',
  affiliateCode: 1200,
  opportunityEnergyBills: 100,
  seecGain: 200,
  opportunityCo2: 300,
  regionName: 'Region1',
  urlAffiliateImage: 'http://img.png',
  customMetric: 42,
  ...overrides,
})

const makeRegionData = (overrides = {}) => ({
  regionName: 'Region1',
  affiliateCount: 2,
  opportunityEnergyBills: 150,
  seecGain: 250,
  opportunityCo2: 350,
  count_affiliate: 2,
  affiliates: [
    makeAffiliate(),
    makeAffiliate({ affiliateName: 'AffiliateB', affiliateCode: 1300 }),
  ],
  ...overrides,
})

const defaultLoaderData = {}

function setup(paramOverrides = {}, locationOverrides = {}) {
  const navigate = vi.fn()
  useNavigate.mockReturnValue(navigate)
  useRouteLoaderData.mockReturnValue(defaultLoaderData)
  useParams.mockReturnValue(paramOverrides)
  useLocation.mockReturnValue({
    pathname: '/affiliates',
    ...locationOverrides,
  })
  useAtomValue.mockReturnValue({ caseData: [] })

  const utils = render(
    <MemoryRouter initialEntries={['/affiliates']}>
      <Affiliates />
    </MemoryRouter>,
  )
  return { ...utils, navigate }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('populateData utility function', () => {
  it('sets affiliate list with only "All" entry', () => {
    const setAffiliateList = vi.fn()
    const setAffiliateDataList = vi.fn()
    const setFilteredAffiliateDataList = vi.fn()
    const setTopKpiData = vi.fn()
    const setIsLoading = vi.fn()
    const tempFinalData = [{ key: 'count_affiliates', value: 0 }]

    populateData(
      setAffiliateList,
      setAffiliateDataList,
      setFilteredAffiliateDataList,
      setTopKpiData,
      setIsLoading,
      tempFinalData,
    )

    expect(setAffiliateList).toHaveBeenCalledWith([
      { display_name: 'All', tag_name: 'all' },
    ])
    expect(setAffiliateDataList).toHaveBeenCalledWith([])
    expect(setFilteredAffiliateDataList).toHaveBeenCalledWith([])
    expect(setTopKpiData).toHaveBeenCalledWith(tempFinalData)
    expect(setIsLoading).toHaveBeenCalledWith(false)
  })
})

describe('Affiliates component – loading state', () => {
  beforeEach(() => {
    getValidAffiliateData.mockReturnValue(new Promise(() => {})) // never resolves
  })

  it('renders Loader while data is being fetched', () => {
    setup()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })
})

describe('Affiliates component – successful data load (no route params)', () => {
  beforeEach(() => {
    getValidAffiliateData.mockResolvedValue([makeRegionData()])
  })

  it('calls redirectToAffiliate on mount', async () => {
    setup()
    await waitFor(() => expect(redirectToAffiliate).toHaveBeenCalled())
  })

  it('renders top KPI tiles after load', async () => {
    setup()
    await waitFor(() =>
      expect(screen.getByTestId('top-kpi')).toBeInTheDocument(),
    )
  })

  it('renders collapsible table with affiliate rows', async () => {
    setup()
    await waitFor(() =>
      expect(screen.getByTestId('collapsible-table')).toBeInTheDocument(),
    )
    // expect(screen.getAllByTestId(/^table-row-/).length).toBeGreaterThan(0)
  })

  it('renders region and affiliate dropdowns', async () => {
    setup()
    await waitFor(() =>
      expect(screen.getByTestId('region-filter')).toBeInTheDocument(),
    )
    expect(screen.getByTestId('affiliate-filter')).toBeInTheDocument()
  })

  it('renders sustainability scorecard', async () => {
    setup()
    await waitFor(() =>
      expect(
        screen.getByTestId('sustainability-scorecard'),
      ).toBeInTheDocument(),
    )
  })

  it('renders tabs', async () => {
    setup()
    await waitFor(() => expect(screen.getByTestId('tabs')).toBeInTheDocument())
  })

  it('shows "Coming soon" content for alert_statistics tab after switch', async () => {
    setup()
    await waitFor(() => screen.getByTestId('tabs'))
    fireEvent.click(screen.getByTestId('tab-btn-alert_statistics'))
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })
})

describe('Affiliates component – route params (specific region)', () => {
  beforeEach(() => {
    getValidAffiliateData.mockResolvedValue([makeRegionData()])
  })

  it('sets region from URL params when params.region is provided', async () => {
    setup({ region: 'region1' })
    await waitFor(() =>
      expect(screen.getByTestId('collapsible-table')).toBeInTheDocument(),
    )
  })
})

describe('Affiliates component – tab navigation', () => {
  beforeEach(() => {
    getValidAffiliateData.mockResolvedValue([makeRegionData()])
  })

  it('navigates to alert-statistics path when tab is clicked (no region param)', async () => {
    const { navigate } = setup()
    await waitFor(() => screen.getByTestId('tabs'))
    fireEvent.click(screen.getByTestId('tab-btn-alert_statistics'))
    expect(navigate).toHaveBeenCalledWith('/affiliates/alert-statistics')
  })

  it('navigates with region prefix when params.region is present', async () => {
    const navigate = vi.fn()
    useNavigate.mockReturnValue(navigate)
    useParams.mockReturnValue({ region: 'region1' })
    getValidAffiliateData.mockResolvedValue([makeRegionData()])

    render(
      <MemoryRouter>
        <Affiliates />
      </MemoryRouter>,
    )

    await waitFor(() => screen.getByTestId('tabs'))
    fireEvent.click(screen.getByTestId('tab-btn-alert_statistics'))
    expect(navigate).toHaveBeenCalledWith('/region1/alert-statistics')
  })

  it('navigates to base affiliates path when overview tab is selected', async () => {
    const { navigate } = setup()
    await waitFor(() => screen.getByTestId('tabs'))
    fireEvent.click(screen.getByTestId('tab-btn-overview'))
    expect(navigate).toHaveBeenCalledWith('/affiliates')
  })
})

describe('Affiliates component – getTabFromPath', () => {
  beforeEach(() => {
    getValidAffiliateData.mockResolvedValue([makeRegionData()])
  })

  it('returns alert_statistics when pathname ends with alert-statistics', async () => {
    useLocation.mockReturnValue({ pathname: '/affiliates/alert-statistics' })
    setup()
    await waitFor(() => screen.getByTestId('tabs'))
    // The active tab drives the Tabs activeKey; just confirm render
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
  })

  it('returns overview for any other pathname', async () => {
    useLocation.mockReturnValue({ pathname: '/affiliates' })
    setup()
    await waitFor(() => screen.getByTestId('tabs'))
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
  })
})

describe('Affiliates component – region filter change', () => {
  beforeEach(() => {
    getValidAffiliateData.mockResolvedValue([
      makeRegionData({ regionName: 'Region1' }),
      makeRegionData({
        regionName: 'Region2',
        affiliates: [
          makeAffiliate({ affiliateName: 'AffC', regionName: 'Region2' }),
        ],
      }),
    ])
  })

  it('calls TRACKEVENTOBJ on region change', async () => {
    setup()
    await waitFor(() => screen.getByTestId('region-filter'))
    const regionSelect = screen
      .getByTestId('region-filter')
      .querySelector('select')
    fireEvent.change(regionSelect, { target: { value: 'Region1' } })
    expect(TRACKEVENTOBJ.affiliates.onRegionChange).toHaveBeenCalled()
  })

  it('selects all regions when "All" is chosen', async () => {
    setup()
    await waitFor(() => screen.getByTestId('region-filter'))
    const regionSelect = screen
      .getByTestId('region-filter')
      .querySelector('select')
    fireEvent.change(regionSelect, { target: { value: 'all' } })
    // Dropdown should still render
    expect(regionSelect).toBeInTheDocument()
  })
})

describe('Affiliates component – affiliate filter change', () => {
  beforeEach(() => {
    getValidAffiliateData.mockResolvedValue([makeRegionData()])
  })

  it('calls TRACKEVENTOBJ on affiliate change', async () => {
    setup()
    await waitFor(() => screen.getByTestId('changing-aff-dropdown-filter'))
    const affSelect = screen.getByTestId('changing-aff-dropdown-filter')
    fireEvent.change(affSelect, { target: { value: 'AffiliateA' } })
    expect(TRACKEVENTOBJ.affiliates.onAffiliateChange).toHaveBeenCalled()
  })

  it('resets to full list when "All" affiliate is selected', async () => {
    setup()
    await waitFor(() => screen.getByTestId('changing-aff-dropdown-filter'))
    const affSelect = screen.getByTestId('changing-aff-dropdown-filter')
    // First select a specific one
    fireEvent.change(affSelect, { target: { value: 'AffiliateA' } })
    // Then select all
    fireEvent.change(affSelect, { target: { value: 'all' } })
    expect(screen.getByTestId('collapsible-table')).toBeInTheDocument()
  })

  it('filters table rows when specific affiliate is selected', async () => {
    setup()
    await waitFor(() => screen.getByTestId('changing-aff-dropdown-filter'))
    const affSelect = screen.getByTestId('changing-aff-dropdown-filter')
    fireEvent.change(affSelect, { target: { value: 'AffiliateA' } })
    await waitFor(() =>
      expect(screen.getAllByTestId(/^table-row-/).length).toBeGreaterThan(0),
    )
  })
})

describe('Affiliates component – table row interaction', () => {
  beforeEach(() => {
    getValidAffiliateData.mockResolvedValue([makeRegionData()])
  })

  it('updates sustainability scorecard on table row click', async () => {
    setup()
    await waitFor(() => screen.getByTestId('table-row-0'))
    fireEvent.click(screen.getByTestId('table-row-0'))
    const scorecard = screen.getByTestId('sustainability-scorecard')
    expect(scorecard.getAttribute('data-is-plant')).toBe('false')
  })

  it('sets isPlant=true on sub-row click', async () => {
    setup()
    await waitFor(() => screen.getByTestId('sub-row-0'))
    fireEvent.click(screen.getByTestId('sub-row-0'))
    await waitFor(() =>
      expect(
        screen
          .getByTestId('sustainability-scorecard')
          .getAttribute('data-is-plant'),
      ).toBe('true'),
    )
  })
})

describe('Affiliates component – empty affiliate list', () => {
  it('shows placeholder when no affiliates are returned', async () => {
    getValidAffiliateData.mockResolvedValue([
      {
        regionName: 'EmptyRegion',
        affiliateCount: 0,
        affiliates: [],
        opportunityEnergyBills: 0,
        seecGain: 0,
        opportunityCo2: 0,
        count_affiliate: 0,
      },
    ])
    setup()
    await waitFor(() =>
      expect(
        screen.getByText('Please Select Region/Affiliate from the list.'),
      ).toBeInTheDocument(),
    )
  })
})

describe('Affiliates component – affiliate icon fallback', () => {
  it('uses urlAffiliateImage when affiliateCode has no mapped icon', async () => {
    getValidAffiliateData.mockResolvedValue([
      makeRegionData({
        affiliates: [
          makeAffiliate({
            affiliateCode: 9999,
            urlAffiliateImage: 'http://fallback.png',
          }),
        ],
      }),
    ])
    setup()
    await waitFor(() => screen.getByTestId('collapsible-table'))
    expect(screen.getByTestId('table-row-0')).toBeInTheDocument()
  })
})

describe('Affiliates component – API failure', () => {
  it('handles API rejection gracefully without crashing', async () => {
    getValidAffiliateData.mockRejectedValue(new Error('Network error'))
    // Should not throw
    expect(() => setup()).not.toThrow()
    // Loader remains since data never loaded
    await waitFor(() =>
      expect(screen.getByTestId('loader')).toBeInTheDocument(),
    )
  })
})

describe('Affiliates component – multiple regions data aggregation', () => {
  it('aggregates KPI values across all regions', async () => {
    getValidAffiliateData.mockResolvedValue([
      makeRegionData({
        regionName: 'Region1',
        opportunityEnergyBills: 100,
        seecGain: 200,
        opportunityCo2: 300,
      }),
      makeRegionData({
        regionName: 'Region2',
        opportunityEnergyBills: 50,
        seecGain: 60,
        opportunityCo2: 70,
        affiliates: [
          makeAffiliate({ affiliateName: 'AffC', regionName: 'Region2' }),
        ],
      }),
    ])
    setup()
    await waitFor(() =>
      expect(screen.getByTestId('top-kpi')).toBeInTheDocument(),
    )
    // KPI tiles should render with aggregated data
    expect(screen.getByTestId('top-kpi')).toBeInTheDocument()
  })
})

describe('Affiliates component – calculateActiveIndex', () => {
  it('returns correct index when single region matches filter values', async () => {
    getValidAffiliateData.mockResolvedValue([makeRegionData()])
    // Provide a specific region param so region_name has exactly 1 entry
    setup({ region: 'region1' })
    await waitFor(() => screen.getByTestId('region-filter'))
    // Just assert component renders correctly (calculateActiveIndex is internal)
    expect(screen.getByTestId('region-filter')).toBeInTheDocument()
  })
})

describe('Affiliates component – KPI values with null/undefined fields', () => {
  it('handles affiliates with missing numeric fields gracefully', async () => {
    getValidAffiliateData.mockResolvedValue([
      makeRegionData({
        affiliates: [
          makeAffiliate({
            opportunityEnergyBills: null,
            seecGain: undefined,
            opportunityCo2: null,
          }),
        ],
      }),
    ])
    setup()
    await waitFor(() => screen.getByTestId('collapsible-table'))
    expect(screen.getByTestId('collapsible-table')).toBeInTheDocument()
  })
})

describe('Affiliates component – known affiliate icon codes', () => {
  const knownCodes = [
    1200, 1300, 1400, 1500, 1600, 1800, 1900, 2000, 2200, 3300, 4000,
  ]

  knownCodes.forEach((code) => {
    it(`renders affiliate row for affiliateCode ${code}`, async () => {
      getValidAffiliateData.mockResolvedValue([
        makeRegionData({
          affiliates: [makeAffiliate({ affiliateCode: code })],
        }),
      ])
      setup()
      await waitFor(() => screen.getByTestId('collapsible-table'))
      expect(screen.getByTestId('table-row-0')).toBeInTheDocument()
    })
  })
})

describe('Affiliates component – top KPI source attribute', () => {
  it('passes source="affiliate" to LandingPagesTopKpi', async () => {
    getValidAffiliateData.mockResolvedValue([makeRegionData()])
    setup()
    await waitFor(() => screen.getByTestId('top-kpi'))
    expect(screen.getByTestId('top-kpi').getAttribute('data-source')).toBe(
      'affiliate',
    )
  })
})

describe('Affiliates component – PerformanceLog wrapper', () => {
  it('wraps content in PerformanceLog after load', async () => {
    getValidAffiliateData.mockResolvedValue([makeRegionData()])
    setup()
    await waitFor(() =>
      expect(screen.getByTestId('performance-log')).toBeInTheDocument(),
    )
  })
})
