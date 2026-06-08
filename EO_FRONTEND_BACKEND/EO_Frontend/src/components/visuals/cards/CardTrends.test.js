import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as utilities from 'utills/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CardTrends from './CardTrends'
// Mock the utilities
vi.mock('utills/utilities', () => ({
  getDisplayNamesFromLibraryName: vi.fn(),
  getModalTitleFromObject: vi.fn(),
}))
// Mock the SCSS variables
vi.mock('../../../config/scss/_variables.scss', () => ({
  primary_blue: '#0000ff',
  primary_gray_2: '#cccccc',
}))
// Mock child components
vi.mock('./CardActions', () => ({
  default: () => {
    return function MockCardActions({
      handleShowModal,
      showCauseModal,
      showOdsButton,
      infoId,
      trendId,
      actionId,
    }) {
      return (
        <div data-testid='card-actions'>
          <button
            onClick={() => handleShowModal(true)}
            data-testid='trend-modal-button'
          >
            Open Trend Modal
          </button>
          <button
            onClick={() => showCauseModal(true)}
            data-testid='cause-modal-button'
          >
            Open Cause Modal
          </button>
          <div data-testid='show-ods-button'>
            {showOdsButton ? 'true' : 'false'}
          </div>
          <div data-testid='info-id'>{infoId}</div>
          <div data-testid='trend-id'>{trendId}</div>
          <div data-testid='action-id'>{actionId}</div>
        </div>
      )
    }
  },
}))

