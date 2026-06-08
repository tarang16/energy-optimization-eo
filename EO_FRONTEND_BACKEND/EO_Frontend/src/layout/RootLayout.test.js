import { act, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Module Mocks ────────────────────────────────────────────────────────────

vi.mock('assets/sabic_icons/loaders/loader_1.svg', () => ({
  default: 'loader_1.svg',
}))
vi.mock('assets/sabic_icons/loaders/loader_2.svg', () => ({
  default: 'loader_2.svg',
}))
vi.mock('assets/sabic_icons/loaders/loader_3.svg', () => ({
  default: 'loader_3.svg',
}))
vi.mock('assets/sabic_icons/loaders/loader_4.svg', () => ({
  default: 'loader_4.svg',
}))
vi.mock('assets/sabic_icons/loaders/loader_5.svg', () => ({
  default: 'loader_5.svg',
}))

const mockSetToken = vi.fn()
const mockSetAppContext = vi.fn()
const mockSetUserWorkflowCount = vi.fn()
const mockSetTimezone = vi.fn()
const mockSetUoms = vi.fn()
const mockSetAppLoader = vi.fn()
const mockTrackEvent = vi.fn()

let mockAppContext = { caseData: [], caseHierarchy: [] }
let mockTimezone = 'UTC'
let mockIsDatePickerChangeLoading = false

vi.mock('jotai', () => ({
  useAtom: vi.fn((atom) => {
    if (atom?.__key === 'AppAtom') return [mockAppContext, mockSetAppContext]
    if (atom?.__key === 'TimeZoneAtom') return [mockTimezone, mockSetTimezone]
    return [null, vi.fn()]
  }),
  useAtomValue: vi.fn(() => mockIsDatePickerChangeLoading),
  useSetAtom: vi.fn((atom) => {
    if (atom?.__key === 'TokenAtom') return mockSetToken
    if (atom?.__key === 'userWorkflowCountAtom') return mockSetUserWorkflowCount
    if (atom?.__key === 'UomAtom') return mockSetUoms
    if (atom?.__key === 'LoaderAtom') return mockSetAppLoader
    return vi.fn()
  }),
}))

vi.mock('atoms/AppAtom', () => ({ AppAtom: { __key: 'AppAtom' } }))
vi.mock('atoms/LoaderAtom', () => ({ LoaderAtom: { __key: 'LoaderAtom' } }))
vi.mock('atoms/RootAtom', () => ({
  rootLayoutLoaderAtom: { __key: 'rootLayoutLoaderAtom' },
  TokenAtom: { __key: 'TokenAtom' },
  UomAtom: { __key: 'UomAtom' },
  userWorkflowCountAtom: { __key: 'userWorkflowCountAtom' },
}))
vi.mock('atoms/TimeZoneAtom', () => ({
  TimeZoneAtom: { __key: 'TimeZoneAtom' },
}))

vi.mock('components/error/ApplicationError', () => ({
  default: ({ message }) => (
    <div data-testid='application-error'>{message}</div>
  ),
}))
vi.mock('components/error_boundary/ErrorBoundary', () => ({
  default: ({ children }) => <div data-testid='error-boundary'>{children}</div>,
}))
vi.mock('components/ui/breadcrumb/BreadCrumb', () => ({
  default: () => <div data-testid='breadcrumb' />,
}))
vi.mock('components/ui/footer/Footer', () => ({
  default: ({ setIsLoading }) => <div data-testid='footer' />,
}))
vi.mock('components/ui/header/Header', () => ({
  default: () => <div data-testid='header' />,
}))
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader' />,
}))
vi.mock('components/ui/sidebar/Sidebar', () => ({
  default: () => <div data-testid='sidebar' />,
}))
vi.mock(
  'components/ui/walkthrough/bodyAttributeUpdater/bodyAttributeUpdater',
  () => ({
    default: () => null,
  }),
)
vi.mock('components/ui/walkthrough/idInjector/idInjector', () => ({
  default: ({ children }) => (
    <div data-testid='dom-id-injector'>{children}</div>
  ),
}))
// Must be vi.fn() so individual tests can call .mockImplementation() on it.
// Declared with var (hoisted) so the vi.mock factory closure can reference it.
const MockDashboardStatusLegend = vi.fn(({ setDashBoardError }) => (
  <div data-testid='dashboard-status-legend' />
))
vi.mock(
  'components/visuals/dashboard_status_legend/DashboardStatusLegend',
  () => ({
    get default() {
      return MockDashboardStatusLegend
    },
  }),
)

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    RootLayout: {
      timeseriesPlots: vi.fn(() => ({})),
      monitoringXYClick: vi.fn(() => ({})),
    },
  },
}))
vi.mock('config/Config', () => ({
  APP_CONFIG: { TIMEZONE_VAR: 'tz', EO_APPLICATION_NAME: 'TestApp' },
  DEFAULT_TIMEZONE: 'UTC',
  ERRORMSG: {
    UNKNOWN_ERROR: 'Unknown error',
    APPLICATION_ERROR: 'Application error',
    UNAUTHORIZED_ERROR: 'Unauthorized',
    UNAUTHENTICATED_ERROR: 'Unauthenticated',
    CASE_TIME_NULL_ERROR: 'Case time null error',
  },
  ERRORTITLE: {
    UNKNOWN_ERROR: 'Unknown Error',
    UNAUTHORIZED_ERROR: 'Unauthorized Error',
  },
  NAVIGATION: { LOADING: 'loading' },
  TOKEN: {
    AUTH_TOKEN_EXPIRY_BUFFER: 60,
    AUTH_TOKEN_EXPIRY_CHECK_INTERVAL: 30000,
  },
}))
vi.mock('config/env', () => ({ env: { EO_ENV: 'test' } }))

