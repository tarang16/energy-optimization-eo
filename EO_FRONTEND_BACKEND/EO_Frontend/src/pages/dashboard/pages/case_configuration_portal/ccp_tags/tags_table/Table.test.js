import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DataTable from './Table'

// Mock assets and styles
vi.mock('assets/sabic_icons/common/timeInfo.svg', () => ({
  default: 'infoIcon',
}))
vi.mock('assets/sabic_icons/header/edit_default_icon.svg', () => ({
  default: 'editIcon',
}))
vi.mock('../TableWithSearch.module.scss', () => ({
  default: {
    DataTableContainer: 'DataTableContainer',
    table_block: 'table_block',
    table: 'table',
    sticky_table: 'sticky_table',
    align_table_cell: 'align_table_cell',
    table_body: 'table_body',
    editBtnImage: 'editBtnImage',
    dropdowncontainer: 'dropdowncontainer',
  },
}))

// Mock SingleSelect component
vi.mock('components/visuals/dropdown/single_select/SingleSelect', () => ({
  default: () => <div data-testid='single-select'>SingleSelect</div>,
}))

// Mock Loader component
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

describe('DataTable Component', () => {
  const headers = [
    { title: 'Name', field: 'name' },
    { title: 'Type', field: 'type' },
    { title: 'PI Name', field: 'piName' },
    { title: 'Action', field: 'action' },
  ]

  const data = [
    { name: 'Sensor A', type: 'Analog', piName: 'PI-123', tagType: 'manual' },
    {
      name: 'Sensor B',
      type: 'Digital',
      piName: 'PI-456',
      tagType: 'inferred',
      inferredExpression: 'Expr-456',
    },
  ]

  const tagTypes = ['manual', 'inferred']

  const mockHandleTagChange = vi.fn()
  const mockOnInfoClick = vi.fn()
  const mockOnEditClick = vi.fn()
  const mockOnDeleteClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders table with data correctly', () => {
    render(
      <DataTable
        data={data}
        headers={headers}
        tagTypes={tagTypes}
        handleTagChange={mockHandleTagChange}
        onInfoClick={mockOnInfoClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
        canEdit={true}
        leftAlignColumns={[0, 2]}
        customColumnWidths={[25, 25, 25, 25]}
        leftAlignHeaders={[0, 2]}
        isLoading={false}
      />,
    )

    // Check headers
    headers.forEach(({ title }) => {
      expect(screen.getByText(title.toUpperCase())).toBeInTheDocument()
    })

    // Check data rows
    expect(screen.getByText('Sensor A')).toBeInTheDocument()
    expect(screen.getByText('Analog')).toBeInTheDocument()
    expect(screen.getByText('PI-123')).toBeInTheDocument()

    expect(screen.getByText('Sensor B')).toBeInTheDocument()
    expect(screen.getByText('Digital')).toBeInTheDocument()
    expect(screen.getByText('Expr-456')).toBeInTheDocument()

    // Check action buttons
    const infoButtons = screen.getAllByRole('button', { name: /infoIcon/i })
    expect(infoButtons.length).toBe(2)

    const editButtons = screen.getAllByRole('button', { name: /edit icon/i })
    expect(editButtons.length).toBe(2)
  })

  test('renders loader when isLoading is true', () => {
    render(
      <DataTable
        data={[]}
        headers={headers}
        tagTypes={tagTypes}
        handleTagChange={mockHandleTagChange}
        onInfoClick={mockOnInfoClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
        canEdit={true}
        leftAlignColumns={[0, 2]}
        customColumnWidths={[25, 25, 25, 25]}
        leftAlignHeaders={[0, 2]}
        isLoading={true}
      />,
    )

    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  test('renders "No Data to show" when data is empty', () => {
    render(
      <DataTable
        data={[]}
        headers={headers}
        tagTypes={tagTypes}
        handleTagChange={mockHandleTagChange}
        onInfoClick={mockOnInfoClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
        canEdit={true}
        leftAlignColumns={[0, 2]}
        customColumnWidths={[25, 25, 25, 25]}
        leftAlignHeaders={[0, 2]}
        isLoading={false}
      />,
    )

    expect(screen.getByText('No Data to show')).toBeInTheDocument()
  })

  test('calls onInfoClick when info button is clicked', () => {
    render(
      <DataTable
        data={data}
        headers={headers}
        tagTypes={tagTypes}
        handleTagChange={mockHandleTagChange}
        onInfoClick={mockOnInfoClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
        canEdit={true}
        leftAlignColumns={[0, 2]}
        customColumnWidths={[25, 25, 25, 25]}
        leftAlignHeaders={[0, 2]}
        isLoading={false}
      />,
    )

    const infoButtons = screen.getAllByRole('button', { name: /infoIcon/i })
    fireEvent.click(infoButtons[0])
    expect(mockOnInfoClick).toHaveBeenCalledWith(data[0])
  })

  test('calls onEditClick when edit button is clicked and canEdit is true', () => {
    render(
      <DataTable
        data={data}
        headers={headers}
        tagTypes={tagTypes}
        handleTagChange={mockHandleTagChange}
        onInfoClick={mockOnInfoClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
        canEdit={true}
        leftAlignColumns={[0, 2]}
        customColumnWidths={[25, 25, 25, 25]}
        leftAlignHeaders={[0, 2]}
        isLoading={false}
      />,
    )

    const editButtons = screen.getAllByRole('button', { name: /edit icon/i })
    fireEvent.click(editButtons[0])
    expect(mockOnEditClick).toHaveBeenCalledWith(data[0])
  })

  test('does not call onEditClick when canEdit is false', () => {
    render(
      <DataTable
        data={data}
        headers={headers}
        tagTypes={tagTypes}
        handleTagChange={mockHandleTagChange}
        onInfoClick={mockOnInfoClick}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
        canEdit={false}
        leftAlignColumns={[0, 2]}
        customColumnWidths={[25, 25, 25, 25]}
        leftAlignHeaders={[0, 2]}
        isLoading={false}
      />,
    )

    const editButtons = screen.getAllByRole('button', { name: /edit icon/i })
    fireEvent.click(editButtons[0])
    expect(mockOnEditClick).not.toHaveBeenCalled()
  })
})
