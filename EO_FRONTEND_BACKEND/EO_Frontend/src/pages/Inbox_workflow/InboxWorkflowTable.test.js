import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import InboxWorkflowTable from './InboxWorkflowTable'

const headers = ['Header1', 'Header2']
const customColumnWidths = [50, 50]
const tooltipData = [
  {
    name: 'Header1',
    id: 'tooltip-1',
    content: 'Tooltip Content 1',
    icon: '/path/to/icon1.png',
  },
]

const tableData = [
  <tr key='1'>
    <td>Row 1 Col 1</td>
    <td>Row 1 Col 2</td>
  </tr>,
]

describe('InboxWorkflowTable', () => {
  it('renders headers with tooltip when present', () => {
    render(
      <InboxWorkflowTable
        headers={headers}
        customColumnWidths={customColumnWidths}
        showLoader={false}
        tooltipData={tooltipData}
        tableData={tableData}
      />,
    )

    // Tooltip icon should be rendered for Header1
    const tooltipIcon = screen.getByRole('img')
    expect(tooltipIcon).toBeInTheDocument()

    // Header2 should be rendered without tooltip
    expect(screen.getByText('Header2')).toBeInTheDocument()
  })

  it('renders loader when showLoader is true', () => {
    render(
      <InboxWorkflowTable
        headers={headers}
        customColumnWidths={customColumnWidths}
        showLoader={true}
        tooltipData={[]}
        tableData={[]}
      />,
    )

    // expect(screen.getByRole('row')).toBeInTheDocument(); // Loader row
  })

  it('renders with Empty Data', () => {
    render(
      <InboxWorkflowTable
        headers={headers}
        customColumnWidths={[]}
        showLoader={false}
        tooltipData={[]}
        tableData={[]}
      />,
    )
  })

  it('renders table rows when data is present', () => {
    render(
      <InboxWorkflowTable
        headers={headers}
        customColumnWidths={customColumnWidths}
        showLoader={false}
        tooltipData={[]}
        tableData={tableData}
      />,
    )

    expect(screen.getByText('Row 1 Col 1')).toBeInTheDocument()
    expect(screen.getByText('Row 1 Col 2')).toBeInTheDocument()
  })

  it('renders "No Data To Show." when tableData is empty and showLoader is false', () => {
    render(
      <InboxWorkflowTable
        headers={headers}
        customColumnWidths={customColumnWidths}
        showLoader={false}
        tooltipData={[]}
        tableData={[]}
      />,
    )

    expect(screen.getByText(/No Data To Show/i)).toBeInTheDocument()
  })

  it('does not show "No Data To Show." if loader is still visible', () => {
    render(
      <InboxWorkflowTable
        headers={headers}
        customColumnWidths={customColumnWidths}
        showLoader={true}
        tooltipData={[]}
        tableData={[]}
      />,
    )

    expect(screen.queryByText(/No Data To Show/i)).not.toBeInTheDocument()
  })
})
