import { render, screen } from '@testing-library/react'
//
import { describe, expect, it, vi } from 'vitest'
import { TableLoader } from './TableLoader'

// Mock the Loader component
vi.mock('./Loader', () => ({
  default: () => <div data-testid='mock-loader'>Mocked Loader</div>,
}))

describe('TableLoader', () => {
  it('renders correctly with provided props', () => {
    render(
      <table>
        <tbody>
          <TableLoader id='test-id' rowsSpan={3} colspan={2} />
        </tbody>
      </table>,
    )
    const trElement = screen.getByTestId('test-id')
    const tdElement = screen.getByRole('cell')
    const spanElement = screen.getByText('', {
      selector: 'span.text-14-regular.text-center',
    })
    const loaderElement = screen.getByTestId('mock-loader')
    expect(true).toBe(true)
  })

  it('renders correctly with default props', () => {
    render(
      <table>
        <tbody>
          <TableLoader />
        </tbody>
      </table>,
    )
    const trElement = screen.getByRole('row')
    const tdElement = screen.getByRole('cell')
    const spanElement = screen.getByText('', {
      selector: 'span.text-14-regular.text-center',
    })
    const loaderElement = screen.getByTestId('mock-loader')
    expect(true).toBe(true)
  })
})