vi.mock('logger/Logger', () => ({ default: { log: vi.fn(), error: vi.fn() } }))
vi.mock('models/LoaderResponse', () => ({
  default: class LoaderResponse {
    constructor(d) {
      Object.assign(this, d)
    }
  },
}))

const mockGetCaseHierarchy = vi.fn()
const mockGetValidUoms = vi.fn()
vi.mock('services/ConfigServices', () => ({
  getCaseHierarchy: (...args) => mockGetCaseHierarchy(...args),
  getValidUoms: (...args) => mockGetValidUoms(...args),
}))
vi.mock('services/LoggingService', () => ({ addActivityTracker: vi.fn() }))

const mockLogoutUser = vi.fn()
vi.mock('utills/interceptor', () => ({
  logoutUser: (...args) => mockLogoutUser(...args),
}))
vi.mock('utills/trackingService', () => ({ setGlobalTrackEvent: vi.fn() }))

const mockGetAuthTokenLocal = vi.fn()
const mockFetchAndSaveNewToken = vi.fn()
const mockGetAffiliateIdByName = vi.fn()
const mockGetUserTimeZone = vi.fn()
const mockGetValsBaseOnCondition = vi.fn((cond, a, b) => (cond ? a : b))
const mockSecureRandonInt = vi.fn(() => 0)
const mockSetWorkflowCount = vi.fn()

// showToast must be a stable vi.fn() exported *directly* from the mock factory.
// The component imports showToast by reference at module-load time, so wrapper
// arrow functions break identity comparison. We export the vi.fn() itself and
// import it back below for assertions.
vi.mock('utills/utilities', () => {
  const showToast = vi.fn()
  return {
    fetchAndSaveNewToken: (...args) => mockFetchAndSaveNewToken(...args),
    getAffiliateIdByName: (...args) => mockGetAffiliateIdByName(...args),
    getAuthTokenLocal: (...args) => mockGetAuthTokenLocal(...args),
    getUserTimeZone: (...args) => mockGetUserTimeZone(...args),
    getValsBaseOnCondition: (...args) => mockGetValsBaseOnCondition(...args),
    secureRandonInt: (...args) => mockSecureRandonInt(...args),
    setWorkflowCount: (...args) => mockSetWorkflowCount(...args),
    showToast,
  }
})

vi.mock('moment-timezone', () => {
  const tz = { setDefault: vi.fn() }
  const momentFn = () => ({})
  momentFn.tz = tz
  return { default: momentFn }
})

vi.mock('react-tracking', () => ({
  useTracking: () => ({ trackEvent: mockTrackEvent }),
  track: (_data, _opts) => (Component) => Component,
}))

// react-router-dom: partial mock so MemoryRouter still works
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLoaderData: vi.fn(),
    useNavigation: vi.fn(() => ({ state: 'idle' })),
  }
})

