import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn(),
    useLocation: vi.fn(),
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    NavLink: ({
      children,
      to,
      className,
      'data-tooltip-id': dataTooltipId,
      ...props
    }) => (
      <a
        href={to}
        className={className}
        data-tooltip-id={dataTooltipId}
        {...props}
      >
        {children}
      </a>
    ),
  }
})

vi.mock('services/AdminServices', () => ({
  getUserStatisticsOnlineUser: vi.fn(),
}))
vi.mock('services/ConfigServices', () => ({
  logout: vi.fn(),
}))

vi.mock(import('logger/Logger'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    error: vi.fn(),
  }
})
vi.mock('moment', () => ({
  default: () => {
    const moment = vi.fn(() => ({
      format: vi.fn(() => '01-Jan-23 10:00 AM'),
    }))
    moment.default = moment
    return moment
  },
}))
// Mock assets
vi.mock('assets/sabic_icons/common/emailIcon.svg', () => ({
  default: 'emailIcon.svg',
}))
vi.mock('assets/sabic_icons/header/backarrowIcon.svg', () => ({
  default: 'backarrowIcon.svg',
}))
vi.mock('assets/sabic_icons/header/energy_optimization_logo.svg', () => ({
  default: 'energyOptimizationIcon.svg',
}))
vi.mock('assets/sabic_icons/header/logout.svg', () => ({
  default: 'logoutIcon.svg',
}))
vi.mock('assets/sabic_icons/header/super_admin_default.svg', () => ({
  default: 'userIcon.svg',
}))
vi.mock('assets/sabic_icons/header/userProfileIcon.svg', () => ({
  default: 'userProfileIcon.svg',
}))
vi.mock('assets/sabic_icons/sabic/sabic_logo.svg', () => ({
  default: 'sabicIcon.svg',
}))
vi.mock('assets/sabic_new_icons/helpActiveIcon.svg', () => ({
  default: 'helpIcon.svg',
}))
vi.mock('env', () => ({
  env: {
    EO_HELP_URL: 'https://help.test.com',
  },
}))
vi.mock('config/Config', () => ({
  ROLES: {
    ADMIN: 'ADMIN',
    CORPORATE: 'CORPORATE',
    PARTIAL_CORPORATE: 'PARTIAL_CORPORATE',
    USER: 'USER',
  },
}))
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    header: {
      backOnClick: vi.fn(),
      inboxWorkflowOnClick: vi.fn(),
      helpOnClick: vi.fn(),
      adminOnClick: vi.fn(),
      adminBackOnClick: vi.fn(),
      logoutOnClick: vi.fn(),
    },
  },
}))
vi.mock(import('pages/affiliates/AffiliateUrls'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    testaffiliate: 'test-affiliate-logo.svg',
    affiliate1: 'affiliate1-logo.svg',
  }
})

vi.mock('utills/utilities', () => ({
  slugToText: vi.fn(),
  toTitleCase: vi.fn(),
}))
vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: () => {
    return function MockCustomModal({ children, show, hideModal, title }) {
      if (!show) return null
      return (
        <div data-testid='custom-modal'>
          <h3>{title}</h3>
          <button onClick={hideModal}>Close</button>
          {children}
        </div>
      )
    }
  },
}))
vi.mock('components/visuals/table/SimpleTable', () => ({
  default: () => {
    return function MockSimpleTable({ data, headers }) {
      return (
        <div data-testid='simple-table'>
          <div data-testid='table-headers'>{headers?.join(',')}</div>
          <div data-testid='table-data'>{data?.length || 0} items</div>
        </div>
      )
    }
  },
}))
vi.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }) => (
    <div data-testid={`tooltip-${id}`}>{children}</div>
  ),
}))
// Mock atoms
vi.mock('atoms/AppAtom', () => ({
  AppAtom: Symbol('AppAtom'),
}))
vi.mock(import('atoms/RootAtom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    TokenAtom: Symbol('TokenAtom'),
    userWorkflowCountAtom: Symbol('userWorkflowCountAtom'),
  }
})

