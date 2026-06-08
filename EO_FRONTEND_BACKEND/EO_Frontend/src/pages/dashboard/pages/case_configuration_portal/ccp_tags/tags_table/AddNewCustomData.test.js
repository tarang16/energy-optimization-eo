import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useOutletContext } from 'react-router-dom'
import { addTag } from 'services/CCPServices'
import * as utilities from 'utills/utilities'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AddNewCustomData from './AddNewCustomData'

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useOutletContext: vi.fn(),
  }
})

vi.mock('services/CCPServices', () => ({
  addTag: vi.fn(),
}))

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    showToast: vi.fn(),
  }
})

const mockSetIsModalOpenAddNew = vi.fn()
const mockSetEditTagsList = vi.fn()
const mockSetRefetch = vi.fn()
const mockHandleSetError = vi.fn()

const baseProps = {
  modelNamesDropDownOptions: [],
  uomDropDownOptions: [],
  editTagsList: {
    modelIDValue: 1,
    UomIdValue: 2,
    name: 'testTag',
  },
  setEditTagsList: mockSetEditTagsList,
  handleSetError: mockHandleSetError,
  tooltips: [],
  validationData: {},
  setIsModalOpenAddNew: mockSetIsModalOpenAddNew,
  setRefetch: mockSetRefetch,
}

describe('AddNewCustomData', () => {
  beforeEach(() => {
    useOutletContext.mockReturnValue({ caseId: 123 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders input fields and buttons correctly', () => {
    render(<AddNewCustomData {...baseProps} />)
    expect(screen.getByTestId('submit_button')).toBeInTheDocument()
    expect(screen.getByTestId('cancel_button')).toBeInTheDocument()
  })

  it('handles cancel button click', () => {
    render(<AddNewCustomData {...baseProps} />)
    fireEvent.click(screen.getByTestId('cancel_button'))
    expect(mockSetIsModalOpenAddNew).toHaveBeenCalledWith(false)
  })

  it('submits form and shows success toast', async () => {
    addTag.mockResolvedValue({ statuscode: 200 })

    render(<AddNewCustomData {...baseProps} />)
    fireEvent.click(screen.getByTestId('submit_button'))

    await waitFor(() => {
      expect(addTag).toHaveBeenCalled()
      expect(utilities.showToast).toHaveBeenCalledWith(
        'Tag Added successfully...',
        'success',
      )
      expect(mockSetIsModalOpenAddNew).toHaveBeenCalledWith(false)
      expect(mockSetRefetch).toHaveBeenCalled()
    })
  })

  it('shows error toast on failed submission', async () => {
    addTag.mockResolvedValue({ statuscode: 400, error: 'Something went wrong' })

    render(<AddNewCustomData {...baseProps} />)
    fireEvent.click(screen.getByTestId('submit_button'))

    await waitFor(() => {
      expect(utilities.showToast).toHaveBeenCalledWith(
        'Something went wrong',
        'error',
      )
    })
  })
})
