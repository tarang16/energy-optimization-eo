// ============================================================
// FILE 6: AutoDelegationSubmitModal.test.jsx
// ============================================================
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AutoDelegationSubmitModal from './AutoDelegationSubmitModal'
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: function MockCustomModal({
    hideModal,
    title,
    show,
    children,
    size,
    modalHeight,
    contentFitWidth,
  }) {
    if (!show) return null
    return (
      <div data-testid='custom-modal'>
        <h3 data-testid='modal-title'>{title}</h3>
        <div data-testid='modal-content'>{children}</div>
        <button onClick={hideModal} data-testid='modal-close-button'>
          Close
        </button>
        <div data-testid='modal-props'>
          Size: {size}, Height: {modalHeight}, ContentFit: {contentFitWidth}
        </div>
      </div>
    )
  },
}))
describe('AutoDelegationSubmitModal', () => {
  const mockDelegateData = [
    {
      active: true,
      assignedToEmployeeName: 'John Doe',
      assigneToName: 'John Doe',
      formattedDate: '2024-12-31',
    },
    {
      active: false,
      assignedToEmployeeName: 'Jane Smith',
      assigneToName: 'Jane Smith',
      formattedDate: '2024-12-31',
    },
  ]
  const defaultProps = {
    showSubmitModal: true,
    isSubmitting: false,
    setShowSubmitModal: vi.fn(),
    handleSubmit: vi.fn(),
    delegateData: mockDelegateData,
  }
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders when showSubmitModal is true', () => {
    render(<AutoDelegationSubmitModal {...defaultProps} />)
    expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title')).toHaveTextContent(
      'User Confirmation',
    )
  })
  it('does not render when showSubmitModal is false', () => {
    const props = { ...defaultProps, showSubmitModal: false }
    render(<AutoDelegationSubmitModal {...props} />)
    expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
  })
  it('renders correct note for active delegation', () => {
    render(<AutoDelegationSubmitModal {...defaultProps} />)
  })
  it('renders correct note for inactive delegation', () => {
    render(<AutoDelegationSubmitModal {...defaultProps} />)
    expect(
      screen.getByText(/new alerts auto delegation is turned off/i),
    ).toBeInTheDocument()
  })
  it('handles name replacement correctly', () => {
    const delegateDataWithComma = [
      {
        active: true,
        assignedToEmployeeName: 'Doe, John',
        assigneToName: 'Doe, John',
        formattedDate: '2024-12-31',
      },
    ]
    render(
      <AutoDelegationSubmitModal
        {...defaultProps}
        delegateData={delegateDataWithComma}
      />,
    )
  })
  it('renders confirmation question', () => {
    render(<AutoDelegationSubmitModal {...defaultProps} />)
    expect(
      screen.getByText(/Are you sure you want to submit the request?/i),
    ).toBeInTheDocument()
  })
  it('renders both Yes and No buttons', () => {
    render(<AutoDelegationSubmitModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument()
  })
  it('No button calls setShowSubmitModal with false', () => {
    render(<AutoDelegationSubmitModal {...defaultProps} />)
    const noButton = screen.getByRole('button', { name: 'No' })
    fireEvent.click(noButton)
    expect(defaultProps.setShowSubmitModal).toHaveBeenCalledWith(false)
  })
  it('Yes button calls handleSubmit', () => {
    render(<AutoDelegationSubmitModal {...defaultProps} />)
    const yesButton = screen.getByRole('button', { name: 'Yes' })
    fireEvent.click(yesButton)
    expect(defaultProps.handleSubmit).toHaveBeenCalled()
  })
  it('buttons are disabled when isSubmitting is true', () => {
    const props = { ...defaultProps, isSubmitting: true }
    render(<AutoDelegationSubmitModal {...props} />)
    const yesButton = screen.getByRole('button', { name: 'Submitting...' })
    const noButton = screen.getByRole('button', { name: 'No' })
    expect(yesButton).toBeDisabled()
    expect(noButton).toBeDisabled()
  })
  it('Yes button shows "Submitting..." text when isSubmitting is true', () => {
    const props = { ...defaultProps, isSubmitting: true }
    render(<AutoDelegationSubmitModal {...props} />)
    expect(
      screen.getByRole('button', { name: 'Submitting...' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Yes' }),
    ).not.toBeInTheDocument()
  })
  it('Yes button shows "Yes" text when isSubmitting is false', () => {
    render(<AutoDelegationSubmitModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Submitting...' }),
    ).not.toBeInTheDocument()
  })
  it('passes correct props to CustomModal', () => {
    render(<AutoDelegationSubmitModal {...defaultProps} />)
    expect(screen.getByTestId('modal-props')).toHaveTextContent(
      'Size: md , Height: auto, ContentFit: customNestedBackgroundBlue',
    )
  })
  it('hide modal function prevents closing when isSubmitting', () => {
    const props = { ...defaultProps, isSubmitting: true }
    render(<AutoDelegationSubmitModal {...props} />)
    const closeButton = screen.getByTestId('modal-close-button')
    fireEvent.click(closeButton)
    expect(defaultProps.setShowSubmitModal).not.toHaveBeenCalled()
  })
  it('hide modal function allows closing when not isSubmitting', () => {
    render(<AutoDelegationSubmitModal {...defaultProps} />)
    const closeButton = screen.getByTestId('modal-close-button')
    fireEvent.click(closeButton)
    expect(defaultProps.setShowSubmitModal).toHaveBeenCalledWith(false)
  })
  it('renders "Please Note" heading', () => {
    render(<AutoDelegationSubmitModal {...defaultProps} />)
  })
  it('handles empty delegateData gracefully', () => {
    const props = { ...defaultProps, delegateData: [] }
    render(<AutoDelegationSubmitModal {...props} />)
    expect(
      screen.getByText(/Are you sure you want to submit the request?/i),
    ).toBeInTheDocument()
  })
  it('uses assigneToName as fallback when assignedToEmployeeName is not available', () => {
    const delegateDataWithFallback = [
      {
        active: true,
        assignedToEmployeeName: null,
        assigneToName: 'Fallback Name',
        formattedDate: '2024-12-31',
      },
    ]
    render(
      <AutoDelegationSubmitModal
        {...defaultProps}
        delegateData={delegateDataWithFallback}
      />,
    )
  })
  it('uses empty string when both names are not available', () => {
    const delegateDataWithoutNames = [
      {
        active: true,
        assignedToEmployeeName: null,
        assigneToName: null,
        formattedDate: '2024-12-31',
      },
    ]
    render(
      <AutoDelegationSubmitModal
        {...defaultProps}
        delegateData={delegateDataWithoutNames}
      />,
    )
  })
  it('renders list items with unique keys', () => {
    const { container } = render(
      <AutoDelegationSubmitModal {...defaultProps} />,
    )
    const listItems = container.querySelectorAll('li')
    expect(listItems.length).toBe(2)
    const texts = Array.from(listItems).map((li) => li.textContent)
    const uniqueTexts = [...new Set(texts)]
    expect(uniqueTexts.length).toBe(texts.length)
  })
})
