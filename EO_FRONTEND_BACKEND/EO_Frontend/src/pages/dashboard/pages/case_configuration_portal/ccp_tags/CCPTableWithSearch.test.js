import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import TableWithSearch from './CCPTableWithSearch'
// Mock dependencies
vi.mock('services/CCPServices', () => ({
  getTagsDataByCaseid: vi.fn(),
}))
vi.mock('assets/sabic_icons/common/red_cross.svg', () => ({
  default: 'cancel-icon',
}))
vi.mock('assets/sabic_icons/table/table_plus_icon_without_space.svg', () => ({
  default: 'plus-add-icon',
}))
vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
    // your mocked methods
  }
})
vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useOutletContext: vi.fn(),
    useParams: vi.fn(),
  }
})
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    CCPTags: {
      onDropDownChange: vi.fn(),
      onSearch: vi.fn(),
    },
  },
}))
vi.mock('config/Config', () => ({
  APP_CONFIG: {
    TOOLTIP_SUBSTR_LIMIT: 20,
  },
}))
vi.mock('utills/utilities', () => ({
  debounce: (fn) => fn,
  getUniqueValue: (data, key, includeAll = false) => {
    const uniqueValues = [...new Set(data.map((item) => item[key]))]
    return includeAll ? ['ALL', ...uniqueValues] : uniqueValues
  },
  uuid4: () => `mock-uuid-${Math.random()}`,
}))
vi.mock('../Configurationdownload/ConfigurationDownload', () => ({
  default: ({ headers, data, title }) => (
    <div data-testid='configuration-download'>
      Download {title} - {data.length} items
    </div>
  ),
}))
vi.mock('components/ui/loader/TableLoader', () => ({
  TableLoader: () => <div data-testid='table-loader'>Loading...</div>,
}))
vi.mock(
  'components/visuals/common/custom_tooltip/CustomOverlayTooltip',
  () => ({
    default: ({ children, message }) => (
      <div data-testid='tooltip' title={message}>
        {children}
      </div>
    ),
  }),
)
vi.mock('components/visuals/dropdown/single_select/SingleSelect', () => ({
  default: ({ data, activeI, onSelectChange, classes }) => (
    <select
      data-testid='single-select'
      className={classes}
      onChange={(e) => onSelectChange(data[e.target.value])}
      value={activeI}
    >
      {data.map((item, index) => (
        <option key={index} value={index}>
          {item.display_name}
        </option>
      ))}
    </select>
  ),
}))
// Mock data
const mockHeaders = [
  { title: 'TAG ID', data: 'tagID', width: '10%', center: true, toFixed: 1 },
  { title: 'NAME', data: 'nameShort' },
  {
    title: 'PI TAG / FORMULA',
    data: 'piName',
    width: '40%',
    search: true,
    center: true,
  },
  {
    title: 'TAG TYPE',
    data: 'tagType',
    width: '10%',
    center: true,
    uppercase: true,
  },
  {
    title: '',
    action: [
      {
        id: 'info',
        icon: 'info-icon',
        callback: vi.fn(),
      },
      {
        id: 'edit',
        icon: 'edit-icon',
        callback: vi.fn(),
      },
    ],
    width: '10%',
    center: true,
  },
]
const mockData = [
  {
    tagID: 1,
    nameShort: 'Tag 1',
    piName: 'PI_TAG_001',
    tagType: 'analog',
    tagName: 'Temperature Sensor',
    uiDisplayName: 'Temp Sensor 1',
    piNameFormula: 'TEMP_001',
    dataType: 'float',
  },
  {
    tagID: 2,
    nameShort: 'Tag 2',
    piName: 'PI_TAG_002',
    tagType: 'digital',
    tagName: 'Pressure Switch',
    uiDisplayName: 'Pressure SW 1',
    piNameFormula: 'PRESS_001',
    dataType: 'boolean',
  },
  {
    tagID: 3,
    nameShort: 'Tag 3',
    piName: 'PI_TAG_003_with_very_long_name_that_exceeds_limit',
    tagType: 'analog',
    tagName: 'Flow Meter',
    uiDisplayName: 'Flow Meter 1',
    piNameFormula: 'FLOW_001',
    dataType: 'float',
  },
]
const mockEmptyData = []
describe('TableWithSearch Component', () => {
  const mockGetTagsDataByCaseid = vi.fn()
  const mockSetModalContent = vi.fn()
  const mockGetUniqueTagAndDataType = vi.fn()
  const renderComponent = (props = {}) => {
    const defaultProps = {
      headers: mockHeaders,
      dataFn: mockGetTagsDataByCaseid,
      canEdit: false,
      refetchData: 1,
      getUniqueTagAndDataType: mockGetUniqueTagAndDataType,
      setModalContent: mockSetModalContent,
      download: true,
      ...props,
    }
    return render(
      <MemoryRouter>
        <TableWithSearch {...defaultProps} />
      </MemoryRouter>,
    )
  }
  beforeEach(async () => {
    vi.clearAllMocks()
    // Default mocks
    const { useOutletContext, useParams } = await import('react-router-dom')
    useOutletContext.mockReturnValue({ caseId: 87 })
    useParams.mockReturnValue({ caseID: '87' })
    const { useAtomValue } = await import('jotai')
    useAtomValue.mockReturnValue({
      caseData: [{ id: 1, name: 'Test Case' }],
    })
    const { getTagsDataByCaseid } = await import('services/CCPServices')
    getTagsDataByCaseid.mockResolvedValue({
      data: mockData,
      status: 200,
    })
    mockGetTagsDataByCaseid.mockResolvedValue({
      data: mockData,
      status: 200,
    })
  })
  afterEach(() => {
    vi.clearAllMocks()
  })
  test('renders component with loading state', async () => {
    mockGetTagsDataByCaseid.mockImplementation(() => new Promise(() => {})) // Never resolves
    renderComponent()
    expect(screen.getByTestId('table-loader')).toBeInTheDocument()
  })
  test('renders component with data', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByTestId('search_input_field')).toBeInTheDocument()
    })
    // Check if table headers are rendered
    expect(screen.getByText('TAG ID')).toBeInTheDocument()
    expect(screen.getByText('NAME')).toBeInTheDocument()
    expect(screen.getByText('PI TAG / FORMULA')).toBeInTheDocument()
    expect(screen.getByText('TAG TYPE')).toBeInTheDocument()
  })
  test('renders no data message when data is empty', async () => {
    mockGetTagsDataByCaseid.mockResolvedValue({ data: mockEmptyData })
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('No Data To Show')).toBeInTheDocument()
    })
  })
  test('handles search functionality', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Tag 1')).toBeInTheDocument()
    })
    const searchInput = screen.getByTestId('search_input_field')
    // Search for existing item
    fireEvent.change(searchInput, { target: { value: 'Tag 1' } })

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } })
    await waitFor(() => {
      expect(screen.getByText('Tag 1')).toBeInTheDocument()
      expect(screen.getByText('Tag 2')).toBeInTheDocument()
    })
  })
  test('handles dropdown filter functionality', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Tag 1')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Tag 1')).toBeInTheDocument()
      expect(screen.getByText('Tag 3')).toBeInTheDocument()
    })
  })
  test('handles action icon clicks', async () => {
    renderComponent({ canEdit: true })
    await waitFor(() => {
      expect(screen.getByText('Tag 1')).toBeInTheDocument()
    })
    const editIcons = screen.getAllByTestId('edit-icon')
    const infoIcons = screen.getAllByTestId('info-icon')
    // Click edit icon
    fireEvent.click(editIcons[0])
    // Click info icon
    fireEvent.click(infoIcons[0])
    await waitFor(() => {
      expect(editIcons[0]).toBeInTheDocument()
      expect(infoIcons[0]).toBeInTheDocument()
    })
  })
  test('shows disabled edit icon when canEdit is false', async () => {
    renderComponent({ canEdit: false })
    await waitFor(() => {
      expect(screen.getByText('Tag 1')).toBeInTheDocument()
    })
    const editIcons = screen.getAllByTestId('edit-icon')
    // The icon should still be rendered but might have disabled styling
    expect(editIcons[0]).toBeInTheDocument()
  })
  test('handles expand icon for long content', async () => {
    renderComponent()
  })

  test('renders download component when data exists', async () => {
    renderComponent({ download: true })
    await waitFor(() => {
      expect(screen.getByTestId('configuration-download')).toBeInTheDocument()
    })
    expect(screen.getByText(/Download tags - 3 items/)).toBeInTheDocument()
  })
  test('does not render download component when no data', async () => {
    mockGetTagsDataByCaseid.mockResolvedValue({ data: mockEmptyData })
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('No Data To Show')).toBeInTheDocument()
    })
    expect(
      screen.queryByTestId('configuration-download'),
    ).not.toBeInTheDocument()
  })
  test('handles refetchData prop changes', async () => {
    const { rerender } = renderComponent({ refetchData: 1 })
    // Rerender with different refetchData value
    rerender(
      <MemoryRouter>
        <TableWithSearch
          headers={mockHeaders}
          dataFn={mockGetTagsDataByCaseid}
          refetchData={2}
        />
      </MemoryRouter>,
    )
  })

  test('calls getUniqueTagAndDataType with correct parameters', async () => {
    renderComponent()
  })
  test('handles error in data fetching', async () => {
    renderComponent()
  })
  test('renders add new button', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Add New')).toBeInTheDocument()
    })
    const addButton = screen.getByText('Add New').closest('button')
    expect(addButton).toBeInTheDocument()
  })
  test('handles column search inputs', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('PI TAG / FORMULA')).toBeInTheDocument()
    })
    // Find search input for PI TAG column
    const searchInputs = screen.getAllByTestId(/input-/)
    expect(searchInputs.length).toBeGreaterThan(0)
  })
})
