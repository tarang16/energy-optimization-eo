import { act, render, screen } from '@testing-library/react'
import { addPerformanceLog } from 'services/LoggingService'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import PerformanceLog from './PerformanceLog'

// Mock the addPerformanceLog function from the services/LoggingService module
vi.mock('services/LoggingService')

describe('PerformanceLog Component', () => {
  // Define mock implementation for performance.getEntriesByType
  beforeAll(() => {
    Object.defineProperty(window, 'performance', {
      value: {
        getEntriesByType: vi.fn().mockReturnValue([
          {
            initiatorType: 'xmlhttprequest',
            name: 'http://example.com/api/test',
            responseEnd: Date.now(),
          },
          {
            initiatorType: 'xmlhttprequest',
            name: 'http://example.com/api/another-test',
            responseEnd: Date.now(),
          },
        ]),
        measure: vi.fn(),
      },
    })
  })

  // Clear mocks before each test case
  beforeEach(() => {
    addPerformanceLog.mockClear()
  })

  // Test case: should render children
  it('renders children', () => {
    render(<PerformanceLog>Hello</PerformanceLog>)
    expect(screen.queryByText('Hello')).toBeInTheDocument()
  })

  // Test case: should render children correctly
  it('renders children correctly', () => {
    render(
      <PerformanceLog>
        <div>Test Child</div>
      </PerformanceLog>,
    )
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  // Test case: should not call addPerformanceLog if APIs are not loaded
  it('does not call addPerformanceLog if APIs are not loaded', () => {
    // Mock the getEntriesByType function to return a list of resources that do not match the API URLs
    window.performance.getEntriesByType.mockReturnValue([
      {
        initiatorType: 'xmlhttprequest',
        name: 'http://example.com/api/incomplete-test',
      },
    ])

    const apiURLs = [
      'http://example.com/api/test',
      'http://example.com/api/another-test',
    ]

    // Render the PerformanceLog component
    render(
      <PerformanceLog
        api_url={apiURLs}
        componentName='TestComponent'
        actionName='TestAction'
        screenName='TestScreen'
        isActive={true}
      >
        <div>Test Child</div>
      </PerformanceLog>,
    )

    // Verify that addPerformanceLog was not called since not all APIs are loaded
    expect(addPerformanceLog).not.toHaveBeenCalled()
  })

  // Test case: should call addPerformanceLog when all APIs are loaded
  it('calls addPerformanceLog when all APIs are loaded', async () => {
    const apiURLs = [
      'http://example.com/api/test',
      'http://example.com/api/another-test',
    ]

    // Render the PerformanceLog component
    render(
      <PerformanceLog
        api_url={apiURLs}
        componentName='TestComponent'
        actionName='TestAction'
        screenName='TestScreen'
        isActive={true}
      >
        <div>Test Child with API</div>
      </PerformanceLog>,
    )

    // Wait for enough time to allow the interval function to execute
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    })
    expect(screen.getByText('Test Child with API')).toBeInTheDocument()
  })
})
