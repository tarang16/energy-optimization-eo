import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as CCPServices from 'services/CCPServices'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EditCCPTabs from './EditCCPTabs'

//@ts-expect-error
vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
  }
})

// Mock modules
vi.mock('services/CCPServices')
vi.mock('react-tooltip', () => ({
  Tooltip: ({ children }) => <div>{children}</div>,
}))
vi.mock('react-select', () => ({
  default: (props) => {
    const handleChange = (e) => {
      props.onChange({ value: e.target.value, label: e.target.value })
    }
    return (
      <select
        data-testid={props['data-testid']}
        onChange={handleChange}
        value={props.value?.value || ''}
      >
        {props.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  },
}))

const mockEditData = {
  tagId: 1,
  modelId: 101,
  piAfTag: 0,
  defaultValue: 50,
  min: 10,
  max: 100,
  tagOutOfBoundSwitch: 2,
  tagNanSwitch: 3,
  tagStuckSwitch: 4,
  defaultSwitch: 1,
  tagFullName: 'TAG_123',
  tagDescription: 'Temperature sensor',
  uom: 'C',
  piTagName: 'PI_TAG_123',
  elementNameAttributeName: null,
}

const tooltips = {
  description: { content: 'Tag Description Info' },
  uom: { content: 'Unit Info' },
  name: { content: 'Full Name Info' },
  pi_name: { content: 'PI Tag Name Info' },
  defaultValue: { content: 'Default value tooltip', maxLength: 5 },
  lolo: { content: 'Min value tooltip', maxLength: 5 },
  hihi: { content: 'Max value tooltip', maxLength: 5 },
  tagOutOfBoundSwitch: { content: 'Out of bound policy tooltip' },
  tagNanSwitch: { content: 'NaN policy tooltip' },
  tagStuckSwitch: { content: 'Stuck policy tooltip' },
  defaultSwitch: { content: 'Default policy tooltip' },
}

const defaultCcpInfo = [
  {
    default_switch: [
      { ccpInfoId: 1, description: 'No Check', piAf: 1 },
      { ccpInfoId: 2, description: 'Hard Limit', piAf: 1 },
    ],
    tag_nan_switch: [{ ccpInfoId: 3, description: 'Flag NaN' }],
    tag_stuck_switch: [{ ccpInfoId: 4, description: 'No Change' }],
    tag_out_of_bound_switch: [{ ccpInfoId: 2, description: 'Hard Limit' }],
  },
]

describe('EditCCPTabs Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    CCPServices.getCcpInfo.mockResolvedValue({
      statuscode: 200,
      data: defaultCcpInfo,
    })

    CCPServices.getAffectedModelIdsByTagId.mockResolvedValue({
      statuscode: 200,
      data: [
        {
          caseId: null,
          caseName: null,
          modelName: null,
          modelId: null,
          tagId: null,
          modelTagId: null,
          max: null,
          min: null,
          defaultValue: null,
          defaultSwitch: null,
          tagNanSwitch: null,
          tagOutOfBoundSwitch: null,
          tagStuckSwitch: null,
          PiName: null,
        },
      ],
    })

    CCPServices.updateCCPData.mockResolvedValue({
      statuscode: 200,
    })

    CCPServices.getDefaultValue.mockResolvedValue({
      data: 'eyJkdW1teUtleSI6ImR1bW15dmFsdWUifQ==',
    })

    CCPServices.addAuditLog = vi.fn()
  })

  it('renders component with all required fields', async () => {
    await act(async () => {
      render(
        <EditCCPTabs
          role='admin'
          editData={mockEditData}
          setEditData={vi.fn()}
          tooltips={tooltips}
          fetchData={vi.fn()}
        />,
      )
    })

    expect(screen.getByText(/TAG DESCRIPTION/i)).toBeInTheDocument()
    expect(screen.getByText(/TAG UOM/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('50')).toBeInTheDocument() // default value input
  })

  it('renders component with all required fields', async () => {
    const data = {
      ...mockEditData,
      piAfTag: 1,
    }
    await act(async () => {
      render(
        <EditCCPTabs
          role='admin'
          editData={data}
          setEditData={vi.fn()}
          tooltips={tooltips}
          fetchData={vi.fn()}
        />,
      )
    })
    expect(screen.getByText(/TAG DESCRIPTION/i)).toBeInTheDocument()
    expect(screen.getByText(/TAG UOM/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('50')).toBeInTheDocument() // default value input
  })

  it('renders component with no data', async () => {
    CCPServices.getCcpInfo.mockResolvedValue({
      statuscode: 201,
    })
    await act(async () => {
      render(
        <EditCCPTabs
          role='admin'
          editData={mockEditData}
          setEditData={vi.fn()}
          tooltips={tooltips}
          fetchData={vi.fn()}
        />,
      )
    })

    expect(screen.getByText(/TAG DESCRIPTION/i)).toBeInTheDocument()
    expect(screen.getByText(/TAG UOM/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('50')).toBeInTheDocument() // default value input
  })

  it('handle reset function', async () => {
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
    await act(async () => {
      render(
        <EditCCPTabs
          role='admin'
          editData={mockEditData}
          setEditData={vi.fn()}
          tooltips={tooltips}
          fetchData={vi.fn()}
        />,
      )
    })

    expect(screen.getByText(/TAG DESCRIPTION/i)).toBeInTheDocument()
    expect(screen.getByText(/TAG UOM/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('50')).toBeInTheDocument() // default value input

    const resetBtn = screen.getByTestId('reset-btn')
    fireEvent.click(resetBtn)
  })

  it('disables Save button initially', async () => {
    await act(async () => {
      render(
        <EditCCPTabs
          role='admin'
          editData={mockEditData}
          setEditData={vi.fn()}
          tooltips={tooltips}
          fetchData={vi.fn()}
        />,
      )
    })

    const saveButton = screen.getByRole('button', { name: /submit/i })

    expect(saveButton).toBeDisabled()
  })

  it('enables Save button on change and submits form', async () => {
    const fetchDataMock = vi.fn()
    const setEditDataMock = vi.fn()

    await act(async () => {
      render(
        <EditCCPTabs
          role='admin'
          editData={mockEditData}
          setEditData={setEditDataMock}
          tooltips={tooltips}
          fetchData={fetchDataMock}
        />,
      )
    })

    const tagInput = screen.getAllByTestId('tag-input')
    fireEvent.change(tagInput[0], { target: { value: 40 } })

    const defaultValueInput = screen.getByDisplayValue('50')
    fireEvent.change(defaultValueInput, { target: { value: '60' } })

    const saveButton = screen.getByText(/Submit/i).closest('button')
    expect(saveButton).not.toBeDisabled()

    await act(async () => {
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(CCPServices.updateCCPData).toHaveBeenCalled()
      expect(setEditDataMock).toHaveBeenCalledWith(null)
    })
  })

  it('enables Save button on change and submits form on piAfTag 1', async () => {
    const fetchDataMock = vi.fn()
    const setEditDataMock = vi.fn()

    const data = {
      ...mockEditData,
      piAfTag: 1,
    }

    await act(async () => {
      render(
        <EditCCPTabs
          role='admin'
          editData={data}
          setEditData={setEditDataMock}
          tooltips={tooltips}
          fetchData={fetchDataMock}
        />,
      )
    })

    const tagInput = screen.getAllByTestId('tag-input')
    fireEvent.change(tagInput[0], { target: { value: 40 } })

    const defaultValueInput = screen.getByDisplayValue('50')
    fireEvent.change(defaultValueInput, { target: { value: '60' } })

    const saveButton = screen.getByText(/Submit/i).closest('button')
    expect(saveButton).not.toBeDisabled()

    await act(async () => {
      fireEvent.click(saveButton)
    })
  })

  it('shows alert on update failure', async () => {
    CCPServices.updateCCPData.mockResolvedValueOnce({
      statuscode: 400,
      errormsg: 'Invalid data',
    })

    vi.spyOn(window, 'alert').mockImplementation(() => {})

    await act(async () => {
      render(
        <EditCCPTabs
          role='admin'
          editData={mockEditData}
          setEditData={vi.fn()}
          tooltips={tooltips}
          fetchData={vi.fn()}
        />,
      )
    })

    const defaultValueInput = screen.getByDisplayValue('50')
    fireEvent.change(defaultValueInput, { target: { value: '60' } })

    const saveButton = screen.getByText(/Submit/i).closest('button')
    await act(async () => {
      fireEvent.click(saveButton)
    })

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('Unable to update data'),
    )
  })

  it('handles cancel action', async () => {
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValueOnce(true)
    const setEditDataMock = vi.fn()

    await act(async () => {
      render(
        <EditCCPTabs
          role='admin'
          editData={mockEditData}
          setEditData={setEditDataMock}
          tooltips={tooltips}
          fetchData={vi.fn()}
        />,
      )
    })

    const cancelButton = screen.getByText(/cancel/i)
    fireEvent.click(cancelButton)

    expect(confirmMock).toHaveBeenCalled()
    expect(setEditDataMock).toHaveBeenCalledWith(null)
  })
})
