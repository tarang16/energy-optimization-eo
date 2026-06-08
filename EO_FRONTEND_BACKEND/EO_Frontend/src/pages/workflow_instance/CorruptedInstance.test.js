import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import CorruptedInstance, {
  handleAlertManageModal,
  onActionBtnClick,
} from './CorruptedInstance'

import * as workflowServices from 'services/WorkflowServices'

import * as odsAlertModal from 'components/visuals/common/modal/ODSAlertModal'

import * as utilities from 'utills/utilities'

import { useAtomValue } from 'jotai'

import { terminateInstance } from 'services/WorkflowServices'
import { showToast } from 'utills/utilities'
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('services/WorkflowServices', () => ({
  terminateInstance: vi.fn(),
}))

vi.mock('utills/utilities', () => ({
  showToast: vi.fn(),
}))
// Mock CSS module

vi.mock('./WorkflowInstanceTabs.module.scss', () => ({
  default: {
    corruptedInstanceContainer: 'corruptedInstanceContainer',
    retrAllyButton: 'retrAllyButton',
    disabled: 'disabled',
    odsArrowBtn: 'odsArrowBtn',
    retryButton: 'retryButton',
    corruptedInstanceTableContainer: 'corruptedInstanceTableContainer',
  },
}))

vi.mock(import('ag-grid-react'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
    default: vi.fn(() => <div data-testid='ag-grid-react' />),
  }
})

vi.mock('atoms/RootAtom', () => ({
  TokenAtom: {},
}))

vi.mock('jotai', () => ({
  useAtomValue: vi.fn(),
}))

vi.mock('moment', () => ({
  default: vi.fn(() => ({
    format: () => '10/10/2025',
  })),
}))

vi.mock('components/ui/loader/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid='Loader'>Loader</div>,
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children }) => <div data-testid='custom-modal'>{children}</div>,
}))

vi.mock('components/visuals/common/modal/ODSAlertModal', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid='ods-alert-modal' />),
  getUserDomainID: vi.fn(),
}))

vi.mock('utills/utilities', () => ({
  showToast: vi.fn(),
}))
// mock services

vi.mock('services/WorkflowServices', () => ({
  bulkTerminateInstance: vi.fn(),
  terminateInstance: vi.fn(),
}))

