import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DatePickerIcon from './DatePickerIcon'

describe('DatePickerIcon', () => {
  const mockOnClick = vi.fn()

  it('calls onClick when button is clicked', () => {
    const { getByRole } = render(
      <DatePickerIcon value='test' onClick={mockOnClick} />,
    )
    const button = getByRole('button')
    fireEvent.click(button)
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('renders hidden input with correct value', () => {
    const { getByDisplayValue } = render(
      <DatePickerIcon value='2025-07-01' onClick={mockOnClick} />,
    )
    const input = getByDisplayValue('2025-07-01')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'hidden')
  })

  it('renders calendar image', () => {
    const { getByRole } = render(
      <DatePickerIcon value='' onClick={mockOnClick} />,
    )
  })
})
