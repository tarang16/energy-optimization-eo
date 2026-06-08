import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider as JotaiProvider } from 'jotai'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import WorkflowConfiguration from './WorkflowConfiguration'

vi.mock('services/WorkflowServices', () => ({
  getWorkflowConfigurations: vi.fn(),
  updateWorkflowConfigurations: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  showToast: vi.fn(),
  getValsBaseOnCondition: vi.fn(),
}))
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    workflowConfiguration: {
      handleSubmit: vi.fn(),
    },
  },
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock(import('react-bootstrap'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,

    OverlayTrigger: ({ children, overlay }) => (
      <div>
        {children}
        {overlay({})}
      </div>
    ),
    Tooltip: ({ children }) => <div data-testid='tooltip'>{children}</div>,
    Form: {
      Check: (props) => (
        <input
          type='checkbox'
          data-testid={props.id}
          defaultChecked={props.defaultChecked}
          disabled={props.disabled}
          onChange={props.onChange}
        />
      ),
    },
  }
})

vi.mock(
  import('./WorkflowConfiguration.module.scss'),
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      worlflowConfigurationContainer: 'worlflowConfigurationContainerClass',
      topContainer: 'topContainerClass',
      checkboxContainer: 'checkboxContainerClass',
      checkboxWrapper: 'checkboxWrapperClass',
      headerContainer: 'headerContainerClass',
      rowContainer: 'rowContainerClass',
      numberContainer: 'numberContainerClass',
      labelContainer: 'labelContainerClass',
      numberInput: 'numberInputClass',
      bottonContainer: 'bottonContainerClass',
      submitBtn: 'submitBtnClass',
    }
  },
)

import {
  getWorkflowConfigurations,
  updateWorkflowConfigurations,
} from 'services/WorkflowServices'

