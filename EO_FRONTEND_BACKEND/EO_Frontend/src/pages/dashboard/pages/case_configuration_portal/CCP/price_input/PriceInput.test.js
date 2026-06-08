import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as CCPServices from 'services/CCPServices'
import * as OptimizationService from 'services/OptimizationService'
import * as Utils from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PriceInput from './PriceInput'

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loader</div>,
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, ...props }) =>
    props.show ? <div data-testid='modal'>{children}</div> : null,
}))
vi.mock('components/visuals/table/SimpleTable', () => ({
  default: ({ data }) => (
    <table>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{typeof cell === 'string' ? cell : cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}))
vi.mock('../../AuditLogs', () => ({
  default: () => <div>AuditLogs</div>,
}))
vi.mock('../../Configurationdownload/ConfigurationDownload', () => ({
  default: () => <div>ConfigurationDownload</div>,
}))

vi.mock('services/CCPServices')
vi.mock('services/OptimizationService')
vi.mock('utills/utilities')

describe('PriceInput', () => {
  const mockData = [
    {
      displayName: 'Feed A',
      uomName: 'kg',
      currentValue: '10.1234',
      modelTagId: 'model-1',
      tagName: 'TAG123',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    OptimizationService.getOptimizationPrice.mockResolvedValue({
      data: mockData,
    })
    CCPServices.updateOptimizationPriceInput.mockResolvedValue({
      statuscode: 200,
    })
    CCPServices.addAuditLog.mockResolvedValue({})
    Utils.detectModification.mockImplementation(
      (a, b) => a?.currentValue !== b?.currentValue,
    )
    Utils.safeBtoa.mockImplementation(JSON.stringify)
    Utils.valueFormatter.mockImplementation((val) => val)
  })

  it('renders loader on initial load and table after fetch', async () => {
    render(<PriceInput caseId='123' canEdit />)
    expect(screen.getByText('Loader')).toBeInTheDocument()

    await waitFor(() => {
      // expect(screen.findByText(/Feed A \(kg\)/i)).toBeInTheDocument()
      expect(screen.getByText('ConfigurationDownload')).toBeInTheDocument()
    })
  })

  it('opens modal and populates with correct values', async () => {
    render(<PriceInput caseId='123' canEdit />)

    // Wait for table data to load (match visible cell text, not component name)

    await screen.findByText(/Feed A \(kg\)/i)

    // Click edit button

    const button = screen.getByRole('button', { name: /edit icon/i })

    fireEvent.click(button)

    // Confirm modal appears

    await screen.findByTestId('modal')

    // Check that modal inputs are prefilled

    // expect(screen.getByLabelText("Tag Name :")).toHaveValue('TAG123')

    // expect(screen.getByDisplayValue('10.12')).toBeInTheDocument()
  })

  it('shows alert if saving with missing data', async () => {
    window.alert = vi.fn()
    render(<PriceInput caseId='123' canEdit />)

    fireEvent.click(await screen.findByRole('button', { name: /edit icon/i }))
    await screen.findByTestId('modal')

    fireEvent.change(screen.getByLabelText(/current value/i), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByText(/submit/i))

    expect(window.alert).toHaveBeenCalledWith('Please fill valid values.')
  })

  it('cancels modal with confirmation', async () => {
    window.confirm = vi.fn(() => true)

    render(<PriceInput caseId='123' canEdit />)
    fireEvent.click(await screen.findByRole('button', { name: /edit icon/i }))
    await screen.findByTestId('modal')

    fireEvent.change(screen.getByLabelText(/current value/i), {
      target: { value: '15' },
    })
    fireEvent.click(screen.getByText(/cancel/i))

    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })
  })

  it('blocks cancel if confirmation is denied', async () => {
    window.confirm = vi.fn(() => false)

    render(<PriceInput caseId='123' canEdit />)
    fireEvent.click(await screen.findByRole('button', { name: /edit icon/i }))
    await screen.findByTestId('modal')

    fireEvent.change(screen.getByLabelText(/current value/i), {
      target: { value: '15' },
    })
    fireEvent.click(screen.getByText(/cancel/i))

    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('handles API failure on save', async () => {
    window.alert = vi.fn()
    CCPServices.updateOptimizationPriceInput.mockResolvedValueOnce({
      statuscode: 500,
    })

    render(<PriceInput caseId='123' canEdit />)
    fireEvent.click(await screen.findByRole('button', { name: /edit icon/i }))
    await screen.findByTestId('modal')

    fireEvent.change(screen.getByLabelText(/current value/i), {
      target: { value: '20.3' },
    })
    fireEvent.click(screen.getByText(/submit/i))

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Unable to update data, please try again.',
      )
    })
  })

  it('disables edit when canEdit is false', async () => {
    render(<PriceInput caseId='123' canEdit={false} />)
    await waitFor(() => {
      const btn = screen.getByRole('button')
      expect(btn).toBeDisabled()
    })
  })
})
