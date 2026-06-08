import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import ConfigurationDownload from './ConfigurationDownload'

describe('ConfigurationDownload Component', () => {
  const mockHeaders = ['Name', 'Age', 'Edit', '', 'Action']
  const mockHeadersForXls = ['name', 'age']
  const mockData = [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 },
  ]

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-05-19T14:30:00Z'))
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  })

  afterAll(() => {
    vi.useRealTimers()
    delete global.URL.createObjectURL
  })

  it('should render and trigger CSV download on click', () => {
    const createElementSpy = vi.spyOn(document, 'createElement')
    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')

    render(
      <ConfigurationDownload
        headers={mockHeaders}
        headersForXls={mockHeadersForXls}
        data={mockData}
        title='Test Download'
      />,
    )

    const downloadButton = screen.getByTestId('csv-download')
    expect(downloadButton).toBeInTheDocument()

    fireEvent.click(downloadButton)

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('should handle empty headers and data', () => {
    const createElementSpy = vi.spyOn(document, 'createElement')
    render(
      <ConfigurationDownload
        headers={[]}
        headersForXls={[]}
        data={[]}
        title='Empty Test'
      />,
    )

    const downloadButton = screen.getByTestId('csv-download')
    fireEvent.click(downloadButton)

    expect(createElementSpy).toHaveBeenCalledWith('a')
    createElementSpy.mockRestore()
  })
})
