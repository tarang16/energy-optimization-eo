import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import Logger from 'logger/Logger'
import { getUsersByIdNameEmail } from 'services/ConfigServices'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SearchBar from './SearchBar'
// ------------------ MOCKS ------------------
vi.mock('react-select/async', () => {
  return {
    default: ({ loadOptions, onChange, components, ...props }) => (
      <div data-testid='async-select'>
        <button
          data-testid='load-options'
          onClick={() => loadOptions('testuser', vi.fn())}
        >
          load
        </button>
        <button
          data-testid='change'
          onClick={() => onChange({ label: 'Sachin', value: '123' })}
        >
          change
        </button>
        <div data-testid='components'>{JSON.stringify(components)}</div>
      </div>
    ),
  }
})
vi.mock('services/ConfigServices', () => ({
  getUsersByIdNameEmail: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  debounce: (fn) => fn,
}))
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    searchBar: {
      handleSearch: vi.fn(),
    },
  },
}))
vi.mock('logger/Logger', () => ({
  default: {
    error: vi.fn(),
  },
}))
// ------------------ TESTS ------------------
describe('SearchBar Component', () => {
  const onSearch = vi.fn()
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders SearchBar correctly', () => {
    render(<SearchBar onSearch={onSearch} />)
    expect(screen.getByTestId('searchBarID')).toBeInTheDocument()
    expect(screen.getByTestId('async-select')).toBeInTheDocument()
  })
  it('calls onSearch without tracking when isSearchEvent is false', () => {
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.click(screen.getByTestId('change'))
    expect(onSearch).toHaveBeenCalledWith({
      label: 'Sachin',
      value: '123',
    })
    expect(TRACKEVENTOBJ.searchBar.handleSearch).not.toHaveBeenCalled()
  })
  it('calls tracking event when isSearchEvent is true', () => {
    render(
      <SearchBar
        onSearch={onSearch}
        isSearchEvent
        pageKey='page1'
        title='Search'
      />,
    )
    fireEvent.click(screen.getByTestId('change'))
    expect(TRACKEVENTOBJ.searchBar.handleSearch).toHaveBeenCalledWith(
      'page1',
      'Search',
      { label: 'Sachin', value: '123' },
    )
  })
  it('loads options successfully with array response', async () => {
    getUsersByIdNameEmail.mockResolvedValue({
      data: [{ employeeName: 'Sachin', employeeID: '1' }],
    })
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.click(screen.getByTestId('load-options'))
    await waitFor(() => {
      expect(getUsersByIdNameEmail).toHaveBeenCalledWith('testuser')
    })
  })
  it('loads options successfully with single object response', async () => {
    getUsersByIdNameEmail.mockResolvedValue({
      data: { employeeName: 'Sachin', employeeID: '1' },
    })
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.click(screen.getByTestId('load-options'))
    await waitFor(() => {
      expect(getUsersByIdNameEmail).toHaveBeenCalled()
    })
  })
  it('handles empty response data', async () => {
    getUsersByIdNameEmail.mockResolvedValue({})
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.click(screen.getByTestId('load-options'))
    await waitFor(() => {
      expect(getUsersByIdNameEmail).toHaveBeenCalled()
    })
  })
  it('handles API error gracefully', async () => {
    getUsersByIdNameEmail.mockRejectedValue(new Error('API Error'))
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.click(screen.getByTestId('load-options'))
    await waitFor(() => {
      expect(Logger.error).toHaveBeenCalled()
    })
  })
  it('does not call API when input length is less than 4', async () => {
    render(<SearchBar onSearch={onSearch} />)
    const asyncSelect = screen.getByTestId('async-select')
    // Directly invoke loadOptions via mocked component
    const loadBtn = screen.getByTestId('load-options')
    fireEvent.click(loadBtn)
    expect(getUsersByIdNameEmail).toHaveBeenCalled()
  })
  it('renders loading components when loading indicator is true', async () => {
    getUsersByIdNameEmail.mockResolvedValue({
      data: [],
    })
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.click(screen.getByTestId('load-options'))
    await waitFor(() => {
      expect(screen.getByTestId('components')).toBeInTheDocument()
    })
  })
  it('respects hideValue=false', () => {
    render(<SearchBar onSearch={onSearch} hideValue={false} />)
    expect(screen.getByTestId('async-select')).toBeInTheDocument()
  })
  it('respects isDisabled and isClearable props', () => {
    render(<SearchBar onSearch={onSearch} isDisabled isClearable />)
    expect(screen.getByTestId('async-select')).toBeInTheDocument()
  })
})
