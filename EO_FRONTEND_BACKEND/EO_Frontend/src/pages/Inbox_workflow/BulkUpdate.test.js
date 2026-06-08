// ============================================================
// FILE: BulkUpdate.test.jsx (FIXED)
// ============================================================
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { TokenAtom } from 'atoms/RootAtom'
import * as ODSAlertModal from 'components/visuals/common/modal/ODSAlertModal'
import { useAtomValue } from 'jotai'
import * as utilities from 'utills/utilities'
import { beforeEach, describe, it, vi } from 'vitest'
import { BulkUpdate } from './BulkUpdate'

vi.mock(import('./BulkUpdate'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    setBulkRequestIDs: vi.fn(() => Promise.resolve()),
  }
})
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})
const mockAssigneeList = {
  errormsg: '',
  statuscode: 200,
  data: [
    {
      employeeId: 30768424,
      name: 'Satyam Sharma',
      email: 'sharmasa@sabic.com',
      role: 'Process Engineer',
    },
    {
      employeeId: 30774037,
      name: 'Sumit Khatri',
      email: 's@sabic.com',
      role: 'Process Engineer',
    },
    {
      employeeId: 30752531,
      name: 'Arshnoor Khan',
      email: 'a@sabic.com',
      role: 'Process Engineer',
    },
  ],
}
let mock_add_activity = {
  data: [],
  errormsg: '',
  statuscode: 200,
}
vi.mock('components/visuals/common/modal/ODSAlertModal', () => ({
  getUserDomainID: vi.fn(() => Promise.resolve('mock-user-id')),
  getSubmitText: vi.fn(() => 'mockedDomainID'),
}))
vi.mock('utills/utilities', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getAuthTokenLocal: vi.fn(),
    convertBase64ToStr: vi.fn(),
    commentValidString: vi.fn(),
  }
})
vi.mock('services/WorkflowServices', () => ({
  getODSWorkflowActionLogsByReqId: vi.fn(),
  getODSAssigneeListByReqId: () => mockAssigneeList,
  getWfAlertHistoricalData: vi.fn(),
  getOdsActivitySuggestionsLogByReqId: vi.fn(),
  getOdsSuggestionsLogByReqId: vi.fn(),
  getWfHandlingReasons: vi.fn(),
  addActivity: () => mock_add_activity,
}))
let mockData = {
  plant: 'OLEFINS-SHARQ',
  requestIDs: [198, 199, 209],
  showModal: false,
  stageId: 2,
}
const getMockAuthData = (uid) => {
  return {
    decodedToken: {
      exp: 1703658076,
      affiliate_name: 'SABIC',
      email: 'abc@SABIC.com',
      firstName: 'fname',
      lastName: 'lname',
      uid,
      ccp: [],
      ods: [],
      read: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      role: 'user',
    },
    isValid: true,
    domainLoginID: `\\${uid}`,
  }
}
describe('WorkflowStgeOne component', () => {
  beforeEach(() => {
    vi.mocked(utilities.getAuthTokenLocal).mockReturnValue({
      domainLoginID: 'SABICCORP\\30770225',
      exp: 1747291236,
      affiliate_name: 'SABIC',
      affiliate_code: '1000',
      email: 'KakkadP@SABIC.com',
      firstName: 'Pratik ',
      lastName: 'Kakkad',
      poweruser: '0',
      uid: '30770225',
      workflowRoleApi: '1',
      workflowClaimsApi: [
        '213',
        '15',
        '97',
        '105',
        '124',
        '206',
        '240',
        '247',
        '268',
        '34',
        '202',
        '204',
        '279',
        '93',
        '196',
        '214',
        '217',
        '241',
      ],
      ccp: [
        '54',
        '34',
        '241',
        '124',
        '278',
        '12',
        '253',
        '13',
        '53',
        '14',
        '82',
        '118',
        '204',
        '199',
        '211',
        '200',
      ],
      ods: [],
      read: [],
      role: 'admin',
      timezone: 'Asia/Riyadh',
      plantClaims: ['34', '204', '217', '241'],
      readClaims: [
        '5',
        '152',
        '4',
        '6',
        '2',
        '151',
        '1',
        '3',
        '67',
        '150',
        '66',
        '68',
        '104',
        '149',
        '103',
        '105',
      ],
      affiliateClaims: ['1400'],
      vcClaims: ['204', '202', '124'],
    })
    vi.restoreAllMocks()
    vi.spyOn(ODSAlertModal, 'getUserDomainID').mockResolvedValue('mock-user-id')
  })
  const setBulkRequestIDs = vi.fn()
  const setIsLoadingMock = vi.fn()
  it('renders component without Error', () => {
    vi.mocked(utilities.getAuthTokenLocal).mockReturnValue(
      getMockAuthData(30752536),
    )
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === TokenAtom) return getMockAuthData(30770225)
      return null
    })
    render(<BulkUpdate requestIDs={mockData.requestIDs} />)
  })
  it('renders component with accept button click', async () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === TokenAtom) return getMockAuthData(30770225)
      return null
    })
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
    const { getByText } = await act(() => {
      return render(
        <BulkUpdate
          requestIDs={mockData.requestIDs}
          stageId={mockData?.stageId}
          setBulkRequestIDs={setBulkRequestIDs}
          setIsLoading={setIsLoadingMock}
        />,
      )
    })
    const acceptButton = getByText('Accept')
    fireEvent.click(acceptButton)
  })
  it('renders component with reject button click', () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === TokenAtom) return getMockAuthData(30770225)
      return null
    })
    const { getByText, getByTestId } = render(
      <BulkUpdate
        requestIDs={mockData.requestIDs}
        stageId={mockData?.stageId}
        setBulkRequestIDs={setBulkRequestIDs}
        setIsLoading={setIsLoadingMock}
      />,
    )
    const rejectButton = getByText('Reject')
    fireEvent.click(rejectButton)
    const commentField = getByTestId('workflow-comment-field')
    fireEvent.change(commentField, { target: { value: 'Testing comment' } })
    fireEvent.change(commentField, { target: { value: 'Testing comment$' } })
    fireEvent.change(commentField, { target: { value: 'A'.repeat(502) } })
  })
  it('renders component with target date button click', () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === TokenAtom) return getMockAuthData(30770225)
      return null
    })
    const { getByText, getByTestId } = render(
      <BulkUpdate
        requestIDs={mockData.requestIDs}
        stageId={2}
        setBulkRequestIDs={setBulkRequestIDs}
        setIsLoading={setIsLoadingMock}
      />,
    )
    const targetDateButton = getByText('Target Date')
    fireEvent.click(targetDateButton)
    const confirmImp = getByTestId('stage_3_confirm_imp')
    fireEvent.click(confirmImp)
    fireEvent.click(confirmImp)
    const commentField = getByTestId('workflow-comment-field')
    fireEvent.change(commentField, { target: { value: 'Testing comment' } })
    const submitBtn = getByTestId('stage-submit-btn')
    fireEvent.click(submitBtn)
  })
  it('renders component with forward button click', () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === TokenAtom) return getMockAuthData(30770225)
      return null
    })
    render(
      <BulkUpdate
        requestIDs={mockData.requestIDs}
        stageId={2}
        setBulkRequestIDs={setBulkRequestIDs}
        setIsLoading={setIsLoadingMock}
      />,
    )
  })
  it('renders component with assign button click', () => {
    act(() => {
      mockData = { ...mockData, stageId: 3 }
    })
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === TokenAtom) return getMockAuthData(30770225)
      return null
    })
    const { getByText } = render(
      <BulkUpdate
        requestIDs={mockData.requestIDs}
        stageId={mockData?.stageId}
        setBulkRequestIDs={setBulkRequestIDs}
        setIsLoading={setIsLoadingMock}
      />,
    )
    const assignButton = getByText('Assign')
    fireEvent.click(assignButton)
  })
  it('renders component with stage 2 with no error data fill and submit', async () => {
    act(() => {
      mockData = { ...mockData, stageId: 1 }
    })
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === TokenAtom) return getMockAuthData(30770225)
      return null
    })
    vi.mocked(utilities.commentValidString).mockReturnValue('')
    const { getByTestId } = render(
      <BulkUpdate
        requestIDs={mockData.requestIDs}
        stageId={2}
        setBulkRequestIDs={setBulkRequestIDs}
        setIsLoading={setIsLoadingMock}
        handleRefreshData={() => {}}
      />,
    )
    const commentField = getByTestId('workflow-comment-field')
    fireEvent.change(commentField, { target: { value: 'Testing comment' } })
    const submitBtn = getByTestId('stage-submit-btn')
    fireEvent.click(submitBtn)
  })
  it('renders component with stage 2 data fill and submit', async () => {
    act(() => {
      mockData = { ...mockData, stageId: 2 }
    })
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === TokenAtom) return getMockAuthData(30770225)
      return null
    })
    vi.mocked(utilities.commentValidString).mockReturnValue('')
    const { getByTestId } = render(
      <BulkUpdate
        requestIDs={mockData.requestIDs}
        stageId={2}
        setBulkRequestIDs={setBulkRequestIDs}
        setIsLoading={setIsLoadingMock}
        handleRefreshData={() => {}}
      />,
    )
    const commentField = getByTestId('workflow-comment-field')
    fireEvent.change(commentField, { target: { value: 'Testing comment' } })
    const submitBtn = getByTestId('stage-submit-btn')
    fireEvent.click(submitBtn)
  })
  it('renders component with stage 3 data fill and submit', async () => {
    act(() => {
      mockData = { ...mockData, stageId: 2 }
    })
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === TokenAtom) return getMockAuthData(30770225)
      return null
    })
    vi.mocked(utilities.commentValidString).mockReturnValue('')
    const { getByText, getByTestId } = render(
      <BulkUpdate
        requestIDs={mockData.requestIDs}
        stageId={3}
        setBulkRequestIDs={setBulkRequestIDs}
        setIsLoading={setIsLoadingMock}
        handleRefreshData={() => {}}
      />,
    )
    const commentField = getByTestId('workflow-comment-field')
    fireEvent.change(commentField, { target: { value: 'Testing comment' } })
    const submitBtn = getByTestId('stage-submit-btn')
    fireEvent.click(submitBtn)
    const confirmButton = getByText('Yes')
    fireEvent.click(confirmButton)
  })
  it('renders component with stage one data fill and submit with failed response', async () => {
    act(() => {
      mockData = { ...mockData, stageId: 1 }
      mock_add_activity = { ...mock_add_activity, statuscode: 400 }
    })
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === TokenAtom) return getMockAuthData(30770225)
      return null
    })
    const { getByText, getByTestId } = render(
      <BulkUpdate
        requestIDs={mockData.requestIDs}
        stageId={1}
        setBulkRequestIDs={setBulkRequestIDs}
        setIsLoading={setIsLoadingMock}
        handleRefreshData={() => {}}
      />,
    )
    await waitFor(() => {
      const singleSelectEvent = document.querySelector('#single-select-click')
      fireEvent.click(singleSelectEvent)
      const handleNameChange = getByText('Satyam Sharma')
      fireEvent.click(handleNameChange)
    })
    const commentField = getByTestId('workflow-comment-field')
    fireEvent.change(commentField, { target: { value: 'Testing comment' } })
    const submitBtn = getByTestId('stage-submit-btn')
    fireEvent.click(submitBtn)
  })
})
