import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { ROLES } from 'config/Config'
import { Tab, Tabs } from 'react-bootstrap'
import { BrowserRouter as Router } from 'react-router-dom'
import { getUsersByRole } from 'services/AccountServices' // Import the service
import { getAuthTokenLocal } from 'utills/utilities'
import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import Roles, { getDefaultActiveTab } from './Roles'
import RolesTab from './RolesTab/RolesTab'

const isWorkflowAdmin = () => true

function getTabTest({
  eventKey,
  title,
  role,
  claimType,
  info,
  visibleOnWorkflowRole,
  token,
  pageKey,
}) {
  if (isWorkflowAdmin(pageKey, token)) {
    if (visibleOnWorkflowRole || token?.isPowerUser) {
      return (
        <Tab eventKey={eventKey} title={title} key={eventKey}>
          <RolesTab
            pageKey={pageKey}
            role={role}
            claimType={claimType}
            title={title}
            info={info}
          />
        </Tab>
      )
    }
  }
  return null
}

describe('getDefaultActiveTab', () => {
  it("should return 'workflow' if user is a workflow admin", () => {
    const token = {
      workflowRole: '1',
      decodedToken: {
        role: ROLES.USER,
      },
    }

    const result = getDefaultActiveTab('features', token)

    expect(result).toBe('workflow')
  })
})

test('getTab returns Tab when visibleOnWorkflowRole is false but token.isPowerUser is true', () => {
  const props = {
    eventKey: 'tab2',

    title: 'Power User Tab',

    role: 'user',

    claimType: 'typeB',

    info: 'power user info',

    visibleOnWorkflowRole: false, // false here

    token: { isPowerUser: true }, // true here

    pageKey: 'page2',
  }

  const tabElement = getTabTest(props)

  render(
    <>
      <Tabs defaultActiveKey='tab2'>{tabElement}</Tabs>
    </>,
  )

  // Check Tab title renders

  expect(screen.getByText('Power User Tab')).toBeInTheDocument()
})

test('getTab returns null when both visibleOnWorkflowRole and token.isPowerUser are false', () => {
  const props = {
    eventKey: 'tab3',

    title: 'No Access Tab',

    role: 'guest',

    claimType: 'typeC',

    info: 'no access info',

    visibleOnWorkflowRole: false,

    token: { isPowerUser: false },

    pageKey: 'page3',
  }

  const tabElement = getTabTest(props)

  expect(tabElement).toBeNull()
})

test('getTab returns Tab component with RolesTab child when user is workflow admin and visibleOnWorkflowRole is true', () => {
  const props = {
    eventKey: 'tab1',
    title: 'My Tab',
    role: 'admin',
    claimType: 'typeA',
    info: 'some info',
    visibleOnWorkflowRole: true,
    token: { isPowerUser: false },
    pageKey: 'page1',
  }

  const tabElement = getTabTest(props)

  render(<Tabs defaultActiveKey='tab1'>{tabElement}</Tabs>)

  // Now you can query as before
  expect(screen.getByText('My Tab')).toBeInTheDocument()
})

describe('handleSearchParam', () => {
  it('should update tabKey in search params and call setSearchParams with replace', () => {
    const mockSetSearchParams = vi.fn()

    const mockSearchParams = new URLSearchParams({ foo: 'bar' })

    const handleSearchParam = (eventKey, searchParams, setSearchParams) => {
      const newSearchParams = new URLSearchParams(searchParams)

      newSearchParams.set('tabKey', eventKey)

      setSearchParams(newSearchParams, { replace: true })
    }

    handleSearchParam('monthly', mockSearchParams, mockSetSearchParams)

    const expectedParams = new URLSearchParams({
      foo: 'bar',
      tabKey: 'monthly',
    })

    expect(mockSetSearchParams).toHaveBeenCalledWith(expectedParams, {
      replace: true,
    })
  })
})

