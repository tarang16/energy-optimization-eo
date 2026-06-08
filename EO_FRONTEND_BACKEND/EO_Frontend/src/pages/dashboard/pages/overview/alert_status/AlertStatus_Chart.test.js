// ============================================================
// FILE 1: AlertStatus_Chart.test.jsx
// ============================================================
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { getAlertStatisticsForRole } from 'services/AlertStaticsSerives'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AlertStatus_Chart from './AlertStatus_Chart'
vi.mock('services/AlertStaticsSerives')
vi.mock('components/visuals/charts/bar_chart/VerticalStackedBartChart', () => ({
  default: function MockVerticalStackedBarChart({
    chartData,
    exportTitle,
    caseIdList,
  }) {
    return (
      <div data-testid='vertical-stacked-bar-chart'>
        <span>Chart Data: {JSON.stringify(chartData)}</span>
        <span>Export Title: {exportTitle}</span>
        <span>Case IDs: {caseIdList?.join(',')}</span>
      </div>
    )
  },
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: function MockCustomModal({ title, hideModal, show, children }) {
    if (!show) return null
    return (
      <div data-testid='custom-modal'>
        <h3>{title}</h3>
        <button onClick={hideModal}>Close Modal</button>
        {children}
      </div>
    )
  },
}))
describe('AlertStatus_Chart', () => {
  const mockCaseIdList = ['case1', 'case2']
  const mockStartDate = '2024-01-01'
  const mockChartData = [
    { role: 'Admin', alerts: 5, resolved: 3 },
    { role: 'User', alerts: 8, resolved: 2 },
  ]
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders without crashing', () => {
    vi.mocked(getAlertStatisticsForRole).mockResolvedValue({
      data: mockChartData,
    })
    render(
      <AlertStatus_Chart
        caseIdList={mockCaseIdList}
        refresh={false}
        startDate={mockStartDate}
      />,
    )
  })
  it('fetches data on component mount when caseIdList is provided', async () => {
    vi.mocked(getAlertStatisticsForRole).mockResolvedValue({
      data: mockChartData,
    })
    render(
      <AlertStatus_Chart
        caseIdList={mockCaseIdList}
        refresh={false}
        startDate={mockStartDate}
      />,
    )
    await waitFor(() => {
      expect(getAlertStatisticsForRole).toHaveBeenCalledWith(
        mockCaseIdList,
        mockStartDate,
      )
    })
  })
  it('does not fetch data when caseIdList is null', () => {
    vi.mocked(getAlertStatisticsForRole).mockResolvedValue({
      data: mockChartData,
    })
    render(
      <AlertStatus_Chart
        caseIdList={null}
        refresh={false}
        startDate={mockStartDate}
      />,
    )
    expect(getAlertStatisticsForRole).not.toHaveBeenCalled()
  })
  it('sets chart data when API call is successful', async () => {
    vi.mocked(getAlertStatisticsForRole).mockResolvedValue({
      data: mockChartData,
    })
    render(
      <AlertStatus_Chart
        caseIdList={mockCaseIdList}
        refresh={false}
        startDate={mockStartDate}
      />,
    )
    await waitFor(() => {
      expect(
        screen.getByText(`Chart Data: ${JSON.stringify(mockChartData)}`),
      ).toBeInTheDocument()
    })
  })
  it('handles API response without data property', async () => {
    vi.mocked(getAlertStatisticsForRole).mockResolvedValue({})
    render(
      <AlertStatus_Chart
        caseIdList={mockCaseIdList}
        refresh={false}
        startDate={mockStartDate}
      />,
    )
    await waitFor(() => {
      expect(
        screen.getByTestId('vertical-stacked-bar-chart'),
      ).toBeInTheDocument()
    })
  })
  it('opens modal when expand button is clicked', async () => {
    vi.mocked(getAlertStatisticsForRole).mockResolvedValue({
      data: mockChartData,
    })
    render(
      <AlertStatus_Chart
        caseIdList={mockCaseIdList}
        refresh={false}
        startDate={mockStartDate}
      />,
    )
    await waitFor(() => {
      expect(
        screen.getByTestId('vertical-stacked-bar-chart'),
      ).toBeInTheDocument()
    })
    const expandButton = screen.getByRole('button', { name: '' })
    fireEvent.click(expandButton)
    expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
  })
  it('closes modal when hideModal is called', async () => {
    vi.mocked(getAlertStatisticsForRole).mockResolvedValue({
      data: mockChartData,
    })
    render(
      <AlertStatus_Chart
        caseIdList={mockCaseIdList}
        refresh={false}
        startDate={mockStartDate}
      />,
    )
    await waitFor(() => {
      expect(
        screen.getByTestId('vertical-stacked-bar-chart'),
      ).toBeInTheDocument()
    })
    const expandButton = screen.getByRole('button', { name: '' })
    fireEvent.click(expandButton)
    expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    const closeButton = screen.getByText('Close Modal')
    fireEvent.click(closeButton)
    expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
  })
  it('refetches data when refresh prop changes', async () => {
    vi.mocked(getAlertStatisticsForRole).mockResolvedValue({
      data: mockChartData,
    })
    const { rerender } = render(
      <AlertStatus_Chart
        caseIdList={mockCaseIdList}
        refresh={false}
        startDate={mockStartDate}
      />,
    )
    await waitFor(() => {
      expect(getAlertStatisticsForRole).toHaveBeenCalledTimes(1)
    })
    rerender(
      <AlertStatus_Chart
        caseIdList={mockCaseIdList}
        refresh={true}
        startDate={mockStartDate}
      />,
    )
    await waitFor(() => {
      expect(getAlertStatisticsForRole).toHaveBeenCalledTimes(2)
    })
  })
  it('refetches data when caseIdList changes', async () => {
    vi.mocked(getAlertStatisticsForRole).mockResolvedValue({
      data: mockChartData,
    })
    const { rerender } = render(
      <AlertStatus_Chart
        caseIdList={mockCaseIdList}
        refresh={false}
        startDate={mockStartDate}
      />,
    )
    await waitFor(() => {
      expect(getAlertStatisticsForRole).toHaveBeenCalledTimes(1)
    })
    const newCaseIdList = ['case3', 'case4']
    rerender(
      <AlertStatus_Chart
        caseIdList={newCaseIdList}
        refresh={false}
        startDate={mockStartDate}
      />,
    )
    await waitFor(() => {
      expect(getAlertStatisticsForRole).toHaveBeenCalledTimes(2)
      expect(getAlertStatisticsForRole).toHaveBeenCalledWith(
        newCaseIdList,
        mockStartDate,
      )
    })
  })
  it('refetches data when startDate changes', async () => {
    vi.mocked(getAlertStatisticsForRole).mockResolvedValue({
      data: mockChartData,
    })
    const { rerender } = render(
      <AlertStatus_Chart
        caseIdList={mockCaseIdList}
        refresh={false}
        startDate={mockStartDate}
      />,
    )
    await waitFor(() => {
      expect(getAlertStatisticsForRole).toHaveBeenCalledTimes(1)
    })
    const newStartDate = '2024-02-01'
    rerender(
      <AlertStatus_Chart
        caseIdList={mockCaseIdList}
        refresh={false}
        startDate={newStartDate}
      />,
    )
    await waitFor(() => {
      expect(getAlertStatisticsForRole).toHaveBeenCalledTimes(2)
      expect(getAlertStatisticsForRole).toHaveBeenCalledWith(
        mockCaseIdList,
        newStartDate,
      )
    })
  })
})