// Now import the component and mocked dependencies
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import Header, { generateUserName } from './Header'
// Import the mocked dependencies after the component
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getUserStatisticsOnlineUser } from 'services/AdminServices'
import { logout } from 'services/ConfigServices'
import { slugToText, toTitleCase } from 'utills/utilities'
const renderHeader = (props = {}) => {
  return render(
    <BrowserRouter>
      <Header {...props} />
    </BrowserRouter>,
  )
}
// Get the mock atom symbols
import {
  UomAtom as AppAtom,
  TokenAtom,
  userWorkflowCountAtom,
} from 'atoms/RootAtom'
describe('Header Component', () => {
  let originalConfirm
  let originalClear
  beforeAll(() => {
    originalConfirm = window.confirm
    originalClear = Storage.prototype.clear
  })
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    useNavigate.mockReturnValue(vi.fn())
    useParams.mockReturnValue({})
    useLocation.mockReturnValue({ pathname: '/' })
    logout.mockResolvedValue({})
    slugToText.mockImplementation((slug) =>
      slug ? slug.replace(/-/g, ' ') : '',
    )
    toTitleCase.mockImplementation((text) =>
      text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : '',
    )

    // Setup default atom values
    useAtomValue.mockImplementation((atom) => {
      if (atom === AppAtom) {
        return { caseData: [] }
      }
      if (atom === TokenAtom) {
        return {
          isValid: true,
          access: {
            role: 'USER',
            workflowRoleApi: '0',
          },
          decodedToken: {
            uid: '123',
            email: 'test@test.com',
            firstName: 'John',
            lastName: 'Doe',
            time_zone: 'UTC',
          },
          isAdminUser: false,
        }
      }
      if (atom === userWorkflowCountAtom) {
        return 0
      }
      return null
    })

    // Mock browser APIs
    window.confirm = vi.fn(() => true)
    Storage.prototype.clear = vi.fn()
  })
  afterAll(() => {
    window.confirm = originalConfirm
    Storage.prototype.clear = originalClear
  })
  describe('Basic Rendering', () => {
    it('renders header with basic elements', () => {
      renderHeader()

      // Check if elements are in the document using different approach
      const energyIcon = document.querySelector('img[alt="energyOptionIocn"]')
      const logo = document.querySelector('img[alt="logo"]')
      const helpIcon = document.querySelector('img[alt="Help Icon"]')

      expect(energyIcon).toBeTruthy()
      expect(logo).toBeTruthy()
      expect(helpIcon).toBeTruthy()
    })
    it('renders navigation when withNav is true and token is valid', () => {
      renderHeader({ withNav: true })

      const inboxIcon = document.querySelector('img[alt="inbox_workflow Icon"]')
      const logoutIcon = document.querySelector('img[alt="Logout"]')

      expect(inboxIcon).toBeTruthy()
      expect(logoutIcon).toBeTruthy()
    })
    it('hides navigation when token is invalid', () => {
      useAtomValue.mockImplementation((atom) => {
        if (atom === TokenAtom) {
          return { isValid: false }
        }
        if (atom === AppAtom) return { caseData: [] }
        if (atom === userWorkflowCountAtom) return 0
        return null
      })

      renderHeader({ withNav: true })

      const inboxIcon = document.querySelector('img[alt="inbox_workflow Icon"]')
      const logoutIcon = document.querySelector('img[alt="Logout"]')

      expect(inboxIcon).toBeFalsy()
      expect(logoutIcon).toBeFalsy()
    })
    it('hides navigation when withNav is false', () => {
      renderHeader({ withNav: false })

      const inboxIcon = document.querySelector('img[alt="inbox_workflow Icon"]')
      const logoutIcon = document.querySelector('img[alt="Logout"]')

      expect(inboxIcon).toBeFalsy()
      expect(logoutIcon).toBeFalsy()
    })
  })

  describe('Logo Handling', () => {
    it('displays default sabic logo', () => {
      useParams.mockReturnValue({})
      renderHeader()

      const logo = document.querySelector('img[alt="logo"]')
      expect(logo).toBeTruthy()
      expect(logo.src).toContain('sabicIcon.svg')
    })
    it('displays affiliate logo when params are present', () => {
      useParams.mockReturnValue({ region: 'test', affiliate: 'testaffiliate' })
      slugToText.mockReturnValue('testaffiliate')

      renderHeader()

      const logo = document.querySelector('img[alt="logo"]')
      expect(logo).toBeTruthy()
    })
    it('uses default logo when affiliate not found', () => {
      useParams.mockReturnValue({ region: 'test', affiliate: 'unknown' })
      slugToText.mockReturnValue('unknown')

      renderHeader()

      const logo = document.querySelector('img[alt="logo"]')
      expect(logo).toBeTruthy()
      expect(logo.src).toContain('sabicIcon.svg')
    })
  })

  describe('Role-based Features', () => {
    it('shows admin icon for ADMIN users', () => {
      useAtomValue.mockImplementation((atom) => {
        if (atom === TokenAtom) {
          return {
            isValid: true,
            access: { role: 'ADMIN' },
            decodedToken: { uid: '123' },
          }
        }
        if (atom === AppAtom) return { caseData: [] }
        if (atom === userWorkflowCountAtom) return 0
        return null
      })
      renderHeader()

      const adminIcon = document.querySelector('img[alt="userManagement Icon"]')
      expect(adminIcon).toBeTruthy()
    })
    it('shows admin icon for workflow admins', () => {
      useAtomValue.mockImplementation((atom) => {
        if (atom === TokenAtom) {
          return {
            isValid: true,
            access: { role: 'CORPORATE', workflowRoleApi: '1' },
            decodedToken: { uid: '123' },
          }
        }
        if (atom === AppAtom) return { caseData: [] }
        if (atom === userWorkflowCountAtom) return 0
        return null
      })
      renderHeader()

      const adminIcon = document.querySelector('img[alt="userManagement Icon"]')
      expect(adminIcon).toBeTruthy()
    })
    it('hides admin icon for regular users', () => {
      useAtomValue.mockImplementation((atom) => {
        if (atom === TokenAtom) {
          return {
            isValid: true,
            access: { role: 'USER', workflowRoleApi: '0' },
            decodedToken: { uid: '123' },
          }
        }
        if (atom === AppAtom) return { caseData: [] }
        if (atom === userWorkflowCountAtom) return 0
        return null
      })
      renderHeader()

      const adminIcon = document.querySelector('img[alt="userManagement Icon"]')
      expect(adminIcon).toBeFalsy()
    })
  })

  describe('Workflow Inbox', () => {
    it('shows workflow count badge', () => {
      useAtomValue.mockImplementation((atom) => {
        if (atom === userWorkflowCountAtom) return 3
        if (atom === TokenAtom)
          return {
            isValid: true,
            access: { role: 'USER' },
            decodedToken: { uid: '123' },
          }
        if (atom === AppAtom) return { caseData: [] }
        return null
      })

      renderHeader()

      // Check if workflow count element exists
      const workflowCountElement = document.querySelector(
        '[class*="workflowCount"]',
      )
      expect(workflowCountElement).toBeTruthy()
      expect(workflowCountElement.textContent).toBe('3')
    })
    it('hides workflow count when zero', () => {
      useAtomValue.mockImplementation((atom) => {
        if (atom === userWorkflowCountAtom) return 0
        if (atom === TokenAtom)
          return {
            isValid: true,
            access: { role: 'USER' },
            decodedToken: { uid: '123' },
          }
        if (atom === AppAtom) return { caseData: [] }
        return null
      })

      renderHeader()

      // Check that no workflow count element is present
      const workflowCountElement = document.querySelector(
        '[class*="workflowCount"]',
      )
      expect(workflowCountElement).toBeFalsy()
    })
    it('shows back arrow on inbox workflow detail pages', () => {
      useLocation.mockReturnValue({ pathname: '/inbox_workflow/123' })
      renderHeader()
      const backArrow = document.querySelector('img[alt="inbox_workflow Icon"]')
      expect(backArrow).toBeTruthy()
    })
  })

  describe('Navigation', () => {
    it('navigates back when back arrow clicked', () => {
      const mockNavigate = vi.fn()
      useNavigate.mockReturnValue(mockNavigate)
      useLocation.mockReturnValue({ pathname: '/inbox_workflow/123' })

      renderHeader()
      fireEvent.click(screen.getByAltText('inbox_workflow Icon'))
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })
    it('tracks back button click', () => {
      useLocation.mockReturnValue({ pathname: '/inbox_workflow/123' })
      renderHeader()
      fireEvent.click(screen.getByAltText('inbox_workflow Icon'))
      expect(TRACKEVENTOBJ.header.backOnClick).toHaveBeenCalled()
    })
  })
  describe('Help Feature', () => {
    // it('opens help link in new tab', () => {
    //   renderHeader();
    //   const helpLink = screen.getByAltText('Help Icon').closest('a');
    //   expect(helpLink).toHaveAttribute('href', 'https://help.test.com');
    //   expect(helpLink).toHaveAttribute('target', '_blank');
    // });
    it('tracks help button click', () => {
      renderHeader()
      fireEvent.click(screen.getByAltText('Help Icon'))
      expect(TRACKEVENTOBJ.header.helpOnClick).toHaveBeenCalled()
    })
  })
  describe('Logout', () => {
    it('shows confirmation dialog', () => {
      renderHeader()
      fireEvent.click(screen.getByAltText('Logout'))
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to logout?',
      )
    })
    it('completes logout when confirmed', async () => {
      const mockNavigate = vi.fn()
      useNavigate.mockReturnValue(mockNavigate)

      renderHeader()
      fireEvent.click(screen.getByAltText('Logout'))
      await waitFor(() => {
        expect(logout).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith('/logout')
      })
    })
    it('cancels logout when not confirmed', () => {
      window.confirm.mockReturnValue(false)
      renderHeader()

      fireEvent.click(screen.getByAltText('Logout'))
      expect(logout).not.toHaveBeenCalled()
    })
    it('tracks logout attempt', () => {
      renderHeader()
      fireEvent.click(screen.getByAltText('Logout'))
      expect(TRACKEVENTOBJ.header.logoutOnClick).toHaveBeenCalled()
    })
  })

  describe('Admin Features - User Online Statistics', () => {
    beforeEach(() => {
      useAtomValue.mockImplementation((atom) => {
        if (atom === TokenAtom) {
          return {
            isValid: true,
            access: { role: 'ADMIN' },
            decodedToken: { uid: '123' },
            isAdminUser: true,
          }
        }
        if (atom === AppAtom) return { caseData: [] }
        if (atom === userWorkflowCountAtom) return 0
        return null
      })
    })
    it('shows users online count on statistics page', async () => {
      useLocation.mockReturnValue({
        pathname: '/activity-tracker/UserStatistics',
      })
      getUserStatisticsOnlineUser.mockResolvedValue({
        statuscode: 200,
        data: [
          {
            employeeID: '123',
            employeeName: 'Test User',
            lastAccessedTimeEpoch: 1672531200000,
            screenName: 'Dashboard',
          },
        ],
      })
      const { container } = renderHeader()
      await waitFor(() => {
        // Look for any span that contains "Users Online" text
        const spans = container.querySelectorAll('span')
        const usersOnlineSpan = Array.from(spans).find(
          (span) =>
            span.textContent && span.textContent.includes('Users Online'),
        )
        expect(usersOnlineSpan).toBeTruthy()
        expect(usersOnlineSpan.textContent).toContain('Users Online : 0')
      })
    })
    it('opens users online modal', async () => {
      useLocation.mockReturnValue({
        pathname: '/activity-tracker/UserStatistics',
      })
      getUserStatisticsOnlineUser.mockResolvedValue({
        statuscode: 200,
        data: [
          {
            employeeID: '123',
            employeeName: 'Test User',
            lastAccessedTimeEpoch: 1672531200000,
            screenName: 'Dashboard',
          },
        ],
      })
      const { container } = renderHeader()
      await waitFor(() => {
        // Find the span by text content
        const spans = container.querySelectorAll('span')
        const usersOnlineSpan = Array.from(spans).find(
          (span) =>
            span.textContent && span.textContent.includes('Users Online'),
        )
        expect(usersOnlineSpan).toBeTruthy()

        // Click the users online text
        fireEvent.click(usersOnlineSpan)
      })
      const modal = document.querySelector('[data-testid="custom-modal"]')
    })
    it('handles empty online users', async () => {
      useLocation.mockReturnValue({
        pathname: '/activity-tracker/UserStatistics',
      })
      getUserStatisticsOnlineUser.mockResolvedValue({
        statuscode: 200,
        data: [],
      })
      const { container } = renderHeader()
      await waitFor(() => {
        // Find the span by text content
        const spans = container.querySelectorAll('span')
        const usersOnlineSpan = Array.from(spans).find(
          (span) =>
            span.textContent && span.textContent.includes('Users Online'),
        )
        expect(usersOnlineSpan).toBeTruthy()
        expect(usersOnlineSpan.textContent).toContain('0')
      })
    })
    it('handles API errors for online users', async () => {
      useLocation.mockReturnValue({
        pathname: '/activity-tracker/UserStatistics',
      })
      getUserStatisticsOnlineUser.mockRejectedValue(new Error('API Error'))
      const { container } = renderHeader()
      await waitFor(() => {
        // Find the span by text content
        const spans = container.querySelectorAll('span')
        const usersOnlineSpan = Array.from(spans).find(
          (span) =>
            span.textContent && span.textContent.includes('Users Online'),
        )
        expect(usersOnlineSpan).toBeTruthy()
        expect(usersOnlineSpan.textContent).toContain('0')
      })

      // expect(error).toHaveBeenCalledWith('Error fetching users online data:', expect.any(Error));
    })
    it('does not show users online for non-admin users', () => {
      useAtomValue.mockImplementation((atom) => {
        if (atom === TokenAtom) {
          return {
            isValid: true,
            access: { role: 'USER' },
            decodedToken: { uid: '123' },
            isAdminUser: false,
          }
        }
        if (atom === AppAtom) return { caseData: [] }
        if (atom === userWorkflowCountAtom) return 0
        return null
      })

      useLocation.mockReturnValue({
        pathname: '/activity-tracker/UserStatistics',
      })

      const { container } = renderHeader()

      // Check that no "Users Online" text is present
      const spans = container.querySelectorAll('span')
      const usersOnlineSpan = Array.from(spans).find(
        (span) => span.textContent && span.textContent.includes('Users Online'),
      )
      expect(usersOnlineSpan).toBeFalsy()
    })
    it('does not show users online on non-UserStatistics pages', () => {
      useLocation.mockReturnValue({ pathname: '/dashboard' })

      const { container } = renderHeader()

      // Check that no "Users Online" text is present
      const spans = container.querySelectorAll('span')
      const usersOnlineSpan = Array.from(spans).find(
        (span) => span.textContent && span.textContent.includes('Users Online'),
      )
      expect(usersOnlineSpan).toBeFalsy()
    })
  })
})
describe('generateUserName', () => {
  it('formats different first and last names', () => {
    expect(generateUserName({ firstName: 'John', lastName: 'Doe' })).toBe(
      'Doe, John',
    )
  })
  it('returns single name when first and last are same', () => {
    expect(generateUserName({ firstName: 'John', lastName: 'John' })).toBe(
      'John',
    )
  })
  it('returns employeeName when no first/last names', () => {
    expect(generateUserName({ employeeName: 'Test Employee' })).toBe(
      'Test Employee',
    )
  })
  it('returns undefined for invalid input', () => {
    expect(generateUserName(null)).toBeUndefined()
    expect(generateUserName(undefined)).toBeUndefined()
    expect(generateUserName({})).toBeUndefined()
  })
})
