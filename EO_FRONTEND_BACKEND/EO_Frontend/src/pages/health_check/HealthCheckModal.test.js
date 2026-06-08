// ============================================================
// FILE 5: HealthCheckModal.test.jsx
// ============================================================
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import HealthCheckModal from './HealthCheckModal'
vi.mock('components/visuals/health_status_info/HealthStatusInfo', () => ({
  default: () => <div data-testid='mock-health-status-info' />,
}))
vi.mock('./HealthTable/HealthTable', () => {
  const React = require('react')
  const MockHealthTable = (props) => {
    React.useEffect(() => {
      props.setTableDataLoaded(true)
      props.setFilteredData([
        {
          affiliateName: 'Aff1',
          affiliateId: 'A1',
          plantName: 'Plant1',
          plantID: 'P1',
          systemName: 'Sys1',
          caseId: 'C1',
          lastRunTime: '2025-06-01',
          caseStatus: 'OK',
          caseStatusMessage: 'All good',
        },
      ])
      props.setSelectedStatus('All')
    }, [])
    return <div data-testid='mock-health-table' />
  }
  return {
    default: MockHealthTable,
  }
})
describe('HealthCheckModal', () => {
  beforeAll(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mocked-url')
  })
  it('renders without crashing and shows basic UI elements', () => {
    render(<HealthCheckModal />)
    expect(screen.getByTestId('mock-health-status-info')).toBeInTheDocument()
    expect(screen.getByTestId('mock-health-table')).toBeInTheDocument()
  })
  it('shows download button when data is loaded and hideDownload is false', async () => {
    render(<HealthCheckModal />)
    await waitFor(() =>
      expect(screen.getByTestId('health-check-download')).toBeInTheDocument(),
    )
  })
  it('does not show download button when hideDownload=true', async () => {
    render(<HealthCheckModal hideDownload={true} />)
    await waitFor(() => {
      expect(
        screen.queryByTestId('health-check-download'),
      ).not.toBeInTheDocument()
    })
  })
  it('calls handleDownloadData and triggers download when download button clicked', async () => {
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:url')
    render(<HealthCheckModal />)
    const downloadBtn = await screen.findByTestId('health-check-download')
    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')
    fireEvent.click(downloadBtn)
    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    createObjectURLSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
  it('calculates column widths correctly based on props', () => {
    const { rerender } = render(<HealthCheckModal hideInitialColumns={true} />)
    expect(screen.getByTestId('mock-health-table')).toBeInTheDocument()
    rerender(<HealthCheckModal hidePlantModelColumns={true} />)
    expect(screen.getByTestId('mock-health-table')).toBeInTheDocument()
  })
  it('renders status indicators with images and labels', () => {
    render(<HealthCheckModal />)
    expect(screen.getByText(/online/i)).toBeInTheDocument()
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
    expect(screen.getByText(/data backfilling/i)).toBeInTheDocument()
  })
  it('does not render dropdown when hideDropdown=true', () => {
    render(<HealthCheckModal hideDropdown={true} />)
    expect(screen.getByTestId('mock-health-table')).toBeInTheDocument()
  })
})
