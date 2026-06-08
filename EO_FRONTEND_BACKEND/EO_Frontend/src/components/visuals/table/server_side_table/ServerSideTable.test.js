import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import moment from 'moment'
import { MemoryRouter } from 'react-router-dom'
import * as CurrentServices from 'services/CurrentServices'
import { describe, expect, test, vi } from 'vitest'
import {
  mock_serverSideErrorLoggingData,
  mock_serverSideErrorLoggingHeaders,
  mock_serverSideTableData,
  mock_serverSideTableHeader,
  mock_serverSideWithSessionTableHeader,
} from '../../../../index.test'
import ServerSideTable from './ServerSideTable'

vi.mock('services/CurrentServices', () => ({
  getMonitoringData: vi.fn(),
  getAssetStatus: vi.fn(),
}))
const mockDataFn = vi.fn().mockResolvedValue({ data: [] })
const onSessionIdClick = vi.fn()

describe('ServerSideTable Component', () => {
  test('Expand icon click', async () => {
    CurrentServices.getMonitoringData.mockResolvedValueOnce(
      mock_serverSideTableData,
    )
    await act(async () => {
      render(
        <MemoryRouter>
          <ServerSideTable
            dataFn={CurrentServices.getMonitoringData}
            refetch={false}
            clickableColumns={['sessionID']}
            onSessionIdClick={onSessionIdClick}
            headers={mock_serverSideTableHeader}
          />
        </MemoryRouter>,
      )
    })
    // await waitFor(() => {
    //   const searchBox = document.querySelector(".searchImgBox input");
    //   fireEvent.change(searchBox, { target: { value: "Testing input field" } });
    //   const expandIcons = screen.getAllByTestId("expand-icon");
    //   fireEvent.click(expandIcons[0]);
    // });
  })

  test('renders without session id and no data', async () => {
    CurrentServices.getMonitoringData.mockResolvedValueOnce({
      data: [],
      errormsg: '',
      statuscode: 200,
      pageNumber: 1,
      pageSize: 20,
      pageCount: 0,
    })
    await act(async () => {
      render(
        <MemoryRouter>
          <ServerSideTable
            dataFn={CurrentServices.getMonitoringData}
            refetch={false}
            clickableColumns={['sessionID']}
            headers={mock_serverSideTableHeader}
          />
        </MemoryRouter>,
      )
    })
  })

  test('renders with action column', async () => {
    CurrentServices.getMonitoringData.mockResolvedValueOnce(
      mock_serverSideErrorLoggingData,
    )
    await act(async () => {
      render(
        <MemoryRouter>
          <ServerSideTable
            dataFn={CurrentServices.getMonitoringData}
            refetch={false}
            clickableColumns={['lastName']}
            onSessionIdClick={onSessionIdClick}
            headers={mock_serverSideErrorLoggingHeaders}
          />
        </MemoryRouter>,
      )
    })
    const actionButtons = await screen.findAllByTestId('table-action-button')
    const clickableLinks = await screen.findAllByTestId('clickable-lastName')
    fireEvent.click(clickableLinks[0])
    fireEvent.click(actionButtons[0])
  })

  test('renders with session id and no data', async () => {
    CurrentServices.getAssetStatus.mockResolvedValueOnce({
      data: [],
      errormsg: '',
      statuscode: 200,
      pageNumber: 1,
      pageSize: 20,
      pageCount: 16522,
    })
    await act(async () => {
      render(
        <MemoryRouter>
          <ServerSideTable
            dataFn={CurrentServices.getAssetStatus}
            refetch={false}
            clickableColumns={['sessionID']}
            onSessionIdClick={onSessionIdClick}
            headers={mock_serverSideWithSessionTableHeader}
            sessionId='some-session-id'
          />
        </MemoryRouter>,
      )
    })
  })

  test('handles cancel date', async () => {
    const defaultProps = {
      dataFn: mockDataFn,
      headers: [{ title: 'Date', data: 'date', date: true, search: true }],
      clickableColumns: [],
      onSessionIdClick: vi.fn(),
      sessionId: '',
      refetch: false,
      allSearchFalse: false,
      maxRecords: 20,
      calledBy: 'Test',
    }
    render(
      <MemoryRouter>
        <ServerSideTable {...defaultProps} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByTestId('Date-Field'))
    const date = moment('2023-01-01').toDate()
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: moment(date).format('DD-MMM-YY hh:mm A') },
    })
    expect(screen.getByRole('textbox').value).toBe(
      moment(date).format('DD-MMM-YY hh:mm A'),
    )
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    await waitFor(() => {
      expect(screen.getByRole('textbox').value).toBe('')
    })
  })

  test('handles cell change for date input', async () => {
    const defaultProps = {
      dataFn: mockDataFn,
      headers: [
        { title: 'Date', data: 'date', date: true, search: true },
        { title: 'Name', data: 'name', search: true },
      ],
      clickableColumns: [],
      onSessionIdClick: vi.fn(),
      sessionId: '',
      refetch: false,
      allSearchFalse: false,
      maxRecords: 20,
      calledBy: 'Test',
    }
    const { container } = render(
      <MemoryRouter>
        <ServerSideTable {...defaultProps} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByTestId('Date-Field'))
    const date = moment('2023-01-01').toDate()
    fireEvent.change(container.querySelector('input[type="text"]'), {
      target: { value: moment(date).format('DD-MMM-YY hh:mm A') },
    })
    const submitButton = container.querySelector('.submitBtn')
    // fireEvent.click(submitButton);
    // await waitFor(() => {
    //   // Optional: validate query params if needed
    // });
  })
})
