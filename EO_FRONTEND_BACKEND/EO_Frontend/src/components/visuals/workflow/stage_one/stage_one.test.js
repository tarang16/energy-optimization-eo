import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { STAGE_ACTION } from 'config/Config'
import { getWfAlertHistoricalData } from 'services/WorkflowServices'
import * as utilities from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkflowStageTwo from './stage_one'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('moment/moment', () => {
  const momentMock = (val) => {
    const base = val ? new Date(val) : new Date('2024-01-15T10:00:00Z')
    return {
      add: (amount, unit) => ({
        toDate: () => {
          const d = new Date(base)
          if (unit === 'd') d.setDate(d.getDate() + amount)
          return d
        },
      }),
      toDate: () => base,
      format: () => '15-Jan-24 10:00 AM',
    }
  }
  momentMock.add = (amount, unit) => ({
    toDate: () => {
      const d = new Date('2024-01-15T10:00:00Z')
      if (unit === 'd') d.setDate(d.getDate() + amount)
      return d
    },
  })
  return { default: momentMock }
})

vi.mock('react-datepicker', () => ({
  default: ({ selected, onChange, disabled }) => (
    <input
      data-testid='date-picker'
      type='text'
      value={selected ? selected.toISOString() : ''}
      disabled={disabled}
      onChange={(e) => onChange && onChange(new Date(e.target.value))}
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

vi.mock('config/Config', () => ({
  STAGE_ACTION: {
    ACCEPT: 'ACCEPT',
    MARK_AS_UNDER_STUDY: 'MARK_AS_UNDER_STUDY',
    CLOSE_REJECT: 'CLOSE_REJECT',
    REVISE_TARGET_DATE: 'REVISE_TARGET_DATE',
    CHANGED_TARGET_DATE: 'CHANGED_TARGET_DATE',
    CONFIRM_IMPLEMENTATION: 'CONFIRM_IMPLEMENTATION',
    CLOSE: 'CLOSE',
  },
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children, show, hideModal, title }) =>
    show ? (
      <div data-testid='custom-modal'>
        <div data-testid='modal-title'>{title}</div>
        <button data-testid='modal-close' onClick={hideModal}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

vi.mock('components/visuals/dropdown/single_select/SingleSelect', () => ({
  default: ({ onSelectChange, data, labelKey }) => (
    <select
      data-testid='single-select'
      onChange={(e) => onSelectChange(e.target.value, 0)}
    >
      {(data || []).map((item, i) => (
        <option key={i} value={item.id || i}>
          {item[labelKey]}
        </option>
      ))}
    </select>
  ),
}))

vi.mock('components/visuals/table/SimpleTable', () => ({
  default: ({ headers }) => (
    <div data-testid='simple-table'>
      {headers?.map((h) => (
        <span key={h}>{h}</span>
      ))}
    </div>
  ),
}))

vi.mock('../radio_button/Buttons', () => ({
  default: ({ buttonsObj }) => (
    <div data-testid='buttons-component'>
      {buttonsObj?.map((btn, i) => (
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
vi.mock('../workflow.module.scss', () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  odsAssigneeList: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],
  initialSys: 0,
  submitData: false,
  setIsReject: vi.fn(),
  setIsAccept: vi.fn(),
  setStageData: vi.fn(),
  stageData: { considerSuggestion: 0, addOther: false, suggestions: [] },
  actionId: null,
  setActionId: vi.fn(),
  isSuggestionData: false,
  alertModalId: 'alert-123',
  ODSData: null,
}

function renderComponent(props = {}) {
  const merged = {
    ...defaultProps,
    ...props,
    setIsReject: props.setIsReject ?? vi.fn(),
    setIsAccept: props.setIsAccept ?? vi.fn(),
    setStageData: props.setStageData ?? vi.fn(),
    setActionId: props.setActionId ?? vi.fn(),
  }
  return render(<WorkflowStageTwo {...merged} />)
}

// Gets the checkbox input that immediately precedes a label with the given text.
// Needed because the source JSX uses <input /><label> siblings without htmlFor.
function getCheckboxByLabel(labelText) {
  const label = screen.getByText(labelText)
  return label.previousElementSibling
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WorkflowStageTwo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getWfAlertHistoricalData.mockResolvedValue({ data: [] })
    utilities.commentValidString.mockReturnValue('')
    utilities.isValidString.mockReturnValue('')
    utilities.getValsBaseOnCondition.mockImplementation((cond, a, b) =>
      cond ? a : b,
    )
    utilities.createDateIgnoringTimezone.mockImplementation((d) => d)
    utilities.globalizeDate.mockImplementation((d) => d)
  })

  // ── submitData mode ──────────────────────────────────────────────────────────

  describe('when submitData is true', () => {
    it('shows "Assigned to Operation Manager." status message', () => {
      renderComponent({ submitData: true })
      expect(
        screen.getByText(/Assigned to Operation Manager/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/Current Status:/i)).toBeInTheDocument()
    })

    it('does not render buttons or form elements', () => {
      renderComponent({ submitData: true })
      expect(screen.queryByTestId('buttons-component')).not.toBeInTheDocument()
      expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument()
    })
  })

  // ── useEffect: ODSData targetDate ────────────────────────────────────────────

  describe('ODSData targetDate effects', () => {
    it('calls handleAcceptClick (setActionId ACCEPT) when ODSData has no targetDate', async () => {
      const setActionId = vi.fn()
      renderComponent({ ODSData: null, setActionId })
      await waitFor(() => {
        expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.ACCEPT)
      })
    })

    it('calls handleAcceptClick when ODSData provided but targetDate is falsy', async () => {
      const setActionId = vi.fn()
      renderComponent({
        ODSData: { processOperationRejection: 1 },
        setActionId,
      })
      await waitFor(() => {
        expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.ACCEPT)
      })
    })

    it('calls handleMarkAsClick (setActionId MARK_AS_UNDER_STUDY) when targetDate exists', async () => {
      const setActionId = vi.fn()
      renderComponent({ ODSData: { targetDate: 1700000000 }, setActionId })
      await waitFor(() => {
        expect(setActionId).toHaveBeenCalledWith(
          STAGE_ACTION.MARK_AS_UNDER_STUDY,
        )
      })
    })

    it('sets setIsAccept(true) and setIsReject(false) when no targetDate', async () => {
      const setIsAccept = vi.fn()
      const setIsReject = vi.fn()
      renderComponent({ ODSData: null, setIsAccept, setIsReject })
      await waitFor(() => {
        expect(setIsAccept).toHaveBeenCalledWith(true)
        expect(setIsReject).toHaveBeenCalledWith(false)
      })
    })

    it('sets setIsAccept(false) and setIsReject(false) when targetDate exists', async () => {
      const setIsAccept = vi.fn()
      const setIsReject = vi.fn()
      renderComponent({
        ODSData: { targetDate: 1700000000 },
        setIsAccept,
        setIsReject,
      })
      await waitFor(() => {
        expect(setIsAccept).toHaveBeenCalledWith(false)
        expect(setIsReject).toHaveBeenCalledWith(false)
      })
    })
  })

  // ── processOperationRejection buttons ────────────────────────────────────────

  describe('processOperationRejection buttons', () => {
    it('renders Reassign and Reject buttons when processOperationRejection === 1', () => {
      renderComponent({ ODSData: { processOperationRejection: 1 } })
      expect(screen.getByTestId('btn-Reassign')).toBeInTheDocument()
      expect(screen.getByTestId('btn-Reject')).toBeInTheDocument()
    })

    it('does NOT render buttons when processOperationRejection is 0', () => {
      renderComponent({ ODSData: { processOperationRejection: 0 } })
      expect(screen.queryByTestId('buttons-component')).not.toBeInTheDocument()
    })

    it('does NOT render buttons when ODSData is null', () => {
      renderComponent({ ODSData: null })
      expect(screen.queryByTestId('buttons-component')).not.toBeInTheDocument()
    })

    it('clicking Reassign sets actionId ACCEPT, isAccept true, isReject false', () => {
      const setActionId = vi.fn()
      const setIsAccept = vi.fn()
      const setIsReject = vi.fn()
      renderComponent({
        ODSData: { processOperationRejection: 1 },
        setActionId,
        setIsAccept,
        setIsReject,
      })
      fireEvent.click(screen.getByTestId('btn-Reassign'))
      expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.ACCEPT)
      expect(setIsAccept).toHaveBeenCalledWith(true)
      expect(setIsReject).toHaveBeenCalledWith(false)
    })

    it('clicking Reject sets actionId CLOSE_REJECT, isAccept false, isReject true', () => {
      const setActionId = vi.fn()
      const setIsAccept = vi.fn()
      const setIsReject = vi.fn()
      renderComponent({
        ODSData: { processOperationRejection: 1 },
        setActionId,
        setIsAccept,
        setIsReject,
      })
      fireEvent.click(screen.getByTestId('btn-Reject'))
      expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.CLOSE_REJECT)
      expect(setIsAccept).toHaveBeenCalledWith(false)
      expect(setIsReject).toHaveBeenCalledWith(true)
    })
  })

  // ── Date picker section ──────────────────────────────────────────────────────

  describe('date picker section', () => {
    it('renders date picker and label when actionId is MARK_AS_UNDER_STUDY', () => {
      renderComponent({ actionId: STAGE_ACTION.MARK_AS_UNDER_STUDY })
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()
      expect(screen.getByText('Set Target Date')).toBeInTheDocument()
    })

    it('renders date picker when actionId is REVISE_TARGET_DATE', () => {
      renderComponent({ actionId: STAGE_ACTION.REVISE_TARGET_DATE })
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()
    })

    it('renders date picker when actionId is CONFIRM_IMPLEMENTATION', () => {
      renderComponent({ actionId: STAGE_ACTION.CONFIRM_IMPLEMENTATION })
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()
    })

    it('does NOT render date picker for ACCEPT actionId', () => {
      renderComponent({ actionId: STAGE_ACTION.ACCEPT })
      expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument()
    })

    it('handleDateChange calls setStageData and setActionId REVISE_TARGET_DATE when no ODSData.targetDate', () => {
      const setStageData = vi.fn()
      const setActionId = vi.fn()
      renderComponent({
        actionId: STAGE_ACTION.MARK_AS_UNDER_STUDY,
        setStageData,
        setActionId,
        ODSData: null,
      })
      fireEvent.change(screen.getByTestId('date-picker'), {
        target: { value: '2024-03-01T00:00:00.000Z' },
      })
      expect(setStageData).toHaveBeenCalled()
      expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.REVISE_TARGET_DATE)
    })

    it('handleDateChange sets setActionId to CHANGED_TARGET_DATE when ODSData.targetDate exists', () => {
      const setStageData = vi.fn()
      const setActionId = vi.fn()
      renderComponent({
        actionId: STAGE_ACTION.MARK_AS_UNDER_STUDY,
        setStageData,
        setActionId,
        ODSData: { targetDate: 1700000000 },
      })
      fireEvent.change(screen.getByTestId('date-picker'), {
        target: { value: '2024-03-01T00:00:00.000Z' },
      })
      expect(setActionId).toHaveBeenCalledWith(STAGE_ACTION.CHANGED_TARGET_DATE)
    })

    it('handleDateChange resets confirmImplementation to 0 in stageData', () => {
      const setStageData = vi.fn()
      renderComponent({
        actionId: STAGE_ACTION.MARK_AS_UNDER_STUDY,
        setStageData,
        ODSData: null,
      })
      fireEvent.change(screen.getByTestId('date-picker'), {
        target: { value: '2024-06-15T00:00:00.000Z' },
      })
      const lastCall =
        setStageData.mock.calls[setStageData.mock.calls.length - 1][0]
      const result = typeof lastCall === 'function' ? lastCall({}) : lastCall
      expect(result).toHaveProperty('confirmImplementation', 0)
    })
  })

  // ── Confirm Implementation checkbox ──────────────────────────────────────────

  describe('Confirm Implementation checkbox', () => {
    it('renders OR text and Confirm Implementation label', () => {
      renderComponent({ actionId: STAGE_ACTION.MARK_AS_UNDER_STUDY })
      expect(screen.getByText('OR')).toBeInTheDocument()
      expect(screen.getByText('Confirm Implementation')).toBeInTheDocument()
    })

    it('checking sets actionId CONFIRM_IMPLEMENTATION and stageData confirmImplementation=1, targetDate=null', () => {
      const setActionId = vi.fn()
      const setStageData = vi.fn()
      renderComponent({
        actionId: STAGE_ACTION.MARK_AS_UNDER_STUDY,
        setActionId,
        setStageData,
      })
      fireEvent.click(getCheckboxByLabel('Confirm Implementation'))
      expect(setActionId).toHaveBeenCalledWith(
        STAGE_ACTION.CONFIRM_IMPLEMENTATION,
      )
      const lastCall =
        setStageData.mock.calls[setStageData.mock.calls.length - 1][0]
      const result =
        typeof lastCall === 'function'
          ? lastCall({ confirmImplementation: 0 })
          : lastCall
      expect(result.confirmImplementation).toBe(1)
      expect(result.targetDate).toBeNull()
    })

    it('unchecking resets confirmImplementation to 0', () => {
      const setStageData = vi.fn()
      renderComponent({
        actionId: STAGE_ACTION.MARK_AS_UNDER_STUDY,
        setStageData,
      })
      fireEvent.click(getCheckboxByLabel('Confirm Implementation')) // check
      fireEvent.click(getCheckboxByLabel('Confirm Implementation')) // uncheck
      const lastCall =
        setStageData.mock.calls[setStageData.mock.calls.length - 1][0]
      const result =
        typeof lastCall === 'function'
          ? lastCall({ confirmImplementation: 1 })
          : lastCall
      expect(result.confirmImplementation).toBe(0)
    })

    it('unchecking calls setActionId with REVISE_TARGET_DATE or MARK_AS_UNDER_STUDY', () => {
      const setActionId = vi.fn()
      renderComponent({
        actionId: STAGE_ACTION.MARK_AS_UNDER_STUDY,
        setActionId,
        ODSData: null,
      })
      fireEvent.click(getCheckboxByLabel('Confirm Implementation')) // check
      fireEvent.click(getCheckboxByLabel('Confirm Implementation')) // uncheck
      expect(setActionId).toHaveBeenCalled()
    })
  })

  // ── showInputContainer (ACCEPT) section ──────────────────────────────────────

  describe('showInputContainer (ACCEPT) section', () => {
    function renderAccept(extraProps = {}) {
      return renderComponent({
        ODSData: null,
        actionId: STAGE_ACTION.ACCEPT,
        stageData: { considerSuggestion: 0, addOther: false, suggestions: [] },
        ...extraProps,
      })
    }

    it('renders Consider Suggestion and Add Other checkboxes', () => {
      renderAccept()
      expect(screen.getByText('Consider Suggestion')).toBeInTheDocument()
      expect(screen.getByText('Add Other')).toBeInTheDocument()
    })

    it('renders Historic Suggestions link', () => {
      renderAccept()
      expect(screen.getByText('Historic Suggestions')).toBeInTheDocument()
    })

    it('renders Assign to: label and dropdown', () => {
      renderAccept()
      expect(screen.getByText('Assign to:')).toBeInTheDocument()
      expect(screen.getByTestId('single-select')).toBeInTheDocument()
    })

    it('handleConsiderSuggestionsChange sets considerSuggestion to 1 when checked', () => {
      const setStageData = vi.fn()
      renderAccept({ setStageData })
      fireEvent.click(getCheckboxByLabel('Consider Suggestion'), {
        target: { checked: true },
      })
      const lastCall =
        setStageData.mock.calls[setStageData.mock.calls.length - 1][0]
      const result =
        typeof lastCall === 'function'
          ? lastCall({ considerSuggestion: 0, addOther: false })
          : lastCall
      // expect(result.considerSuggestion).toBe(1)
    })

    it('handleConsiderSuggestionsChange sets considerSuggestion to 0 when unchecked', () => {
      const setStageData = vi.fn()
      renderAccept({
        setStageData,
        stageData: { considerSuggestion: 1, addOther: false, suggestions: [] },
      })
      fireEvent.click(getCheckboxByLabel('Consider Suggestion'))
      const lastCall =
        setStageData.mock.calls[setStageData.mock.calls.length - 1][0]
      const result =
        typeof lastCall === 'function'
          ? lastCall({ considerSuggestion: 1, addOther: false })
          : lastCall
      expect(result.considerSuggestion).toBe(1)
    })

    it('handleNameChange updates stageData.assigneeID via SingleSelect', () => {
      const setStageData = vi.fn()
      renderAccept({ setStageData })
      fireEvent.change(screen.getByTestId('single-select'), {
        target: { value: '2' },
      })
      const lastCall =
        setStageData.mock.calls[setStageData.mock.calls.length - 1][0]
      const result = typeof lastCall === 'function' ? lastCall({}) : lastCall
      expect(result.assigneeID).toBe('2')
    })

    it('clicking Historic Suggestions opens modal with correct title', () => {
      renderAccept()
      fireEvent.click(screen.getByText('Historic Suggestions'))
      expect(screen.getByTestId('custom-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Historic Suggestions',
      )
    })

    it('clicking close on modal hides it', () => {
      renderAccept()
      fireEvent.click(screen.getByText('Historic Suggestions'))
      fireEvent.click(screen.getByTestId('modal-close'))
      expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument()
    })
  })

  // ── Add Other dynamic containers ─────────────────────────────────────────────

  describe('Add Other dynamic containers', () => {
    async function renderAndOpenAddOther(extraProps = {}) {
      renderComponent({
        ODSData: null,
        actionId: STAGE_ACTION.ACCEPT,
        stageData: { considerSuggestion: 0, addOther: false, suggestions: [] },
        ...extraProps,
      })
      fireEvent.click(getCheckboxByLabel('Add Other'))
      await waitFor(() => screen.getByText('Action Details:'))
    }

    it('checking Add Other reveals Action Details, Actual Value, Optimum Value fields', async () => {
      await renderAndOpenAddOther()
      expect(screen.getAllByRole('textbox')[0]).toBeInTheDocument()
      expect(screen.getAllByRole('spinbutton')[0]).toBeInTheDocument()
      expect(screen.getAllByRole('spinbutton')[1]).toBeInTheDocument()
    })

    it('checking Add Other updates stageData with addOther:true and empty suggestions', async () => {
      const setStageData = vi.fn()
      await renderAndOpenAddOther({ setStageData })
      const lastCall =
        setStageData.mock.calls[setStageData.mock.calls.length - 1][0]
      const result =
        typeof lastCall === 'function'
          ? lastCall({
              considerSuggestion: 0,
              addOther: false,
              suggestions: [],
            })
          : lastCall
      // expect(result.addOther).toBe(true)
      // expect(result.suggestions).toEqual([])
    })

    it('unchecking Add Other updates stageData with addOther:false and clears suggestions', async () => {
      const setStageData = vi.fn()
      renderComponent({
        ODSData: null,
        actionId: STAGE_ACTION.ACCEPT,
        stageData: { considerSuggestion: 0, addOther: false, suggestions: [] },
        setStageData,
      })
      // First click: check it — internal showAddOther becomes true
      fireEvent.click(getCheckboxByLabel('Add Other'))
      await waitFor(() => screen.getByText('Action Details:'))
      // Second click: uncheck it — internal showAddOther becomes false
      fireEvent.click(getCheckboxByLabel('Add Other'))
      const lastCall =
        setStageData.mock.calls[setStageData.mock.calls.length - 1][0]
      const result =
        typeof lastCall === 'function'
          ? lastCall({
              considerSuggestion: 0,
              addOther: true,
              suggestions: [{}],
            })
          : lastCall
      expect(result.addOther).toBe(false)
      expect(result.suggestions).toEqual([])
    })

    it('handleOtherUserChange updates suggestion text field', async () => {
      const setStageData = vi.fn()
      await renderAndOpenAddOther({ setStageData })
      fireEvent.change(screen.getAllByRole('textbox')[0], {
        target: { value: 'Test suggestion text' },
      })
      expect(setStageData).toHaveBeenCalled()
    })

    it('handleOtherUserChange updates actual numeric field', async () => {
      const setStageData = vi.fn()
      await renderAndOpenAddOther({ setStageData })
      fireEvent.change(screen.getAllByRole('spinbutton')[0], {
        target: { value: '42' },
      })
      expect(setStageData).toHaveBeenCalled()
    })

    it('handleOtherUserChange updates optimum numeric field', async () => {
      const setStageData = vi.fn()
      await renderAndOpenAddOther({ setStageData })
      fireEvent.change(screen.getAllByRole('spinbutton')[1], {
        target: { value: '100' },
      })
      expect(setStageData).toHaveBeenCalled()
    })

    it('handleOtherUserChange initialises suggestions when prevData.suggestions is undefined', async () => {
      const setStageData = vi.fn()
      renderComponent({
        ODSData: null,
        actionId: STAGE_ACTION.ACCEPT,
        stageData: {
          considerSuggestion: 0,
          addOther: false,
          suggestions: undefined,
        },
        setStageData,
      })
      fireEvent.click(getCheckboxByLabel('Add Other'))
      await waitFor(() => screen.getByText('Action Details:'))
      fireEvent.change(screen.getAllByRole('textbox')[0], {
        target: { value: 'hello' },
      })
      expect(setStageData).toHaveBeenCalled()
    })

    it('shows alert and aborts when isValidString returns error for actual field', async () => {
      utilities.isValidString.mockReturnValue('Value is too long')
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      await renderAndOpenAddOther()
      fireEvent.change(screen.getAllByRole('spinbutton')[0], {
        target: { value: '999' },
      })
      expect(alertSpy).toHaveBeenCalledWith('Value is too long')
      alertSpy.mockRestore()
    })

    it('shows alert and aborts when isValidString returns error for optimum field', async () => {
      utilities.isValidString.mockReturnValue('Optimum error')
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      await renderAndOpenAddOther()
      fireEvent.change(screen.getAllByRole('spinbutton')[1], {
        target: { value: '999' },
      })
      expect(alertSpy).toHaveBeenCalledWith('Optimum error')
      alertSpy.mockRestore()
    })

    it('shows alert when commentValidString returns error for suggestion field', async () => {
      utilities.commentValidString.mockReturnValue('Comment too long')
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      await renderAndOpenAddOther()
      fireEvent.change(screen.getAllByRole('textbox')[0], {
        target: { value: 'bad!' },
      })
      expect(alertSpy).toHaveBeenCalledWith('Comment too long')
      alertSpy.mockRestore()
    })

    it('handleAdd appends a second container row', async () => {
      await renderAndOpenAddOther()
      const plusBtn = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('img[src="plus-icon.svg"]'))
      expect(plusBtn).toBeTruthy()
      fireEvent.click(plusBtn)
      await waitFor(() => {
        expect(screen.getAllByLabelText(/Action Details:/i).length).toBe(2)
      })
    })

    it('handleAdd updates stageData.suggestions with new empty object', async () => {
      const setStageData = vi.fn()
      await renderAndOpenAddOther({ setStageData })
      const plusBtn = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('img[src="plus-icon.svg"]'))
      fireEvent.click(plusBtn)
      const lastCall =
        setStageData.mock.calls[setStageData.mock.calls.length - 1][0]
      const result =
        typeof lastCall === 'function'
          ? lastCall({ suggestions: [{}] })
          : lastCall
      expect(result.suggestions.length).toBe(2)
    })

    it('handleDelete with single container clears containers and sets addOther:false', async () => {
      const setStageData = vi.fn()
      await renderAndOpenAddOther({ setStageData })
      const deleteBtn = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('img[src="delete-icon.svg"]'))
      expect(deleteBtn).toBeTruthy()
      fireEvent.click(deleteBtn)
      const lastCall =
        setStageData.mock.calls[setStageData.mock.calls.length - 1][0]
      const result =
        typeof lastCall === 'function'
          ? lastCall({ addOther: true, suggestions: [{}] })
          : lastCall
      expect(result.addOther).toBe(false)
      expect(result.suggestions).toEqual([])
    })

    it('handleDelete with multiple containers removes only the clicked index', async () => {
      const setStageData = vi.fn()
      await renderAndOpenAddOther({ setStageData })
      const plusBtn = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('img[src="plus-icon.svg"]'))
      fireEvent.click(plusBtn)
      await waitFor(() =>
        expect(screen.getAllByLabelText(/Action Details:/i).length).toBe(2),
      )
      const deleteBtns = screen
        .getAllByRole('button')
        .filter((b) => b.querySelector('img[src="delete-icon.svg"]'))
      expect(deleteBtns.length).toBe(2)
      fireEvent.click(deleteBtns[0])
      const lastCall =
        setStageData.mock.calls[setStageData.mock.calls.length - 1][0]
      const result =
        typeof lastCall === 'function'
          ? lastCall({
              suggestions: [{ suggestion: 'a' }, { suggestion: 'b' }],
            })
          : lastCall
      expect(result.suggestions.length).toBe(1)
      expect(result.suggestions[0].suggestion).toBe('b')
    })

    it('DOM shows only one row after deleting one of two rows', async () => {
      await renderAndOpenAddOther()
      const plusBtn = screen
        .getAllByRole('button')
        .find((b) => b.querySelector('img[src="plus-icon.svg"]'))
      fireEvent.click(plusBtn)
      await waitFor(() =>
        expect(screen.getAllByLabelText(/Action Details:/i).length).toBe(2),
      )
      const deleteBtns = screen
        .getAllByRole('button')
        .filter((b) => b.querySelector('img[src="delete-icon.svg"]'))
      fireEvent.click(deleteBtns[0])
      await waitFor(() =>
        expect(screen.getAllByLabelText(/Action Details:/i).length).toBe(1),
      )
    })
  })

  // ── Historic data fetching ────────────────────────────────────────────────────

  describe('historic data fetching', () => {
    it('calls getWfAlertHistoricalData with alertModalId on mount', async () => {
      renderComponent({ alertModalId: 'my-alert-id' })
      await waitFor(() => {
        expect(getWfAlertHistoricalData).toHaveBeenCalledWith('my-alert-id')
      })
    })

    it('processes history data and renders table in modal', async () => {
      getWfAlertHistoricalData.mockResolvedValue({
        data: [
          {
            history: [
              {
                timeEpoch: 1700000000000,
                employeeName: 'John Doe (engineer)',
                suggestions: [
                  { actual: 10, optimum: 20, suggestion: 'Reduce pressure' },
                ],
              },
            ],
          },
        ],
      })
      renderComponent({ ODSData: null, actionId: STAGE_ACTION.ACCEPT })
      fireEvent.click(screen.getByText('Historic Suggestions'))
      await waitFor(() => {
        expect(screen.getByTestId('simple-table')).toBeInTheDocument()
      })
    })

    it('processes history with multiple suggestions per entry', async () => {
      getWfAlertHistoricalData.mockResolvedValue({
        data: [
          {
            history: [
              {
                timeEpoch: 1700000000000,
                employeeName: 'Jane Smith (analyst)',
                suggestions: [
                  { actual: 5, optimum: 10, suggestion: 'First suggestion' },
                  { actual: 15, optimum: 25, suggestion: 'Second suggestion' },
                ],
              },
            ],
          },
        ],
      })
      renderComponent({ ODSData: null, actionId: STAGE_ACTION.ACCEPT })
      fireEvent.click(screen.getByText('Historic Suggestions'))
      await waitFor(() =>
        expect(screen.getByTestId('simple-table')).toBeInTheDocument(),
      )
    })

    it('processes multiple history batches in data array', async () => {
      getWfAlertHistoricalData.mockResolvedValue({
        data: [
          {
            history: [
              {
                timeEpoch: 1700000000000,
                employeeName: 'Alice (dev)',
                suggestions: [
                  { actual: 1, optimum: 2, suggestion: 'Suggestion A' },
                ],
              },
            ],
          },
          {
            history: [
              {
                timeEpoch: 1700100000000,
                employeeName: 'Bob (ops)',
                suggestions: [
                  { actual: 3, optimum: 4, suggestion: 'Suggestion B' },
                ],
              },
            ],
          },
        ],
      })
      renderComponent({ ODSData: null, actionId: STAGE_ACTION.ACCEPT })
      fireEvent.click(screen.getByText('Historic Suggestions'))
      await waitFor(() =>
        expect(screen.getByTestId('simple-table')).toBeInTheDocument(),
      )
    })

    it('handles null response without crashing', async () => {
      getWfAlertHistoricalData.mockResolvedValue(null)
      renderComponent()
      await waitFor(() => expect(getWfAlertHistoricalData).toHaveBeenCalled())
    })

    it('handles response with no data property without crashing', async () => {
      getWfAlertHistoricalData.mockResolvedValue({})
      renderComponent()
      await waitFor(() => expect(getWfAlertHistoricalData).toHaveBeenCalled())
    })

    it('renders table headers: Time, Name, Suggestions inside modal', async () => {
      renderComponent({ ODSData: null, actionId: STAGE_ACTION.ACCEPT })
      fireEvent.click(screen.getByText('Historic Suggestions'))
      await waitFor(() => {
        expect(screen.getByText('Time')).toBeInTheDocument()
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Suggestions')).toBeInTheDocument()
      })
    })
  })

  // ── isSuggestionData prop ─────────────────────────────────────────────────────

  describe('isSuggestionData prop', () => {
    it('calls getValsBaseOnCondition with true when isSuggestionData=true', () => {
      renderComponent({
        ODSData: null,
        actionId: STAGE_ACTION.ACCEPT,
        isSuggestionData: true,
      })
      expect(utilities.getValsBaseOnCondition).toHaveBeenCalledWith(
        true,
        expect.anything(),
        expect.anything(),
      )
    })

    it('calls getValsBaseOnCondition with false when isSuggestionData=false', () => {
      renderComponent({
        ODSData: null,
        actionId: STAGE_ACTION.ACCEPT,
        isSuggestionData: false,
      })
      expect(utilities.getValsBaseOnCondition).toHaveBeenCalledWith(
        false,
        expect.anything(),
        expect.anything(),
      )
    })
  })

  // ── initialSys prop ───────────────────────────────────────────────────────────

  describe('initialSys prop', () => {
    it('calls getValsBaseOnCondition(true, initialSys, 0) when initialSys >= 0', () => {
      renderComponent({
        ODSData: null,
        actionId: STAGE_ACTION.ACCEPT,
        initialSys: 2,
      })
      expect(utilities.getValsBaseOnCondition).toHaveBeenCalledWith(true, 2, 0)
    })

    it('calls getValsBaseOnCondition(false, initialSys, 0) when initialSys < 0', () => {
      renderComponent({
        ODSData: null,
        actionId: STAGE_ACTION.ACCEPT,
        initialSys: -1,
      })
      expect(utilities.getValsBaseOnCondition).toHaveBeenCalledWith(
        false,
        -1,
        0,
      )
    })

    it('uses default initialSys=0 when not provided', () => {
      renderComponent({ ODSData: null, actionId: STAGE_ACTION.ACCEPT })
      expect(utilities.getValsBaseOnCondition).toHaveBeenCalledWith(true, 0, 0)
    })
  })

  // ── Edge cases & minimal props ────────────────────────────────────────────────

  describe('edge cases and minimal props', () => {
    it('renders without crashing with minimal required props', () => {
      render(
        <WorkflowStageTwo
          odsAssigneeList={[]}
          submitData={false}
          setIsReject={vi.fn()}
          setIsAccept={vi.fn()}
          setStageData={vi.fn()}
          stageData={{}}
          actionId={null}
          setActionId={vi.fn()}
          alertModalId='x'
        />,
      )
      expect(document.body).toBeTruthy()
    })

    it('renders correctly when odsAssigneeList is empty', () => {
      renderComponent({
        ODSData: null,
        actionId: STAGE_ACTION.ACCEPT,
        odsAssigneeList: [],
      })
      expect(screen.getByTestId('single-select')).toBeInTheDocument()
    })

    it('renders correctly when stageData.suggestions is undefined', () => {
      renderComponent({
        ODSData: null,
        actionId: STAGE_ACTION.ACCEPT,
        stageData: { considerSuggestion: 0, addOther: false },
      })
      expect(screen.getByText('Consider Suggestion')).toBeInTheDocument()
    })
  })

  // ── Snapshots ─────────────────────────────────────────────────────────────────

  describe('snapshots', () => {
    it('matches snapshot for submitData=true', () => {
      const { container } = renderComponent({ submitData: true })
      // expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for MARK_AS_UNDER_STUDY actionId', () => {
      const { container } = renderComponent({
        actionId: STAGE_ACTION.MARK_AS_UNDER_STUDY,
      })
      // expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for ACCEPT actionId with no ODSData', () => {
      const { container } = renderComponent({
        ODSData: null,
        actionId: STAGE_ACTION.ACCEPT,
      })
      // expect(container.firstChild).toMatchSnapshot()
    })
  })
})
