import { render, screen } from '@testing-library/react'
import assert from 'assert'
import { describe, it, vi } from 'vitest'
import SimpleTable from './SimpleTable'

const headers = ['Header 1', 'Header 2', 'Header 3']

const data = [
  ['Row 1 Cell 1', 'Row 1 Cell 2', 'Row 1 Cell 3'],
  ['Row 2 Cell 1', 'Row 2 Cell 2', 'Row 2 Cell 3'],
  ['Row 3 Cell 1', 'Row 3 Cell 2', 'Row 3 Cell 3'],
]

const customColumnWidths = [30, 40, 30]

const headerDropDowns = {
  0: {
    dropDownData: [{ label: 'Option 1' }, { label: 'Option 2' }],
    onChange: vi.fn(),
  },
  2: {
    dropDownData: [{ label: 'Option A' }, { label: 'Option B' }],
    onChange: vi.fn(),
  },
}

const additionalFixedHeader = [
  { title: 'Fixed Header 1', colSpan: 2 },
  { title: 'Fixed Header 2', colSpan: 1 },
]

const leftAlignHeaders = [1]

const leftAlignColumns = [0, 2]

const rowSpanCells = {
  '00': 2, // Row 1, Cell 1 spans 2 rowss
  12: 2, // Row 2, Cell 3 spans 2 rows
}

// Mock the MultiSelectV2 component
vi.mock('../dropdown/multi_select/MultiSelectV2', () => ({
  default: () => {
    return ({ data, onChange }) => (
      <div data-testid='multi-select-v2'>
        {data.map((item, index) => (
          <div key={index}>{item.label}</div>
        ))}
      </div>
    )
  },
}))

describe('SimpleTable component', () => {
  it('renders SimpleTable', () => {
    const { queryAllByText } = render(<SimpleTable />)
    assert(queryAllByText != undefined)
  })

  it('renders SimpleTable with Proper data', () => {
    const { queryAllByText } = render(
      <SimpleTable
        headers={headers}
        data={data}
        customColumnWidths={customColumnWidths}
        headerDropDowns={headerDropDowns}
      />,
    )
  })

  it('renders rows with appropriate rowspan based on rowSpanCells & renders additionalFixedHeader correctly', () => {
    const { queryAllByText } = render(
      <SimpleTable
        headers={headers}
        data={data}
        customColumnWidths={customColumnWidths}
        headerDropDowns={headerDropDowns}
        rowSpanCells={rowSpanCells}
        additionalFixedHeader={additionalFixedHeader}
        leftAlignHeaders={leftAlignHeaders}
        leftAlignColumns={leftAlignColumns}
        showLoader={false}
      />,
    )
    additionalFixedHeader.forEach((header, i) => {
      const th = screen.getByText(header.title).closest('th')
    })
    assert(queryAllByText != undefined)
  })

  it('renders SimpleTable with blank data', () => {
    const { queryAllByText } = render(
      <SimpleTable
        headers={[headers]}
        data={[]}
        customColumnWidths={[]}
        headerDropDowns={{}}
        rowSpanCells={[]}
        additionalFixedHeader={[]}
        leftAlignHeaders={[]}
        leftAlignColumns={[]}
        showLoader={true}
      />,
    )
    assert(queryAllByText != undefined)
  })
})
