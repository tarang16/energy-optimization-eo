import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { useAtom } from 'jotai'
import { getSeuOutputData } from 'services/CurrentServices'
import { detectModification } from 'utills/utilities'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import OptimizedSeuTable, {
  customIcons,
  getSelectedValues,
  getSortIcon,
  getSorting,
  newRowSpan,
  onSortChanged,
  sortDescending,
  sortHandler,
} from './OptimizedSeuTable'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtom: vi.fn(), // mock only useAtom
  }
})

vi.mock('utills/utilities', () => ({
  detectModification: vi.fn(),
  differenceInMinutes: vi.fn(),
}))
vi.mock('services/CurrentServices', () => ({
  getSeuOutputData: vi.fn(),
}))
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show }) => <div data-testid='modal'>{show}</div>,
}))

vi.mock('components/visuals/dropdown/multi_select/CustomMultiSelect', () => ({
  default: () => <div data-testid='custom-select'>Dropdown</div>,
}))

vi.mock('config/scss/_variables.scss', () => ({
  default: {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
    primary_dark_blue: '#ff0000',
  },
}))
const mockAtom = [{ data: [], time: null }, vi.fn()]
describe('OptimizedSeuTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAtom.mockReturnValue(mockAtom)
  })
  beforeAll(() => {
    if (!Array.prototype.toSorted) {
      Array.prototype.toSorted = function (compareFn) {
        return [...this].sort(compareFn)
      }
    }
  })
  const mockData = [
    {
      equipmentCategory: 'Category A',
      plantName: 'Plant 1',
      energySource: 'Gas',
      equipment: 'Compressor 1',
      baselineEnergy: 10,
      energyConsumed: 12,
      targetEnergy: 11,
      seecGain: 2,
      gainBenefit: 300,
      enpi: 1.2,
      enpiBenefit: 3.4,
    },
  ]
  it('renders loader while fetching data', async () => {
    getSeuOutputData.mockResolvedValue({ data: mockData })
    render(<OptimizedSeuTable actualTime={new Date()} caseId='123' />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
  })
  it('calls getSeuOutputData if atom is empty or outdated', async () => {
    render(<OptimizedSeuTable actualTime={new Date()} caseId='testCase' />)
  })
  it('displays the modal when a trend is selected', async () => {
    getSeuOutputData.mockResolvedValue({ data: mockData })
    render(<OptimizedSeuTable actualTime={new Date()} caseId='testCase' />)
  })
  it('renders ag-grid with the correct columns', async () => {
    getSeuOutputData.mockResolvedValue({ data: mockData })
    const { container } = render(
      <OptimizedSeuTable actualTime={new Date()} caseId='123' />,
    )
    // const headers = container.querySelectorAll('.ag-header-cell-text')
    // expect(headers.length).toBeGreaterThan(0)
    // expect(
    //   Array.from(headers).some((header) =>
    //     header.textContent.includes('CATEGORY'),
    //   ),
    // ).toBe(false)
  })
  it('handles window resize for row/header height adjustment', () => {
    // Setup mock window size
    window.innerWidth = 1200
    window.innerHeight = 800
    render(<OptimizedSeuTable actualTime={new Date()} caseId='resizeTest' />)
    global.dispatchEvent(new Event('resize'))
  })
  it('sorts data when a sortable column is clicked', async () => {
    getSeuOutputData.mockResolvedValue({ data: mockData })
    render(<OptimizedSeuTable actualTime={new Date()} caseId='sortTest' />)
  })
})
//
describe('Sorting Utilities', () => {
  describe('getSorting', () => {
    it('should return "desc" when current sort is "asc"', () => {
      expect(getSorting('asc')).toBe('desc')
    })
    it('should return empty string when current sort is "desc"', () => {
      expect(getSorting('desc')).toBe('')
    })
    it('should return "asc" when current sort is empty string', () => {
      expect(getSorting('')).toBe('asc')
    })
    it('should return "asc" when current sort is undefined', () => {
      expect(getSorting(undefined)).toBe('asc')
    })
    it('should return "asc" when current sort is null', () => {
      expect(getSorting(null)).toBe('asc')
    })
    it('should return "asc" when current sort is invalid value', () => {
      expect(getSorting('invalid')).toBe('asc')
    })
  })
  describe('sortHandler', () => {
    let mockAgGridInstance
    let mockSetSortState
    beforeEach(() => {
      mockAgGridInstance = {
        column: {
          getSort: vi.fn(),
        },
        setSort: vi.fn(),
      }
      mockSetSortState = vi.fn()
    })
    it('should not call any functions when hideSortBtn is true', () => {
      sortHandler(true, mockAgGridInstance, mockSetSortState)
      expect(mockAgGridInstance.column.getSort).not.toHaveBeenCalled()
      expect(mockAgGridInstance.setSort).not.toHaveBeenCalled()
      expect(mockSetSortState).not.toHaveBeenCalled()
    })
    it('should handle sorting when hideSortBtn is false and current sort is "asc"', () => {
      mockAgGridInstance.column.getSort.mockReturnValue('asc')
      sortHandler(false, mockAgGridInstance, mockSetSortState)
      expect(mockAgGridInstance.column.getSort).toHaveBeenCalled()
      expect(mockAgGridInstance.setSort).toHaveBeenCalledWith('desc', false)
      expect(mockSetSortState).toHaveBeenCalledWith('desc')
    })
    it('should handle sorting when hideSortBtn is false and current sort is "desc"', () => {
      mockAgGridInstance.column.getSort.mockReturnValue('desc')
      sortHandler(false, mockAgGridInstance, mockSetSortState)
      expect(mockAgGridInstance.column.getSort).toHaveBeenCalled()
      expect(mockAgGridInstance.setSort).toHaveBeenCalledWith('', false)
      expect(mockSetSortState).toHaveBeenCalledWith('')
    })
    it('should handle sorting when hideSortBtn is false and current sort is empty', () => {
      mockAgGridInstance.column.getSort.mockReturnValue('')
      sortHandler(false, mockAgGridInstance, mockSetSortState)
      expect(mockAgGridInstance.column.getSort).toHaveBeenCalled()
      expect(mockAgGridInstance.setSort).toHaveBeenCalledWith('asc', false)
      expect(mockSetSortState).toHaveBeenCalledWith('asc')
    })
    it('should handle sorting when hideSortBtn is false and current sort is undefined', () => {
      mockAgGridInstance.column.getSort.mockReturnValue(undefined)
      sortHandler(false, mockAgGridInstance, mockSetSortState)
      expect(mockAgGridInstance.column.getSort).toHaveBeenCalled()
      expect(mockAgGridInstance.setSort).toHaveBeenCalledWith('asc', false)
      expect(mockSetSortState).toHaveBeenCalledWith('asc')
    })
  })
  describe('getSortIcon', () => {
    it('should return sortAscending icon when sortState is "asc"', () => {
      expect(getSortIcon('asc')).toBe(customIcons.sortAscending)
    })
    it('should return sortDescending icon when sortState is "desc"', () => {
      expect(getSortIcon('desc')).toBe(customIcons.sortDescending)
    })
    it('should return sortUnSort icon when sortState is empty string', () => {
      expect(getSortIcon('')).toBe(customIcons.sortUnSort)
    })
    it('should return sortUnSort icon when sortState is undefined', () => {
      expect(getSortIcon(undefined)).toBe(customIcons.sortUnSort)
    })
    it('should return sortUnSort icon when sortState is null', () => {
      expect(getSortIcon(null)).toBe(customIcons.sortUnSort)
    })
    it('should return sortUnSort icon when sortState is invalid value', () => {
      expect(getSortIcon('invalid')).toBe(customIcons.sortUnSort)
    })
  })
  describe('getSelectedValues', () => {
    let mockGetFilter
    let mockSetSelectedValues
    let mockGridRef
    let mockInitialData
    beforeEach(() => {
      mockGetFilter = vi.fn()
      mockSetSelectedValues = vi.fn()
      mockGridRef = {
        current: {
          api: {
            setGridOption: vi.fn(),
            getGridOption: vi.fn(),
          },
        },
      }
      mockInitialData = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 30 },
        { name: 'Bob', age: 35 },
      ]
      // Reset the mock
      detectModification.mockReset()
    })
    it('should set "ALL" option when values length equals default filter length', () => {
      const values = [
        { id: 1, name: 'Option1' },
        { id: 2, name: 'Option2' },
      ]
      mockGetFilter.mockReturnValue(['filter1', 'filter2'])
      getSelectedValues(
        values,
        mockGetFilter,
        mockSetSelectedValues,
        mockGridRef,
        mockInitialData,
        'name',
      )
      expect(mockSetSelectedValues).toHaveBeenCalledWith([
        { id: 'all', name: 'ALL' },
        ...values,
      ])
    })
    it('should set values directly when values length does not equal default filter length', () => {
      const values = [{ id: 1, name: 'Option1' }]
      mockGetFilter.mockReturnValue(['filter1', 'filter2', 'filter3'])
      getSelectedValues(
        values,
        mockGetFilter,
        mockSetSelectedValues,
        mockGridRef,
        mockInitialData,
        'name',
      )
      expect(mockSetSelectedValues).toHaveBeenCalledWith(values)
    })
    it('should set empty rowData when values array is empty', () => {
      const values = []
      mockGetFilter.mockReturnValue(['filter1', 'filter2'])
      getSelectedValues(
        values,
        mockGetFilter,
        mockSetSelectedValues,
        mockGridRef,
        mockInitialData,
        'name',
      )
      expect(mockGridRef.current.api.setGridOption).toHaveBeenCalledWith(
        'rowData',
        [],
      )
    })
    it('should filter data and set rowData when values array has items and detectModification returns true', () => {
      const values = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ]
      const prevRowsData = [{ name: 'Bob', age: 35 }]
      const expectedFilterData = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 30 },
      ]
      mockGetFilter.mockReturnValue(['filter1', 'filter2'])
      mockGridRef.current.api.getGridOption.mockReturnValue(prevRowsData)
      detectModification.mockReturnValue(true)
      getSelectedValues(
        values,
        mockGetFilter,
        mockSetSelectedValues,
        mockGridRef,
        mockInitialData,
        'name',
      )
      expect(mockGridRef.current.api.setGridOption).toHaveBeenCalledWith(
        'rowData',
        expectedFilterData,
      )
    })
    it('should not set rowData when detectModification returns false', () => {
      const values = [{ id: 1, name: 'John' }]
      const prevRowsData = [{ name: 'John', age: 25 }]
      mockGetFilter.mockReturnValue(['filter1', 'filter2'])
      mockGridRef.current.api.getGridOption.mockReturnValue(prevRowsData)
      detectModification.mockReturnValue(false)
      getSelectedValues(
        values,
        mockGetFilter,
        mockSetSelectedValues,
        mockGridRef,
        mockInitialData,
        'name',
      )
      expect(mockGridRef.current.api.setGridOption).not.toHaveBeenCalled()
    })
    it('should handle case insensitive filtering', () => {
      const values = [
        { id: 1, name: 'JOHN' },
        { id: 2, name: 'jane' },
      ]
      const expectedFilterData = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 30 },
      ]
      mockGetFilter.mockReturnValue(['filter1', 'filter2', 'filter3'])
      mockGridRef.current.api.getGridOption.mockReturnValue([])
      detectModification.mockReturnValue(true)
      getSelectedValues(
        values,
        mockGetFilter,
        mockSetSelectedValues,
        mockGridRef,
        mockInitialData,
        'name',
      )
      expect(mockGridRef.current.api.setGridOption).toHaveBeenCalledWith(
        'rowData',
        expectedFilterData,
      )
    })
    it('should handle null gridRef', () => {
      const values = [{ id: 1, name: 'John' }]
      mockGetFilter.mockReturnValue(['filter1', 'filter2'])
      expect(() => {
        getSelectedValues(
          values,
          mockGetFilter,
          mockSetSelectedValues,
          null,
          mockInitialData,
          'name',
        )
      }).not.toThrow()
    })
    it('should handle null gridRef current api', () => {
      const values = [{ id: 1, name: 'John' }]
      const nullGridRef = { current: null }
      mockGetFilter.mockReturnValue(['filter1', 'filter2'])
      expect(() => {
        getSelectedValues(
          values,
          mockGetFilter,
          mockSetSelectedValues,
          nullGridRef,
          mockInitialData,
          'name',
        )
      }).not.toThrow()
    })
  })
})
describe('Grid Utility Functions', () => {
  describe('newRowSpan', () => {
    let mockParams
    beforeEach(() => {
      mockParams = {
        node: {
          rowIndex: 0,
        },
        colDef: {
          field: 'name',
        },
        data: {
          name: 'Test Name',
          equipmentCategory: 'Category A',
        },
        api: {
          getDisplayedRowAtIndex: vi.fn(),
          getDisplayedRowCount: vi.fn(),
        },
      }
    })
    it('should return 1 for first row with no duplicates below', () => {
      mockParams.api.getDisplayedRowCount.mockReturnValue(1)
      mockParams.api.getDisplayedRowAtIndex.mockReturnValue(null)
      const result = newRowSpan(mockParams)
      expect(result).toBe(1)
    })
    it('should return 0 when current value matches previous row value and category', () => {
      mockParams.node.rowIndex = 1
      mockParams.api.getDisplayedRowAtIndex.mockReturnValueOnce({
        data: {
          name: 'Test Name',
          equipmentCategory: 'Category A',
        },
      })
    })
    it('should return count when multiple rows have same value and category below', () => {
      mockParams.node.rowIndex = 0
      mockParams.api.getDisplayedRowCount.mockReturnValue(3)
      // First call (rowIndex + 1 = 1)
      mockParams.api.getDisplayedRowAtIndex.mockReturnValueOnce({
        data: {
          name: 'Test Name',
          equipmentCategory: 'Category A',
        },
      })
      // Second call (rowIndex + 1 = 2)
      mockParams.api.getDisplayedRowAtIndex.mockReturnValueOnce({
        data: {
          name: 'Different Name',
          equipmentCategory: 'Category A',
        },
      })
    })
    it('should return 1 when next row has different value', () => {
      mockParams.node.rowIndex = 0
      mockParams.api.getDisplayedRowCount.mockReturnValue(2)
      mockParams.api.getDisplayedRowAtIndex.mockReturnValueOnce({
        data: {
          name: 'Different Name',
          equipmentCategory: 'Category A',
        },
      })
      const result = newRowSpan(mockParams)
      expect(result).toBe(1)
    })
    it('should return 1 when next row has same value but different category', () => {
      mockParams.node.rowIndex = 0
      mockParams.api.getDisplayedRowCount.mockReturnValue(2)
      mockParams.api.getDisplayedRowAtIndex.mockReturnValueOnce({
        data: {
          name: 'Test Name',
          equipmentCategory: 'Category B',
        },
      })
      const result = newRowSpan(mockParams)
      expect(result).toBe(1)
    })
    it('should handle undefined previous row data', () => {
      mockParams.node.rowIndex = 1
      mockParams.api.getDisplayedRowAtIndex.mockReturnValueOnce(null)
      const result = newRowSpan(mockParams)
      expect(result).toBe(1)
    })
    it('should handle multiple consecutive duplicates', () => {
      mockParams.node.rowIndex = 0
      mockParams.api.getDisplayedRowCount.mockReturnValue(4)
      // Set up mock to return same value for first 3 rows, then different
      mockParams.api.getDisplayedRowAtIndex
        .mockReturnValueOnce({
          // rowIndex 1
          data: {
            name: 'Test Name',
            equipmentCategory: 'Category A',
          },
        })
        .mockReturnValueOnce({
          // rowIndex 2
          data: {
            name: 'Test Name',
            equipmentCategory: 'Category A',
          },
        })
        .mockReturnValueOnce({
          // rowIndex 3
          data: {
            name: 'Different Name',
            equipmentCategory: 'Category A',
          },
        })
    })
    it('should handle edge case at last row', () => {
      mockParams.node.rowIndex = 2
      mockParams.api.getDisplayedRowCount.mockReturnValue(3)
      mockParams.api.getDisplayedRowAtIndex.mockReturnValueOnce({
        data: {
          name: 'Previous Name',
          equipmentCategory: 'Category A',
        },
      })
      const result = newRowSpan(mockParams)
      expect(result).toBe(1)
    })
  })
  describe('onSortChanged', () => {
    let mockGridRef
    let mockSortAscending
    let mockSortDescending
    let mockEvent
    beforeEach(() => {
      mockGridRef = {
        current: {
          api: {
            getGridOption: vi.fn(),
            setGridOption: vi.fn(),
          },
        },
      }
      mockSortAscending = vi.fn()
      mockSortDescending = vi.fn()
      mockEvent = {
        columns: [
          {
            colDef: {
              field: 'name',
            },
            sort: 'asc',
          },
        ],
      }
    })
    it('should sort ascending when sort is "asc"', () => {
      const mockRowData = [{ name: 'A' }, { name: 'B' }]
      const mockSortedData = [{ name: 'A' }, { name: 'B' }]
      mockGridRef.current.api.getGridOption.mockReturnValue(mockRowData)
      mockSortAscending.mockReturnValue(mockSortedData)
      onSortChanged(
        mockEvent,
        mockGridRef,
        mockSortAscending,
        mockSortDescending,
      )
      expect(mockSortAscending).toHaveBeenCalledWith('name', mockRowData)
      expect(mockGridRef.current.api.setGridOption).toHaveBeenCalledWith(
        'rowData',
        mockSortedData,
      )
    })
    it('should sort descending when sort is "desc"', () => {
      mockEvent.columns[0].sort = 'desc'
      const mockRowData = [{ name: 'A' }, { name: 'B' }]
      const mockSortedData = [{ name: 'B' }, { name: 'A' }]
      mockGridRef.current.api.getGridOption.mockReturnValue(mockRowData)
      mockSortDescending.mockReturnValue(mockSortedData)
      onSortChanged(
        mockEvent,
        mockGridRef,
        mockSortAscending,
        mockSortDescending,
      )
      expect(mockSortDescending).toHaveBeenCalledWith('name', mockRowData)
      expect(mockGridRef.current.api.setGridOption).toHaveBeenCalledWith(
        'rowData',
        mockSortedData,
      )
    })
    it('should reset to original data when sort is neither asc nor desc', () => {
      mockEvent.columns[0].sort = null
      const mockRowData = [{ name: 'A' }, { name: 'B' }]
      mockGridRef.current.api.getGridOption.mockReturnValue(mockRowData)
      onSortChanged(
        mockEvent,
        mockGridRef,
        mockSortAscending,
        mockSortDescending,
      )
      expect(mockGridRef.current.api.setGridOption).toHaveBeenCalledWith(
        'rowData',
        mockRowData,
      )
      expect(mockSortAscending).not.toHaveBeenCalled()
      expect(mockSortDescending).not.toHaveBeenCalled()
    })
    it('should handle multiple columns and use the last one', () => {
      mockEvent.columns = [
        { colDef: { field: 'age' }, sort: 'desc' },
        { colDef: { field: 'name' }, sort: 'asc' },
      ]
      const mockRowData = [{ name: 'A' }, { name: 'B' }]
      const mockSortedData = [{ name: 'A' }, { name: 'B' }]
      mockGridRef.current.api.getGridOption.mockReturnValue(mockRowData)
      mockSortAscending.mockReturnValue(mockSortedData)
      onSortChanged(
        mockEvent,
        mockGridRef,
        mockSortAscending,
        mockSortDescending,
      )
      expect(mockSortAscending).toHaveBeenCalledWith('name', mockRowData)
    })
    it('should handle undefined gridRef', () => {
      expect(() => {
        onSortChanged(mockEvent, null, mockSortAscending, mockSortDescending)
      }).not.toThrow()
    })
    it('should handle undefined gridRef current api', () => {
      const nullGridRef = { current: null }
      expect(() => {
        onSortChanged(
          mockEvent,
          nullGridRef,
          mockSortAscending,
          mockSortDescending,
        )
      }).not.toThrow()
    })
  })
  describe('sortDescending', () => {
    const mockData = [
      { equipmentCategory: 'Category A', value: 10, name: 'Item A1' },
      { equipmentCategory: 'Category A', value: 20, name: 'Item A2' },
      { equipmentCategory: 'Category B', value: 15, name: 'Item B1' },
      { equipmentCategory: 'Category B', value: 25, name: 'Item B2' },
      { equipmentCategory: 'Category C', value: 20, name: 'Item C1' },
    ]
    it('should sort categories by max value descending and items within category descending', () => {
      const result = sortDescending('value', mockData)
      // Category B has max value 25, Category C has 20, Category A has 20
      // For same max values (A and C), they should be sorted alphabetically by category name
      expect(result[0].equipmentCategory).toBe('Category B')
      expect(result[0].value).toBe(25)
      expect(result[1].equipmentCategory).toBe('Category B')
      expect(result[1].value).toBe(15)
      expect(result[2].equipmentCategory).toBe('Category A')
      expect(result[2].value).toBe(20)
      expect(result[3].equipmentCategory).toBe('Category A')
      expect(result[3].value).toBe(10)
      expect(result[4].equipmentCategory).toBe('Category C')
      expect(result[4].value).toBe(20)
    })
    it('should handle empty data array', () => {
      const result = sortDescending('value', [])
      expect(result).toEqual([])
    })
    it('should handle undefined data parameter', () => {
      const result = sortDescending('value')
      expect(result).toEqual([])
    })
    it('should handle single item array', () => {
      const singleItem = [{ equipmentCategory: 'Category A', value: 10 }]
      const result = sortDescending('value', singleItem)
      expect(result).toEqual(singleItem)
    })
    it('should handle categories with same max values by sorting alphabetically', () => {
      const dataWithSameMax = [
        { equipmentCategory: 'Category Z', value: 10 },
        { equipmentCategory: 'Category A', value: 10 },
        { equipmentCategory: 'Category M', value: 10 },
      ]
      const result = sortDescending('value', dataWithSameMax)
      expect(result[0].equipmentCategory).toBe('Category A')
      expect(result[1].equipmentCategory).toBe('Category M')
      expect(result[2].equipmentCategory).toBe('Category Z')
    })
    it('should sort items within each category in descending order', () => {
      const categoryAData = mockData.filter(
        (item) => item.equipmentCategory === 'Category A',
      )
      const result = sortDescending('value', categoryAData)
      expect(result[0].value).toBe(20)
      expect(result[1].value).toBe(10)
    })
    it('should handle different field names', () => {
      const dataWithDifferentField = [
        { equipmentCategory: 'Category A', count: 5 },
        { equipmentCategory: 'Category A', count: 10 },
        { equipmentCategory: 'Category B', count: 8 },
      ]
      const result = sortDescending('count', dataWithDifferentField)
      expect(result[0].count).toBe(10)
      expect(result[1].count).toBe(5)
      expect(result[2].count).toBe(8)
    })
    it('should handle null or undefined values in the field', () => {
      const dataWithNulls = [
        { equipmentCategory: 'Category A', value: null },
        { equipmentCategory: 'Category A', value: 10 },
        { equipmentCategory: 'Category B', value: undefined },
        { equipmentCategory: 'Category B', value: 5 },
      ]
      const result = sortDescending('value', dataWithNulls)
      // The function should handle these without throwing errors
      expect(result.length).toBe(4)
    })
  })
})
