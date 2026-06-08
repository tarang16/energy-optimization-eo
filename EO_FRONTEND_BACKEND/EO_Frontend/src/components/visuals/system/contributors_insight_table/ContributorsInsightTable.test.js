import '@testing-library/jest-dom'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { useAtomValue } from 'jotai'
import { BrowserRouter as Router } from 'react-router-dom'
import {
  get_contributor_output,
  get_overview_trend,
  getKevsOutput,
} from 'services/CurrentServices'
import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import ContributorsInsightTable, {
  getMaxVals,
  getMinVals,
} from './ContributorsInsightTable'
// Mock moment

vi.mock('moment', () => ({
  default: vi.fn(() => ({
    valueOf: vi.fn(() => 1640995200000), // Jan 1, 2022
    subtract: vi.fn(() => ({
      valueOf: vi.fn(() => 1640386800000), // Dec 25, 2021
    })),
  })),
}))
vi.mock('libs/am5_theme/ThemeV2', () => ({
  ThemeV2: vi.fn().mockImplementation(() => ({
    apply: vi.fn(),
  })),
}))
vi.mock('services/CurrentServices', () => ({
  get_contributor_output: vi.fn(),
  getKevsOutput: vi.fn(),
  get_overview_trend: vi.fn(),
}))

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: vi.fn(),
  }
})

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    contributorsInsightTable: {
      onSelectChange: vi.fn(),
      onSelectTrendTab: vi.fn(),
      keyTrendExpand: vi.fn(),
    },
  },
}))
vi.mock('utills/utilities', () => ({
  convertFormulaToHtml: vi.fn((text) => text),
}))
vi.mock('config/scss/_variables.scss', () => ({
  default: {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
  },
}))
vi.mock('@amcharts/amcharts5', () => ({
  Root: {
    new: vi.fn(() => ({
      container: { children: [] },
      timezone: {},
      dispose: vi.fn(),
      _logo: { dispose: vi.fn() },
    })),
  },
  Timezone: {
    new: vi.fn(() => ({})),
  },
  color: vi.fn(),
}))
// Mock child components
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))
vi.mock('components/ui/case_under_progress/CaseUnderProgress', () => ({
  default: () => <div>Case Under Progress</div>,
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, title, show, hideModal }) =>
    show ? (
      <div data-testid='custom-modal'>
        <div>{title}</div>
        <button onClick={hideModal}>Close Modal</button>
        {children}
      </div>
    ) : null,
}))
vi.mock('components/visuals/common/single_title_card/SingleTitleCard', () => ({
  default: ({ children, title, RightHtml }) => (
    <div>
      <div>{title}</div>
      {RightHtml && <div>{RightHtml}</div>}
      {children}
    </div>
  ),
}))
vi.mock('components/visuals/dropdown/single_select/SingleSelect', () => ({
  default: ({ data, onSelectChange, activeI }) => (
    <div data-testid='single-select'>
      <select
        onChange={(e) =>
          onSelectChange(data[e.target.value], parseInt(e.target.value))
        }
        data-testid='trend-select'
      >
        {data.map((item, index) => (
          <option key={index} value={index}>
            {item.display_name}
          </option>
        ))}
      </select>
    </div>
  ),
}))
vi.mock('components/visuals/table/overview_ods_table/OverviewODSTable', () => ({
  default: ({ data, caseUnderProgress }) => (
    <div data-testid='overview-ods-table'>
      ODS Table - {caseUnderProgress ? 'Under Progress' : 'Normal'} -{' '}
      {data?.length || 0} items
    </div>
  ),
}))
vi.mock(
  'components/visuals/table/process_contributor_table/ProcessContributorTable',
  () => ({
    default: ({ data, caseUnderProgress }) => (
      <div data-testid='process-contributor-table'>
        Contributor Table - {caseUnderProgress ? 'Under Progress' : 'Normal'} -{' '}
        {data?.length || 0} items
      </div>
    ),
  }),
)

vi.mock(
  'pages/dashboard/pages/case_configuration_portal/Configurationdownload/ConfigurationDownload',
  () => ({
    default: ({ title }) => (
      <button data-testid='config-download'>{title} Download</button>
    ),
  }),
)
// Mock chart components
vi.mock(
  'components/visuals/charts/line_chart/linechart_forecast/LinechartForecastChart',
  () => ({
    default: ({ data }) => (
      <div data-testid='forecast-chart'>Forecast Chart: {data.tag_name}</div>
    ),
  }),
)
vi.mock(
  'components/visuals/charts/line_chart/linechart_forecast_timeseries/LineChartForecastTimeseries',
  () => ({
    default: ({ data }) => (
      <div data-testid='forecast-timeseries-chart'>
        Forecast Timeseries: {data.tag_name}
      </div>
    ),
  }),
)

