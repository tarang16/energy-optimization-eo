import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AuditLogs from './AuditLogs'
import * as CCPServices from 'services/CCPServices'
import * as LoggingService from 'services/LoggingService'
import * as HelperFunctions from './CaseConfigurationPortal.functions'
import Logger from 'logger/Logger'
import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'

vi.mock('services/CCPServices')
vi.mock('services/LoggingService')
vi.mock('./CaseConfigurationPortal.functions')
vi.mock('logger/Logger')

describe('AuditLogs component', () => {
  const mockLogs = [{ id: 1, message: 'Test Log' }]
  const mockDefaultData = { key1: 'value1' }

  beforeEach(() => {
    CCPServices.getCcpInfo.mockResolvedValue({
      statuscode: 200,
      data: { foo: 'bar' },
    })
    CCPServices.getDefaultValue.mockResolvedValue({
      data: btoa(JSON.stringify(mockDefaultData)),
    })
    LoggingService.getAuditLog.mockResolvedValue({ data: mockLogs })
    HelperFunctions.generateLogsTableData.mockReturnValue(mockLogs)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders View Logs and Reset buttons', async () => {
    render(<AuditLogs tag='testTag' tagId='123' resetFunction={vi.fn()} />)
    expect(await screen.findByText('View Logs')).toBeInTheDocument()
    expect(screen.getByText('Reset')).toBeInTheDocument()
  })

  it('disables Reset button when defaultData is empty', async () => {
    CCPServices.getDefaultValue.mockResolvedValueOnce({})
    render(<AuditLogs tag='testTag' tagId='123' resetFunction={vi.fn()} />)
    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /Reset/i })
      expect(resetButton).toBeDisabled()
    })
  })

  it('calls resetFunction with defaultData when Reset is confirmed', async () => {
    window.confirm = vi.fn(() => true)
    const mockReset = vi.fn()

    render(<AuditLogs tag='testTag' tagId='123' resetFunction={mockReset} />)
    const resetBtn = await screen.findByRole('button', { name: /Reset/i })

    await waitFor(() => {
      expect(resetBtn).not.toBeDisabled()
    })

    fireEvent.click(resetBtn)
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({ key1: 'value1' })
    })
  })

  it('does not call resetFunction if confirmation is cancelled', async () => {
    window.confirm = vi.fn(() => false)
    const mockReset = vi.fn()

    render(<AuditLogs tag='testTag' tagId='123' resetFunction={mockReset} />)
    const resetBtn = await screen.findByText('Reset')
    fireEvent.click(resetBtn)
    expect(mockReset).not.toHaveBeenCalled()
  })

  // it('opens modal and shows logs when View Logs is clicked', async () => {
  //     render(<AuditLogs tag="testTag" tagId="123" resetFunction={vi.fn()} />);
  //     const viewBtn = await screen.findByText('View Logs');
  //     fireEvent.click(viewBtn);

  //     await waitFor(() => {
  //         expect(screen.getByText('Logs Data')).toBeInTheDocument();
  //     });

  //     expect(screen.getByText('Test Log')).toBeInTheDocument();
  // });

  // it('shows Loader when loading is true and no logs yet', async () => {
  //     LoggingService.getAuditLog.mockImplementation(() => new Promise(() => { }));
  //     render(<AuditLogs tag="testTag" tagId="123" resetFunction={vi.fn()} />);
  //     await waitFor(() => {
  //         expect(screen.getByRole('status')).toBeInTheDocument();
  //     });
  // });

  // it('shows "No data to show" if logs are empty', async () => {
  //     HelperFunctions.generateLogsTableData.mockReturnValue([]);
  //     render(<AuditLogs tag="testTag" tagId="123" resetFunction={vi.fn()} />);
  //     await waitFor(() => {
  //         expect(screen.getByText(/No data to show/i)).toBeInTheDocument();
  //     });
  // });

  it('logs an error if tag or tagId is missing', () => {
    render(<AuditLogs resetFunction={vi.fn()} />)
    expect(Logger.error).toHaveBeenCalledWith('Missing configuration or tag ID')
  })

  it('does not show View Logs or Reset if props set to false', async () => {
    render(
      <AuditLogs
        tag='testTag'
        tagId='123'
        resetFunction={vi.fn()}
        showLogs={false}
        showReset={false}
      />,
    )
    expect(screen.queryByText('View Logs')).not.toBeInTheDocument()
    expect(screen.queryByText('Reset')).not.toBeInTheDocument()
  })
})
