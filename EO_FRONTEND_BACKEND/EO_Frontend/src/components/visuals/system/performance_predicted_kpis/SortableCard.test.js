import '@testing-library/jest-dom' // for better expect assertions
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Card from './Card'

vi.mock('config/scss/_variables.scss', () => {
  return {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
  }
})

describe('Card component', () => {
  const mockCard = {
    id: 1,
    draggable: true,
    kipobj: {
      tagName: 'Tag1',
    },
    category: 'Category1',
    caseId: '123',
    actualTime: '2023-01-01',
    odsData: {},
    isPerformance: true,
    onDragStart: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
  }

  it('should handle drag and drop events correctly', () => {
    const { getByTestId } = render(<Card {...mockCard} />)

    const cardElement = getByTestId('card-1')

    // Simulate drag start
    fireEvent.dragStart(cardElement)
    expect(mockCard.onDragStart).toHaveBeenCalled()

    // Simulate drag over
    fireEvent.dragOver(cardElement)
    expect(mockCard.onDragOver).toHaveBeenCalled()

    // Simulate drop
    fireEvent.drop(cardElement)
    expect(mockCard.onDrop).toHaveBeenCalled()
  })

  it('should handle drag and drop events correctly with predicted', () => {
    const { getByTestId } = render(<Card {...mockCard} isPerformance={false} />)

    const cardElement = getByTestId('card-1')

    // Simulate drag start
    fireEvent.dragStart(cardElement)
    expect(mockCard.onDragStart).toHaveBeenCalled()

    // Simulate drag over
    fireEvent.dragOver(cardElement)
    expect(mockCard.onDragOver).toHaveBeenCalled()

    // Simulate drop
    fireEvent.drop(cardElement)
    expect(mockCard.onDrop).toHaveBeenCalled()
  })
})