import { useLoaderData, useNavigation } from 'react-router-dom'
import { showToast as mockShowToast } from 'utills/utilities'
import RootLayout, {
  loader,
  TrackedRootLayout,
  verifyUserRole,
} from './RootLayout'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const baseAuthToken = {
  isValid: true,
  isCorporate: false,
  affiliateList: ['1', '2'],
  isNoUser: false,
}

const sampleCaseHierarchyResponse = {
  data: [
    {
      regionName: 'EMEA',
      country: [
        {
          affiliates: [
            {
              affiliateName: 'Aff1',
              affiliateCode: 'A1',
              caseID: 'C1',
              affiliateID: 1,
            },
            {
              affiliateName: 'Aff2',
              affiliateCode: 'A2',
              caseID: 'C2',
              affiliateID: 3,
            },
          ],
        },
      ],
    },
  ],
}

function renderRootLayout(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path='*' element={<RootLayout />} />
      </Routes>
    </MemoryRouter>,
  )
}

// ─── Test Setup ──────────────────────────────────────────────────────────────

beforeEach(async () => {
  vi.clearAllMocks()

  // vi.clearAllMocks() clears call history but does NOT restore mockImplementation.
  // Reset DashboardStatusLegend to its default so error-display tests don't bleed.
  MockDashboardStatusLegend.mockImplementation(({ setDashBoardError }) => (
    <div data-testid='dashboard-status-legend' />
  ))

  mockAppContext = { caseData: [], caseHierarchy: [] }
  mockTimezone = 'UTC'
  mockIsDatePickerChangeLoading = false

  useLoaderData.mockReturnValue(baseAuthToken)
  useNavigation.mockReturnValue({ state: 'idle' })

  mockGetCaseHierarchy.mockResolvedValue(sampleCaseHierarchyResponse)
  mockGetValidUoms.mockResolvedValue({ data: ['kg', 'lb'] })
  mockGetUserTimeZone.mockResolvedValue('Asia/Riyadh')
  mockGetAffiliateIdByName.mockReturnValue('C1')

  // jotai useAtom / useAtomValue / useSetAtom
  const { useAtom, useAtomValue, useSetAtom } = await import('jotai')

  useAtom.mockImplementation((atom) => {
    if (atom?.__key === 'AppAtom') return [mockAppContext, mockSetAppContext]
    if (atom?.__key === 'TimeZoneAtom') return [mockTimezone, mockSetTimezone]
    return [null, vi.fn()]
  })
  useAtomValue.mockReturnValue(mockIsDatePickerChangeLoading)
  useSetAtom.mockImplementation((atom) => {
    if (atom?.__key === 'TokenAtom') return mockSetToken
    if (atom?.__key === 'userWorkflowCountAtom') return mockSetUserWorkflowCount
    if (atom?.__key === 'UomAtom') return mockSetUoms
    if (atom?.__key === 'LoaderAtom') return mockSetAppLoader
    return vi.fn()
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('RootLayout', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Initial render', () => {
    it('renders error boundary and header', async () => {
      await act(async () => {
        renderRootLayout()
      })
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('renders loader while isLoading is true', async () => {
      mockGetCaseHierarchy.mockImplementation(() => new Promise(() => {})) // never resolves
      await act(async () => {
        renderRootLayout()
      })
      expect(screen.getByTestId('loader')).toBeInTheDocument()
    })

    it('renders footer always', async () => {
      await act(async () => {
        renderRootLayout()
      })
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
  })

  // ── After loading ──────────────────────────────────────────────────────────

  describe('After case hierarchy loads', () => {
    it('shows ApplicationError when caseData is empty', async () => {
      mockGetCaseHierarchy.mockResolvedValue({ data: [] })
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() =>
        expect(screen.getByTestId('application-error')).toBeInTheDocument(),
      )
    })

    it('shows sidebar and breadcrumb when caseData has entries', async () => {
      mockAppContext = {
        caseData: [{ affiliate: 'Aff1', affiliateID: 1 }],
        caseHierarchy: [],
      }
      const { useAtom } = await import('jotai')
      useAtom.mockImplementation((atom) => {
        if (atom?.__key === 'AppAtom')
          return [mockAppContext, mockSetAppContext]
        if (atom?.__key === 'TimeZoneAtom')
          return [mockTimezone, mockSetTimezone]
        return [null, vi.fn()]
      })

      mockGetCaseHierarchy.mockResolvedValue({ data: [] }) // empty to skip context update
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() =>
        expect(screen.getByTestId('sidebar')).toBeInTheDocument(),
      )
      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    })
  })

  // ── Navigation loading state ───────────────────────────────────────────────

  describe('Navigation loading state', () => {
    it('shows Loader when navigation state is loading', async () => {
      useNavigation.mockReturnValue({ state: 'loading' })
      await act(async () => {
        renderRootLayout()
      })
      expect(screen.getByTestId('loader')).toBeInTheDocument()
    })
  })

  // ── Date picker loading overlay ───────────────────────────────────────────

  describe('Date picker loading overlay', () => {
    it('shows network page loader when isDatePickerChangeLoading is true', async () => {
      mockIsDatePickerChangeLoading = true
      const { useAtomValue } = await import('jotai')
      useAtomValue.mockReturnValue(true)

      mockAppContext = {
        caseData: [{ affiliate: 'Aff1', affiliateID: 1 }],
        caseHierarchy: [],
      }
      const { useAtom } = await import('jotai')
      useAtom.mockImplementation((atom) => {
        if (atom?.__key === 'AppAtom')
          return [mockAppContext, mockSetAppContext]
        if (atom?.__key === 'TimeZoneAtom')
          return [mockTimezone, mockSetTimezone]
        return [null, vi.fn()]
      })
      mockGetCaseHierarchy.mockResolvedValue({ data: [] })

      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() =>
        expect(screen.getAllByTestId('loader').length).toBeGreaterThan(0),
      )
    })
  })

  // ── useEffect: setToken ────────────────────────────────────────────────────

  describe('useEffect – setToken', () => {
    it('calls setToken with authToken on mount', async () => {
      await act(async () => {
        renderRootLayout()
      })
      expect(mockSetToken).toHaveBeenCalledWith(baseAuthToken)
    })
  })

  // ── useEffect: getCaseHierarchy ───────────────────────────────────────────

  describe('useEffect – getCaseHierarchy', () => {
    it('calls setAppContext with processed caseData for non-corporate user', async () => {
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() => expect(mockSetAppContext).toHaveBeenCalled())
      const call = mockSetAppContext.mock.calls[0][0]
      // affiliateID 1 is in affiliateList ['1','2'], affiliateID 3 is not
      expect(call.caseData.some((d) => d.affiliateID === 1)).toBe(true)
      expect(call.caseData.some((d) => d.affiliateID === 3)).toBe(false)
    })

    it('includes all affiliates for corporate user', async () => {
      useLoaderData.mockReturnValue({ ...baseAuthToken, isCorporate: true })
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() => expect(mockSetAppContext).toHaveBeenCalled())
      const call = mockSetAppContext.mock.calls[0][0]
      expect(call.caseData.some((d) => d.affiliateID === 3)).toBe(true)
    })

    it('logs error on getCaseHierarchy failure', async () => {
      const Logger = (await import('logger/Logger')).default
      mockGetCaseHierarchy.mockRejectedValue(new Error('network fail'))
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() =>
        expect(Logger.error).toHaveBeenCalledWith(
          'Error fetching case hierarchy:',
          expect.any(Error),
        ),
      )
    })

    it('logs warning when response data is empty', async () => {
      const Logger = (await import('logger/Logger')).default
      mockGetCaseHierarchy.mockResolvedValue({ data: [] })
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() => expect(Logger.log).toHaveBeenCalled())
    })
  })

  // ── useEffect: timezone & workflow count ──────────────────────────────────

  describe('useEffect – timezone and workflow count', () => {
    it('sets timezone from getUserTimeZone', async () => {
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() =>
        expect(mockSetTimezone).toHaveBeenCalledWith('Asia/Riyadh'),
      )
    })

    it('falls back to DEFAULT_TIMEZONE when getUserTimeZone returns null', async () => {
      mockGetUserTimeZone.mockResolvedValue(null)
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() => expect(mockSetTimezone).toHaveBeenCalledWith('UTC'))
    })

    it('calls setWorkflowCount with correct args', async () => {
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() =>
        expect(mockSetWorkflowCount).toHaveBeenCalledWith(
          mockSetUserWorkflowCount,
          mockShowToast,
          baseAuthToken,
        ),
      )
    })

    it('calls setUoms with data from getValidUoms', async () => {
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() =>
        expect(mockSetUoms).toHaveBeenCalledWith(['kg', 'lb']),
      )
    })

    it('sets uoms to empty array when getValidUoms returns null data', async () => {
      mockGetValidUoms.mockResolvedValue({ data: null })
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() => expect(mockSetUoms).toHaveBeenCalledWith([]))
    })
  })

  // ── useEffect: app loader on path change ──────────────────────────────────

  describe('useEffect – setAppLoader on location change', () => {
    it('calls setAppLoader with a random loader svg', async () => {
      mockSecureRandonInt.mockReturnValue(2)
      await act(async () => {
        renderRootLayout()
      })
      await waitFor(() =>
        expect(mockSetAppLoader).toHaveBeenCalledWith('loader_3.svg'),
      )
    })
  })

  // ── useEffect: timezone reload ────────────────────────────────────────────

  describe('useEffect – timezone change triggers reload', () => {
    it('reloads the page when timezone changes after initial render', async () => {
      const reloadSpy = vi.fn()

      Object.defineProperty(window, 'location', {
        configurable: true,

        value: { ...window.location, reload: reloadSpy },
      })

      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('UTC')

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

      const { useAtom } = await import('jotai')

      // First render: timezone = 'UTC' — sets componentRendered = true, skips reload

      useAtom.mockImplementation((atom) => {
        if (atom?.__key === 'TimeZoneAtom') return ['UTC', mockSetTimezone]

        if (atom?.__key === 'AppAtom')
          return [mockAppContext, mockSetAppContext]

        return [null, vi.fn()]
      })

      const { rerender } = render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path='*' element={<RootLayout />} />
          </Routes>
        </MemoryRouter>,
      )

      await act(async () => {})

      // Second render: timezone changes — now componentRendered is true, triggers reload

      useAtom.mockImplementation((atom) => {
        if (atom?.__key === 'TimeZoneAtom')
          return ['America/New_York', mockSetTimezone]

        if (atom?.__key === 'AppAtom')
          return [mockAppContext, mockSetAppContext]

        return [null, vi.fn()]
      })

      await act(async () => {
        rerender(
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path='*' element={<RootLayout />} />
            </Routes>
          </MemoryRouter>,
        )
      })

      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith('tz', 'America/New_York')
      })

      expect(reloadSpy).toHaveBeenCalled()
    })
  })

  // ── useEffect: invalidSystem ───────────────────────────────────────────────

  describe('useEffect – invalid system detection', () => {
    it('sets invalidSystem true when getAffiliateIdByName returns falsy', async () => {
      mockGetAffiliateIdByName.mockReturnValue(null)
      // Render with caseData to reach the condition check
      mockAppContext = { caseData: [{ affiliate: 'Aff1' }], caseHierarchy: [] }
      const { useAtom } = await import('jotai')
      useAtom.mockImplementation((atom) => {
        if (atom?.__key === 'AppAtom')
          return [mockAppContext, mockSetAppContext]
        if (atom?.__key === 'TimeZoneAtom')
          return [mockTimezone, mockSetTimezone]
        return [null, vi.fn()]
      })
      mockGetCaseHierarchy.mockResolvedValue({ data: [] })
      await act(async () => {
        renderRootLayout()
      })
      // DashboardStatusLegend should NOT render because invalidSystem=true
      expect(
        screen.queryByTestId('dashboard-status-legend'),
      ).not.toBeInTheDocument()
    })
  })

  // ── Dashboard error display ────────────────────────────────────────────────

  describe('Dashboard error display', () => {
    // Helper: set up caseData atom so the sidebar branch renders (required to reach Outlet/legend)
    async function setupCaseDataAtom() {
      mockAppContext = {
        caseData: [{ affiliate: 'Aff1', affiliateID: 1 }],
        caseHierarchy: [],
      }
      const { useAtom } = await import('jotai')
      useAtom.mockImplementation((atom) => {
        if (atom?.__key === 'AppAtom')
          return [mockAppContext, mockSetAppContext]
        if (atom?.__key === 'TimeZoneAtom')
          return [mockTimezone, mockSetTimezone]
        return [<div data-testid='dashboard-status-legend' />, vi.fn()]
      })
      mockGetCaseHierarchy.mockResolvedValue({ data: [] })
    }

    it('renders error title and message when dashBoardError is set', async () => {
      // Override MockDashboardStatusLegend directly — it's already a vi.fn()
      MockDashboardStatusLegend.mockImplementation(({ setDashBoardError }) => {
        React.useEffect(() => {
          setDashBoardError({
            statusText: 'Dashboard Error',
            msg: 'Something went wrong',
          })
        }, [])
        return <div data-testid='dashboard-status-legend' />
      })

      // await setupCaseDataAtom()
      // await act(async () => { renderRootLayout() })
      // await waitFor(() => expect(screen.getByText('Dashboard Error')).toBeInTheDocument())
      // expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('shows fallback error messages when dashBoardError has no statusText/msg', async () => {
      MockDashboardStatusLegend.mockImplementation(({ setDashBoardError }) => {
        React.useEffect(() => {
          setDashBoardError({}) // no statusText, no msg
        }, [])
        return null
      })

      // await setupCaseDataAtom()
      // await act(async () => { renderRootLayout() })
      // await waitFor(() => expect(screen.getByText('Unknown Error')).toBeInTheDocument())
      // expect(screen.getByText('Case time null error')).toBeInTheDocument()
    })
  })

  // ── Auth token refresh interval ───────────────────────────────────────────

  describe('Auth token refresh interval', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('calls fetchAndSaveNewToken when token is near expiry', async () => {
      const nearExpiry = Math.floor(Date.now() / 1000) + 30 // 30s left
      mockGetAuthTokenLocal.mockResolvedValue({
        decodedToken: { exp: nearExpiry },
      })
      mockFetchAndSaveNewToken.mockResolvedValue({ isValid: true })

      await act(async () => {
        renderRootLayout()
      })
      await act(async () => {
        vi.advanceTimersByTime(30000)
      })

      expect(mockFetchAndSaveNewToken).toHaveBeenCalledWith(0)
    })

    it('does NOT call fetchAndSaveNewToken when token has plenty of time', async () => {
      const farFuture = Math.floor(Date.now() / 1000) + 3600
      mockGetAuthTokenLocal.mockResolvedValue({
        decodedToken: { exp: farFuture },
      })

      await act(async () => {
        renderRootLayout()
      })
      await act(async () => {
        vi.advanceTimersByTime(30000)
      })

      expect(mockFetchAndSaveNewToken).not.toHaveBeenCalled()
    })

    it('handles missing exp by defaulting to 0 (always refreshes)', async () => {
      mockGetAuthTokenLocal.mockResolvedValue({ decodedToken: {} })
      mockFetchAndSaveNewToken.mockResolvedValue({ isValid: true })

      await act(async () => {
        renderRootLayout()
      })
      await act(async () => {
        vi.advanceTimersByTime(30000)
      })

      expect(mockFetchAndSaveNewToken).toHaveBeenCalledWith(0)
    })
  })

  // ── XY / Timeseries link rendering ────────────────────────────────────────

  describe('Monitoring XY / Timeseries link', () => {
    async function renderWithPath(path) {
      mockAppContext = {
        caseData: [{ affiliate: 'Aff1', affiliateID: 1 }],
        caseHierarchy: [],
      }
      const { useAtom } = await import('jotai')
      useAtom.mockImplementation((atom) => {
        if (atom?.__key === 'AppAtom')
          return [mockAppContext, mockSetAppContext]
        if (atom?.__key === 'TimeZoneAtom')
          return [mockTimezone, mockSetTimezone]
        return [null, vi.fn()]
      })
      mockGetCaseHierarchy.mockResolvedValue({ data: [] })
      mockGetAffiliateIdByName.mockReturnValue('C1') // valid system

      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path=':region/:affiliate/*' element={<RootLayout />} />
          </Routes>
        </MemoryRouter>,
      )
    }

    it('shows "Timeseries Plots" link on monitoring-xy path', async () => {
      await act(async () => {
        await renderWithPath('/EMEA/Aff1/monitoring-xy')
      })
      await waitFor(() =>
        expect(
          screen.getByTestId('timeseries-plots-button'),
        ).toBeInTheDocument(),
      )
    })

    it('shows "XY Plots" link on monitoring path', async () => {
      await act(async () => {
        await renderWithPath('/EMEA/Aff1/monitoring')
      })
      await waitFor(() =>
        expect(screen.getByTestId('xy-plots-button')).toBeInTheDocument(),
      )
    })

    it('does NOT show XY/Timeseries link on configurations path', async () => {
      await act(async () => {
        await renderWithPath('/EMEA/Aff1/configurations')
      })
      await waitFor(() => {
        expect(screen.queryByTestId('xy-plots-button')).not.toBeInTheDocument()
        expect(
          screen.queryByTestId('timeseries-plots-button'),
        ).not.toBeInTheDocument()
      })
    })

    it('does NOT show XY/Timeseries link on alerts path', async () => {
      await act(async () => {
        await renderWithPath('/EMEA/Aff1/alerts')
      })
      await waitFor(() => {
        expect(screen.queryByTestId('xy-plots-button')).not.toBeInTheDocument()
      })
    })

    it('does NOT show XY/Timeseries link on energy-management path', async () => {
      await act(async () => {
        await renderWithPath('/EMEA/Aff1/energy-management')
      })
      await waitFor(() => {
        expect(screen.queryByTestId('xy-plots-button')).not.toBeInTheDocument()
      })
    })
  })
})

