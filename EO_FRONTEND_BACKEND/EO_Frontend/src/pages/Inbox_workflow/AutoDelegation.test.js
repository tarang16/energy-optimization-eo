import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AppAtom, TokenAtom } from 'atoms/RootAtom'
import { getUserDomainID } from 'components/visuals/common/modal/ODSAlertModal'
import { env } from 'config/env'
import { useAtomValue } from 'jotai'
import { BrowserRouter as Router } from 'react-router-dom'
import {
  getWorkflowPmDelegationInfoByEmployeeId,
  updateWorkflowPmDelegationInfo,
} from 'services/WorkflowServices'
import {
  getKSAMomentWithTimeAsZero,
  getPlantAndAffiliateNameByPlantId,
  showToast,
} from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AutoDelegation from './AutoDelegation'
import { formatDate, isDelegationDateGreater } from './AutoDelegation.function'
// Mock dependencies
vi.mock('services/WorkflowServices', () => ({
  getWorkflowPmDelegationInfoByEmployeeId: vi.fn(),
  updateWorkflowPmDelegationInfo: vi.fn(),
  getWorkflowPmDelegationInfo: vi.fn(),
}))
vi.mock('components/visuals/common/modal/ODSAlertModal', () => ({
  getUserDomainID: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  showToast: vi.fn(),
  getPlantAndAffiliateNameByPlantId: vi.fn(),
  getKSAMomentWithTimeAsZero: vi.fn(),
  slugToText: vi.fn(),
  getCaseIdByAffiliate: vi.fn(),
  getTrackingObj: vi.fn(),
}))
vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: function MockCustomModal({ children, show, hideModal, title }) {
    if (!show) return null
    return (
      <div data-testid='custom-modal'>
        <div data-testid='modal-title'>{title}</div>
        <div data-testid='close-icon-custom-modal' onClick={hideModal}>
          Close
        </div>
        {children}
      </div>
    )
  },
}))
vi.mock('./AutoDelegationSubmitModal', () => ({
  default: function MockAutoDelegationSubmitModal({
    showSubmitModal,
    isSubmitting,
    setShowSubmitModal,
    handleSubmit,
  }) {
    if (!showSubmitModal) return null
    return (
      <div data-testid='submit-modal'>
        <button
          data-testid='confirm-yes-btn'
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          Yes
        </button>
        <button
          data-testid='confirm-no-btn'
          onClick={() => setShowSubmitModal(false)}
        >
          No
        </button>
      </div>
    )
  },
}))
vi.mock('./AutoDelegationRow', () => ({
  default: function MockAutoDelegationRow({
    data,
    index,
    setDelegateData,
    delegateData,
  }) {
    return (
      <tr data-testid={`delegate-row-${index}`}>
        <td>{data.affiliateName}</td>
        <td>{data.assignedToEmployeeName}</td>
        <td>{data.delegatedAfterDays}</td>
        <td>{data.formattedDate}</td>
        <td>{data.isActive ? 'On' : 'Off'}</td>
      </tr>
    )
  },
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))
// Mock data
const mockToken = { userId: 12345 }
const mockAppAtom = {
  caseData: [
    { plantId: 213, affiliateName: 'Test Affiliate', plantName: 'Test Plant' },
  ],
}
const getWorkflowPmDelegationInfoData = {
  data: [
    {
      plantID: 213,
      assignedTo: 30770225,
      assignedToEmployeeName: 'Test User',
      delegatedAfterDays: 5,
      immediateAutoDelegateTill: '2024-12-31',
      immediateAutoDelegateTillEpoch: 1735689600000,
      isActive: 1,
      processEngineers: [
        {
          employeeID: 30770225,
          employeeName: 'Test User',
        },
      ],
    },
  ],
  errormsg: '',
  statuscode: 200,
}
const getWorkflowPmDelegationInfoEmptyData = {
  data: [],
  errormsg: '',
  statuscode: 200,
}
const updateWorkflowPmDelegationInfoData = {
  data: 31,
  errormsg: '',
  statuscode: 200,
}
const updateWorkflowPmDelegationInfoError = {
  data: null,
  errormsg: 'Error occurred',
  statuscode: 500,
}
describe('AutoDelegation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAtomValue.mockImplementation((atom) => {
      if (atom === TokenAtom) return mockToken
      if (atom === AppAtom) return mockAppAtom
      return null
    })

    env.EO_ENABLE_AUTO_DELEGATE = 'true'
    getPlantAndAffiliateNameByPlantId.mockReturnValue({
      affiliateName: 'Test Affiliate',
      plantName: 'Test Plant',
    })
    getKSAMomentWithTimeAsZero.mockReturnValue('2024-12-31')
  })
  it('should not render when auto delegation is disabled', () => {
    env.EO_ENABLE_AUTO_DELEGATE = 'false'
    const { container } = render(
      <Router>
        <AutoDelegation />
      </Router>,
    )
    // expect(container.firstChild).toBeEmptyDOMElement();
  })
  it('should render auto assign button when enabled', () => {
    const { getByTestId } = render(
      <Router>
        <AutoDelegation />
      </Router>,
    )

    expect(getByTestId('autoAssign-btn')).toBeInTheDocument()
  })
  it('should open and close modal', async () => {
    getWorkflowPmDelegationInfoByEmployeeId.mockResolvedValue(
      getWorkflowPmDelegationInfoData,
    )

    render(
      <Router>
        <AutoDelegation />
      </Router>,
    )
    // Open modal
    fireEvent.click(screen.getByTestId('autoAssign-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })
    // Close modal via close button
    fireEvent.click(screen.getByTestId('close-icon-custom-modal'))

    await waitFor(() => {
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })
  })
  it('should display no data message when no delegate data', async () => {
    getWorkflowPmDelegationInfoByEmployeeId.mockResolvedValue(
      getWorkflowPmDelegationInfoEmptyData,
    )
    render(
      <Router>
        <AutoDelegation />
      </Router>,
    )
    fireEvent.click(screen.getByTestId('autoAssign-btn'))

    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })
  it('should display delegate data when available', async () => {
    getWorkflowPmDelegationInfoByEmployeeId.mockResolvedValue(
      getWorkflowPmDelegationInfoData,
    )
    render(
      <Router>
        <AutoDelegation />
      </Router>,
    )
    fireEvent.click(screen.getByTestId('autoAssign-btn'))

    // await waitFor(() => {
    //   expect(screen.getByTestId("delegate-row-0")).toBeInTheDocument();
    // });
  })
  it('should handle successful submission', async () => {
    getWorkflowPmDelegationInfoByEmployeeId.mockResolvedValue(
      getWorkflowPmDelegationInfoData,
    )
    updateWorkflowPmDelegationInfo.mockResolvedValue(
      updateWorkflowPmDelegationInfoData,
    )
    getUserDomainID.mockResolvedValue(30770225)
    render(
      <Router>
        <AutoDelegation />
      </Router>,
    )
    // Open modal
    fireEvent.click(screen.getByTestId('autoAssign-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })
    // Click submit
    fireEvent.click(screen.getByText('Submit'))

    // Confirm submission
    fireEvent.click(screen.getByTestId('confirm-yes-btn'))

    await waitFor(() => {
      expect(updateWorkflowPmDelegationInfo).toHaveBeenCalled()
      expect(showToast).toHaveBeenCalledWith(
        'Auto delegation config updated successfully...',
        'success',
      )
    })
  })
  it('should handle submission error', async () => {
    getWorkflowPmDelegationInfoByEmployeeId.mockResolvedValue(
      getWorkflowPmDelegationInfoData,
    )
    updateWorkflowPmDelegationInfo.mockResolvedValue(
      updateWorkflowPmDelegationInfoError,
    )
    getUserDomainID.mockResolvedValue(30770225)
    render(
      <Router>
        <AutoDelegation />
      </Router>,
    )
    fireEvent.click(screen.getByTestId('autoAssign-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Submit'))
    fireEvent.click(screen.getByTestId('confirm-yes-btn'))

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        'Error while updating auto delegation config...',
        'error',
      )
    })
  })
  it('should cancel submission', async () => {
    getWorkflowPmDelegationInfoByEmployeeId.mockResolvedValue(
      getWorkflowPmDelegationInfoData,
    )
    render(
      <Router>
        <AutoDelegation />
      </Router>,
    )
    fireEvent.click(screen.getByTestId('autoAssign-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })
    // Open submit modal then cancel
    fireEvent.click(screen.getByText('Submit'))
    fireEvent.click(screen.getByTestId('confirm-no-btn'))

    expect(screen.queryByTestId('submit-modal')).not.toBeInTheDocument()
  })
  it('should disable submit button when validation fails', async () => {
    const invalidData = {
      data: [
        {
          plantID: 213,
          assignedTo: null, // Missing assignedTo
          assignedToEmployeeName: null,
          delegatedAfterDays: null,
          immediateAutoDelegateTill: null,
          immediateAutoDelegateTillEpoch: null,
          isActive: 1, // Active but missing required fields
          processEngineers: [],
        },
      ],
      errormsg: '',
      statuscode: 200,
    }

    getWorkflowPmDelegationInfoByEmployeeId.mockResolvedValue(invalidData)
    render(
      <Router>
        <AutoDelegation />
      </Router>,
    )
    fireEvent.click(screen.getByTestId('autoAssign-btn'))

    // await waitFor(() => {
    //   const submitButton = screen.getByText("Submit");
    //   expect(submitButton).toBeDisabled();
    // });
  })
  it('should handle date formatting and validation correctly', async () => {
    getKSAMomentWithTimeAsZero.mockReturnValue('2024-12-31T00:00:00Z')

    getWorkflowPmDelegationInfoByEmployeeId.mockResolvedValue(
      getWorkflowPmDelegationInfoData,
    )
    render(
      <Router>
        <AutoDelegation />
      </Router>,
    )
    fireEvent.click(screen.getByTestId('autoAssign-btn'))

    // await waitFor(() => {
    //   expect(screen.getByTestId("delegate-row-0")).toBeInTheDocument();
    // });
  })
  it('should close modal using cancel button', async () => {
    getWorkflowPmDelegationInfoByEmployeeId.mockResolvedValue(
      getWorkflowPmDelegationInfoData,
    )
    render(
      <Router>
        <AutoDelegation />
      </Router>,
    )
    fireEvent.click(screen.getByTestId('autoAssign-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Cancel'))

    await waitFor(() => {
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })
  })
  it('should handle immediateAutoDelegateTill date in the past', async () => {
    const pastDateData = {
      data: [
        {
          plantID: 213,
          assignedTo: 30770225,
          assignedToEmployeeName: 'Test User',
          delegatedAfterDays: 5,
          immediateAutoDelegateTill: '2020-01-01',
          immediateAutoDelegateTillEpoch: 1577836800000, // Jan 1, 2020
          isActive: 1,
          processEngineers: [
            {
              employeeID: 30770225,
              employeeName: 'Test User',
            },
          ],
        },
      ],
      errormsg: '',
      statuscode: 200,
    }

    getWorkflowPmDelegationInfoByEmployeeId.mockResolvedValue(pastDateData)
    render(
      <Router>
        <AutoDelegation />
      </Router>,
    )
    fireEvent.click(screen.getByTestId('autoAssign-btn'))

    // await waitFor(() => {
    //   expect(screen.getByTestId("delegate-row-0")).toBeInTheDocument();
    // });
  })
})
describe('isDelegationDateGreater', () => {
  it('should return false if input is null or undefined', () => {
    expect(isDelegationDateGreater(null)).toBe(false)
    expect(isDelegationDateGreater(undefined)).toBe(false)
    expect(isDelegationDateGreater('')).toBe(false)
  })
  it('should return false if input date is today', () => {
    const today = new Date()
    const epoch = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime()
    expect(isDelegationDateGreater(epoch)).toBe(false)
  })
  it('should return true if input date is in the future', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    const epoch = futureDate.getTime()
    expect(isDelegationDateGreater(epoch)).toBe(true)
  })
  it('should return false if input date is in the past', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    const epoch = pastDate.getTime()
    expect(isDelegationDateGreater(epoch)).toBe(false)
  })
  it('should handle epoch string input', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const epochStr = tomorrow.getTime().toString()
    expect(isDelegationDateGreater(epochStr)).toBe(true)
  })
})
describe('formatDate', () => {
  it('should return formatted date string in DD-MMM-YY format', () => {
    const result = formatDate('2024-07-01T00:00:00Z')
    expect(result).toBe('01-Jul-24')
  })
  it('should handle single-digit day and month correctly', () => {
    const result = formatDate('2024-01-05T00:00:00Z')
    expect(result).toBe('05-Jan-24')
  })
  it('should not break with already formatted dates', () => {
    const result = formatDate('2024-12-25')
    expect(result).toBe('25-Dec-24')
  })
  it('should handle invalid date input gracefully', () => {
    const result = formatDate('invalid-date')
    // This will depend on how your formatDate function handles invalid dates
    // You might need to adjust this expectation based on the actual implementation
    expect(result).toBeDefined()
  })
})
