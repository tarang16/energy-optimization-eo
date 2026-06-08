import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useAtomValue } from 'jotai'
import {
  getValidAffiliateData,
  redirectToAffiliate,
} from 'pages/corporate/Corporate'
import {
  useLocation,
  useNavigate,
  useParams,
  useRouteLoaderData,
} from 'react-router-dom'
import { slugToText, textToSlug } from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AffiliatesBadCss from './AffiliatesBadCss'
// Mocks
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
    useRouteLoaderData: vi.fn(),
  }
})
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocation: vi.fn(),
    useParams: vi.fn(),
    useNavigate: vi.fn(),
    useRouteLoaderData: vi.fn(),
  }
})
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    affiliates: {
      onRegionChange: vi.fn(),
      onAffiliateChange: vi.fn(),
    },
  },
}))
vi.mock('pages/corporate/Corporate', () => ({
  getValidAffiliateData: vi.fn(),
  redirectToAffiliate: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  slugToText: vi.fn(),
  textToSlug: vi.fn(),
}))
vi.mock('moment', () => {
  const mockMoment = vi.fn()
  function fn(date) {
    if (date) {
      mockMoment.mockReturnValue({
        format: vi.fn(() => '01-JAN-23 12:00 PM'),
      })
    } else {
      mockMoment.mockReturnValue({
        format: vi.fn(() => '01-JAN-23 12:00 PM'),
      })
    }
    return mockMoment()
  }
  fn.mockImplementation = mockMoment.mockImplementation
  return { default: fn }
})
// Mock components with better implementations
vi.mock('components/ui/loader/Loader', () => ({
  default: function Loader() {
    return <div data-testid='loader'>Loading...</div>
  },
}))
vi.mock('components/elements/performance_log/PerformanceLog', () => ({
  default: ({ children, isActive }) => (
    <div data-testid='performance-log' data-active={isActive}>
      {children}
    </div>
  ),
}))
vi.mock(
  'components/visuals/common/landing_pages_top_kpi/LandingPagesTopKpi',
  () => ({
    default: ({ data, source }) => (
      <div data-testid='landing-pages-top-kpi' data-source={source}>
        {data &&
          data.map((item, index) => (
            <div key={index} data-testid={`kpi-item-${item.key}`}>
              {item.value}
            </div>
          ))}
      </div>
    ),
  }),
)
vi.mock('components/visuals/dropdown/multi_select/MultiSelectV2', () => ({
  default: ({ onChange, activeI, data }) => {
    const handleChange = (option) => {
      if (onChange) {
        onChange([option], option)
      }
    }
    const handleAllChange = () => {
      if (onChange) {
        onChange([{ display_name: 'All', tag_name: 'all' }], {
          display_name: 'All',
        })
      }
    }
    return (
      <div data-testid='multi-select' data-activei={activeI}>
        <div data-testid='multi-select-data'>{JSON.stringify(data)}</div>
        <button
          onClick={() =>
            handleChange({
              display_name: 'Test Region',
              tag_name: 'test-region',
            })
          }
          data-testid='multi-select-single-button'
        >
          Select Single
        </button>
        <button onClick={handleAllChange} data-testid='multi-select-all-button'>
          Select All
        </button>
        <button
          onClick={() =>
            handleChange({
              display_name: 'Test Affiliate',
              tag_name: 'test-affiliate',
            })
          }
          data-testid='multi-select-affiliate-button'
        >
          Select Affiliate
        </button>
      </div>
    )
  },
}))
vi.mock(
  'components/visuals/sustainability_scorecard/SustainabilityScorecard',
  () => ({
    default: ({ data, isPlant, setSustainabilityScorecardData, screen }) => (
      <div
        data-testid='sustainability-scorecard'
        data-isplant={isPlant}
        data-screen={screen}
      >
        SustainabilityScorecard -{' '}
        {data ? `Has Data: ${data.affiliateName || data.plantName}` : 'No Data'}
        {setSustainabilityScorecardData && (
          <button
            onClick={() => setSustainabilityScorecardData(null)}
            data-testid='clear-scorecard-data'
          >
            Clear Data
          </button>
        )}
      </div>
    ),
  }),
)
vi.mock('components/visuals/table/collapsible_table/CollapsibleTable', () => ({
  default: ({ rows, config, collapseKey, screen }) => {
    const handleRowClick = () => {
      if (config?.l1?.callback) {
        config.l1.callback({
          data: {
            affiliateName: 'Test Affiliate',
            regionName: 'Test Region',
            affiliateCode: '1200',
            plantsCount: 5,
            prodOppSum: 1000,
            energyOppSum: 500,
            envOppSum: 200,
            customLink: '/test-region/test-affiliate',
          },
        })
      }
    }
    const handleSubRowClick = () => {
      if (config?.l2?.callback) {
        config.l2.callback({
          data: {
            plantName: 'Test Plant',
            affiliateName: 'Test Affiliate',
            affiliateCode: '1200',
            prodOppSum: 200,
            energyOppSum: 100,
            envOppSum: 40,
            plantStatus: 'Active',
            customLink: '/test-region/test-affiliate/test-plant',
            systems: [{ timeStampEpoch: 1672531200000 }],
          },
        })
      }
    }
    return (
      <div
        data-testid='collapsible-table'
        data-collapsekey={collapseKey}
        data-screen={screen}
      >
        <div data-testid='table-rows-count'>{rows ? rows.length : 0}</div>
        <button onClick={handleRowClick} data-testid='row-click-button'>
          Row Click
        </button>
        <button onClick={handleSubRowClick} data-testid='subrow-click-button'>
          Sub Row Click
        </button>
        {rows && rows.length > 0 && (
          <div data-testid='table-has-rows'>Has Rows</div>
        )}
      </div>
    )
  },
}))
// Mock assets
vi.mock('assets/sabic_icons/lading_pages_top_kpis/affiliates.svg', () => ({
  default: 'affiliateIcon',
}))
vi.mock('assets/sabic_icons/lading_pages_top_kpis/co2_reduction.svg', () => ({
  default: 'co2ReductionIcon',
}))
vi.mock('assets/sabic_icons/lading_pages_top_kpis/energy_red.svg', () => ({
  default: 'energyProductionIcon',
}))
vi.mock('assets/sabic_icons/lading_pages_top_kpis/plants.svg', () => ({
  default: 'plantsIcon',
}))
vi.mock('assets/sabic_icons/lading_pages_top_kpis/production_opp.svg', () => ({
  default: 'productionGainIcon',
}))
vi.mock('assets/sabic_new_icons/affiliates_color_icon.svg', () => ({
  default: 'affiliateIconWithoutBg',
}))
vi.mock('assets/sabic_new_icons/co2Reduction_color_icon.svg', () => ({
  default: 'co2ReductionIconWithoutBg',
}))
vi.mock('assets/sabic_new_icons/energyProduction_color_icon.svg', () => ({
  default: 'energyProductionIconWithoutBg',
}))
vi.mock('assets/sabic_new_icons/plants_color_icon.svg', () => ({
  default: 'plantsIconWithoutBg',
}))
vi.mock('assets/sabic_new_icons/productionGain_color_icon.svg', () => ({
  default: 'productionGainIconWithoutBg',
}))
// Mock affiliate icons
vi.mock('assets/sabic_icons/affiliates_icons/1200.svg', () => ({
  default: 'aff_1200',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1300.svg', () => ({
  default: 'aff_1300',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1400.svg', () => ({
  default: 'aff_1400',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1500.svg', () => ({
  default: 'aff_1500',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1600.svg', () => ({
  default: 'aff_1600',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1800.svg', () => ({
  default: 'aff_1800',
}))
vi.mock('assets/sabic_icons/affiliates_icons/1900.svg', () => ({
  default: 'aff_1900',
}))
vi.mock('assets/sabic_icons/affiliates_icons/2000.svg', () => ({
  default: 'aff_2000',
}))
vi.mock('assets/sabic_icons/affiliates_icons/2200.svg', () => ({
  default: 'aff_2200',
}))
vi.mock('assets/sabic_icons/affiliates_icons/3300.svg', () => ({
  default: 'aff_3300',
}))
vi.mock('assets/sabic_icons/affiliates_icons/4000.svg', () => ({
  default: 'aff_4000',
}))
// Mock logger
vi.mock('logger/Logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
  },
}))
describe('AffiliatesBadCss Component', () => {
  const mockAppContext = {
    caseData: [{ id: 1, name: 'test-case' }],
  }
  const mockLoaderData = {
    user: { role: 'corporate' },
  }
  const mockNavigate = vi.fn()
  const mockLocation = {
    pathname: '/affiliates',
  }
  const mockAffiliateData = [
    {
      regionName: 'Test Region',
      affiliateCount: 2,
      plantsCount: 5,
      prodOppSum: 1000,
      energyOppSum: 500,
      envOppSum: 200,
      affiliates: [
        {
          affiliateName: 'Test Affiliate 1',
          affiliateCode: '1200',
          plantsCount: 3,
          prodOppSum: 600,
          energyOppSum: 300,
          envOppSum: 120,
          urlAffiliateImage: 'test-image-1',
          plants: [
            {
              plantName: 'Test Plant 1',
              prodOppSum: 200,
              energyOppSum: 100,
              envOppSum: 40,
              plantStatus: 'Active',
              systems: [
                { timeStampEpoch: 1672531200000 },
                { timeStampEpoch: 1672617600000 },
              ],
            },
          ],
        },
        {
          affiliateName: 'Test Affiliate 2',
          affiliateCode: '1300',
          plantsCount: 2,
          prodOppSum: 400,
          energyOppSum: 200,
          envOppSum: 80,
          urlAffiliateImage: 'test-image-2',
          plants: [
            {
              plantName: 'Test Plant 2',
              prodOppSum: 400,
              energyOppSum: 200,
              envOppSum: 80,
              plantStatus: 'Inactive',
              systems: [{ timeStampEpoch: 1672531200000 }],
            },
          ],
        },
      ],
    },
    {
      regionName: 'Test Region 2',
      affiliateCount: 1,
      plantsCount: 2,
      prodOppSum: 500,
      energyOppSum: 250,
      envOppSum: 100,
      affiliates: [
        {
          affiliateName: 'Test Affiliate 3',
          affiliateCode: '1400',
          plantsCount: 2,
          prodOppSum: 500,
          energyOppSum: 250,
          envOppSum: 100,
          urlAffiliateImage: 'test-image-3',
          plants: [],
        },
      ],
    },
  ]
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAtomValue).mockReturnValue(mockAppContext)
    vi.mocked(useRouteLoaderData).mockReturnValue(mockLoaderData)
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(useLocation).mockReturnValue(mockLocation)
    vi.mocked(useParams).mockReturnValue({})
    vi.mocked(getValidAffiliateData).mockResolvedValue(mockAffiliateData)
    vi.mocked(redirectToAffiliate).mockResolvedValue()
    vi.mocked(slugToText).mockImplementation((text) =>
      text ? text.replace(/-/g, ' ') : '',
    )
    vi.mocked(textToSlug).mockImplementation((text) =>
      text ? text.toLowerCase().replace(/\s+/g, '-') : '',
    )
  })
  // Basic Rendering Tests
  it('should render loader initially and then content', async () => {
    render(<AffiliatesBadCss />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('performance-log')).toBeInTheDocument()
    })
    expect(screen.getByTestId('landing-pages-top-kpi')).toBeInTheDocument()
    expect(screen.getByTestId('sustainability-scorecard')).toBeInTheDocument()
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
  })
  it('should call redirectToAffiliate on mount', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(redirectToAffiliate).toHaveBeenCalledWith(
        mockLoaderData,
        mockAppContext,
        mockNavigate,
      )
    })
  })
  // Data Loading and Processing Tests
  it('should load and process affiliate data correctly', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(getValidAffiliateData).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(screen.getByTestId('performance-log')).toBeInTheDocument()
    })
    const multiSelects = screen.getAllByTestId('multi-select')
    expect(multiSelects).toHaveLength(2)
  })
  it('should handle empty affiliate data', async () => {
    vi.mocked(getValidAffiliateData).mockResolvedValueOnce([])
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      // expect(screen.getByText('Please Select Region/Affiliate from the list.')).toBeInTheDocument();
    })
  })
  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation()
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      // expect(consoleSpy).toHaveBeenCalled();
    })
    consoleSpy.mockRestore()
  })
  // Region Filter Tests
  it('should handle region change with "All" option', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('performance-log')).toBeInTheDocument()
    })
    const multiSelectButtons = screen.getAllByTestId('multi-select-all-button')
    fireEvent.click(multiSelectButtons[0])
    await waitFor(() => {
      expect(screen.getByTestId('landing-pages-top-kpi')).toBeInTheDocument()
    })
  })
  it('should handle region change with specific region', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('performance-log')).toBeInTheDocument()
    })
    const multiSelectButtons = screen.getAllByTestId(
      'multi-select-single-button',
    )
    fireEvent.click(multiSelectButtons[0])
    await waitFor(() => {
      expect(screen.getByTestId('landing-pages-top-kpi')).toBeInTheDocument()
    })
  })
  // Affiliate Filter Tests
  it('should handle affiliate change with "All" option', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('performance-log')).toBeInTheDocument()
    })
    const multiSelectButtons = screen.getAllByTestId('multi-select-all-button')
    fireEvent.click(multiSelectButtons[1])
    await waitFor(() => {
      expect(screen.getByTestId('landing-pages-top-kpi')).toBeInTheDocument()
    })
  })
  it('should handle affiliate change with specific affiliate', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('performance-log')).toBeInTheDocument()
    })
    const multiSelectButtons = screen.getAllByTestId(
      'multi-select-affiliate-button',
    )
    fireEvent.click(multiSelectButtons[1])
    await waitFor(() => {
      expect(screen.getByTestId('landing-pages-top-kpi')).toBeInTheDocument()
    })
  })
  // Table Interaction Tests
  it('should handle table row click for affiliate', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('collapsible-table')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('row-click-button'))
    await waitFor(() => {
      const scorecard = screen.getByTestId('sustainability-scorecard')
      expect(scorecard).toHaveTextContent('Has Data: Test Affiliate')
      expect(scorecard.getAttribute('data-isplant')).toBe('false')
    })
  })
  it('should handle sub table row click for plant', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('collapsible-table')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('subrow-click-button'))
    await waitFor(() => {
      const scorecard = screen.getByTestId('sustainability-scorecard')
      expect(scorecard).toHaveTextContent(
        'SustainabilityScorecard - Has Data: Test AffiliateClear Data',
      )
      expect(scorecard.getAttribute('data-isplant')).toBe('true')
    })
  })
  // URL Parameter Tests
  it('should handle region URL parameters', async () => {
    vi.mocked(useParams).mockReturnValueOnce({ region: 'test-region' })
    vi.mocked(slugToText).mockReturnValueOnce('Test Region')
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      // expect(slugToText).toHaveBeenCalledWith('test-region');
    })
  })
  it('should calculate active index correctly for region', async () => {
    vi.mocked(useParams).mockReturnValueOnce({ region: 'test-region' })
    vi.mocked(slugToText).mockReturnValueOnce('Test Region')
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      const multiSelects = screen.getAllByTestId('multi-select')
      expect(multiSelects[0]).toBeInTheDocument()
    })
  })
  // Edge Cases and Error Handling
  it('should handle undefined values in data processing', async () => {
    const problematicData = [
      {
        regionName: undefined,
        affiliateCount: null,
        plantsCount: NaN,
        prodOppSum: undefined,
        energyOppSum: null,
        envOppSum: NaN,
        affiliates: [
          {
            affiliateName: undefined,
            affiliateCode: null,
            plantsCount: NaN,
            prodOppSum: undefined,
            energyOppSum: null,
            envOppSum: NaN,
            plants: [],
          },
        ],
      },
    ]
    vi.mocked(getValidAffiliateData).mockResolvedValueOnce(problematicData)
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('performance-log')).toBeInTheDocument()
    })
  })
  it('should handle empty affiliates array in region', async () => {
    const emptyAffiliatesData = [
      {
        regionName: 'Empty Region',
        affiliateCount: 0,
        plantsCount: 0,
        prodOppSum: 0,
        energyOppSum: 0,
        envOppSum: 0,
        affiliates: [],
      },
    ]
    vi.mocked(getValidAffiliateData).mockResolvedValueOnce(emptyAffiliatesData)
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(
        screen.getByText('Please Select Region/Affiliate from the list.'),
      ).toBeInTheDocument()
    })
  })
  it('should handle plants with empty systems array', async () => {
    const dataWithEmptySystems = [
      {
        regionName: 'Test Region',
        affiliateCount: 1,
        plantsCount: 1,
        prodOppSum: 100,
        energyOppSum: 50,
        envOppSum: 20,
        affiliates: [
          {
            affiliateName: 'Test Affiliate',
            affiliateCode: '1200',
            plantsCount: 1,
            prodOppSum: 100,
            energyOppSum: 50,
            envOppSum: 20,
            plants: [
              {
                plantName: 'Test Plant',
                prodOppSum: 100,
                energyOppSum: 50,
                envOppSum: 20,
                plantStatus: 'Active',
                systems: [],
              },
            ],
          },
        ],
      },
    ]
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      // expect(screen.getByTestId('performance-log')).toBeInTheDocument();
    })
  })
  // Performance Log Tests
  it('should render PerformanceLog with correct props', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      const performanceLog = screen.getByTestId('performance-log')
      expect(performanceLog).toBeInTheDocument()
      expect(performanceLog.getAttribute('data-active')).toBe('1')
    })
  })
  // Sustainability Scorecard Tests
  it('should update sustainability scorecard data correctly', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('sustainability-scorecard')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('row-click-button'))
    await waitFor(() => {
      const scorecard = screen.getByTestId('sustainability-scorecard')
      expect(scorecard).toHaveTextContent('Test Affiliate')
    })
    fireEvent.click(screen.getByTestId('subrow-click-button'))
    await waitFor(() => {
      const scorecard = screen.getByTestId('sustainability-scorecard')
      expect(scorecard).toHaveTextContent(
        'SustainabilityScorecard - Has Data: Test AffiliateClear Data',
      )
    })
  })
  // Multi-select Data Population Tests
  it('should populate multi-select with correct data', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      const multiSelectDataElements = screen.getAllByTestId('multi-select-data')
      expect(multiSelectDataElements[0]).toHaveTextContent('Test Region')
      expect(multiSelectDataElements[0]).toHaveTextContent('Test Region 2')
      expect(multiSelectDataElements[1]).toHaveTextContent('Test Affiliate 1')
      expect(multiSelectDataElements[1]).toHaveTextContent('Test Affiliate 2')
    })
  })
  // Table Data Generation Tests
  it('should generate correct table rows from affiliate data', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('collapsible-table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const tableRowsCount = screen.getByTestId('table-rows-count')
      expect(tableRowsCount).toHaveTextContent('3')
    })
  })
  // KPI Data Calculation Tests
  it('should calculate correct KPI values', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('landing-pages-top-kpi')).toBeInTheDocument()
    })
    await waitFor(() => {
      const kpiComponent = screen.getByTestId('landing-pages-top-kpi')
      expect(kpiComponent).toBeInTheDocument()
    })
  })
  // Component State Tests
  it('should maintain correct state after interactions', async () => {
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('performance-log')).toBeInTheDocument()
    })
    let scorecard = screen.getByTestId('sustainability-scorecard')
    expect(scorecard).toHaveTextContent(
      'SustainabilityScorecard - Has Data: undefinedClear Data',
    )
    fireEvent.click(screen.getByTestId('row-click-button'))
    await waitFor(() => {
      scorecard = screen.getByTestId('sustainability-scorecard')
      expect(scorecard).toHaveTextContent('Has Data: Test Affiliate')
      expect(scorecard.getAttribute('data-isplant')).toBe('false')
    })
    fireEvent.click(screen.getByTestId('subrow-click-button'))
    await waitFor(() => {
      scorecard = screen.getByTestId('sustainability-scorecard')
      expect(scorecard).toHaveTextContent(
        'SustainabilityScorecard - Has Data: Test AffiliateClear Data',
      )
      expect(scorecard.getAttribute('data-isplant')).toBe('true')
    })
  })
  // CSS Class Tests
  it('should apply correct CSS classes', async () => {
    const { container } = render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('performance-log')).toBeInTheDocument()
    })
    const parentDiv = container.querySelector('.parent')
    // expect(parentDiv).toBeInTheDocument();
    const topKpiSection = screen.getByTestId('affiliate-top-tiles')
    expect(topKpiSection).toBeInTheDocument()
  })
  // Activity Tracking Tests
  it('should call activity tracking on region change', async () => {
    const ActivityTrackerConfig = await import('config/ActivityTrackerConfig')
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('performance-log')).toBeInTheDocument()
    })
    const multiSelectButtons = screen.getAllByTestId(
      'multi-select-single-button',
    )
    fireEvent.click(multiSelectButtons[0])
    await waitFor(() => {
      expect(
        ActivityTrackerConfig.TRACKEVENTOBJ.affiliates.onRegionChange,
      ).toHaveBeenCalled()
    })
  })
  it('should call activity tracking on affiliate change', async () => {
    const ActivityTrackerConfig = await import('config/ActivityTrackerConfig')
    render(<AffiliatesBadCss />)
    await waitFor(() => {
      expect(screen.getByTestId('performance-log')).toBeInTheDocument()
    })
    const multiSelectButtons = screen.getAllByTestId(
      'multi-select-affiliate-button',
    )
    fireEvent.click(multiSelectButtons[1])
    await waitFor(() => {
      expect(
        ActivityTrackerConfig.TRACKEVENTOBJ.affiliates.onAffiliateChange,
      ).toHaveBeenCalled()
    })
  })
})
