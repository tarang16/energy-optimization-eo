import { fireEvent, render } from '@testing-library/react'
import assert from 'assert'
import { BrowserRouter as Router, useRouteError } from 'react-router-dom'
import { test, vi } from 'vitest'
import ErrorPage from './ErrorPage'

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useRouteError: vi.fn(),
  }
})

test('renders component with no error', () => {
  useRouteError.mockReturnValue({
    status: 503,
    statusText: 'test status',
    message: 'test message',
    data: 'error data',
  })
  const { queryAllByText } = render(
    <Router>
      <ErrorPage appMessage='Mock error' isInner={true} />
    </Router>,
  )
  // Assert
  assert(queryAllByText('Mock error'))
})

test('renders component with 503 error', () => {
  useRouteError.mockReturnValue({
    status: 503,
    statusText: 'test status',
    message: 'test message',
    data: 'error data',
  })
  const { queryAllByText } = render(
    <Router>
      <ErrorPage isInner={true} />
    </Router>,
  )
  // Assert
  assert(queryAllByText('Mock error'))
})

test('renders component with 404 error', () => {
  useRouteError.mockReturnValue({
    status: 404,
    statusText: 'test status',
    message: 'test message',
    data: 'error data',
  })
  const { queryAllByText } = render(
    <Router>
      <ErrorPage isInner={true} />
    </Router>,
  )
  // Assert
  assert(queryAllByText('Mock error'))
})

test('renders component with 400 error', () => {
  useRouteError.mockReturnValue({
    status: 400,
    statusText: 'test status',
    message: 'test message',
    data: 'error data',
  })
  const { queryAllByText } = render(
    <Router>
      <ErrorPage isInner={true} />
    </Router>,
  )
  // Assert
  assert(queryAllByText('Mock error'))
})

test('renders component with else condition', () => {
  useRouteError.mockReturnValue({
    statusText: 'test status',
    data: 'error data',
  })
  const { queryAllByText } = render(
    <Router>
      <ErrorPage isInner={false} />
    </Router>,
  )
  const refresh_btn = document.querySelector('#local-storage-location')
  fireEvent.click(refresh_btn)
  // Assert
  assert(queryAllByText('Mock error'))
})