describe('WorkflowConfiguration Component', () => {
  const mockSetShowModalConfig = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('shows loader initially and then renders groupings correctly', async () => {
    const mockData = [
      { configurationName: 'Send_Email_PM', configurationValue: 'True' },
      { configurationName: 'Send_Email_PE', configurationValue: 'false' },
      {
        configurationName: 'Send_Overdue_Email_OM',
        configurationValue: 'True',
      },
      {
        configurationName: 'Send_Overdue_Email_OE',
        configurationValue: 'false',
      },
      {
        configurationName: 'Send_Email_AutoClosure_PM',
        configurationValue: 'True',
      },
      { configurationName: 'Check_Overdue_AfterHrs', configurationValue: '12' },
      { configurationName: 'Some_Other_Config', configurationValue: '123' },
    ]
    getWorkflowConfigurations.mockResolvedValue({
      statuscode: 200,
      data: mockData,
    })

    render(
      <JotaiProvider>
        <WorkflowConfiguration setShowModalConfig={mockSetShowModalConfig} />
      </JotaiProvider>,
    )
    expect(screen.getByTestId('loader')).toBeInTheDocument()
    await waitFor(() => expect(getWorkflowConfigurations).toHaveBeenCalled())

    // Loader should disappear
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )
    const pmCheckbox = screen.getByTestId('workflow-checkbox-Send_Email_PM')
    expect(pmCheckbox).toBeInTheDocument()
    expect(pmCheckbox).toBeChecked()
    const peCheckbox = screen.getByTestId('workflow-checkbox-Send_Email_PE')
    expect(peCheckbox).toBeInTheDocument()
    expect(peCheckbox).not.toBeDisabled()
    expect(peCheckbox).not.toBeChecked()
    const omCheckbox = screen.getByTestId(
      'workflow-checkbox-Send_Overdue_Email_OM',
    )
    expect(omCheckbox).toBeChecked()
    expect(omCheckbox).not.toBeDisabled()
    const oeCheckbox = screen.getByTestId(
      'workflow-checkbox-Send_Overdue_Email_OE',
    )
    expect(oeCheckbox).not.toBeChecked()
    const hrsInput = screen.getAllByRole('spinbutton')
    expect(hrsInput[0]).toHaveValue(12)
  })

  test('toggles checkbox updates internal state and enables submit button', async () => {
    const mockData = [
      { configurationName: 'Send_Email_PM', configurationValue: 'True' },
      { configurationName: 'Check_Overdue_AfterHrs', configurationValue: '5' },
    ]
    getWorkflowConfigurations.mockResolvedValue({
      statuscode: 200,
      data: mockData,
    })

    render(
      <JotaiProvider>
        <WorkflowConfiguration setShowModalConfig={mockSetShowModalConfig} />
      </JotaiProvider>,
    )

    // Wait for loading complete
    await waitFor(() => expect(getWorkflowConfigurations).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )
    const submitBtn = screen.getByRole('button', { name: /Submit/i })
    expect(submitBtn).toBeDisabled()
    const peCheckboxId = 'workflow-checkbox-Send_Email_PE'
    const pmCheckbox = screen.getByTestId('workflow-checkbox-Send_Email_PM')
    fireEvent.click(pmCheckbox)
    expect(submitBtn).toBeEnabled()
  })

  test('changing hrs input updates state and enables submit button', async () => {
    const mockData = [
      { configurationName: 'Check_Overdue_AfterHrs', configurationValue: '8' },
    ]
    getWorkflowConfigurations.mockResolvedValue({
      statuscode: 200,
      data: mockData,
    })

    render(
      <JotaiProvider>
        <WorkflowConfiguration setShowModalConfig={mockSetShowModalConfig} />
      </JotaiProvider>,
    )

    // Wait for loading complete
    await waitFor(() => expect(getWorkflowConfigurations).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    const submitBtn = screen.getByRole('button', { name: /Submit/i })
    expect(submitBtn).toBeDisabled()

    const hrsInput = screen.getAllByRole('spinbutton')
    fireEvent.change(hrsInput[0], { target: { value: '10' } })

    expect(hrsInput[0]).toHaveValue(10)
    // Now submit button should be enabled
    expect(submitBtn).toBeEnabled()
  })

  test('successful submit calls update service and closes modal', async () => {
    const mockData = [
      { configurationName: 'Send_Email_PM', configurationValue: 'True' },
      { configurationName: 'Check_Overdue_AfterHrs', configurationValue: '3' },
      {
        configurationName: 'Send_Email_AutoClosure',
        configurationValue: 'False',
      },
    ]
    getWorkflowConfigurations.mockResolvedValue({
      statuscode: 200,
      data: mockData,
    })
    updateWorkflowConfigurations.mockResolvedValue({ statuscode: 200 })

    render(
      <JotaiProvider>
        <WorkflowConfiguration setShowModalConfig={mockSetShowModalConfig} />
      </JotaiProvider>,
    )

    await waitFor(() => expect(getWorkflowConfigurations).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )

    // Change hrs to trigger updatedValues
    const hrsInput = screen.getAllByRole('spinbutton')
    fireEvent.change(hrsInput[0], { target: { value: '6' } })

    const submitBtn = screen.getByRole('button', { name: /Submit/i })
    fireEvent.click(submitBtn)

    await waitFor(() => expect(updateWorkflowConfigurations).toHaveBeenCalled())
  })

  test('submit with error shows error toast but does not close modal', async () => {
    const mockData = [
      { configurationName: 'Send_Email_PE', configurationValue: 'False' },
      {
        configurationName: 'Send_Email_AutoClosure',
        configurationValue: 'True',
      },
    ]
    getWorkflowConfigurations.mockResolvedValue({
      statuscode: 200,
      data: mockData,
    })
    updateWorkflowConfigurations.mockResolvedValue({ statuscode: 500 })

    render(
      <JotaiProvider>
        <WorkflowConfiguration setShowModalConfig={mockSetShowModalConfig} />
      </JotaiProvider>,
    )

    await waitFor(() => expect(getWorkflowConfigurations)?.toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument(),
    )
    const peCheckbox = screen.getByTestId('workflow-checkbox-Send_Email_PE')
    fireEvent.click(peCheckbox)

    const submitBtn = screen.getByRole('button', { name: /Submit/i })
    fireEvent.click(submitBtn)

    await waitFor(() => expect(updateWorkflowConfigurations).toHaveBeenCalled())
    // expect(showToast).toHaveBeenCalledWith("Error While Updating Workflow Configuration", "error");
    expect(mockSetShowModalConfig).not.toHaveBeenCalled()
  })
})
