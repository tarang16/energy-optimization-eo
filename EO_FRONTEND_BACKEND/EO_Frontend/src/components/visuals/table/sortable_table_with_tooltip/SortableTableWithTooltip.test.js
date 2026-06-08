import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest' // adjust path
import SortableTableWithTooltip from './SortableTableWithTooltip'

vi.mock('components/visuals/dropdown/multi_select/MultiSelectV2', () => ({
  default: (props) => (
    <div data-testid='multi-select'>{JSON.stringify(props.data)}</div>
  ),
}))

vi.mock('components/ui/loader/TableLoader', () => ({
  TableLoader: ({ colspan }) => (
    <tr>
      <td colSpan={colspan}>Loading...</td>
    </tr>
  ),
}))

describe('SortableTableWithTooltip', () => {
  const headers = [{ title: 'Column 1' }, { title: 'Column 2' }]

  const data = [
    ['Data 1.1', 'Data 1.2'],
    ['Data 2.1', 'Data 2.2'],
  ]

  it('renders table headers and data rows correctly', () => {
    render(
      <SortableTableWithTooltip
        data={data}
        headers={headers}
        customColumnWidths={[50, 50]}
      />,
    )
    expect(screen.getByText('Column 1')).toBeInTheDocument()
    expect(screen.getByText('Data 2.2')).toBeInTheDocument()
  })

  it('renders search boxes if specified in headerSearchBoxes', () => {
    render(
      <SortableTableWithTooltip
        data={data}
        headers={headers}
        headerSearchBoxes={[0]}
        customColumnWidths={[50, 50]}
        handleSearchChange={vi.fn()}
      />,
    )
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
  })

  it('renders MultiSelect dropdown if headerDropDowns provided', () => {
    const headerDropDowns = {
      0: {
        dropDownData: [{ label: 'Option 1', value: '1' }],
        onChange: vi.fn(),
      },
    }

    render(
      <SortableTableWithTooltip
        data={data}
        headers={headers}
        headerDropDowns={headerDropDowns}
        customColumnWidths={[50, 50]}
      />,
    )

    expect(screen.getByTestId('multi-select')).toBeInTheDocument()
  })

  it('shows "No Data To Show" if data is empty and not loading', () => {
    render(
      <SortableTableWithTooltip
        data={[]}
        headers={headers}
        customColumnWidths={[50, 50]}
        showLoader={false}
      />,
    )
    expect(screen.getByText('No Data To Show.')).toBeInTheDocument()
  })

  it('shows loader when showLoader is true', () => {
    render(
      <SortableTableWithTooltip
        data={data}
        headers={headers}
        customColumnWidths={[50, 50]}
        showLoader={true}
      />,
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('handles header input debounce and calls handleSearchChange', async () => {
    const mockHandleSearchChange = vi.fn()

    render(
      <SortableTableWithTooltip
        data={data}
        headers={headers}
        headerSearchBoxes={[0]}
        customColumnWidths={[50, 50]}
        handleSearchChange={mockHandleSearchChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText('Search')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    await waitFor(
      () => {
        expect(mockHandleSearchChange).toHaveBeenCalledWith('test', '0')
      },
      { timeout: 2000 },
    )
  })

  it('calculates default column widths if customColumnWidths is empty', () => {
    const headers = [
      { title: 'Header 1' },
      { title: 'Header 2' },
      { title: 'Header 3' },
    ]

    const data = [['A', 'B', 'C']]
    const customWidths = []

    render(
      <SortableTableWithTooltip
        data={data}
        headers={headers}
        customColumnWidths={customWidths}
        showLoader={false}
      />,
    )
    const thElements = screen.getAllByRole('columnheader')
    expect(thElements).toHaveLength(3)
  })

  it('applies rowSpan to cell if defined in rowSpanCells', () => {
    const headers = [{ title: 'Header 1' }, { title: 'Header 2' }]

    const data = [
      ['A1', 'B1'],
      ['A2', 'B2'],
    ]

    const rowSpanCells = {
      '01': 2,
    }

    render(
      <SortableTableWithTooltip
        data={data}
        headers={headers}
        customColumnWidths={[50, 50]}
        rowSpanCells={rowSpanCells}
        showLoader={false}
      />,
    )

    const cells = screen.getAllByRole('cell')
    const spannedCell = cells.find((cell) => cell.textContent === 'B1')

    expect(spannedCell).toBeInTheDocument()
  })

  it('sets loading to false when containerRef is available', async () => {
    const headers = [{ title: 'Header 1' }, { title: 'Header 2' }]
    const data = [['A', 'B']]

    await act(async () => {
      render(
        <SortableTableWithTooltip
          data={data}
          headers={headers}
          customColumnWidths={[50, 50]}
          showLoader={false}
        />,
      )
    })

    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('renders additional fixed header row when additionalFixedHeader is provided', () => {
    const headers = [{ title: 'H1' }, { title: 'H2' }]
    const data = [['A', 'B']]
    const additionalFixedHeader = [
      { title: 'Fixed 1', colSpan: 1 },
      { title: 'Fixed 2', colSpan: 1 },
    ]

    render(
      <SortableTableWithTooltip
        data={data}
        headers={headers}
        customColumnWidths={[50, 50]}
        additionalFixedHeader={additionalFixedHeader}
        leftAlignHeaders={[0]} // force one to be left aligned
        showLoader={false}
      />,
    )

    // Check that additional fixed header titles render
    expect(screen.getByText('Fixed 1')).toBeInTheDocument()
    expect(screen.getByText('Fixed 2')).toBeInTheDocument()

    // Check correct class applied for left-aligned header
    const ths = screen.getAllByRole('columnheader')
    expect(ths[0].className).toMatch(/text-start/)
    expect(ths[1].className).toMatch(/text-center/)
  })
})
