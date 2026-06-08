import { render, screen } from '@testing-library/react'

import { describe, expect, it, vi } from 'vitest'
import CaseUnderProgress from './CaseUnderProgress'

// Mock the module stylesheet
vi.mock('./CaseUnderProgress.module.scss', () => ({
  default: { caseProgressIcon: 'caseProgressIcon' },
}))

// Mock the SVG asset
vi.mock('assets/sabic_icons/common/workprogress.svg', () => ({
  default: 'mock-workprogress.svg',
}))

describe('CaseUnderProgress', () => {
  it('renders correctly with the image and text', () => {
    render(<CaseUnderProgress />)
    // Check if the image is rendered with correct src and class
    const imgElement = screen.getByRole('presentation')
    expect(imgElement).toHaveAttribute('src', 'mock-workprogress.svg')
    expect(imgElement).toHaveClass('caseProgressIcon')
    // Check if the text is rendered correctly
    const textElement = screen.getByText('Case under Progress')
    expect(textElement).toBeInTheDocument()
    expect(textElement).toHaveClass('text-14-regular')
  })

  it('has correct container styles', () => {
    const { container } = render(<CaseUnderProgress />)
    const divElement = container.querySelector('div')
    // Check if the container div has the correct classes
    expect(divElement).toHaveClass('w-100')
    expect(divElement).toHaveClass('h-100')
    expect(divElement).toHaveClass('d-flex')
    expect(divElement).toHaveClass('flex-column')
    expect(divElement).toHaveClass('align-items-center')
    expect(divElement).toHaveClass('justify-content-center')
  })
})
