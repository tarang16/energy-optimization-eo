import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

// Mock component that throws an error
const ProblemChild = () => {
  throw new Error('Test error')
}

// Component that does not throw
const SafeChild = () => <div>Safe Content</div>

describe('ErrorBoundary', () => {
  it('renders child component when no error occurs', () => {
    render(
      <ErrorBoundary>
        <SafeChild />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Safe Content')).toBeInTheDocument()
  })

  it('shows fallback UI when a child throws an error', () => {
    // Suppress expected error output from React in test logs
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    )
    expect(screen.getByText('SOMETHING WENT WRONG')).toBeInTheDocument()
    expect(screen.getByText('Please try again later.')).toBeInTheDocument()
    // Restore console.error
    console.error.mockRestore()
  })

  it('renders custom error message if provided via props', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary message='Custom error message'>
        <ProblemChild />
      </ErrorBoundary>,
    )
    expect(screen.getByText('SOMETHING WENT WRONG')).toBeInTheDocument()
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    console.error.mockRestore()
  })

  it('renders and mounts component', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>SOMETHING WENT WRONG</div>{' '}
      </ErrorBoundary>,
    )
    getByText('SOMETHING WENT WRONG', { exact: false })
  })
})
