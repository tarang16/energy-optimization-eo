import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { Provider as JotaiProvider, useAtomValue } from 'jotai'
import { useOutletContext, useParams } from 'react-router-dom'
import {
  deleteTag,
  getBlockDetails,
  getModelNamesByCaseID,
} from 'services/CCPServices'
import {
  getValidUoms,
  getViewDataDictionaryByTablename,
} from 'services/ConfigServices'
import { showToast } from 'utills/utilities'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import TagDetails from './tagDetails'

vi.mock('atoms/AppAtom', () => ({
  AppAtom: 'AppAtom',
}))
vi.mock('atoms/CCPAtom', () => ({
  CCPTagsValidationData: 'CCPTagsValidationData',
}))

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Provider: actual.Provider,
    useAtom: vi.fn(),
    useAtomValue: vi.fn(),
  }
})

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useOutletContext: vi.fn(),
}))

vi.mock('services/CCPServices', () => ({
  deleteTag: vi.fn(),
  getBlockDetails: vi.fn(),
  getModelNamesByCaseID: vi.fn(),
  getTagsDataForValidation: vi.fn(),
}))
vi.mock('services/ConfigServices', () => ({
  getValidUoms: vi.fn(),
  getViewDataDictionaryByTablename: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  showToast: vi.fn(),
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    CCPTags: {
      onBtnClick: vi.fn(),
      onEditTag: vi.fn(),
    },
  },
}))

vi.mock(
  import('../CaseConfigurationPortal.module.scss'),
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      ccpTagsContainer: 'ccpTagsContainerClass',
      ccptagsContainer__bottom: 'ccptagsContainer__bottomClass',
    }
  },
)
vi.mock('./tags_table/tagsTable', () => ({
  default: (props) => {
    const {
      onEditClick,
      onInfoClick,
      onDeleteClick,
      refetch,
      setTagTypes,
      setDataTypes,
      modelNamesDropDownOptions,
      uomDropDownOptions,
      validationData,
      tooltips,
      canEdit,
    } = props
    return (
      <div data-testid='tags-table'>
        <button
          data-testid='edit-button'
          onClick={() => onEditClick({ tagID: 't1' })}
        >
          Edit
        </button>
        <button
          data-testid='info-button'
          onClick={() => onInfoClick({ tagID: 't2' })}
        >
          Info
        </button>
        <button
          data-testid='delete-button'
          onClick={() => onDeleteClick({ tagID: 't3' })}
        >
          Delete
        </button>
        <span data-testid='refetch-value'>{String(refetch)}</span>
        <span data-testid='tooltips-length'>{tooltips.length}</span>
        <span data-testid='model-names-length'>
          {modelNamesDropDownOptions.length}
        </span>
        <span data-testid='uom-data-length'>{uomDropDownOptions.length}</span>
      </div>
    )
  },
}))

vi.mock('./ccpTagsEditModal_EO', () => ({
  default: (props) => {
    const {
      editedData,
      closeModalCancel,
      closeModalRefetch,
      setIsDirty,
      tagTypes,
      blockNames,
      uomDropDownOptions,
      dataTypes,
      validationData,
      tooltips,
    } = props
    return (
      <div data-testid='edit-modal'>
        <span data-testid='show-modal'>
          {editedData.showModal ? 'true' : 'false'}
        </span>
        <span data-testid='is-edit-mode'>
          {editedData.isEditMode ? 'true' : 'false'}
        </span>
        <span data-testid='edited-data'>{JSON.stringify(editedData.data)}</span>
        <span data-testid='tag-types-length'>{tagTypes.length}</span>
        <span data-testid='block-names-length'>{blockNames.length}</span>
        <span data-testid='uom-dropdown-length'>
          {uomDropDownOptions.length}
        </span>
        <span data-testid='data-types-length'>{dataTypes.length}</span>
        <span data-testid='validation-data'>
          {JSON.stringify(validationData)}
        </span>
        <span data-testid='tooltips-length-modal'>{tooltips.length}</span>
        <button data-testid='set-dirty' onClick={() => setIsDirty(true)}>
          SetDirty
        </button>
        <button
          data-testid='close-cancel'
          onClick={() => closeModalCancel(editedData.isEditMode)}
        >
          CloseCancel
        </button>
        <button data-testid='close-refetch' onClick={() => closeModalRefetch()}>
          CloseRefetch
        </button>
      </div>
    )
  },
}))

