import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AddUser from './AddUser'

vi.mock(
  'components/visuals/common/single_title_card/SingleTitleCardWithButton',
  () => ({
    default: ({ children, title, handleButtonClick }) => (
      <div>
        <div>{title}</div>
        <button onClick={handleButtonClick} data-testid='add-user-button'>
          Add
        </button>
        {children}
      </div>
    ),
  }),
)

vi.mock('../search_bar/SearchBar', () => ({
  default: ({ onSearch }) => {
    const mockUser = {
      employeeName: 'Test User',
      email: 'test@example.com',
      employeeId: 'EMP001',
      afiliateName: 'Affiliate A',
    }
    return (
      <button onClick={() => onSearch(mockUser)} data-testid='trigger-search'>
        Search
      </button>
    )
  },
}))

describe('AddUser component', () => {
  let handlerMock
  let trackSpy

  beforeEach(() => {
    handlerMock = vi.fn()
    trackSpy = vi.fn()
  })

  it.each([
    ['admin', 'ADD ADMIN USER'],
    ['corporate', 'ADD CORPORATE USER'],
    ['ccp', 'GRANT CCP ACCESS TO USER'],
    ['other', 'Add User'],
  ])('renders correct title for role "%s"', (role, expectedTitle) => {
    render(
      <AddUser
        handler={handlerMock}
        role={role}
        title='User Management'
        pageKey='page1'
      />,
    )
    expect(screen.getByText(expectedTitle)).toBeInTheDocument()
  })

  it('adds user on search and prevents duplicates', () => {
    render(
      <AddUser
        handler={handlerMock}
        role='admin'
        title='User Management'
        pageKey='page1'
      />,
    )

    const searchBtn = screen.getByTestId('trigger-search')
    fireEvent.click(searchBtn) // 1st time
    fireEvent.click(searchBtn) // 2nd time (duplicate)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getAllByText('Test User').length).toBe(1) // no duplicates
  })

  it('toggles checkbox selection', () => {
    render(
      <AddUser
        handler={handlerMock}
        role='corporate'
        title='User Management'
        pageKey='page1'
      />,
    )

    fireEvent.click(screen.getByTestId('trigger-search'))

    const checkbox = screen.getByTestId('checkbox-EMP001')
    expect(checkbox).toBeChecked()
    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('calls handler and tracker correctly on add click', () => {
    render(
      <AddUser
        handler={handlerMock}
        role='admin'
        title='User Management'
        pageKey='page1'
      />,
    )

    fireEvent.click(screen.getByTestId('trigger-search'))
    fireEvent.click(screen.getByTestId('add-user-button'))

    expect(handlerMock).toHaveBeenCalledWith('EMP001')
    expect(screen.queryByText('Test User')).not.toBeInTheDocument() // cleared state
  })

  it('does not call handler if no selected user on add', () => {
    render(
      <AddUser
        handler={handlerMock}
        role='admin'
        title='User Management'
        pageKey='page1'
      />,
    )

    fireEvent.click(screen.getByTestId('trigger-search'))
    fireEvent.click(screen.getByTestId('checkbox-EMP001')) // uncheck
    fireEvent.click(screen.getByTestId('add-user-button'))

    expect(handlerMock).toHaveBeenCalledWith('')
  })
})
