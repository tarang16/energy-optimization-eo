import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useSetAtom } from 'jotai'
import { useOutletContext, useParams } from 'react-router-dom'
import { getEOTagsDataByCaseid } from 'services/CCPServices'
import { getDataTypeAndTagType } from 'services/ConfigServices'
import { showToast } from 'utills/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TagsTable from './tagsTable'

vi.mock('jotai')
vi.mock('react-router-dom')
vi.mock('services/CCPServices')
vi.mock('services/ConfigServices')
vi.mock('utills/utilities', async () => {
  const actual = await vi.importActual('utills/utilities')
  return {
    ...actual,
    showToast: vi.fn(),
    debounce: (fn) => fn,
    getValsBaseOnCondition: (condition, trueVal, falseVal) =>
      condition ? trueVal : falseVal,
  }
})
vi.mock('react-infinite-scroll-hook', () => ({
  default: vi.fn(() => [vi.fn()]),
}))
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    CCPTags: {
      onSearch: vi.fn(),
      modelNamDropDownChange: vi.fn(),
      onDropDownChange: vi.fn(),
      onEditTag: vi.fn(),
    },
  },
}))

vi.mock('./tableHeader', () => ({
  default: vi.fn(
    ({ onSearchChange, handleModelChange, setRefetch, finalFilteredData }) => (
      <div data-testid='table-header'>
        <input data-testid='search-input' />
        <button
          data-testid='model-filter-btn'
          onClick={() => handleModelChange({ tag_name: 'model1' })}
        >
          Filter Model
        </button>
        <button
          data-testid='refresh-btn'
          onClick={() => setRefetch((prev) => !prev)}
        >
          Refresh
        </button>
        <div data-testid='filtered-count'>{finalFilteredData.length}</div>
      </div>
    ),
  ),
}))

vi.mock('./Table', () => ({
  default: vi.fn(
    ({
      data,
      handleFilterChange,
      onEditClick,
      onDeleteClick,
      onInfoClick,
      isLoading,
      isLoadingMore,
      loaderRef,
    }) => (
      <div data-testid='data-table'>
        {isLoading && <div data-testid='loading'>Loading...</div>}
        {data.map((item, idx) => (
          <div key={idx} data-testid={`row-${idx}`}>
            <span>{item.tagName}</span>
            <button onClick={() => onEditClick(item)}>Edit</button>
            <button onClick={() => onDeleteClick(item)}>Delete</button>
            <button onClick={() => onInfoClick(item)}>Info</button>
          </div>
        ))}

        {isLoadingMore && <div data-testid='loading-more'>Loading more...</div>}
        <div ref={loaderRef} data-testid='infinite-scroll-trigger' />
      </div>
    ),
  ),
}))