describe('TagDetails Component', () => {
  const mockUseAtomValue = useAtomValue

  beforeEach(async () => {
    vi.clearAllMocks()
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'AppAtom') {
        return { caseData: { id: 'caseData1' } }
      }
      if (atom === 'CCPTagsValidationData') {
        return { some: 'validation' }
      }
      return undefined
    })
    useParams.mockReturnValue({ someParam: 'p1' })
    useOutletContext.mockReturnValue({ caseId: 'case123' })

    getViewDataDictionaryByTablename.mockResolvedValue({
      data: [
        { columnName: 'tag_id' },
        { columnName: 'tag_name' },
        // more columns if needed
      ],
    })
    getModelNamesByCaseID.mockResolvedValue({
      data: [{ ModelName: 'M1' }, { ModelName: 'M2' }],
    })
    getBlockDetails.mockResolvedValue({
      data: [{ blockname: 'B1' }, { blockname: 'B2' }],
    })
    getValidUoms.mockResolvedValue({
      data: [{ uomName: 'U1' }, { uomName: 'U2' }],
    })
  })

  test('renders invalid case message when no caseId', () => {
    useOutletContext.mockReturnValue({ caseId: null })
    render(
      <JotaiProvider>
        <TagDetails />
      </JotaiProvider>,
    )

    expect(
      screen.getByText("Invalid Case, can't show data."),
    ).toBeInTheDocument()
  })

  test('onEditClick updates editedData and modal shows edit mode', async () => {
    render(
      <JotaiProvider>
        <TagDetails canEdit={true} />
      </JotaiProvider>,
    )
    // Wait for initial fetch
    await waitFor(() => screen.getByTestId('tags-table'))

    // Click edit button
    fireEvent.click(screen.getByTestId('edit-button'))

    // Modal should show edit mode
    expect(screen.getByTestId('show-modal')).toHaveTextContent('true')
    expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('true')
    // Edited data should contain tagID "t1"
    expect(screen.getByTestId('edited-data')).toHaveTextContent('"tagID":"t1"')

    // Activity tracker should have been called
    expect(TRACKEVENTOBJ.CCPTags.onEditTag).toHaveBeenCalledWith({
      btnName: 'EDIT',
      value: 't1',
      params: { someParam: 'p1' },
      caseData: { id: 'caseData1' },
    })
  })

  test('onInfoClick updates editedData and modal shows info mode', async () => {
    render(
      <JotaiProvider>
        <TagDetails canEdit={true} />
      </JotaiProvider>,
    )
    await waitFor(() => screen.getByTestId('tags-table'))

    // Click info button
    fireEvent.click(screen.getByTestId('info-button'))

    expect(screen.getByTestId('show-modal')).toHaveTextContent('true')
    expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('false')
    expect(screen.getByTestId('edited-data')).toHaveTextContent('"tagID":"t2"')

    expect(TRACKEVENTOBJ.CCPTags.onEditTag).toHaveBeenCalledWith({
      btnName: 'INFO',
      value: 't2',
      params: { someParam: 'p1' },
      caseData: { id: 'caseData1' },
    })
  })

  test('closeModalCancel resets editedData without confirm when isEditMode=false and isDirty=false', async () => {
    render(
      <JotaiProvider>
        <TagDetails canEdit={true} />
      </JotaiProvider>,
    )
    await waitFor(() => screen.getByTestId('tags-table'))

    // Click info button to open modal
    fireEvent.click(screen.getByTestId('info-button'))
    expect(screen.getByTestId('show-modal')).toHaveTextContent('true')

    // Click close-cancel
    fireEvent.click(screen.getByTestId('close-cancel'))

    // Modal should close
    expect(screen.getByTestId('show-modal')).toHaveTextContent('false')

    expect(TRACKEVENTOBJ.CCPTags.onBtnClick).toHaveBeenCalledWith({
      btnName: 'CLOSE',
      params: { someParam: 'p1' },
      caseData: { id: 'caseData1' },
    })
  })

  test('closeModalCancel prompts confirm when isEditMode=false and isDirty=true', async () => {
    window.confirm = vi.fn(() => true)
    render(
      <JotaiProvider>
        <TagDetails canEdit={true} />
      </JotaiProvider>,
    )
    await waitFor(() => screen.getByTestId('tags-table'))

    // Click info to open modal
    fireEvent.click(screen.getByTestId('info-button'))
    // Set dirty
    fireEvent.click(screen.getByTestId('set-dirty'))

    // Click close-cancel
    fireEvent.click(screen.getByTestId('close-cancel'))
  })

  test('closeModalRefetch toggles refetch and closes modal', async () => {
    render(
      <JotaiProvider>
        <TagDetails canEdit={true} />
      </JotaiProvider>,
    )
    await waitFor(() => screen.getByTestId('tags-table'))

    // Click edit to open modal
    fireEvent.click(screen.getByTestId('edit-button'))
    expect(screen.getByTestId('show-modal')).toHaveTextContent('true')

    // Initial refetch is false
    expect(screen.getByTestId('refetch-value')).toHaveTextContent('false')

    // Click close-refetch
    fireEvent.click(screen.getByTestId('close-refetch'))

    // Modal closed
    expect(screen.getByTestId('show-modal')).toHaveTextContent('false')
    // refetch toggled to true
    expect(screen.getByTestId('refetch-value')).toHaveTextContent('true')
  })

  test('onDeleteClick does nothing when confirm is false', async () => {
    window.confirm = vi.fn(() => false)
    deleteTag.mockResolvedValue({ statuscode: 200 })
    render(
      <JotaiProvider>
        <TagDetails canEdit={true} />
      </JotaiProvider>,
    )
    await waitFor(() => screen.getByTestId('tags-table'))

    fireEvent.click(screen.getByTestId('delete-button'))

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete?',
    )
    expect(deleteTag).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
    // refetch remains false
    expect(screen.getByTestId('refetch-value')).toHaveTextContent('false')
  })
})