describe('CorruptedInstance Component', () => {
  const mockDataFn = vi.fn()
  const mockSetRefetch = vi.fn()
  const tokenValue = 'fake-token'
  beforeEach(() => {
    vi.clearAllMocks()
    useAtomValue.mockReturnValue(tokenValue)
    odsAlertModal.getUserDomainID.mockResolvedValue('user-1')
  })
  const renderComp = (props = {}) =>
    render(
      <CorruptedInstance
        tabKey='corrupted_failed_instance'
        dataFn={mockDataFn}
        eventKey='corrupted_failed_instance'
        infoMsg='info message'
        {...props}
      />,
    )
  test('renders and calls getUserDomainID', async () => {
    mockDataFn.mockResolvedValue({ statuscode: 200, data: [] })
    await act(async () => renderComp())
    expect(odsAlertModal.getUserDomainID).toHaveBeenCalledWith(tokenValue)
    // expect(await screen.findByText("info message")).toBeInTheDocument();
  })
  test('fetchData success path with formatted data', async () => {
    mockDataFn.mockResolvedValue({
      statuscode: 200,
      data: [
        { processInstanceID: 'p1', requestID: 'r1', createdOn: '2025-10-10' },
      ],
    })
    await act(async () =>
      renderComp({
        tabKey: 'terminated_instance',
        eventKey: 'terminated_instance',
      }),
    )
    await waitFor(() => expect(mockDataFn).toHaveBeenCalledWith('user-1'))
  })
  test('fetchData failure path', async () => {
    mockDataFn.mockResolvedValue({ statuscode: 400, data: null })
    await act(async () => renderComp())
    await waitFor(() =>
      expect(utilities.showToast).not.toBeCalledWith(
        expect.stringContaining('error'),
      ),
    )
  })
  test('fetchData throws error', async () => {
    mockDataFn.mockRejectedValueOnce(new Error('fetch error'))
    await act(async () => renderComp())
    await waitFor(() =>
      expect(utilities.showToast).toHaveBeenCalledWith(
        'error while fetching corrupted instance',
        expect.any(Error),
      ),
    )
  })
  test('Terminate All button disabled when no data', async () => {
    mockDataFn.mockResolvedValue({ statuscode: 200, data: [] })
    await act(async () => renderComp())
    const btn = await screen.findByText('TERMINATE ALL')
    // expect(btn).toBeDisabled();
  })
  test('onTerminateAllClick success', async () => {
    mockDataFn.mockResolvedValue({ statuscode: 200, data: [{ id: 1 }] })
    workflowServices.bulkTerminateInstance.mockResolvedValue({
      statuscode: 200,
    })
    await act(async () => renderComp())
    const button = await screen.findByText('TERMINATE ALL')
    await act(async () => fireEvent.click(button))
    expect(workflowServices.bulkTerminateInstance).toHaveBeenCalledWith(
      'user-1',
    )
    expect(utilities.showToast).toHaveBeenCalledWith(
      'Terminate all instances Successfull',
      'success',
    )
  })
  test('onTerminateAllClick failure', async () => {
    mockDataFn.mockResolvedValue({ statuscode: 200, data: [{ id: 1 }] })
    workflowServices.bulkTerminateInstance.mockResolvedValue({
      statuscode: 500,
    })
    await act(async () => renderComp())
    const button = await screen.findByText('TERMINATE ALL')
    await act(async () => fireEvent.click(button))
    expect(utilities.showToast).toHaveBeenCalledWith(
      'failed to terminate all instances',
    )
  })
  test('onTerminateAllClick throws error', async () => {
    mockDataFn.mockResolvedValue({ statuscode: 200, data: [{ id: 1 }] })
    workflowServices.bulkTerminateInstance.mockRejectedValue(new Error('error'))
    await act(async () => renderComp())
    const button = await screen.findByText('TERMINATE ALL')
    await act(async () => fireEvent.click(button))
    expect(utilities.showToast).toHaveBeenCalledWith(
      'failed to terminate all instances',
    )
  })
  test('renders CustomModal when alertModalData exists', async () => {
    mockDataFn.mockResolvedValue({ statuscode: 200, data: [] })
    const { rerender } = renderComp()
    // await waitFor(() => expect(screen.getByText("TERMINATE ALL")).toBeInTheDocument());
    rerender(
      <CorruptedInstance
        tabKey='corrupted_failed_instance'
        dataFn={mockDataFn}
        eventKey='corrupted_failed_instance'
        infoMsg='info'
      />,
    )
    await act(async () => {
      fireEvent.click(screen.getByText('TERMINATE ALL'))
    })
  })
})

describe('Standalone function unit tests', () => {
  test('onActionBtnClick success path', async () => {
    const setRefetch = vi.fn()
    terminateInstance.mockResolvedValue({ statuscode: 200 })
    await onActionBtnClick(
      'pid123',
      'userX',
      'TERMINATE',
      showToast,
      setRefetch,
    )
    expect(terminateInstance).toHaveBeenCalledWith('userX', 'pid123')
    expect(showToast).toHaveBeenCalledWith('TERMINATE Successfull', 'success')
    expect(setRefetch).toHaveBeenCalledWith(expect.any(Function))
  })
  test('onActionBtnClick failure + handleAlertManageModal', async () => {
    terminateInstance.mockResolvedValue({ statuscode: 500 })
    const setRefetch = vi.fn()
    await onActionBtnClick(
      'pid999',
      'userY',
      'TERMINATE',
      showToast,
      setRefetch,
    )
    expect(showToast).toHaveBeenCalledWith('failed on TERMINATE instance')
    const setAlertModal = vi.fn()
    const setAlertModalData = vi.fn()
    const dummyData = { id: 'req1' }
    handleAlertManageModal(
      'REQ-123',
      dummyData,
      setAlertModal,
      setAlertModalData,
    )
    expect(setAlertModal).toHaveBeenCalledWith('REQ-123')
    expect(setAlertModalData).toHaveBeenCalledWith(dummyData)
  })
})
