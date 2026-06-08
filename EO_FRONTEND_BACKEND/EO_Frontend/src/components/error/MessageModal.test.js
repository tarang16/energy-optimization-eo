import { render, screen, fireEvent } from '@testing-library/react'

import { describe, it, expect, vi, beforeEach } from 'vitest'

import MessageModal from './MessageModal'

vi.mock('./Message.module.scss', () => ({
  default: {
    overlay: 'overlay',

    messageBox: 'messageBox',

    icon: 'icon',

    successIcon: 'successIcon',

    errorIcon: 'errorIcon',
  },
}))

vi.mock('@/config/scss/variables', () => ({
  default: {
    primary_orange: '#ff6600',
  },
}))

describe('MessageModal Component - 100% Coverage', () => {
  const mockOnOk = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when show is false', () => {
    const { container } = render(
      <MessageModal show={false} message='Hidden message' onOk={mockOnOk} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render success modal with default type', () => {
    render(
      <MessageModal
        show={true}
        message='Operation successful'
        onOk={mockOnOk}
      />,
    )

    // Heading

    expect(screen.getByText('Success')).toBeInTheDocument()

    expect(screen.getByText('✓')).toBeInTheDocument()

    expect(screen.getByText('Operation successful')).toBeInTheDocument()

    const button = screen.getByRole('button', { name: /ok/i })

    expect(button).toBeInTheDocument()

    expect(button).toHaveClass('btn-success')
  })
  it('should render error modal when type is error', () => {
    render(
      <MessageModal
        show={true}
        type='error'
        message='Something went wrong'
        onOk={mockOnOk}
      />,
    )

    expect(screen.getByText('Error')).toBeInTheDocument()

    expect(screen.getByText('✕')).toBeInTheDocument()

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    const button = screen.getByRole('button', { name: /ok/i })

    expect(button).toHaveClass('btn-danger')
  })

  it('should apply inline background color from variables', () => {
    render(<MessageModal show={true} message='Styled button' onOk={mockOnOk} />)

    const button = screen.getByRole('button', { name: /ok/i })

    expect(button).toHaveStyle('background-color: #ff6600')
  })

  it('should call onOk handler when Ok button is clicked', () => {
    render(<MessageModal show={true} message='Click test' onOk={mockOnOk} />)

    const button = screen.getByRole('button', { name: /ok/i })

    fireEvent.click(button)

    expect(mockOnOk).toHaveBeenCalledTimes(1)
  })

  it('should apply successIcon class when type is success', () => {
    const { container } = render(
      <MessageModal
        show={true}
        type='success'
        message='Success case'
        onOk={mockOnOk}
      />,
    )

    const iconDiv = container.querySelector('.successIcon')

    expect(iconDiv).toBeInTheDocument()
  })

  it('should apply errorIcon class when type is error', () => {
    const { container } = render(
      <MessageModal
        show={true}
        type='error'
        message='Error case'
        onOk={mockOnOk}
      />,
    )

    const iconDiv = container.querySelector('.errorIcon')

    expect(iconDiv).toBeInTheDocument()
  })
})
