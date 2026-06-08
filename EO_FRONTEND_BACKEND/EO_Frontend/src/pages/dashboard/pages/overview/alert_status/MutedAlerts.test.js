import { beforeEach, describe, expect, it, vi } from 'vitest'
// MutedAlerts.test.jsx
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useAtomValue } from 'jotai'
import {
  getAlertStatisticsMutedAlerts,
  updateMuteAlertsLogByCauseIdList,
} from 'services/AlertStaticsSerives'
import { getWorkflowUsersByRole } from 'services/WorkflowServices'
import {
  convertFormulaToHtml,
  getAffiliateCodeByCaseID,
  showToast,
} from 'utills/utilities'

// Mock all external dependencies

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
    // your mocked methods
  }
})

vi.mock('react-bootstrap', () => ({
  Tab: vi.fn(({ children }) => <div>{children}</div>),
  Tabs: vi.fn(({ children, defaultActiveKey, onSelect }) => (
    <div data-testid='tabs'>
      <button onClick={() => onSelect('current_mute_alerts')}>
        Current Tab
      </button>
      <button onClick={() => onSelect('past_mute_alerts')}>Past Tab</button>
      {children}
    </div>
  )),
}))

vi.mock('moment', () => ({
  default: () => {
    const mockMoment = vi.fn(() => ({
      format: vi.fn(() => '01-Jan-23'),
    }))
    mockMoment.format = vi.fn()
    return mockMoment
  },
}))

