import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import AccordianExpandableTable from './AccordianExpandableTable'

// Mock SVG imports
vi.mock('assets/sabic_icons/table/table_minus_icon.svg', () => ({
  default: () => 'minusIcon.svg',
}))
vi.mock('assets/sabic_icons/table/table_plus_icon.svg', () => ({
  default: () => 'plusIcon.svg',
}))
// Sample props

const headers = [
  { key: 'col1', label: 'Column 1' },
  { key: 'col2', label: 'Column 2' },
  { key: 'col3', label: 'Column 3' },
]
const data = [
  {
    data: ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
    children: [
      ['Child 1.1', 'Child 1.2', 'Child 1.3'],
      ['Child 1.4', 'Child 1.5', 'Child 1.6'],
    ],
  },
  {
    data: ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3'],
    children: [],
  },
]

describe('AccordianExpandableTable', () => {
  test('renders table headers', () => {
    render(
      <AccordianExpandableTable
        headers={headers}
        data={data}
        expandedRowsKey={{}}
        customColumnWidths={[33, 33, 34]}
      />,
    )
    headers.forEach((header) => {
      expect(screen.getByText(header.label)).toBeInTheDocument()
    })
  })

  test('renders main rows', () => {
    render(
      <AccordianExpandableTable
        headers={headers}
        data={data}
        expandedRowsKey={{}}
        customColumnWidths={[33, 33, 34]}
      />,
    )
    expect(screen.getByText('Row 1 Col 1')).toBeInTheDocument()
    expect(screen.getByText('Row 2 Col 1')).toBeInTheDocument()
  })

  test('renders plus icon for rows with children', () => {
    render(
      <AccordianExpandableTable
        headers={headers}
        data={data}
        expandedRowsKey={{}}
        customColumnWidths={[33, 33, 34]}
      />,
    )
    const expandIcon = screen.getAllByAltText('Expand')
    expect(expandIcon.length).toBeGreaterThan(0)
  })

  test('does not render icon for rows without children', () => {
    render(
      <AccordianExpandableTable
        headers={headers}
        data={data}
        expandedRowsKey={{}}
        customColumnWidths={[33, 33, 34]}
      />,
    )
    // Row 2 has no children so it should not have an expand/collapse icon
    expect(screen.queryAllByAltText('Expand').length).toBe(1)
  })

  test('expands and shows child rows on click', () => {
    render(
      <AccordianExpandableTable
        headers={headers}
        data={data}
        expandedRowsKey={{}}
        customColumnWidths={[33, 33, 34]}
      />,
    )
    expect(screen.queryByText('Child 1.1')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Row 1 Col 1'))
    expect(screen.getByText('Child 1.1')).toBeInTheDocument()
    expect(screen.getByText('Child 1.5')).toBeInTheDocument()
  })

  test('uses initial expandedRowsKey to pre-expand rows', () => {
    render(
      <AccordianExpandableTable
        headers={headers}
        data={data}
        expandedRowsKey={{ 0: true }}
        customColumnWidths={[33, 33, 34]}
      />,
    )
    expect(screen.getByText('Child 1.1')).toBeInTheDocument()
    expect(screen.getByAltText('Collapse')).toBeInTheDocument()
  })

  test('toggles icon between plus and minus on expand/collapse', () => {
    render(
      <AccordianExpandableTable
        headers={headers}
        data={data}
        expandedRowsKey={{}}
        customColumnWidths={[33, 33, 34]}
      />,
    )
    const icon = screen.getByAltText('Expand')
    expect(icon).toBeInTheDocument()
    fireEvent.click(screen.getByText('Row 1 Col 1'))
    expect(screen.getByAltText('Collapse')).toBeInTheDocument()
  })
})

describe('AccordianExpandableTable', () => {
  const baseHeaders = [
    { key: 'col1', label: 'Column 1' },
    { key: 'col2', label: 'Column 2' },
    { key: 'col3', label: 'Column 3' },
    { key: 'col4', label: 'Column 4' },
  ]

  test('renders table with fallback JSON.stringify(item.data) key when item.data[0] is undefined', () => {
    const data = [
      {
        data: [undefined, 'Value B', 'Value C', 'Value d'],
        children: [['Child A1', 'Child B1', 'Child C1', 'Child d1']],
      },
    ]
    render(
      <AccordianExpandableTable
        headers={baseHeaders}
        data={data}
        expandedRowsKey={{}}
        customColumnWidths={[25, 25, 30, 20]}
      />,
    )
    expect(screen.getByText('Value B')).toBeInTheDocument()
  })

  test('applies getColumnStyles correctly when headers.length is 2', () => {
    const headers2 = [
      { key: 'col1', label: 'Column A' },
      { key: 'col2', label: 'Column B' },
    ]

    const data = [
      {
        data: ['Data A', 'Data B'],
        children: [],
      },
    ]
    const { container } = render(
      <AccordianExpandableTable
        headers={headers2}
        data={data}
        expandedRowsKey={{}}
        customColumnWidths={[50, 50]}
      />,
    )
    const tds = container.querySelectorAll('tbody tr td')
    expect(tds.length).toBe(2)
    expect(tds[0].style.width).toBe('') // uses fixed height
    expect(tds[1].style.width).toBe('40%') // from getColumnStyles logic
  })

  test('handles empty headers, customColumnWidths, and expandedRowsKey gracefully', () => {
    const data = [
      {
        data: ['Row 1 Cell 1', 'Row 1 Cell 2'],
        children: [['Child Cell 1', 'Child Cell 2']],
      },
    ]

    render(
      <AccordianExpandableTable
        headers={[]} // default
        customColumnWidths={[]} // default
        expandedRowsKey={{}} // default
        data={data}
      />,
    )

    // Should render data even if headers are empty (no <th>)
    expect(screen.getByText('Row 1 Cell 1')).toBeInTheDocument()
    expect(screen.getByText('Row 1 Cell 2')).toBeInTheDocument()

    // Should not throw error or render <th>
    const headers = screen.queryAllByRole('columnheader')
    expect(headers.length).toBe(0)

    // Clicking should still toggle expand/collapse
    fireEvent.click(screen.getByText('Row 1 Cell 1'))
    expect(screen.getByText('Child Cell 1')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Row 1 Cell 1'))
    expect(screen.queryByText('Child Cell 1')).not.toBeInTheDocument()
  })

  test('applies getColumnStyles correctly when headers.length is 3', () => {
    const headers3 = [
      { key: 'col1', label: 'Column A' },
      { key: 'col2', label: 'Column B' },
      { key: 'col3', label: 'Column C' },
    ]
    const data = [
      {
        data: ['A', 'B', 'C'],
        children: [],
      },
    ]
    const { container } = render(
      <AccordianExpandableTable
        headers={headers3}
        data={data}
        expandedRowsKey={{}}
        customColumnWidths={[25, 25, 30, 20]}
      />,
    )
    const tds = container.querySelectorAll('tbody tr td')
    expect(tds[1].style.width).toBe('30%')
    expect(tds[2].style.width).toBe('10%')
  })

  test('expands and collapses rows when clicked', () => {
    const data = [
      {
        data: ['Parent 1', 'P1-B', 'P1-C'],
        children: [['Child 1', 'Child 2', 'Child 3']],
      },
    ]
    render(
      <AccordianExpandableTable
        headers={baseHeaders}
        data={data}
        expandedRowsKey={{}}
        customColumnWidths={[25, 25, 30, 20]}
      />,
    )
    // Initially collapsed
    expect(screen.queryByText('Child 1')).not.toBeInTheDocument()
    // Expand
    fireEvent.click(screen.getByText('Parent 1'))
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    // Collapse
    fireEvent.click(screen.getByText('Parent 1'))
    expect(screen.queryByText('Child 1')).not.toBeInTheDocument()
  })
})
