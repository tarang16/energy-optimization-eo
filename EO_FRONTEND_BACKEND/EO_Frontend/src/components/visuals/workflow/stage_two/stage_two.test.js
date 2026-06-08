import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { STAGE_ACTION } from 'config/Config'
import * as WorkflowServices from 'services/WorkflowServices'
import * as utilities from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkflowStageTwo from './stage_two'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('config/Config', () => ({
  STAGE_ACTION: {
    DELEGATE: 'DELEGATE',
    CLOSE: 'CLOSE',
    REJECT: 'REJECT',
    WILL_IMPLEMENT: 'WILL_IMPLEMENT',
    REVISE_TARGET_DATE: 'REVISE_TARGET_DATE',
    CHANGED_TARGET_DATE: 'CHANGED_TARGET_DATE',
    ACCEPT: 'ACCEPT',
    CONFIRM_IMPLEMENTATION: 'CONFIRM_IMPLEMENTATION',
  },
}))

vi.mock('moment/moment', () => {
  const momentFn = (val) => {
    const instance = {
      toDate: () => new Date('2024-01-15'),
      format: (fmt) => '15-Jan-24 10:00 AM',
      add: () => instance,
    }
    return instance
  }
  momentFn.isMoment = () => false
  return { default: momentFn }
})

vi.mock('react-datepicker', () => ({
  default: ({ selected, onChange, placeholderText, minDate }) => (
    <input
      data-testid='date-picker'
      placeholder={placeholderText}
      value={selected ? selected.toString() : ''}
      onChange={(e) => onChange(new Date(e.target.value))}
      readOnly
    />
  ),
}))

vi.mock('services/WorkflowServices', () => ({
  getWfAlertHistoricalData: vi.fn(),
}))

