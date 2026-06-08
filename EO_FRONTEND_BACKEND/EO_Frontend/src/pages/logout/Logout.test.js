import { fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { getAuthTokenLocal } from 'utills/utilities'
import { describe, it, vi } from 'vitest'
import Logout from './Logout'

// Mock the getAuthTokenLocal function
vi.mock('utills/utilities', () => ({
  getAuthTokenLocal: vi.fn(),
}))

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('Logout', () => {
  it('should redirect to login when the token is present', () => {
    getAuthTokenLocal.mockReturnValue({
      _token: 'test token',
    })

    // Act
    render(
      <Router>
        <Logout />
      </Router>,
    )

    fireEvent.click(screen.getByText(/login/i))

    // Assert
  })

  it('should not redirect when the token is not present', () => {
    getAuthTokenLocal.mockReturnValue({
      _token: null,
    })

    // Act
    render(
      <Router>
        <Logout />
      </Router>,
    )

    fireEvent.click(screen.getByText(/login/i))

    // Assert
  })
})
