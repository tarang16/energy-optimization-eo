import '@testing-library/jest-dom'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getCardComponent } from '../process_critical_parameters/ProcessCriticalParameters'
import Card from './Card'

vi.mock('../process_critical_parameters/ProcessCriticalParameters', () => ({
  getCardComponent: vi.fn(),
}))

describe('Card component', () => {
  const mockProps = {
    id: 'test-id',
    draggable: true,
    onDragStart: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    kipobj: { tagName: 'test-tag' },
    category: 'test-category',
    caseId: 'test-case-id',
    actualTime: 'test-actual-time',
    odsData: 'test-ods-data',
    isPerformance: false,
  }

  it('renders correctly', () => {
    getCardComponent.mockReturnValue(<div>Card Content</div>)
    const { getByText } = render(<Card {...mockProps} />)
    expect(getByText('Card Content')).toBeInTheDocument()
    expect(getByText('Card Content').parentElement).toHaveStyle({
      width: 'calc(100% / 2)',
    })
  })

  it('handles drag and drop events', () => {
    getCardComponent.mockReturnValue(<div>Card Content</div>)
    const { getByText } = render(<Card {...mockProps} />)
    const cardElement = getByText('Card Content').parentElement
    fireEvent.dragStart(cardElement)
    expect(mockProps.onDragStart).toHaveBeenCalledWith(
      expect.any(Object),
      'test-id',
    )
    fireEvent.dragOver(cardElement)
    expect(mockProps.onDragOver).toHaveBeenCalledWith(expect.any(Object))
    fireEvent.drop(cardElement)
    expect(mockProps.onDrop).toHaveBeenCalledWith(expect.any(Object), 'test-id')
  })

  it('applies correct style based on isPerformance prop', () => {
    getCardComponent.mockReturnValue(<div>Card Content</div>)
    const { getByText, rerender } = render(
      <Card {...mockProps} isPerformance={false} />,
    )
    expect(getByText('Card Content').parentElement).toHaveStyle({
      width: 'calc(100% / 2)',
    })
    rerender(<Card {...mockProps} isPerformance={true} />)
    expect(getByText('Card Content').parentElement).toHaveStyle({
      width: 'calc(100% / 3)',
    })
  })
})
