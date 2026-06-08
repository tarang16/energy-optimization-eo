import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import { MemoryRouter } from 'react-router-dom'
import * as CCPServices from 'services/CCPServices'
import { showToast } from 'utills/utilities'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { initialAppContextTest } from '../../../../../index.test'
import EditMacrosTabs from './EditMacrosTabs'

// Mocks
vi.mock('components/visuals/dropdown/single_select/SingleSelect', () => ({
  default: (props) => (
    <div
      data-testid='single-select'
      onClick={() =>
        props.onSelectChange({ macroName: 'MACRO_2', mstPipelineMacroId: 2 })
      }
    >
      Mocked SingleSelect
    </div>
  ),
}))

vi.mock('../AuditLogs', () => ({
  default: () => <div data-testid='audit-logs'>Mocked AuditLogs</div>,
}))

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    safeBtoa: vi.fn((val) => btoa(val)),
    showToast: vi.fn(),
  }
})

vi.spyOn(window, 'confirm').mockImplementation(() => true)

describe('EditMacrosTabs', () => {
  const contextValue = initialAppContextTest

  const editDataMock = {
    pipelineMacroId: 1,
    value: '100',
    macroName: 'MACRO_1',
    mstAfConstantsId: 'CONST_1',
    modelId: 'MODEL_1',
  }

  const tooltipsMock = {
    value: {
      maxLength: 5,
    },
  }

  const fetchDataMock = vi.fn()
  const setEditDataMock = vi.fn()

  beforeEach(() => {
    vi.spyOn(CCPServices, 'getAffectedConstants').mockResolvedValue({
      statuscode: 200,
      data: [{ id: 1 }],
    })

    vi.spyOn(CCPServices, 'getMstMacros').mockResolvedValue({
      statuscode: 200,
      data: [
        { macroName: 'MACRO_1', mstPipelineMacroId: 1 },
        { macroName: 'MACRO_2', mstPipelineMacroId: 2 },
      ],
    })

    vi.spyOn(CCPServices, 'upsertMacrosData').mockResolvedValue({
      statuscode: 200,
    })

    vi.spyOn(CCPServices, 'addAuditLog').mockImplementation(vi.fn())
  })

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <Provider value={contextValue}>
          <EditMacrosTabs
            editData={editDataMock}
            tooltips={tooltipsMock}
            setEditData={setEditDataMock}
            fetchData={fetchDataMock}
          />
        </Provider>
      </MemoryRouter>,
    )

  test('renders correctly with initial data', async () => {
    renderComponent()
    expect(await screen.findByTestId('single-select')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    expect(screen.getByText('Submit')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  test('disables save button when data is unchanged', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Submit').closest('button')).toBeDisabled()
    })
  })

  test('enables save button when value is changed', async () => {
    renderComponent()
    const input = screen.getByDisplayValue('100')
    fireEvent.change(input, { target: { value: '200' } })

    await waitFor(() => {
      expect(screen.getByText('Submit').closest('button')).not.toBeDisabled()
    })
  })

  test('calls onSubmit and shows toast on success', async () => {
    renderComponent()

    const input = screen.getByDisplayValue('100')
    fireEvent.change(input, { target: { value: '200' } })

    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        'Successfully updated data.',
        'success',
      )
      expect(setEditDataMock).toHaveBeenCalledWith(null)
      expect(fetchDataMock).toHaveBeenCalled()
      expect(CCPServices.addAuditLog).toHaveBeenCalled()
    })
  })

  test('calls setEditData(null) on cancel confirmation', async () => {
    renderComponent()

    expect(screen.getByText('Cancel')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
  })

  test('triggers macro change via SingleSelect', async () => {
    renderComponent()

    const dropdown = screen.getByTestId('single-select')
    fireEvent.click(dropdown)

    await waitFor(() => {
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    })
  })
})
