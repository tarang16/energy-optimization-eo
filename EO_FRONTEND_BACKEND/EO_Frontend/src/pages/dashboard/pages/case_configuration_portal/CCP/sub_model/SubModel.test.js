import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as CCPServices from 'services/CCPServices'
import * as ConfigServices from 'services/ConfigServices'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SubModel from './SubModel'

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='Loader'>Loader</div>,
}))
vi.mock('components/visuals/table/SimpleTable', () => ({
  default: ({ data, headers }) => (
    <div data-testid='SimpleTable'>
      <button data-testid='edit-btn' onClick={() => data[0][4].props.onClick()}>
        Mock Edit
      </button>
      {JSON.stringify(data)}
    </div>
  ),
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ show, title, children }) =>
    show ? (
      <div data-testid='CustomModal'>
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}))

vi.mock('./EditSubModel', () => ({
  default: ({ editData, setEditData, onSave, onCancel }) => (
    <div data-testid='EditSubModel'>
      <button onClick={() => onSave({})}>Mock Save</button>
      <button onClick={onCancel}>Mock Cancel</button>
    </div>
  ),
}))

vi.mock('../../Configurationdownload/ConfigurationDownload', () => ({
  default: () => <div data-testid='Download'>Download</div>,
}))

const mockData = [
  {
    tagName: 'Tag 1',
    subModelID: 1,
    subModelName: 'Model 1',
    subModelType: 'Type A',
    order: 1,
    responseOutput: 'Output',
    subModelExpression: 'Expression',
  },
]

describe('SubModel Component', () => {
  beforeEach(() => {
    vi.spyOn(CCPServices, 'getSubModel').mockResolvedValue({ data: mockData })
    vi.spyOn(CCPServices, 'updateSubModel').mockResolvedValue({
      statuscode: 200,
    })
    vi.spyOn(CCPServices, 'addAuditLog').mockResolvedValue({})
    vi.spyOn(
      ConfigServices,
      'getViewDataDictionaryByTablename',
    ).mockResolvedValue({ data: [] })
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('renders loader initially', async () => {
    render(<SubModel caseID={123} />)
    expect(screen.getByTestId('Loader')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByTestId('Loader')).not.toBeInTheDocument(),
    )
  })

  it('renders table after API load', async () => {
    render(<SubModel caseID={123} />)
    await waitFor(() => screen.getByTestId('SimpleTable'))
    expect(screen.getByTestId('SimpleTable')).toBeInTheDocument()
    expect(screen.getByText(/Tag 1/)).toBeInTheDocument()
  })

  it('opens modal on edit button click if canEdit is true', async () => {
    render(<SubModel caseID={123} canEdit={true} />)
    await waitFor(() => screen.getByTestId('SimpleTable'))
    const editBtn = screen.getByTestId('edit-btn')
    fireEvent.click(editBtn)

    await waitFor(() => screen.getByTestId('CustomModal'))
    expect(screen.getByTestId('EditSubModel')).toBeInTheDocument()
  })

  it('saves updated data and triggers audit log', async () => {
    render(<SubModel caseID={123} canEdit={true} />)
    await waitFor(() => screen.getByTestId('edit-btn'))
    fireEvent.click(screen.getByTestId('edit-btn'))
    await waitFor(() => screen.getByTestId('EditSubModel'))
    fireEvent.click(screen.getByText('Mock Save'))
    await waitFor(() => expect(CCPServices.updateSubModel).toHaveBeenCalled())
  })

  it('cancels edit and closes modal without saving', async () => {
    render(<SubModel caseID={123} canEdit={true} />)
    await waitFor(() => screen.getByTestId('edit-btn'))
    fireEvent.click(screen.getByTestId('edit-btn'))
    await waitFor(() => screen.getByTestId('EditSubModel'))
    fireEvent.click(screen.getByText('Mock Cancel'))
    await waitFor(() =>
      expect(screen.queryByTestId('EditSubModel')).not.toBeInTheDocument(),
    )
  })

  it('shows download component if apiData is available', async () => {
    render(<SubModel caseID={123} />)
    await waitFor(() => screen.getByTestId('Download'))
    expect(screen.getByTestId('Download')).toBeInTheDocument()
  })
})