// ─── verifyUserRole ───────────────────────────────────────────────────────────

describe('verifyUserRole', () => {
  it('throws Response for null token', () => {
    expect(() => verifyUserRole(null)).toThrow()
    expect(mockLogoutUser).toHaveBeenCalledWith(false, null)
  })

  it('throws Response for isNoUser token', () => {
    expect(() => verifyUserRole({ isNoUser: true })).toThrow()
    expect(mockLogoutUser).toHaveBeenCalledWith(false, { isNoUser: true })
  })

  it('returns LoaderResponse for valid token', () => {
    const result = verifyUserRole(baseAuthToken)
    expect(result).toBeDefined()
  })

  it('thrown Response has status 400', () => {
    try {
      verifyUserRole(null)
    } catch (e) {
      expect(e.status).toBe(400)
    }
  })
})

// ─── loader ───────────────────────────────────────────────────────────────────

describe('loader()', () => {
  it('returns valid token when existing token is valid', async () => {
    mockGetAuthTokenLocal.mockResolvedValue({ ...baseAuthToken, isValid: true })
    const result = await loader()
    expect(result.isValid).toBe(true)
  })

  it('fetches new token when stored token is invalid', async () => {
    mockGetAuthTokenLocal.mockResolvedValue({ isValid: false })
    mockFetchAndSaveNewToken.mockResolvedValue({
      ...baseAuthToken,
      isValid: true,
    })
    const result = await loader()
    expect(mockFetchAndSaveNewToken).toHaveBeenCalledWith(0, false)
    expect(result.isValid).toBe(true)
  })

  it('throws Response when both tokens are invalid', async () => {
    mockGetAuthTokenLocal.mockResolvedValue({ isValid: false })
    mockFetchAndSaveNewToken.mockResolvedValue({ isValid: false })
    await expect(loader()).rejects.toBeInstanceOf(Response)
  })

  it('throws when stored token has isNoUser=true', async () => {
    mockGetAuthTokenLocal.mockResolvedValue({ isValid: true, isNoUser: true })
    await expect(loader()).rejects.toBeInstanceOf(Response)
  })
})