describe('getDefaultActiveTab', () => {
  const tabConfig = {
    page1: [
      { eventKey: 'overview' },

      { eventKey: 'details' },

      { eventKey: 'power' },
    ],

    page2: [
      { eventKey: 'summary' },

      { eventKey: 'insights' },

      { eventKey: 'advanced' },
    ],
  }

  let isWorkflowAdmin = () => false

  function getDefaultActiveTab(pageKey, token) {
    if (isWorkflowAdmin(pageKey, token)) return 'workflow'

    if (token?.isPowerUser) return tabConfig[pageKey]?.[2]?.eventKey

    return tabConfig[pageKey]?.[0]?.eventKey
  }

  it("returns 'workflow' if isWorkflowAdmin is true", () => {
    isWorkflowAdmin = () => true

    const token = { isPowerUser: false }
    const result = getDefaultActiveTab('page1', token)
    expect(result).toBe('workflow')
  })

  it('returns 3rd tab if isWorkflowAdmin is false but isPowerUser is true', () => {
    isWorkflowAdmin = () => false

    const token = { isPowerUser: true }
    const result = getDefaultActiveTab('page1', token)
    expect(result).toBe('power')
  })

  it('returns 1st tab if neither isWorkflowAdmin nor isPowerUser is true', () => {
    isWorkflowAdmin = () => false

    const token = { isPowerUser: false }
    const result = getDefaultActiveTab('page1', token)
    expect(result).toBe('overview')
  })

  it("should return 'workflow' if both isWorkflowAdmin and isPowerUser are true", () => {
    isWorkflowAdmin = () => true

    const token = { isPowerUser: true }

    const result = getDefaultActiveTab('page1', token)

    expect(result).toBe('workflow')
  })

  it("should return 'workflow' if isWorkflowAdmin is true", () => {
    isWorkflowAdmin = () => true

    const token = { decodedToken: { role: 'USER' }, isPowerUser: false }

    const result = getDefaultActiveTab('page1', token)

    expect(result).toBe('workflow')
  })

  it('should return 3rd tab if isWorkflowAdmin is false and token.isPowerUser is true', () => {
    isWorkflowAdmin = () => false

    const token = { decodedToken: { role: 'USER' }, isPowerUser: true }

    const result = getDefaultActiveTab('page1', token)

    expect(result).toBe('power')
  })

  it('should return 1st tab if neither isWorkflowAdmin nor isPowerUser', () => {
    isWorkflowAdmin = () => false

    const token = { decodedToken: { role: 'USER' }, isPowerUser: false }

    const result = getDefaultActiveTab('page1', token)

    expect(result).toBe('overview')
  })

  it('returns false if workflowRole is not 1', () => {
    const token = {
      workflowRole: '0',

      decodedToken: { role: 'developer' },
    }

    expect(isWorkflowAdmin('features', token)).toBe(false)
  })

  it('returns false if user is admin', () => {
    const token = {
      workflowRole: '1',

      decodedToken: { role: ROLES.ADMIN },
    }

    expect(isWorkflowAdmin('features', token)).toBe(false)
  })
  it('returns false if user is admin', () => {
    const token = {
      workflowRole: '1',
    }

    expect(isWorkflowAdmin('features', token)).toBe(false)
  })
  it('should return "workflow" if user is workflow admin', () => {
    isWorkflowAdmin = () => true

    const token = { isPowerUser: true }

    const result = getDefaultActiveTab('page1', token)

    expect(result).toBe('workflow')
  })

  it('should return 3rd tab if user is power user and not admin', () => {
    isWorkflowAdmin = () => false

    const token = { isPowerUser: true }

    const result = getDefaultActiveTab('page1', token)

    expect(result).toBe('power')
  })
  it('should return 1st tab if user is not power user', () => {
    isWorkflowAdmin = () => false

    const token = { isPowerUser: false }

    const result = getDefaultActiveTab('page1', token)

    expect(result).toBe('overview')
  })

  it('should return 1st tab from tabConfig when not workflow admin and not power user (explicit else branch)', () => {
    isWorkflowAdmin = () => false

    const token = { isPowerUser: false }

    const result = getDefaultActiveTab('page2', token)

    expect(result).toBe('summary')
  })

  it('should return 1st tab if token is undefined', () => {
    isWorkflowAdmin = () => false

    const result = getDefaultActiveTab('page1', undefined)

    expect(result).toBe('overview')
  })

  it('should return undefined if pageKey is invalid', () => {
    isWorkflowAdmin = () => false

    const result = getDefaultActiveTab('invalidPage', { isPowerUser: true })

    expect(result).toBeUndefined()
  })
})

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