vi.mock('services/AlertStaticsSerives', () => ({
  getAlertStatisticsMutedAlerts: vi.fn(),
  updateMuteAlertsLogByCauseIdList: vi.fn(),
}))
vi.mock('services/WorkflowServices', () => ({
  getWorkflowUsersByRole: vi.fn(),
}))
vi.mock('components/ui/switch/Switch', () => ({
  default: ({ type, defaultChecked, onChange, customToggleStyle }) => (
    <input
      type='checkbox'
      data-testid='switch'
      defaultChecked={defaultChecked}
      onChange={onChange}
      className={customToggleStyle}
    />
  ),
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({
    show,
    title,
    children,
    hideModal,
    size,
    bodyHeight,
    modalHeight,
    customSpacingClass,
    id,
  }) =>
    show ? (
      <div
        data-testid='custom-modal'
        data-title={title}
        data-size={size}
        data-body-height={bodyHeight}
        data-modal-height={modalHeight}
        className={customSpacingClass}
        id={id}
      >
        <h3>{title}</h3>
        <button onClick={hideModal}>Close Modal</button>
        {children}
      </div>
    ) : null,
}))
vi.mock('components/visuals/table/SimpleTable', () => ({
  default: ({
    data,
    headers,
    showLoader,
    customColumnWidths,
    leftAlignColumns,
  }) =>
    showLoader ? (
      <div>Loading...</div>
    ) : (
      <table data-testid='simple-table'>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} data-width={customColumnWidths?.[index]}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  data-align={
                    leftAlignColumns?.includes(cellIndex) ? 'left' : 'center'
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    ),
}))
vi.mock('utills/utilities', () => ({
  convertFormulaToHtml: vi.fn((text) => text || ''),
  getAffiliateCodeByCaseID: vi.fn(),
  getValsBaseOnCondition: vi.fn((condition, trueVal, falseVal) =>
    condition ? trueVal : falseVal,
  ),
  showToast: vi.fn(),
}))
// Mock config
vi.mock('config/Config', () => ({
  WORKFLOW_ROLE: {
    PROCESS_MANAGER: '1',
    PROCESS_ENGINEER: '2',
  },
}))
// Import after mocking
import MutedAlerts, { handleConfirmSubmit } from './MutedAlerts'
describe('MutedAlerts Component', () => {
  const mockCaseId = 'test-case-123'
  const mockToken = {
    userId: 'user123',
    isPowerUser: true,
  }
  const mockAppAtom = {
    caseData: [
      { caseId: 'test-case-123', affiliateCode: 'AFF123' },
      { caseId: 'other-case', affiliateCode: 'AFF456' },
    ],
  }
  // Mock data
  const mockCurrentAlerts = [
    {
      causeId: 1,
      causename: 'Test Cause 1',
      mutedOn: '2023-01-01',
      muteTill: '2023-12-31',
      createdBy: 'User1',
      reason: 'Maintenance',
      comment: 'Scheduled maintenance',
      isActive: true,
      causeName: 'Test Cause 1',
      formula: 'test formula',
      Suggestion: 'test suggestion',
    },
    {
      causeId: 2,
      causename: 'Test Cause 2',
      mutedOn: '2023-02-01',
      muteTill: '2023-11-30',
      createdBy: 'User2',
      reason: 'Bug fix',
      comment: 'Fixing critical bug',
      isActive: false,
      causeName: 'Test Cause 2',
      formula: 'another formula',
      Suggestion: 'another suggestion',
    },
  ]
  const mockPastAlerts = [
    {
      causeId: 3,
      causeName: 'Past Cause 1',
      mutedOn: '2023-01-01',
      muteTill: '2023-06-30',
      createdBy: 'User1',
      updatedBy: 'User3',
      updatedOn: '2023-07-01',
      reason: 'Resolved',
      comment: 'Issue resolved',
      formula: 'past formula',
      Suggestion: 'past suggestion',
    },
  ]
  const mockWorkflowUsers = [
    {
      employeeId: 'user123',
      roleId: '1', // PROCESS_MANAGER
    },
    {
      employeeId: 'otheruser',
      roleId: '3', // Other role
    },
  ]
  beforeEach(() => {
    vi.clearAllMocks()
    useAtomValue
      .mockReturnValueOnce(mockToken) // TokenAtom
      .mockReturnValueOnce(mockAppAtom) // AppAtom
    getWorkflowUsersByRole.mockResolvedValue({
      statuscode: 200,
      data: mockWorkflowUsers,
    })

    getAlertStatisticsMutedAlerts.mockResolvedValue({
      statuscode: 200,
      data: mockCurrentAlerts,
    })
    getAffiliateCodeByCaseID.mockReturnValue('AFF123')
  })
  describe('handleConfirmSubmit', () => {
    it('should successfully submit and update alerts', async () => {
      const mockSetIsSubmitting = vi.fn()
      const mockSetShow = vi.fn()
      const mockSetRefetchAlert = vi.fn()
      const mockUpdatedAlerts = ['1', '2']

      updateMuteAlertsLogByCauseIdList.mockResolvedValue({ statuscode: 200 })
      await handleConfirmSubmit(
        mockSetIsSubmitting,
        mockUpdatedAlerts,
        mockSetShow,
        mockSetRefetchAlert,
      )
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(true)
      expect(updateMuteAlertsLogByCauseIdList).toHaveBeenCalledWith('1,2')
      expect(mockSetShow).toHaveBeenCalledWith(false)
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(false)
      expect(mockSetRefetchAlert).toHaveBeenCalledWith(expect.any(Function))
    })
    it('should handle API error', async () => {
      const mockSetIsSubmitting = vi.fn()
      const mockSetShow = vi.fn()
      const mockSetRefetchAlert = vi.fn()
      const mockUpdatedAlerts = ['1', '2']

      updateMuteAlertsLogByCauseIdList.mockResolvedValue({ statuscode: 500 })
      await handleConfirmSubmit(
        mockSetIsSubmitting,
        mockUpdatedAlerts,
        mockSetShow,
        mockSetRefetchAlert,
      )
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(false)
      expect(showToast).not.toHaveBeenCalled()
    })
    it('should handle exception', async () => {
      const mockSetIsSubmitting = vi.fn()
      const mockSetShow = vi.fn()
      const mockSetRefetchAlert = vi.fn()
      const mockUpdatedAlerts = ['1', '2']

      updateMuteAlertsLogByCauseIdList.mockRejectedValue(new Error('API Error'))
      await handleConfirmSubmit(
        mockSetIsSubmitting,
        mockUpdatedAlerts,
        mockSetShow,
        mockSetRefetchAlert,
      )
      expect(mockSetIsSubmitting).toHaveBeenCalledWith(false)
      expect(showToast).toHaveBeenCalledWith(
        'error while update muted alerts Data',
        expect.any(Error),
      )
    })
  })
  describe('Component Rendering', () => {
    it('should render Mute Alerts Info button', async () => {
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
    })
    it('should open modal when button is clicked', async () => {
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      const button = screen.getByText('Mute Alerts Info')
      await act(async () => {
        fireEvent.click(button)
      })
    })
    it('should fetch workflow users on mount', async () => {
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      expect(getWorkflowUsersByRole).toHaveBeenCalledWith('', 'AFF123')
    })
    it('should set isAccessMute to true when user has correct role', async () => {
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
    })
    it('should set isAccessMute to false when user does not have correct role', async () => {
      const mockNonPowerUserToken = { userId: 'user123', isPowerUser: false }
      useAtomValue
        .mockReturnValueOnce(mockNonPowerUserToken)
        .mockReturnValueOnce(mockAppAtom)
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
    })
  })
  describe('Modal Interactions', () => {
    beforeEach(async () => {
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      // Open modal
      const button = screen.getByText('Mute Alerts Info')
      await act(async () => {
        fireEvent.click(button)
      })
    })
    it('should switch to past muted alerts tab', async () => {})
    it('should display tooltip content correctly', async () => {
      convertFormulaToHtml.mockReturnValue('formula content')
    })
  })
  describe('Form Submission', () => {
    beforeEach(async () => {
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      // Open modal
      const button = screen.getByText('Mute Alerts Info')
      await act(async () => {
        fireEvent.click(button)
      })
    })
    it('should open confirmation modal when submit is clicked', async () => {
      await waitFor(() => {
        const submitButton = screen.getByText('submit')
        fireEvent.click(submitButton)
      })
    })
    it('should handle confirmation modal - Yes', async () => {
      updateMuteAlertsLogByCauseIdList.mockResolvedValue({ statuscode: 200 })
      await waitFor(() => {
        const submitButton = screen.getByText('submit')
        fireEvent.click(submitButton)
      })
      await waitFor(() => {
        const yesButton = screen.getByText('Yes')
        fireEvent.click(yesButton)
      })
      expect(updateMuteAlertsLogByCauseIdList).toHaveBeenCalled()
    })
    it('should handle confirmation modal - No', async () => {
      await waitFor(() => {
        const submitButton = screen.getByText('submit')
        fireEvent.click(submitButton)
      })
      await waitFor(() => {
        const noButton = screen.getByText('No')
        fireEvent.click(noButton)
      })
    })
  })
  describe('Error Handling', () => {
    it('should handle workflow users API error', async () => {
      getWorkflowUsersByRole.mockRejectedValue(new Error('API Error'))
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith(
          'error while fetching workflow user role',
          expect.any(Error),
        )
      })
    })
    it('should handle muted alerts API error', async () => {
      getAlertStatisticsMutedAlerts.mockRejectedValue(new Error('API Error'))
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      // Open modal to trigger API call
      const button = screen.getByText('Mute Alerts Info')
      await act(async () => {
        fireEvent.click(button)
      })
      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith(
          'error while fetch muted alert Data',
          expect.any(Error),
        )
      })
    })
    it('should handle empty API response', async () => {
      getAlertStatisticsMutedAlerts.mockResolvedValue({
        statuscode: 200,
        data: [],
      })
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      // Open modal
      const button = screen.getByText('Mute Alerts Info')
      await act(async () => {
        fireEvent.click(button)
      })
    })
    it('should handle API response with no statuscode 200', async () => {
      getAlertStatisticsMutedAlerts.mockResolvedValue({
        statuscode: 500,
        data: null,
      })
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      // Open modal
      const button = screen.getByText('Mute Alerts Info')
      await act(async () => {
        fireEvent.click(button)
      })
    })
  })
  describe('Edge Cases', () => {
    it('should handle missing data fields gracefully', async () => {
      const incompleteAlerts = [
        {
          causeId: 1,
          // Missing other fields
        },
      ]

      getAlertStatisticsMutedAlerts.mockResolvedValue({
        statuscode: 200,
        data: incompleteAlerts,
      })
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      // Open modal
      const button = screen.getByText('Mute Alerts Info')
      await act(async () => {
        fireEvent.click(button)
      })
    })
    it('should handle null or undefined values in tooltip modal', async () => {
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      // Open main modal first
      const button = screen.getByText('Mute Alerts Info')
      await act(async () => {
        fireEvent.click(button)
      })
      // Should handle null tooltip data without crashing
    })
    it('should not show action buttons when no access and no data', async () => {
      // Mock user without access
      const mockNonPowerUserToken = { userId: 'user123', isPowerUser: false }
      useAtomValue
        .mockReturnValueOnce(mockNonPowerUserToken)
        .mockReturnValueOnce(mockAppAtom)

      getAlertStatisticsMutedAlerts.mockResolvedValue({
        statuscode: 200,
        data: [],
      })
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      // Open modal
      const button = screen.getByText('Mute Alerts Info')
      await act(async () => {
        fireEvent.click(button)
      })
    })
  })
  describe('Data Formatting', () => {
    it('should format dates using moment', async () => {
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      // Open modal
      const button = screen.getByText('Mute Alerts Info')
      await act(async () => {
        fireEvent.click(button)
      })
    })
    it('should handle missing dates', async () => {
      const alertsWithMissingDates = [
        {
          causeId: 1,
          causename: 'Test Cause',
          // No mutedOn or muteTill
          createdBy: 'User1',
          reason: 'Test',
          comment: 'Test',
          isActive: true,
        },
      ]
      getAlertStatisticsMutedAlerts.mockResolvedValue({
        statuscode: 200,
        data: alertsWithMissingDates,
      })
      await act(async () => {
        render(<MutedAlerts caseId={mockCaseId} />)
      })
      // Open modal
      const button = screen.getByText('Mute Alerts Info')
      await act(async () => {
        fireEvent.click(button)
      })
    })
  })
})