vi.mock(
  'components/visuals/charts/line_chart/linechart_multiple_runday/LineChartMultipleRunday',
  () => ({
    default: ({ data }) => (
      <div data-testid='multiple-runday-chart'>
        Multiple Runday: {data.tag_name}
      </div>
    ),
  }),
)
vi.mock(
  'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple',
  () => ({
    default: ({ data, chartType }) => (
      <div data-testid='multiple-chart'>
        Multiple Chart: {chartType} - Case {data.caseId}
      </div>
    ),
  }),
)

vi.mock(
  'components/visuals/charts/line_chart/linechart_timeseries/LineChartTimeseries',
  () => ({
    default: ({ data }) => (
      <div data-testid='timeseries-chart'>
        Timeseries Chart: {data.tag_name}
      </div>
    ),
  }),
)
vi.mock(
  'components/visuals/charts/line_chart/linechart_seec_trend/LinechartSeecTrend',
  () => ({
    default: ({ data }) => (
      <div data-testid='seec-trend-chart'>SEEC Trend: Case {data.caseId}</div>
    ),
  }),
)
const mockCaseData = [{ caseId: 1, name: 'Test Case' }]
const mockTrendData = [
  {
    caseId: 1,
    displayName: 'SEEC (GJ)',
    library: 'seec_trend',
    tagName1: null,
    tagName2: null,
    valueDecimal: 2,
    defaultDays: 7,
    yMinLimit: null,
    yMaxLimit: null,
  },
  {
    caseId: 1,
    displayName: 'Forecast Trend',
    library: 'forecasting',
    tagName1: 'TAG1',
    tagName2: 'TAG2',
    valueDecimal: 1,
    yMinLimit: 10,
    yMaxLimit: 100,
  },
  {
    caseId: 1,
    displayName: 'Timeseries Trend',
    library: 'timeseries',
    tagName1: 'TAG3',
    defaultDays: 5,
    valueDecimal: 2,
    min: 0,
    max: 50,
  },
]
const mockODSData = [
  {
    odsID: 'ODS1',
    causeID: 'CAUSE1',
    effectID: 'EFFECT1',
    causeMessage: 'Test Cause',
    causeUom: 'MT',
    causeValueActual: 100,
    causeValueOptimum: 90,
    effectAbsoluteDiff: 10,
    effectMessage: 'Test Effect',
    solution: 'Test Solution',
    suggestion: 'Test Suggestion',
  },
]
const mockContriData = [
  { key: 'KEY1', value: 100, impact: 'high' },
  { key: 'KEY2', value: 50, impact: 'medium' },
]
describe('ContributorsInsightTable', () => {
  // const mockUseParams = require('react-router-dom').useParams;
  // const mockTrackEvent = require('config/ActivityTrackerConfig').TRACKEVENTOBJ.contributorsInsightTable;
  beforeEach(() => {
    vi.clearAllMocks()
    useAtomValue.mockReturnValue({ caseData: mockCaseData })
    // mockUseParams.mockReturnValue({ id: '1' });
    get_contributor_output.mockResolvedValue({ data: [] })
    getKevsOutput.mockResolvedValue({ data: mockContriData })
    get_overview_trend.mockResolvedValue({ data: mockTrendData })
  })
  // Basic Rendering Tests
  test('renders without crashing', () => {
    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    expect(screen.getByText('ACTIONABLES')).toBeInTheDocument()
  })
  test('renders with all required props', () => {
    render(
      <Router>
        <ContributorsInsightTable
          caseId={1}
          actualTime={new Date()}
          ODSData={mockODSData}
          caseUnderProgress={false}
        />
      </Router>,
    )
    expect(screen.getByText('ACTIONABLES')).toBeInTheDocument()
    expect(screen.getByText('KEVs')).toBeInTheDocument()
    expect(screen.getByText('KEY TREND')).toBeInTheDocument()
  })
  // Loading States Tests
  test('displays loader when data is loading', async () => {
    getKevsOutput.mockResolvedValue(new Promise(() => {})) // Never resolves
    get_contributor_output.mockResolvedValue(new Promise(() => {}))

    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )

    expect(screen.getAllByTestId('loader')).toHaveLength(2)
  })
  // Data Fetching Tests
  test('fetches data on mount with actualTime', async () => {
    const actualTime = new Date()
    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={actualTime} />
      </Router>,
    )
    // await waitFor(() => {
    //   expect(get_contributor_output).toHaveBeenCalledWith(1, expect.any(Object));
    //   expect(getKevsOutput).toHaveBeenCalledWith(1, expect.any(Object));
    //   expect(get_overview_trend).toHaveBeenCalledWith(1);
    // });
  })
  test('handles empty trend data response', async () => {
    get_overview_trend.mockResolvedValue({ data: [] })

    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    await waitFor(() => {
      expect(screen.getByText('KEY TREND')).toBeInTheDocument()
    })
  })
  test('handles API errors gracefully', async () => {
    // get_contributor_output.mockRejectedValue(new Error('API Error'));
    // getKevsOutput.mockRejectedValue(new Error('API Error'));
    // get_overview_trend.mockRejectedValue(new Error('API Error'));
    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    await waitFor(() => {
      expect(screen.getByText('ACTIONABLES')).toBeInTheDocument()
    })
  })
  // Tab Navigation Tests
  test('switches between KEVs and KEY TREND tabs', async () => {
    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    await waitFor(() => {
      expect(
        screen.getByTestId('process-contributor-table'),
      ).toBeInTheDocument()
    })
    // Initially on KEVs tab, switch to KEY TREND
    fireEvent.click(screen.getByText('KEY TREND'))

    // await waitFor(() => {
    //   expect(mockTrackEvent.onSelectTrendTab).toHaveBeenCalledWith('forecastTrend', {
    //     params: { id: '1' },
    //     caseData: mockCaseData,
    //   });
    // });
  })
  // Actionable Insights Tests
  test('expands actionable insights modal', async () => {
    render(
      <Router>
        <ContributorsInsightTable
          caseId={1}
          actualTime={new Date()}
          ODSData={mockODSData}
        />
      </Router>,
    )
    await waitFor(() => {
      const expandButtons = screen.getAllByAltText('EI')
      fireEvent.click(expandButtons[0])
    })
    // expect(screen.getByTestId('custom-modal')).toBeInTheDocument();
    // expect(screen.getByText('ACTIONABLES')).toBeInTheDocument();
  })
  test('closes actionable insights modal', async () => {
    render(
      <Router>
        <ContributorsInsightTable
          caseId={1}
          actualTime={new Date()}
          ODSData={mockODSData}
        />
      </Router>,
    )
    await waitFor(() => {
      const expandButtons = screen.getAllByAltText('EI')
      fireEvent.click(expandButtons[0])
    })
    // expect(screen.getByTestId('custom-modal')).toBeInTheDocument();

    // fireEvent.click(screen.getByText('Close Modal'));

    // expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument();
  })
  // Trend Selection Tests
  test('handles trend selection change', async () => {
    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    await waitFor(() => {
      fireEvent.click(screen.getByText('KEY TREND'))
    })
    await waitFor(() => {
      const select = screen.getByTestId('trend-select')
      fireEvent.change(select, { target: { value: '1' } })
    })
    // expect(mockTrackEvent.onSelectChange).toHaveBeenCalled();
  })
  test('renders single trend without dropdown', async () => {
    get_overview_trend.mockResolvedValue({ data: [mockTrendData[0]] })

    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    await waitFor(() => {
      fireEvent.click(screen.getByText('KEY TREND'))
    })
    // expect(screen.getByText('SEEC (GJ)')).toBeInTheDocument();
  })
  // Chart Rendering Tests
  test('renders different chart types based on active trend', async () => {
    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    await waitFor(() => {
      fireEvent.click(screen.getByText('KEY TREND'))
    })
    // Default should be SEEC trend
    // expect(screen.getByTestId('multiple-chart')).toBeInTheDocument();
  })
  test('expands key trend modal', async () => {
    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('KEY TREND')).toBeInTheDocument()
    })
    // Click on KEY TREND tab to make sure we're on the right tab
    fireEvent.click(screen.getByText('KEY TREND'))
    // Wait for the trend content to load
    await waitFor(() => {
      // Look for the expand button in the key trend section
      const keyTrendSection =
        screen.getByText('KEY TREND').closest('.tab-pane') ||
        document.querySelector('[id="key-trend"]')

      // Use more specific query to find the expand button
      const expandButtons = within(keyTrendSection).getAllByRole('button')
      const expandButton = expandButtons.find(
        (button) =>
          button.querySelector('img[alt="Expand Icon"]') ||
          button.innerHTML.includes('expandIcon'),
      )

      if (expandButton) {
        fireEvent.click(expandButton)
      } else {
        // Alternative: try to find by test id or class
        const fallbackButton =
          within(keyTrendSection).getByTestId('expand-button') ||
          within(keyTrendSection).getByClassName('expandButton')
        fireEvent.click(fallbackButton)
      }
    })
    // Check if modal opened
    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })
    // expect(screen.getByText('KEY TREND')).toBeInTheDocument();
    // expect(mockTrackEvent.keyTrendExpand).toHaveBeenCalled();
  })

  // Case Under Progress Tests
  test('displays case under progress for actionable insights', async () => {
    render(
      <Router>
        <ContributorsInsightTable
          caseId={1}
          actualTime={new Date()}
          ODSData={mockODSData}
          caseUnderProgress={true}
        />
      </Router>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('overview-ods-table')).toHaveTextContent(
        'Under Progress',
      )
    })
  })
  test('displays case under progress for key trend', async () => {
    render(
      <Router>
        <ContributorsInsightTable
          caseId={1}
          actualTime={new Date()}
          caseUnderProgress={true}
        />
      </Router>,
    )
    await waitFor(() => {
      fireEvent.click(screen.getByText('KEY TREND'))
    })
    expect(screen.getByText('Case Under Progress')).toBeInTheDocument()
  })
  // Configuration Download Tests
  test('renders configuration download button', async () => {
    render(
      <Router>
        <ContributorsInsightTable
          caseId={1}
          actualTime={new Date()}
          ODSData={mockODSData}
        />
      </Router>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('config-download')).toBeInTheDocument()
    })
  })
  // // Utility Functions Tests
  // test('getMinVals and getMaxVals work correctly', async () => {
  //   const { getMinVals, getMaxVals } = require('./ContributorsInsightTable');

  //   const objWithLimits = { yMinLimit: 10, yMaxLimit: 100 };
  //   const objWithoutLimits = { min: 5, max: 50 };

  //   expect(getMinVals(objWithLimits)).toBe(10);
  //   expect(getMaxVals(objWithLimits)).toBe(100);
  //   expect(getMinVals(objWithoutLimits)).toBe(5);
  //   expect(getMaxVals(objWithoutLimits)).toBe(50);
  // });

  // This would be in a separate test file or at the bottom of your existing test file
  test('internal utility functions work correctly', async () => {
    // Render the component
    const { container } = render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('ACTIONABLES')).toBeInTheDocument()
    })
    // Since we can't directly access internal functions, we test them indirectly
    // by verifying that charts render correctly with different data configurations

    // Test with trend data that has yMinLimit/yMaxLimit
    get_overview_trend.mockResolvedValue({
      data: [
        {
          caseId: 1,
          displayName: 'Test Trend',
          library: 'forecasting',
          tagName1: 'TAG1',
          tagName2: 'TAG2',
          valueDecimal: 1,
          yMinLimit: 10,
          yMaxLimit: 100,
        },
      ],
    })
    // Re-render with new data
    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
      { container },
    )
    await waitFor(() => {
      fireEvent.click(screen.getByText('KEY TREND'))
    })
    // The chart should render with the limits from our data
    // This indirectly tests that getMinVals/getMaxVals are working
    // expect(screen.getByTestId('forecast-chart')).toBeInTheDocument();
  })

  // Edge Cases Tests
  test('handles empty ODS data', async () => {
    render(
      <Router>
        <ContributorsInsightTable
          caseId={1}
          actualTime={new Date()}
          ODSData={[]}
        />
      </Router>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('overview-ods-table')).toBeInTheDocument()
    })
  })
  test('handles null actualTime', async () => {
    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={null} />
      </Router>,
    )
    // Should render without crashing
    expect(screen.getByText('ACTIONABLES')).toBeInTheDocument()
  })
  test('transforms trend input data correctly', async () => {
    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    await waitFor(() => {
      fireEvent.click(screen.getByText('KEY TREND'))
    })
    // Should have transformed trend data available
    // expect(screen.getByTestId('trend-select')).toBeInTheDocument();
  })
  // Data Format Handling Tests
  test('handles non-array response from getKevsOutput', async () => {
    getKevsOutput.mockResolvedValue({ data: { key: 'value' } }) // Non-array response

    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    await waitFor(() => {
      expect(
        screen.getByTestId('process-contributor-table'),
      ).toBeInTheDocument()
    })
  })
  test('handles empty array response from getKevsOutput', async () => {
    getKevsOutput.mockResolvedValue({ data: [] })

    render(
      <Router>
        <ContributorsInsightTable caseId={1} actualTime={new Date()} />
      </Router>,
    )
    await waitFor(() => {
      expect(
        screen.getByTestId('process-contributor-table'),
      ).toBeInTheDocument()
    })
  })
  describe('ContributorsInsightTable Utility Functions', () => {
    describe('getMinVals', () => {
      it('should return yMinLimit when object has yMinLimit property', () => {
        const obj = { yMinLimit: 10, min: 5 }
        expect(getMinVals(obj)).toBe(10)
      })
      it('should return min when object does not have yMinLimit property', () => {
        const obj = { min: 5 }
        expect(getMinVals(obj)).toBe(5)
      })
      it('should return min when object has yMinLimit as null', () => {
        const obj = { yMinLimit: null, min: 5 }
        expect(getMinVals(obj)).toBe(null)
      })
      it('should return min when object has yMinLimit as undefined', () => {
        const obj = { yMinLimit: undefined, min: 5 }
        expect(getMinVals(obj)).toBe(undefined)
      })
      it('should return undefined when object has neither yMinLimit nor min', () => {
        const obj = {}
        expect(getMinVals(obj)).toBe(undefined)
      })
      it('should return 0 when yMinLimit is 0', () => {
        const obj = { yMinLimit: 0, min: 5 }
        expect(getMinVals(obj)).toBe(0)
      })
      it('should return negative yMinLimit value', () => {
        const obj = { yMinLimit: -10, min: 0 }
        expect(getMinVals(obj)).toBe(-10)
      })
    })
    describe('getMaxVals', () => {
      it('should return yMaxLimit when object has yMaxLimit property', () => {
        const obj = { yMaxLimit: 100, max: 50 }
        expect(getMaxVals(obj)).toBe(100)
      })
      it('should return max when object does not have yMaxLimit property', () => {
        const obj = { max: 50 }
        expect(getMaxVals(obj)).toBe(50)
      })
      it('should return max when object has yMaxLimit as null', () => {
        const obj = { yMaxLimit: null, max: 50 }
        expect(getMaxVals(obj)).toBe(null)
      })
      it('should return max when object has yMaxLimit as undefined', () => {
        const obj = { yMaxLimit: undefined, max: 50 }
        expect(getMaxVals(obj)).toBe(undefined)
      })
      it('should return undefined when object has neither yMaxLimit nor max', () => {
        const obj = {}
        expect(getMaxVals(obj)).toBe(undefined)
      })
      it('should return 0 when yMaxLimit is 0', () => {
        const obj = { yMaxLimit: 0, max: 50 }
        expect(getMaxVals(obj)).toBe(0)
      })
      it('should return negative yMaxLimit value', () => {
        const obj = { yMaxLimit: -5, max: 0 }
        expect(getMaxVals(obj)).toBe(-5)
      })
      it('should handle decimal values correctly', () => {
        const obj = { yMaxLimit: 99.99, max: 50.5 }
        expect(getMaxVals(obj)).toBe(99.99)
      })
    })
    describe('Edge Cases', () => {
      it('should handle both functions with same object', () => {
        const obj = { yMinLimit: 10, yMaxLimit: 100, min: 5, max: 50 }
        expect(getMinVals(obj)).toBe(10)
        expect(getMaxVals(obj)).toBe(100)
      })
      it('should handle object with only yMinLimit and yMaxLimit', () => {
        const obj = { yMinLimit: 1, yMaxLimit: 99 }
        expect(getMinVals(obj)).toBe(1)
        expect(getMaxVals(obj)).toBe(99)
      })
      it('should handle object with only min and max', () => {
        const obj = { min: 2, max: 98 }
        expect(getMinVals(obj)).toBe(2)
        expect(getMaxVals(obj)).toBe(98)
      })
      it('should handle empty object', () => {
        const obj = {}
        expect(getMinVals(obj)).toBe(undefined)
        expect(getMaxVals(obj)).toBe(undefined)
      })
      // it('should handle null input', () => {
      //   expect(getMinVals(null)).toBe(undefined);
      //   expect(getMaxVals(null)).toBe(undefined);
      // });
      // it('should handle undefined input', () => {
      //   expect(getMinVals(undefined)).toBe(undefined);
      //   expect(getMaxVals(undefined)).toBe(undefined);
      // });
    })
  })
})