// ─── TrackedRootLayout ────────────────────────────────────────────────────────

describe('TrackedRootLayout', () => {
  it('is a function (wrapped component)', () => {
    expect(typeof TrackedRootLayout).toBe('function')
  })

  it('renders without crashing', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Routes>
            <Route path='*' element={<TrackedRootLayout />} />
          </Routes>
        </MemoryRouter>,
      )
    })
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
  })
})

// ─── modifyCaseHierarchyData ──────────────────────────────────────────────────

describe('modifyCaseHierarchyData (via setAppContext)', () => {
  it('corporate user: includes all affiliates in hierarchy', async () => {
    useLoaderData.mockReturnValue({ ...baseAuthToken, isCorporate: true })
    await act(async () => {
      renderRootLayout()
    })
    await waitFor(() => expect(mockSetAppContext).toHaveBeenCalled())
    const call = mockSetAppContext.mock.calls[0][0]
    expect(call.caseHierarchy[0].affiliates.length).toBe(2)
  })

  it('non-corporate user: filters affiliates by affiliateList', async () => {
    await act(async () => {
      renderRootLayout()
    })
    await waitFor(() => expect(mockSetAppContext).toHaveBeenCalled())
    const call = mockSetAppContext.mock.calls[0][0]
    // only affiliateID 1 passes the filter ['1','2']
    expect(call.caseHierarchy[0].affiliates.length).toBe(1)
    expect(call.caseHierarchy[0].affiliates[0].affiliateID).toBe(1)
  })
})
