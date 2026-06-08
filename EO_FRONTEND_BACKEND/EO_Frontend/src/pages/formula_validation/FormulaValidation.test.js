import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import FormulaValidation from './FormulaValidation'
import { convertIfToTernary } from 'components/visuals/formula_box/FormulaBox'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'

vi.mock('components/visuals/formula_box/FormulaBox', () => ({
  convertIfToTernary: vi.fn(),
}))

describe('FormulaValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the FormulaValidation component', () => {
    render(<FormulaValidation />)
    const inputElement = screen.getByPlaceholderText('Enter your formula here')
    expect(inputElement).toBeInTheDocument
  })

  it('validates a correct formula and displays the success message', async () => {
    render(<FormulaValidation />)
    const inputElement = screen.getByPlaceholderText('Enter your formula here')
    convertIfToTernary.mockReturnValue('tag1 > 40 ? 1 : 0')
    fireEvent.change(inputElement, { target: { value: 'if(tag1 > 40, 1, 0)' } })
    const successMessage = await screen.findByText(/formula is correct: 1/i)
    expect(successMessage).toBeInTheDocument
  })

  it('validates an incorrect formula and displays the error message', async () => {
    render(<FormulaValidation />)
    const inputElement = screen.getByPlaceholderText('Enter your formula here')
    fireEvent.change(inputElement, { target: { value: 'if(tag1 > 40, 1, )' } })
    const errorMessage = await screen.findByText('Value expected (char 18)')
    expect(errorMessage).toBeInTheDocument
  })

  it('handles formula without if statements', async () => {
    render(<FormulaValidation />)
    const inputElement = screen.getByPlaceholderText('Enter your formula here')
    fireEvent.change(inputElement, { target: { value: 'tag1 + tag2' } })
    const successMessage = await screen.findByText(/formula is correct: 85/i)
    expect(successMessage).toBeInTheDocument
  })
})
