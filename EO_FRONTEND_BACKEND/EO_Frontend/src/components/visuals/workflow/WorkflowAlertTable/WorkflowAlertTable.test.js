import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, test, vi } from 'vitest'
import { mock_getWfAlertHistoricalDataAllUser } from '../../../../index.test'
import WorkflowAlertTable from './WorkflowAlertTable'

let mockData = mock_getWfAlertHistoricalDataAllUser
vi.mock('services/WorkflowServices', () => ({
  getWfAlertHistoricalDataAllUser: () => mockData,
}))

describe('WorkflowAlertTable component', () => {
  test('renders WorkflowAlertTable', async () => {
    act(() => {
      render(<WorkflowAlertTable alertModalId={925} />)
    })

    await waitFor(() => {
      const tableRow = screen.getByTestId('tableRow-0')
      fireEvent.mouseDown(tableRow)
    })
  })

  test('renders WorkflowAlertTable wihout alertId', async () => {
    act(() => {
      render(<WorkflowAlertTable />)
    })
  })
})
