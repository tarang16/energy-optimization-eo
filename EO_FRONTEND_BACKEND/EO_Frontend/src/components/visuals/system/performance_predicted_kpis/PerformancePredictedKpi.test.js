import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { getKpiOrderByKey } from 'services/FavoriteService'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PerformancePredictedKpi from './PerformancePredictedKpi'

vi.mock('components/ui/loader/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid='loader'>Loading...</div>,
}))
vi.mock(
  '../performance_predicted_kpis_card/PerformancePredictedKpisCard',
  () => ({
    __esModule: true,
    default: () => <div>PerformancePredictedKpisCard</div>,
  }),
)
vi.mock('services/FavoriteService')

vi.mock('config/scss/_variables.scss', () => {
  return {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
  }
})

const mockKpiOrderData = {
  data: [
    {
      preferences: {
        parameter: 'performance_kpi',
        data: [{ kpi: 'kpi1', order: 1 }],
      },
    },
    {
      preferences: {
        parameter: 'predicted_kpi',
        data: [{ kpi: 'kpi3', order: 1 }],
      },
    },
  ],
}

describe('PerformancePredictedKpi Component', () => {
  beforeEach(() => {
    getKpiOrderByKey.mockResolvedValue(mockKpiOrderData)
  })

  it('renders performance and predicted KPI sections', async () => {
    render(
      <PerformancePredictedKpi
        performanceKpis={[
          { tagName: 'kpi1', kpiSortID: 2 },
          { tagName: 'kpi2', kpiSortID: 1 },
        ]}
        predictedKpis={[
          { tagName: 'kpi3', kpiSortID: 2 },
          { tagName: 'kpi4', kpiSortID: 1 },
        ]}
        isLoading={false}
        caseId='case123'
        actualTime=''
        odsData={{}}
      />,
    )

    expect(
      await screen.findAllByText(/PerformancePredictedKpisCard/),
    ).toHaveLength(1)
  })

  it('renders performance and predicted KPI sections less then 2', async () => {
    render(
      <PerformancePredictedKpi
        performanceKpis={[{ tagName: 'kpi1', kpiSortID: 1 }]}
        predictedKpis={[{ tagName: 'kpi2', kpiSortID: 1 }]}
        isLoading={false}
        caseId='case123'
        actualTime=''
        odsData={{}}
      />,
    )

    expect(
      await screen.findAllByText(/PerformancePredictedKpisCard/),
    ).toHaveLength(1)
  })

  it('renders performance and predicted KPI sections more then 2', async () => {
    render(
      <PerformancePredictedKpi
        performanceKpis={[
          { tagName: 'kpi1', kpiSortID: 2 },
          { tagName: 'kpi2', kpiSortID: 1 },
          { tagName: 'kpi3', kpiSortID: 3 },
        ]}
        predictedKpis={[
          { tagName: 'kpi4', kpiSortID: 2 },
          { tagName: 'kpi5', kpiSortID: 1 },
          { tagName: 'kpi6', kpiSortID: 3 },
        ]}
        isLoading={false}
        caseId='case123'
        actualTime=''
        odsData={{}}
      />,
    )

    expect(
      await screen.findAllByText(/PerformancePredictedKpisCard/),
    ).toHaveLength(1)
  })

  it('renders performance and predicted KPI sections with no cards', async () => {
    render(
      <PerformancePredictedKpi
        performanceKpis={[]}
        predictedKpis={[]}
        isLoading={false}
        caseId='case123'
        actualTime=''
        odsData={{}}
      />,
    )

    expect(
      await screen.findAllByText(/PerformancePredictedKpisCard/),
    ).toHaveLength(1)
  })

  it('renders performance and predicted KPI sections with no predictedKpis', async () => {
    render(
      <PerformancePredictedKpi
        performanceKpis={[{ tagName: 'kpi4', kpiSortID: 2 }]}
        predictedKpis={[]}
        isLoading={false}
        caseId='case123'
        actualTime=''
        odsData={{}}
      />,
    )

    expect(
      await screen.findAllByText(/PerformancePredictedKpisCard/),
    ).toHaveLength(1)
  })

  it('renders performance and predicted KPI sections with no performanceKpis', async () => {
    render(
      <PerformancePredictedKpi
        performanceKpis={[]}
        predictedKpis={[{ tagName: 'kpi4', kpiSortID: 2 }]}
        isLoading={false}
        caseId='case123'
        actualTime=''
        odsData={{}}
      />,
    )

    expect(
      await screen.findAllByText(/PerformancePredictedKpisCard/),
    ).toHaveLength(1)
  })

  it('renders loader when isLoading is true', async () => {
    render(
      <PerformancePredictedKpi
        performanceKpis={[]}
        predictedKpis={[]}
        isLoading={true}
        caseId='case123'
        actualTime=''
        odsData={{}}
      />,
    )
    const elements = await screen.findAllByText('Loading...')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('opens sorting modal on button click', async () => {
    render(
      <PerformancePredictedKpi
        performanceKpis={[
          { tagName: 'kpi1', kpiSortID: 1 },
          { tagName: 'kpi2', kpiSortID: 2 },
        ]}
        predictedKpis={[
          { tagName: 'kpi3', kpiSortID: 1 },
          { tagName: 'kpi4', kpiSortID: 2 },
        ]}
        isLoading={false}
        caseId='case123'
        actualTime=''
        odsData={{}}
      />,
    )
    await waitFor(() => {
      expect(
        screen.getByTestId('sortingModalPerformance_btn'),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('sortingModalPerformance_btn'))

    // Click the sorting modal for performance
    const btn = screen.getByTestId('sortingModalPerformance_btn')
    fireEvent.click(btn)

    await waitFor(() => {
      expect(
        screen.getByText(/SORTING CONFIGURATION - PERFORMANCE KPI/),
      ).toBeInTheDocument()
    })

    // Close modal
    fireEvent.click(screen.getByText('SORTING CONFIGURATION - PERFORMANCE KPI'))
  })

  it('calls getKpiOrderByKey with correct caseId', async () => {
    render(
      <PerformancePredictedKpi
        performanceKpis={[
          { tagName: 'kpi1', kpiSortID: 2 },
          { tagName: 'kpi2', kpiSortID: 1 },
        ]}
        predictedKpis={[
          { tagName: 'kpi3', kpiSortID: 2 },
          { tagName: 'kpi4', kpiSortID: 1 },
        ]}
        isLoading={false}
        caseId='case456'
        actualTime=''
        odsData={{}}
      />,
    )

    await waitFor(() => {
      expect(getKpiOrderByKey).toHaveBeenCalledWith('case456')
    })
  })
})