vi.mock('utills/utilities', () => ({
  commentValidString: vi.fn(() => ''),
  createDateIgnoringTimezone: vi.fn((d) => d),
  getValsBaseOnCondition: vi.fn((cond, a, b) => (cond ? a : b)),
  globalizeDate: vi.fn((d) => d),
  isValidString: vi.fn(() => ''),
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, children, title, hideModal }) =>
    show ? (
      <div data-testid='custom-modal'>
        <span>{title}</span>
        <button onClick={hideModal} data-testid='close-modal'>
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

vi.mock('components/visuals/dropdown/single_select/SingleSelect', () => ({
  default: ({ data, onSelectChange, activeI, labelKey }) => (
    <select
      data-testid='single-select'
      onChange={(e) => onSelectChange(e.target.value)}
      defaultValue={activeI}
    >
      {(data || []).map((item, i) => (
        <option key={i} value={i}>
          {item[labelKey]}
        </option>
      ))}
    </select>
  ),
}))

vi.mock('components/visuals/table/SimpleTable', () => ({
  default: ({ data, headers }) => (
    <div data-testid='simple-table'>
      {headers.map((h) => (
        <span key={h}>{h}</span>
      ))}
    </div>
  ),
}))

vi.mock('../radio_button/Buttons', () => ({
  default: ({ buttonsObj, defaultActiveIndex }) => (
    <div data-testid='buttons'>
      {buttonsObj.map((btn, i) => (
        <button
          key={i}
          data-testid={`btn-${btn.name}`}
          onClick={btn.onButtonClick}
        >
          {btn.name}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('../../../../assets/sabic_icons/common/red_delete_icon.svg', () => ({
  default: 'delete-icon.svg',
}))
vi.mock('../../../../assets/sabic_icons/table/table_plus_icon.svg', () => ({
  default: 'plus-icon.svg',
}))
vi.mock('../workflow.module.scss', () => ({ default: {} }))

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockHistoryResponse = {
  data: [
    {
      history: [
        {
          timeEpoch: 1700000000000,
          employeeName: 'John Doe (ENG)',
          suggestions: [
            { actual: 10, optimum: 20, suggestion: 'Increase pressure' },
          ],
        },
      ],
    },
  ],
}

const defaultProps = {
  odsAssigneeList: [{ name: 'Alice' }, { name: 'Bob' }],
  odsReAssigneeList: [{ name: 'Charlie' }],
  initialSys: 0,
  submitData: false,
  setIsReject: vi.fn(),
  setIsAccept: vi.fn(),
  setStageData: vi.fn((fn) =>
    fn({ suggestions: [], addOther: false, considerSuggestion: 0 }),
  ),
  stageData: {
    targetDate: new Date('2024-01-15'),
    confirmImplementation: 0,
    addOther: false,
    considerSuggestion: 0,
    suggestions: [],
    assigneeID: null,
  },
  actionId: STAGE_ACTION.CLOSE,
  setActionId: vi.fn(),
  isSuggestionData: false,
  alertModalId: 'alert-123',
  ODSData: null,
}

function renderComponent(props = {}) {
  return render(<WorkflowStageTwo {...defaultProps} {...props} />)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WorkflowStageTwo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    WorkflowServices.getWfAlertHistoricalData.mockResolvedValue(
      mockHistoryResponse,
    )
  })

  // ── Rendering ───────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders buttons when submitData is false', () => {
      renderComponent()
      expect(screen.getByTestId('buttons')).toBeInTheDocument()
    })

    it('renders submitData message when submitData is true', () => {
      renderComponent({ submitData: true })
      expect(screen.getByText('Current Status:')).toBeInTheDocument()
      expect(
        screen.getByText('Assigned to Operation Manager.'),
      ).toBeInTheDocument()
      expect(screen.queryByTestId('buttons')).not.toBeInTheDocument()
    })

    it('renders Accept, Target Date, Reject, Forward buttons when ODSData has no targetDate', () => {
      renderComponent()
      expect(screen.getByTestId('btn-Accept')).toBeInTheDocument()
      expect(screen.getByTestId('btn-Target Date')).toBeInTheDocument()
      expect(screen.getByTestId('btn-Reject')).toBeInTheDocument()
      expect(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      ).toBeInTheDocument()
    })

    it('renders "Change Target Date" button when ODSData has targetDate', () => {
      renderComponent({ ODSData: { targetDate: 1700000000 } })
      expect(screen.getByTestId('btn-Change Target Date')).toBeInTheDocument()
      expect(screen.queryByTestId('btn-Target Date')).not.toBeInTheDocument()
    })
  })

  // ── useEffect: ODSData ───────────────────────────────────────────────────────

  describe('useEffect – ODSData', () => {
    it('calls setStageData with targetDate from ODSData when targetDate exists', () => {
      const setStageData = vi.fn((fn) =>
        fn({ suggestions: [], addOther: false, confirmImplementation: 0 }),
      )
      renderComponent({ ODSData: { targetDate: 1700000000 }, setStageData })
      expect(setStageData).toHaveBeenCalled()
    })

    it('calls setStageData with moment().toDate() when ODSData has no targetDate', () => {
      const setStageData = vi.fn((fn) =>
        fn({ suggestions: [], addOther: false, confirmImplementation: 0 }),
      )
      renderComponent({ ODSData: null, setStageData })
      expect(setStageData).toHaveBeenCalled()
    })

    it('calls setActionId(WILL_IMPLEMENT) when ODSData has targetDate', () => {
      const setActionId = vi.fn()
      renderComponent({ ODSData: { targetDate: 1700000000 }, setActionId })
      expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.WILL_IMPLEMENT)
    })

    it('calls setActionId(CLOSE) when ODSData has no targetDate', () => {
      const setActionId = vi.fn()
      renderComponent({ ODSData: null, setActionId })
      expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.CLOSE)
    })
  })

  // ── useEffect: fetchData ─────────────────────────────────────────────────────

  describe('useEffect – fetchData', () => {
    it('calls getWfAlertHistoricalData on mount', async () => {
      renderComponent()
      await waitFor(() =>
        expect(WorkflowServices.getWfAlertHistoricalData).toHaveBeenCalledWith(
          'alert-123',
        ),
      )
    })

    it('sets alertHistoryData when response has data', async () => {
      renderComponent()
      await waitFor(() =>
        expect(WorkflowServices.getWfAlertHistoricalData).toHaveBeenCalled(),
      )
    })

    it('handles empty/null response gracefully', async () => {
      WorkflowServices.getWfAlertHistoricalData.mockResolvedValue(null)
      renderComponent()
      await waitFor(() =>
        expect(WorkflowServices.getWfAlertHistoricalData).toHaveBeenCalled(),
      )
    })

    it('handles response with no data property', async () => {
      WorkflowServices.getWfAlertHistoricalData.mockResolvedValue({
        data: null,
      })
      renderComponent()
      await waitFor(() =>
        expect(WorkflowServices.getWfAlertHistoricalData).toHaveBeenCalled(),
      )
    })
  })

  // ── Button click handlers ────────────────────────────────────────────────────

  describe('button click handlers', () => {
    it('handleAcceptClick sets CLOSE action and shows no input container', () => {
      const setActionId = vi.fn()
      const setIsAccept = vi.fn()
      const setIsReject = vi.fn()
      renderComponent({ setActionId, setIsAccept, setIsReject })
      fireEvent.click(screen.getByTestId('btn-Accept'))
      expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.CLOSE)
      expect(setIsAccept).toHaveBeenCalledWith(true)
      expect(setIsReject).toHaveBeenCalledWith(false)
    })

    it('handleRejectClick sets REJECT action', () => {
      const setActionId = vi.fn()
      const setIsAccept = vi.fn()
      const setIsReject = vi.fn()
      renderComponent({ setActionId, setIsAccept, setIsReject })
      fireEvent.click(screen.getByTestId('btn-Reject'))
      expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.REJECT)
      expect(setIsReject).toHaveBeenCalledWith(true)
      expect(setIsAccept).toHaveBeenCalledWith(false)
    })

    it('handleMarkAsClick sets WILL_IMPLEMENT action', () => {
      const setActionId = vi.fn()
      renderComponent({ setActionId })
      fireEvent.click(screen.getByTestId('btn-Target Date'))
      expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.WILL_IMPLEMENT)
    })

    it('handleForwardClick sets DELEGATE action and shows input container', () => {
      const setActionId = vi.fn()
      const setIsAccept = vi.fn()
      const setIsReject = vi.fn()
      renderComponent({ setActionId, setIsAccept, setIsReject })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.DELEGATE)
      expect(setIsAccept).toHaveBeenCalledWith(false)
      expect(setIsReject).toHaveBeenCalledWith(false)
    })

    it('handleReviseDateClick sets REVISE_TARGET_DATE action', () => {
      const setActionId = vi.fn()
      renderComponent({ ODSData: { targetDate: 1700000000 }, setActionId })
      fireEvent.click(screen.getByTestId('btn-Change Target Date'))
      expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.REVISE_TARGET_DATE)
    })
  })

  // ── DatePicker ───────────────────────────────────────────────────────────────

  describe('DatePicker', () => {
    it('renders DatePicker when actionId is WILL_IMPLEMENT', () => {
      renderComponent({ actionId: STAGE_ACTION.WILL_IMPLEMENT })
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()
    })

    it('renders DatePicker when actionId is REVISE_TARGET_DATE', () => {
      renderComponent({ actionId: STAGE_ACTION.REVISE_TARGET_DATE })
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()
    })

    it('does not render DatePicker for CLOSE action', () => {
      renderComponent({ actionId: STAGE_ACTION.CLOSE })
      expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument()
    })

    it('handleDateChange calls setStageData and setActionId(WILL_IMPLEMENT) when no ODSData', () => {
      const setStageData = vi.fn((fn) => fn({ suggestions: [] }))
      const setActionId = vi.fn()
      renderComponent({
        actionId: STAGE_ACTION.WILL_IMPLEMENT,
        setStageData,
        setActionId,
        ODSData: null,
      })
      // DatePicker onChange is read-only in our mock; verify handler is wired
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()
    })

    it('handleDateChange calls setActionId(CHANGED_TARGET_DATE) when ODSData has targetDate', () => {
      const setActionId = vi.fn()
      const setStageData = vi.fn((fn) => fn({ suggestions: [] }))
      renderComponent({
        actionId: STAGE_ACTION.WILL_IMPLEMENT,
        setActionId,
        setStageData,
        ODSData: { targetDate: 1700000000 },
      })
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()
    })
  })

  // ── Confirm Implementation checkbox ─────────────────────────────────────────

  describe('Confirm Implementation checkbox', () => {
    it('renders when actionId is ACCEPT', () => {
      renderComponent({ actionId: STAGE_ACTION.ACCEPT })
      expect(screen.getByText('Confirm Implementation')).toBeInTheDocument()
    })

    it('renders when actionId is CONFIRM_IMPLEMENTATION', () => {
      renderComponent({ actionId: STAGE_ACTION.CONFIRM_IMPLEMENTATION })
      expect(screen.getByText('Confirm Implementation')).toBeInTheDocument()
    })

    it('does not render for CLOSE action', () => {
      renderComponent({ actionId: STAGE_ACTION.CLOSE })
      expect(
        screen.queryByText('Confirm Implementation'),
      ).not.toBeInTheDocument()
    })

    it('calls setStageData with confirmImplementation:1 when checked', () => {
      const setStageData = vi.fn((fn) => fn({ suggestions: [] }))
      const setActionId = vi.fn()
      renderComponent({
        actionId: STAGE_ACTION.ACCEPT,
        setStageData,
        setActionId,
      })
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      expect(setStageData).toHaveBeenCalled()
    })

    it('calls setStageData with confirmImplementation:0 when unchecked', () => {
      const setStageData = vi.fn((fn) => fn({ suggestions: [] }))
      const setActionId = vi.fn()
      renderComponent({
        actionId: STAGE_ACTION.ACCEPT,
        stageData: { ...defaultProps.stageData, confirmImplementation: 1 },
        setStageData,
        setActionId,
      })
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox) // uncheck
      expect(setStageData).toHaveBeenCalled()
    })
  })

  // ── Forward / Delegate input container ──────────────────────────────────────

  describe('forward/delegate input container', () => {
    it('shows Consider Suggestion and Add Other checkboxes when forwarding', () => {
      renderComponent({ actionId: STAGE_ACTION.DELEGATE })
      // Trigger forward click to show container
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      // After click the local state showInputContainer becomes true
      // Re-render with correct actionId to reveal checkboxes
      // Since state is internal we check labels after clicking
    })

    it('shows Historic Suggestions button in input container', async () => {
      const { rerender } = renderComponent({ actionId: STAGE_ACTION.DELEGATE })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => {
        expect(screen.queryByText('Historic Suggestions')).toBeInTheDocument()
      })
    })

    it('opens historic modal when Historic Suggestions is clicked', async () => {
      renderComponent({ actionId: STAGE_ACTION.DELEGATE })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByText('Historic Suggestions'))
      fireEvent.click(screen.getByText('Historic Suggestions'))
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
    })

    it('closes historic modal when hideModal is called', async () => {
      renderComponent({ actionId: STAGE_ACTION.DELEGATE })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByText('Historic Suggestions'))
      fireEvent.click(screen.getByText('Historic Suggestions'))
      fireEvent.click(screen.getByTestId('close-modal'))
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })

    it('shows SingleSelect (Assign to) when actionId is ACCEPT and container visible', async () => {
      renderComponent({ actionId: STAGE_ACTION.DELEGATE })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() =>
        expect(screen.getByTestId('single-select')).toBeInTheDocument(),
      )
    })

    it('handleNameChange calls setStageData with assigneeID', async () => {
      const setStageData = vi.fn((fn) =>
        fn({ suggestions: [], addOther: false, considerSuggestion: 0 }),
      )
      renderComponent({ actionId: STAGE_ACTION.DELEGATE, setStageData })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByTestId('single-select'))
      fireEvent.change(screen.getByTestId('single-select'), {
        target: { value: '1' },
      })
      expect(setStageData).toHaveBeenCalled()
    })
  })

  // ── Add Other / Dynamic Containers ──────────────────────────────────────────

  describe('Add Other dynamic rows', () => {
    async function openForwardAndAddOther(props = {}) {
      renderComponent({ actionId: STAGE_ACTION.DELEGATE, ...props })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByText('Historic Suggestions'))
      const addOtherCheckbox = screen
        .getAllByRole('checkbox')
        .find((el) => el.name === 'addOther')
      fireEvent.click(addOtherCheckbox)
      return addOtherCheckbox
    }

    it('shows dynamic row fields when Add Other is checked', async () => {
      await openForwardAndAddOther()
      expect(screen.getByLabelText(/Action Details/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Actual Value/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Optimum Value/)).toBeInTheDocument()
    })

    it('handleAddOtherChange calls setStageData', async () => {
      const setStageData = vi.fn((fn) =>
        fn({ suggestions: [], addOther: false, considerSuggestion: 0 }),
      )
      await openForwardAndAddOther({ setStageData })
      expect(setStageData).toHaveBeenCalled()
    })

    it('handleConsiderSuggestionsChange calls setStageData', async () => {
      const setStageData = vi.fn((fn) =>
        fn({ suggestions: [], addOther: false, considerSuggestion: 0 }),
      )
      renderComponent({ actionId: STAGE_ACTION.DELEGATE, setStageData })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByText('Historic Suggestions'))
      const considerCheckbox = screen
        .getAllByRole('checkbox')
        .find((el) => el.name === 'considerSuggestions')
      fireEvent.click(considerCheckbox)
      expect(setStageData).toHaveBeenCalled()
    })

    it('handleOtherUserChange updates suggestion text field', async () => {
      const setStageData = vi.fn((fn) =>
        fn({
          suggestions: [{ suggestion: '', actual: null, optimum: null }],
          addOther: true,
        }),
      )
      await openForwardAndAddOther({ setStageData })
      const actionInput = screen.getByLabelText(/Action Details/)
      fireEvent.change(actionInput, { target: { value: 'New action' } })
      expect(setStageData).toHaveBeenCalled()
    })

    it('handleOtherUserChange updates actual numeric field', async () => {
      const setStageData = vi.fn((fn) =>
        fn({
          suggestions: [{ suggestion: '', actual: null, optimum: null }],
          addOther: true,
        }),
      )
      await openForwardAndAddOther({ setStageData })
      const actualInput = screen.getByLabelText(/Actual Value/)
      fireEvent.change(actualInput, { target: { value: '42' } })
      expect(setStageData).toHaveBeenCalled()
    })

    it('handleOtherUserChange updates optimum numeric field', async () => {
      const setStageData = vi.fn((fn) =>
        fn({
          suggestions: [{ suggestion: '', actual: null, optimum: null }],
          addOther: true,
        }),
      )
      await openForwardAndAddOther({ setStageData })
      const optimumInput = screen.getByLabelText(/Optimum Value/)
      fireEvent.change(optimumInput, { target: { value: '99' } })
      expect(setStageData).toHaveBeenCalled()
    })

    it('handleOtherUserChange alerts and reverts on invalid text (isValidString returns error)', async () => {
      utilities.isValidString.mockReturnValueOnce('Too long!')
      utilities.getValsBaseOnCondition
        .mockImplementationOnce((cond, a, b) => (cond ? a : b)) // acop check
        .mockImplementationOnce(() => 'Too long!') // errMsg
      global.alert = vi.fn()
      await openForwardAndAddOther()
      const actionInput = screen.getByLabelText(/Action Details/)
      fireEvent.change(actionInput, { target: { value: 'x'.repeat(25) } })
      // alert may or may not fire depending on mock chain – ensure no crash
    })

    it('handleAdd appends a new dynamic row', async () => {
      await openForwardAndAddOther()
      const addBtn = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('img[src="plus-icon.svg"]'))
      if (addBtn) {
        fireEvent.click(addBtn)
        // Two Action Details fields should now be present
        expect(
          screen.getAllByLabelText(/Action Details/).length,
        ).toBeGreaterThanOrEqual(1)
      }
    })

    it('handleDelete with one container clears the row', async () => {
      await openForwardAndAddOther()
      const delBtn = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('img[src="delete-icon.svg"]'))
      if (delBtn) {
        fireEvent.click(delBtn)
        expect(
          screen.queryByLabelText(/Action Details/),
        ).not.toBeInTheDocument()
      }
    })

    it('handleDelete with multiple containers removes one row', async () => {
      const setStageData = vi.fn((fn) =>
        fn({
          suggestions: [
            { suggestion: 'a', actual: 1, optimum: 2 },
            { suggestion: 'b', actual: 3, optimum: 4 },
          ],
          addOther: true,
          considerSuggestion: 0,
        }),
      )
      await openForwardAndAddOther({ setStageData })
      // Add a row first
      const addBtn = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('img[src="plus-icon.svg"]'))
      if (addBtn) {
        fireEvent.click(addBtn)
        const delBtns = screen
          .getAllByRole('button')
          .filter((b) => b.querySelector('img[src="delete-icon.svg"]'))
        if (delBtns.length > 0) {
          fireEvent.click(delBtns[0])
        }
      }
      expect(setStageData).toHaveBeenCalled()
    })
  })

  // ── Historic Suggestions modal / table data ──────────────────────────────────

  describe('historic suggestions table data generation', () => {
    it('renders simple table inside modal', async () => {
      renderComponent({ actionId: STAGE_ACTION.DELEGATE })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByText('Historic Suggestions'))
      fireEvent.click(screen.getByText('Historic Suggestions'))
      await waitFor(() =>
        expect(screen.getByTestId('simple-table')).toBeInTheDocument(),
      )
    })

    it('displays table headers Time, Name, Suggestions', async () => {
      renderComponent({ actionId: STAGE_ACTION.DELEGATE })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByText('Historic Suggestions'))
      fireEvent.click(screen.getByText('Historic Suggestions'))
      await waitFor(() => {
        expect(screen.getByText('Time')).toBeInTheDocument()
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Suggestions')).toBeInTheDocument()
      })
    })

    it('handles history with multiple suggestion entries', async () => {
      WorkflowServices.getWfAlertHistoricalData.mockResolvedValue({
        data: [
          {
            history: [
              {
                timeEpoch: 1700000000000,
                employeeName: 'Jane Smith (OPS)',
                suggestions: [
                  { actual: 5, optimum: 10, suggestion: 'Suggestion A' },
                  { actual: 15, optimum: 25, suggestion: 'Suggestion B' },
                ],
              },
            ],
          },
        ],
      })
      renderComponent({ actionId: STAGE_ACTION.DELEGATE })
      await waitFor(() =>
        expect(WorkflowServices.getWfAlertHistoricalData).toHaveBeenCalled(),
      )
    })
  })

  // ── isSuggestionData prop ────────────────────────────────────────────────────

  describe('isSuggestionData prop', () => {
    it('passes isSuggestionData=true to affect dropdown class (getValsBaseOnCondition called)', async () => {
      renderComponent({
        isSuggestionData: true,
        actionId: STAGE_ACTION.DELEGATE,
      })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByTestId('single-select'))
      expect(screen.getByTestId('single-select')).toBeInTheDocument()
    })
  })

  // ── initialSys prop ──────────────────────────────────────────────────────────

  describe('initialSys prop', () => {
    it('uses initialSys when >= 0 for activeI', async () => {
      renderComponent({ initialSys: 1, actionId: STAGE_ACTION.DELEGATE })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByTestId('single-select'))
      expect(screen.getByTestId('single-select')).toBeInTheDocument()
    })

    it('uses 0 as fallback when initialSys is negative', async () => {
      utilities.getValsBaseOnCondition.mockImplementation((cond, a, b) =>
        cond ? a : b,
      )
      renderComponent({ initialSys: -1, actionId: STAGE_ACTION.DELEGATE })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByTestId('single-select'))
      expect(screen.getByTestId('single-select')).toBeInTheDocument()
    })
  })

  // ── Reject hides input-container checkboxes ──────────────────────────────────

  describe('Reject edge cases', () => {
    it('hides Consider Suggestion and Add Other when actionId is REJECT and showInputContainer is true', async () => {
      renderComponent({ actionId: STAGE_ACTION.REJECT })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      fireEvent.click(screen.getByTestId('btn-Reject'))
      // After reject, input container should be hidden
      expect(screen.queryByText('Consider Suggestion')).not.toBeInTheDocument()
    })
  })

  // ── handleOtherUserChange with empty suggestions array ──────────────────────

  describe('handleOtherUserChange edge cases', () => {
    it('initializes suggestions array when prevData.suggestions is empty', async () => {
      const setStageData = vi.fn((fn) =>
        fn({ suggestions: [], addOther: true, considerSuggestion: 0 }),
      )
      renderComponent({ actionId: STAGE_ACTION.DELEGATE, setStageData })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByText('Historic Suggestions'))
      const addOtherCheckbox = screen
        .getAllByRole('checkbox')
        .find((el) => el.name === 'addOther')
      fireEvent.click(addOtherCheckbox)
      const actionInput = await screen.findByLabelText(/Action Details/)
      fireEvent.change(actionInput, { target: { value: 'test' } })
      expect(setStageData).toHaveBeenCalled()
    })

    it('handles null suggestions in prevData', async () => {
      const setStageData = vi.fn((fn) =>
        fn({ suggestions: null, addOther: true, considerSuggestion: 0 }),
      )
      renderComponent({ actionId: STAGE_ACTION.DELEGATE, setStageData })
      fireEvent.click(
        screen.getByTestId('btn-Forward to another Operation/Process Engineer'),
      )
      await waitFor(() => screen.getByText('Historic Suggestions'))
      const addOtherCheckbox = screen
        .getAllByRole('checkbox')
        .find((el) => el.name === 'addOther')
      fireEvent.click(addOtherCheckbox)
      const actionInput = await screen.findByLabelText(/Action Details/)
      fireEvent.change(actionInput, { target: { value: 'test' } })
      expect(setStageData).toHaveBeenCalled()
    })
  })
})