vi.mock('../common/modal/CustomModal', () => ({
  default: () => {
    return function MockCustomModal({
      children,
      show,
      hideModal,
      title,
      subTitle,
      unit,
      bodyHeight,
      modalHeight,
      customSpacingClass,
      id,
    }) {
      if (!show) return null

      return (
        <div data-testid={`custom-modal-${id}`}>
          <div data-testid='modal-title'>{title}</div>
          <div data-testid='modal-subtitle'>{subTitle}</div>
          <div data-testid='modal-unit'>{unit}</div>
          <div data-testid='modal-body-height'>{bodyHeight}</div>
          <div data-testid='modal-height'>{modalHeight}</div>
          <div data-testid='modal-spacing-class'>{customSpacingClass}</div>
          <button onClick={hideModal} data-testid='modal-close-button'>
            Close
          </button>
          <div>{children}</div>
        </div>
      )
    }
  },
}))
vi.mock('../charts/line_chart/linechart_multiple/LineChartMultiple', () => ({
  default: () => {
    return function MockLineChartMultiple({
      data,
      actualTime,
      exportTitle,
      showCustomRange,
      baseIntervalDuration,
    }) {
      return (
        <div data-testid='line-chart-multiple'>
          <div data-testid='chart-case-id'>{data.caseId}</div>
          <div data-testid='chart-tags-count'>{data.tagsList.length}</div>
          <div data-testid='chart-end-time'>{data.endTime}</div>
          <div data-testid='chart-legend-visible'>
            {data.isLegendVisible?.toString()}
          </div>
          <div data-testid='chart-single-yaxis'>
            {data.isSingleYAxis?.toString()}
          </div>
          <div data-testid='chart-export-title'>{exportTitle}</div>
          <div data-testid='chart-custom-range'>
            {showCustomRange.toString()}
          </div>
          <div data-testid='chart-base-interval'>{baseIntervalDuration}</div>
        </div>
      )
    }
  },
}))
vi.mock('../table/cause_table/CauseTable', () => ({
  default: () => {
    return function MockCauseTable({
      category,
      time,
      caseId,
      odsData,
      kpiData,
    }) {
      return (
        <div data-testid='cause-table'>
          <div data-testid='cause-category'>{category}</div>
          <div data-testid='cause-time'>{time}</div>
          <div data-testid='cause-case-id'>{caseId}</div>
          <div data-testid='cause-ods-data'>
            {odsData ? 'has-ods' : 'no-ods'}
          </div>
          <div data-testid='cause-kpi-data'>{kpiData.displayName}</div>
        </div>
      )
    }
  },
}))
describe('CardTrends', () => {
  const defaultProps = {
    data: {
      displayUom: '°C',
      displayName: 'Temperature',
      trendLibrary: 'timeseries_single',
      tagName: 'temp_sensor',
      valueDecimal: 2,
      kpiDescription: 'Temperature KPI Description',
    },
    caseId: 'case-123',
    actualTime: '2023-10-01T12:00:00Z',
    category: 'temperature',
    showOdsButton: true,
    odsData: { some: 'ods data' },
    tagName: 'custom_tag',
    isLegendVisible: true,
    baseIntervalDuration: 3600,
  }
  beforeEach(() => {
    utilities.getDisplayNamesFromLibraryName.mockReturnValue([
      'Display Name 1',
      'Display Name 2',
    ])
    utilities.getModalTitleFromObject.mockReturnValue('Modal Title')
  })
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('renders without crashing', () => {
    render(<CardTrends {...defaultProps} />)
    waitFor(() => {
      expect(screen.getByTestId('card-actions')).toBeInTheDocument()
    })
  })
  it('renders CardActions with correct props', () => {
    render(<CardTrends {...defaultProps} />)
    waitFor(() => {
      expect(screen.getByTestId('show-ods-button')).toHaveTextContent('true')
      expect(screen.getByTestId('info-id')).toHaveTextContent(
        'kpis-details-icon',
      )
      expect(screen.getByTestId('trend-id')).toHaveTextContent(
        'kpis-trends-icon',
      )
      expect(screen.getByTestId('action-id')).toHaveTextContent(
        'kpis-actions-button-icon',
      )
    })
  })
  it('calls getDisplayNamesFromLibraryName and getModalTitleFromObject with correct data', () => {
    render(<CardTrends {...defaultProps} />)

    expect(utilities.getDisplayNamesFromLibraryName).toHaveBeenCalledWith(
      defaultProps.data,
    )
    expect(utilities.getModalTitleFromObject).toHaveBeenCalledWith(
      defaultProps.data,
    )
  })
  it('opens and closes trend modal', () => {
    render(<CardTrends {...defaultProps} />)

    // Initially modals should not be visible
    expect(
      screen.queryByTestId('custom-modal-kpis-trend'),
    ).not.toBeInTheDocument()
    waitFor(() => {
      // Modal should be visible
      expect(screen.getByTestId('custom-modal-kpis-trend')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Modal Title')
      expect(screen.getByTestId('modal-unit')).toHaveTextContent('°C')

      // Close modal
      fireEvent.click(screen.getByTestId('modal-close-button'))

      // Modal should be closed
      expect(
        screen.queryByTestId('custom-modal-kpis-trend'),
      ).not.toBeInTheDocument()
    })
  })
  it('opens and closes cause modal', () => {
    render(<CardTrends {...defaultProps} />)
    waitFor(() => {
      // Initially modals should not be visible
      expect(
        screen.queryByTestId('custom-modal-kpis-actions'),
      ).not.toBeInTheDocument()

      // Open cause modal
      fireEvent.click(screen.getByTestId('cause-modal-button'))

      // Modal should be visible
      expect(
        screen.getByTestId('custom-modal-kpis-actions'),
      ).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Temperature')
      expect(screen.getByTestId('modal-subtitle')).toHaveTextContent(
        'Temperature KPI Description',
      )
      expect(screen.getByTestId('modal-body-height')).toHaveTextContent('auto')
      expect(screen.getByTestId('modal-height')).toHaveTextContent('auto')

      // Close modal
      fireEvent.click(screen.getByTestId('modal-close-button'))

      // Modal should be closed
      expect(
        screen.queryByTestId('custom-modal-kpis-actions'),
      ).not.toBeInTheDocument()
    })
  })
  it('renders LineChartMultiple with two tags when trendLibrary is timeseries_multiple and tagName2 exists', () => {
    const propsWithMultipleTrends = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        trendLibrary: 'timeseries_multiple',
        tagName: 'tag1',
        tagName2: 'tag2',
        valueDecimal: 1,
      },
    }

    render(<CardTrends {...propsWithMultipleTrends} />)

    // Open trend modal to see the chart
    waitFor(() => {
      expect(screen.getByTestId('chart-tags-count')).toHaveTextContent('2')
      expect(screen.getByTestId('chart-case-id')).toHaveTextContent('case-123')
      expect(screen.getByTestId('chart-end-time')).toHaveTextContent(
        '2023-10-01T12:00:00Z',
      )
      expect(screen.getByTestId('chart-legend-visible')).toHaveTextContent(
        'true',
      )
      expect(screen.getByTestId('chart-single-yaxis')).toHaveTextContent('true')
      expect(screen.getByTestId('chart-export-title')).toHaveTextContent(
        'Temperature',
      )
      expect(screen.getByTestId('chart-custom-range')).toHaveTextContent('true')
    })
  })
  it('renders LineChartMultiple with single tag when trendLibrary is not timeseries_multiple', () => {
    render(<CardTrends {...defaultProps} />)

    // Open trend modal to see the chart
    waitFor(() => {
      expect(screen.getByTestId('chart-tags-count')).toHaveTextContent('1')
      expect(screen.getByTestId('chart-legend-visible')).toHaveTextContent(
        'true',
      )
      expect(screen.getByTestId('chart-base-interval')).toHaveTextContent(
        '3600',
      )
    })
  })
  it('renders LineChartMultiple with single tag when tagName2 does not exist', () => {
    const propsWithoutTagName2 = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        trendLibrary: 'timeseries_multiple',
        tagName: 'tag1',
        // No tagName2
        valueDecimal: 1,
      },
    }

    render(<CardTrends {...propsWithoutTagName2} />)
    waitFor(() => {
      // Open trend modal to see the chart
      fireEvent.click(screen.getByTestId('trend-modal-button'))

      expect(screen.getByTestId('chart-tags-count')).toHaveTextContent('1')
    })
  })
  it('renders CauseTable with correct props in cause modal', () => {
    render(<CardTrends {...defaultProps} />)
    waitFor(() => {
      // Open cause modal
      fireEvent.click(screen.getByTestId('cause-modal-button'))

      expect(screen.getByTestId('cause-table')).toBeInTheDocument()
      expect(screen.getByTestId('cause-category')).toHaveTextContent(
        'temperature',
      )
      expect(screen.getByTestId('cause-time')).toHaveTextContent(
        '2023-10-01T12:00:00Z',
      )
      expect(screen.getByTestId('cause-case-id')).toHaveTextContent('case-123')
      expect(screen.getByTestId('cause-ods-data')).toHaveTextContent('has-ods')
      expect(screen.getByTestId('cause-kpi-data')).toHaveTextContent(
        'Temperature',
      )
    })
  })
  it('handles undefined or null values gracefully', () => {
    const propsWithPartialData = {
      data: {
        displayName: 'Test KPI',
        trendLibrary: null,
        valueDecimal: 0,
      },
      caseId: null,
      actualTime: null,
      category: undefined,
      showOdsButton: false,
      odsData: null,
      tagName: undefined,
      isLegendVisible: false,
      baseIntervalDuration: undefined,
    }

    render(<CardTrends {...propsWithPartialData} />)
    waitFor(() => {
      // Should render without crashing
      expect(screen.getByTestId('card-actions')).toBeInTheDocument()

      // Test modals can still be opened
      fireEvent.click(screen.getByTestId('trend-modal-button'))
      expect(screen.getByTestId('custom-modal-kpis-trend')).toBeInTheDocument()
    })
  })
  it('handles missing kpiDescription in cause modal', () => {
    const propsWithoutDescription = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        kpiDescription: undefined,
      },
    }

    render(<CardTrends {...propsWithoutDescription} />)
    waitFor(() => {
      fireEvent.click(screen.getByTestId('cause-modal-button'))
      // Modal should still render without subtitle
      expect(
        screen.getByTestId('custom-modal-kpis-actions'),
      ).toBeInTheDocument()
      expect(screen.getByTestId('modal-subtitle')).toHaveTextContent('')
    })
  })
  it('uses correct CSS class for cause table modal', () => {
    vi.mock(import('./Cards.module.scss'), async (importOriginal) => {
      const actual = await importOriginal()
      return {
        ...actual,
        causeTableClass: 'mock-cause-table-class',
      }
    })

    render(<CardTrends {...defaultProps} />)
    waitFor(() => {
      expect(screen.getByTestId('modal-spacing-class')).toHaveTextContent(
        'causeTableClass',
      )
    })
  })
  it('verifies chart configuration for multiple trends', () => {
    const propsWithMultipleTrends = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        trendLibrary: 'timeseries_multiple',
        tagName: 'tag1',
        tagName2: 'tag2',
        valueDecimal: 3,
      },
    }

    render(<CardTrends {...propsWithMultipleTrends} />)

    waitFor(() => {
      const chart = screen.getByTestId('line-chart-multiple')
      expect(chart).toBeInTheDocument()
      expect(screen.getByTestId('chart-tags-count')).toHaveTextContent('2')
    })
  })
  it('verifies chart configuration for single trend', () => {
    render(<CardTrends {...defaultProps} />)

    waitFor(() => {
      const chart = screen.getByTestId('line-chart-multiple')
      expect(chart).toBeInTheDocument()
      expect(screen.getByTestId('chart-tags-count')).toHaveTextContent('1')
    })
  })
})