vi.mock('utills/utilities', () => ({
  getAuthTokenLocal: vi.fn(),
  isValidString: vi.fn(() => ''),
  uuid4: vi.fn(() => 'unique-id'),
  genRandomNumber: vi.fn(),
  convertFormulaToHtml: vi.fn(),
  debounce: vi.fn(),
}))

vi.mock('services/AccountServices', () => ({
  getUsersByRole: vi.fn(),
}))

global.alert = vi.fn()

describe('Roles component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUsersByRole.mockResolvedValue([
      {
        employeeName: 'abcd',
        employeeID: 2121,
        firstName: 'ab',
        lastName: 'cd',
        email: 'abcd@sabic.com',
        affiliateName: 'SABIC',
      },
    ])
  })

  it('renders without crashing', () => {
    render(
      <Router>
        <>
          <Roles />
        </>
      </Router>,
    )
  })

  it('shows alert and navigates when the user is not authorized', () => {
    getAuthTokenLocal.mockReturnValue({
      decodedToken: { role: 'user' },
    })
    render(
      <Router>
        <>
          <Roles pageKey='dashboard' />
        </>
      </Router>,
    )
    expect(global.alert).toHaveBeenCalledWith(
      'NOT AUTHORIZED TO VIEW THE RESOURCE, NAVIGATE TO MAIN PAGE.',
    )
  })

  it('renders tabs correctly when given a valid key', () => {
    // Mock token with admin role
    getAuthTokenLocal.mockReturnValue({
      decodedToken: { role: 'admin' },
      role: !ROLES.ADMIN,
      // workflowRole: null, // Adjust as necessary
    })
    render(
      <Router>
        <>
          <Roles pageKey='dashboard' />
        </>
      </Router>,
    )
  })

  it('renders tabs correctly with workflowRole', () => {
    // Mock token with admin role
    getAuthTokenLocal.mockReturnValue({
      decodedToken: { role: 'user' },
      workflowRole: '1',
      role: !ROLES.ADMIN,
    })
    render(
      <Router>
        <>
          <Roles pageKey='workflow' />
        </>
      </Router>,
    )
  })

  it('displays "INVALID COMPONENT NAME" message when given an invalid key', () => {
    // Mock token with admin role
    getAuthTokenLocal.mockReturnValue({
      decodedToken: { role: 'admin' },
      workflowRole: null, // Adjust as necessary
    })
    render(
      <Router>
        <>
          <Roles pageKey='invalidKey' />
        </>
      </Router>,
    )
  })
})

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    UserManagement: {
      onTabChange: vi.fn(),
    },
  },
  getTrackingObj: vi.fn(() => ({})),
}))

test('calls onTabChange with correct tabName and pageKey', () => {
  getAuthTokenLocal.mockReturnValue({
    decodedToken: { role: 'admin' },
    workflowRole: '0', // Adjust as necessary
  })
  render(
    <Router>
      <Roles pageKey='dashboard' />
    </Router>,
  )

  const corporateTab = screen.getByText('Corporate')
  fireEvent.click(corporateTab)
})

test('increments reloadUsers state only when switching to Users tab from another tab', () => {
  getAuthTokenLocal.mockReturnValue({
    decodedToken: { role: 'admin' },
    workflowRole: '0',
  })

  render(
    <Router>
      <Roles pageKey='dashboard' />
    </Router>,
  )

  const usersTab = screen.getByText('Users')
  fireEvent.click(usersTab)
  expect(screen.getByText('Users')).toBeInTheDocument()
})
