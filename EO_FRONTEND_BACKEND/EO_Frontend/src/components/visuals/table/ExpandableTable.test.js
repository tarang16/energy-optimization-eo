import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ExpandableTable from './ExpandableTable'

// Mock icons
vi.mock('assets/sabic_icons/table/table_minus_icon.svg', () => ({
  default: () => 'minusIcon.svg',
}))
vi.mock('assets/sabic_icons/table/table_plus_icon.svg', () => ({
  default: () => 'plusIcon.svg',
}))

describe('ExpandableTable', () => {
  const headers = [
    { key: 'col1', label: 'Column 1' },
    { key: 'col2', label: 'Column 2', uom: 'UOM' },
  ]

  const data = [
    {
      data: ['Parent 1', 'Value 1'],
      children: [
        ['Child 1.1', 'Subvalue 1.1'],
        ['Child 1.2', 'Subvalue 1.2'],
      ],
    },
    {
      data: ['Parent 2', 'Value 2'],
      children: [],
    },
  ]

  it('renders headers correctly', () => {
    render(
      <ExpandableTable
        headers={headers}
        data={data}
        customColumnWidths={[50, 50]}
      />,
    )
    expect(screen.getByText('Column 1')).toBeInTheDocument()
    expect(screen.getByText('Column 2')).toBeInTheDocument()
    expect(screen.getByText('UOM')).toBeInTheDocument()
  })

  it('renders parent rows but hides children initially', () => {
    render(
      <ExpandableTable
        headers={headers}
        data={data}
        customColumnWidths={[50, 50]}
      />,
    )
    expect(screen.getByText('Parent 1')).toBeInTheDocument()
    expect(screen.getByText('Parent 2')).toBeInTheDocument()
    expect(screen.queryByText('Child 1.1')).not.toBeInTheDocument()
  })

  it('expands and collapses rows on click', () => {
    render(
      <ExpandableTable
        headers={headers}
        data={data}
        customColumnWidths={[50, 50]}
        expandedRowsKey={{}}
      />,
    )

    const parentRow = screen.getByText('Parent 1').closest('tr')
    fireEvent.click(parentRow)

    // Children should now appear
    expect(screen.getByText('Child 1.1')).toBeInTheDocument()
    expect(screen.getByText('Subvalue 1.2')).toBeInTheDocument()

    // Collapse again
    fireEvent.click(parentRow)

    // Children should disappear
    expect(screen.queryByText('Child 1.1')).not.toBeInTheDocument()
  })

  it('handles no children gracefully', () => {
    render(
      <ExpandableTable
        headers={headers}
        data={data}
        customColumnWidths={[50, 50]}
      />,
    )
    expect(screen.queryByAltText('Expand')).toBeInTheDocument() // for Parent 1
    expect(screen.queryAllByAltText('Expand')).toHaveLength(1) // only one expand icon
  })
})