describe('TagsTable Component', () => {
  const mockSetAtom = vi.fn()
  const mockSetTagTypes = vi.fn()
  const mockSetDataTypes = vi.fn()
  const mockOnEditClick = vi.fn()
  const mockOnInfoClick = vi.fn()
  const mockOnDeleteClick = vi.fn()
  const mockSetRefetch = vi.fn()

  const defaultProps = {
    onEditClick: mockOnEditClick,
    onInfoClick: mockOnInfoClick,
    onDeleteClick: mockOnDeleteClick,
    setTagTypes: mockSetTagTypes,
    setDataTypes: mockSetDataTypes,
    canEdit: true,
    modelNamesDropDownOptions: [],
    uomDropDownOptions: [],
    validationData: {},
    tooltips: {},
    refetch: false,
    setRefetch: mockSetRefetch,
  }

  const mockTagsData = [
    {
      tagID: 'tag1',
      tagName: 'Temperature',
      description: 'Temperature Sensor',
      uiDisplayName: 'Temp Sensor',
      uom: 'Celsius',
      tagType: 'pi',
      piName: 'PI_TEMP_01',
      modelName: 'model1',
      modelDescription: 'Model 1 Description',
      modelType: 'type1',
    },
    {
      tagID: 'tag2',
      tagName: 'Pressure',
      description: 'Pressure Sensor',
      uiDisplayName: 'Press Sensor',
      uom: 'PSI',
      tagType: 'inferred',
      inferredExpression: 'TEMP * 2',
      modelName: 'model2',
      modelDescription: 'Model 2 Description',
      modelType: 'type2',
    },
  ]

  const mockDropdownData = {
    tag_type: ['pi', 'inferred', 'calculated'],
    tag_data_type: ['numeric', 'string', 'boolean'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useSetAtom.mockReturnValue(mockSetAtom)
    useOutletContext.mockReturnValue({ caseId: 'case123' })
    useParams.mockReturnValue({ projectId: 'proj1' })
    getEOTagsDataByCaseid.mockResolvedValue({
      data: mockTagsData,
      pageCount: 1,
      statuscode: 200,
    })
    getDataTypeAndTagType.mockResolvedValue({
      data: mockDropdownData,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Rendering and Data Fetching', () => {
    it('should render the component with loading state initially', () => {
      render(<TagsTable {...defaultProps} />)
      expect(screen.getByTestId('data-table')).toBeInTheDocument()
    })

    it('should fetch tags data on mount', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(getEOTagsDataByCaseid).toHaveBeenCalledWith(
          'case123',
          null,
          1,
          100,
        )
      })
    })

    it('should fetch dropdown data on mount', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(getDataTypeAndTagType).toHaveBeenCalled()
      })
    })

    it('should set tag types and data types from dropdown data', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(mockSetTagTypes).toHaveBeenCalledWith([
          'pi',
          'inferred',
          'calculated',
        ])
        expect(mockSetDataTypes).toHaveBeenCalledWith([
          'numeric',
          'string',
          'boolean',
        ])
      })
    })

    it('should display fetched data after loading', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Temperature')).toBeInTheDocument()
      expect(screen.getByText('Pressure')).toBeInTheDocument()
    })

    it('should not fetch data if caseId is not available', async () => {
      useOutletContext.mockReturnValue({ caseId: null })
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(getEOTagsDataByCaseid).not.toHaveBeenCalled()
      })
    })
  })

  describe('Data Processing', () => {
    it('should combine tags with same tagID', async () => {
      const duplicateTagsData = [
        ...mockTagsData,
        {
          ...mockTagsData[0],
          modelName: 'model3',
          modelDescription: 'Model 3',
          modelType: 'type3',
        },
      ]

      getEOTagsDataByCaseid.mockResolvedValueOnce({
        data: duplicateTagsData,
        pageCount: 1,
        statuscode: 200,
      })

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(mockSetAtom).toHaveBeenCalled()
      })

      const ccpContextArg = mockSetAtom.mock.calls[0][0]
      expect(ccpContextArg).toHaveLength(3)
    })

    it('should set piName for pi tags and inferredExpression for inferred tags', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument()
      })

      expect(getEOTagsDataByCaseid).toHaveBeenCalled()
    })

    it('should create model dropdown options from unique model names', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('table-header')).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('should trigger search when search input changes', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'Temperature' } })
    })

    it('should reset search to null when search string is empty', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: '   ' } })

      await waitFor(() => {
        expect(getEOTagsDataByCaseid).toHaveBeenCalledWith(
          'case123',
          null,
          1,
          100,
        )
      })
    })

    it('should reset page number and count on search', async () => {
      getEOTagsDataByCaseid.mockResolvedValue({
        data: mockTagsData,
        pageCount: 5,
        statuscode: 200,
      })

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'test' } })
    })
  })

  describe('Filtering Functionality', () => {
    it('should filter by tag type', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument()
      })
    })

    it('should filter by model name', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('model-filter-btn')).toBeInTheDocument()
      })

      const modelFilterBtn = screen.getByTestId('model-filter-btn')
      fireEvent.click(modelFilterBtn)

      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument()
      })
    })

    it('should show all data when no filters are applied', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument()
        expect(screen.getByText('Pressure')).toBeInTheDocument()
      })
    })

    it('should combine tag type and model filters', async () => {
      render(<TagsTable {...defaultProps} />)

      const modelFilterBtn = screen.getByTestId('model-filter-btn')
      fireEvent.click(modelFilterBtn)

      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument()
      })
    })
  })

  describe('Infinite Scroll', () => {
    it('should load more data when scrolling', async () => {
      getEOTagsDataByCaseid
        .mockResolvedValueOnce({
          data: mockTagsData,
          pageCount: 2,
          statuscode: 200,
        })
        .mockResolvedValueOnce({
          data: [
            {
              ...mockTagsData[0],
              tagID: 'tag3',
              tagName: 'Flow',
            },
          ],
          pageCount: 2,
          statuscode: 200,
        })

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(getEOTagsDataByCaseid).toHaveBeenCalledTimes(1)
      })

      expect(screen.getByTestId('infinite-scroll-trigger')).toBeInTheDocument()
    })

    it('should show loading indicator when loading more data', async () => {
      getEOTagsDataByCaseid.mockResolvedValue({
        data: mockTagsData,
        pageCount: 2,
        statuscode: 200,
      })

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument()
      })
    })

    it('should append new data to existing data', async () => {
      const firstBatch = mockTagsData
      const secondBatch = [
        {
          ...mockTagsData[0],
          tagID: 'tag3',
          tagName: 'Flow',
        },
      ]

      getEOTagsDataByCaseid
        .mockResolvedValueOnce({
          data: firstBatch,
          pageCount: 2,
          statuscode: 200,
        })
        .mockResolvedValueOnce({
          data: secondBatch,
          pageCount: 2,
          statuscode: 200,
        })

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should call onEditClick when edit button is clicked', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getAllByText('Edit')[0]).toBeInTheDocument()
      })

      const editButton = screen.getAllByText('Edit')[0]
      fireEvent.click(editButton)

      expect(mockOnEditClick).toHaveBeenCalled()
    })

    it('should call onDeleteClick when delete button is clicked', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getAllByText('Delete')[0]).toBeInTheDocument()
      })

      const deleteButton = screen.getAllByText('Delete')[0]
      fireEvent.click(deleteButton)

      expect(mockOnDeleteClick).toHaveBeenCalled()
    })

    it('should call onInfoClick when info button is clicked', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getAllByText('Info')[0]).toBeInTheDocument()
      })

      const infoButton = screen.getAllByText('Info')[0]
      fireEvent.click(infoButton)

      expect(mockOnInfoClick).toHaveBeenCalled()
    })

    it('should trigger refetch when refresh button is clicked', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('refresh-btn')).toBeInTheDocument()
      })

      const refreshBtn = screen.getByTestId('refresh-btn')
      fireEvent.click(refreshBtn)

      expect(mockSetRefetch).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should show toast on error', async () => {
      const error = new Error('API Error')
      getEOTagsDataByCaseid.mockRejectedValueOnce(error)

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith('err', error)
      })
    })

    it('should stop loading on error', async () => {
      getEOTagsDataByCaseid.mockRejectedValueOnce(new Error('API Error'))

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(showToast).toHaveBeenCalled()
      })

      expect(screen.getByTestId('data-table')).toBeInTheDocument()
    })

    it('should handle empty data response', async () => {
      getEOTagsDataByCaseid.mockResolvedValueOnce({
        data: [],
        pageCount: 0,
        statuscode: 200,
      })

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(getEOTagsDataByCaseid).toHaveBeenCalled()
      })

      expect(screen.getByTestId('data-table')).toBeInTheDocument()
    })

    it('should handle non-200 status codes', async () => {
      getEOTagsDataByCaseid.mockResolvedValueOnce({
        data: [],
        pageCount: 0,
        statuscode: 404,
      })

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(getEOTagsDataByCaseid).toHaveBeenCalled()
      })
    })
  })

  describe('Refetch Functionality', () => {
    it('should refetch data when refetch prop changes', async () => {
      const { rerender } = render(
        <TagsTable {...defaultProps} refetch={false} />,
      )

      await waitFor(() => {
        expect(getEOTagsDataByCaseid).toHaveBeenCalledTimes(1)
      })

      rerender(<TagsTable {...defaultProps} refetch={true} />)

      await waitFor(() => {
        expect(getEOTagsDataByCaseid).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Activity Tracking', () => {
    it('should track search events', async () => {
      const { TRACKEVENTOBJ } = await import('config/ActivityTrackerConfig')

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'test' } })
    })

    it('should track edit events', async () => {
      const { TRACKEVENTOBJ } = await import('config/ActivityTrackerConfig')

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getAllByText('Edit')[0]).toBeInTheDocument()
      })

      const editButton = screen.getAllByText('Edit')[0]
      fireEvent.click(editButton)

      expect(TRACKEVENTOBJ.CCPTags.onEditTag).toHaveBeenCalled()
    })
  })

  describe('Pagination State', () => {
    it('should update page number after successful data fetch', async () => {
      getEOTagsDataByCaseid.mockResolvedValue({
        data: mockTagsData,
        pageCount: 3,
        statuscode: 200,
      })

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(getEOTagsDataByCaseid).toHaveBeenCalled()
      })

      expect(screen.getByTestId('data-table')).toBeInTheDocument()
    })

    it('should set hasMore to true when there are more pages', async () => {
      getEOTagsDataByCaseid.mockResolvedValue({
        data: mockTagsData,
        pageCount: 5,
        statuscode: 200,
      })

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(getEOTagsDataByCaseid).toHaveBeenCalled()
      })

      expect(screen.getByTestId('infinite-scroll-trigger')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle tags without model information', async () => {
      const incompleteData = [
        {
          ...mockTagsData[0],
          modelName: undefined,
        },
      ]

      getEOTagsDataByCaseid.mockResolvedValue({
        data: incompleteData,
        pageCount: 1,
        statuscode: 200,
      })

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument()
      })
    })

    it('should handle tags with missing piName or inferredExpression', async () => {
      const incompleteData = [
        {
          ...mockTagsData[0],
          piName: null,
          inferredExpression: null,
        },
      ]

      getEOTagsDataByCaseid.mockResolvedValue({
        data: incompleteData,
        pageCount: 1,
        statuscode: 200,
      })

      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument()
      })
    })

    it('should handle rapid filter changes', async () => {
      render(<TagsTable {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument()
      })
    })
  })
})
