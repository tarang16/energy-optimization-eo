/// <reference types="vitest" />
// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Corporate, {
  fetchAndSaveAffiliateData,
  getMapVals,
  getValidAffiliateData,
  handleAffiliateUserNavigation,
  redirectToAffiliate,
} from './Corporate'

// ---------------- MOCK ASSETS ----------------
vi.mock('assets', () => ({}), { virtual: true })
// ---------------- MOCK SERVICES ----------------
const getLandingMock = vi.fn()
vi.mock('services/ConfigServices', () => ({
  get_landing_corporate: () => getLandingMock(),
}))
// ---------------- MOCK UTILS ----------------
vi.mock('utills/interceptor', () => ({
  logoutUser: vi.fn(),
}))
vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    digitDecimal: (v) => v,
    formatNumbers: (v) => v,
    textToSlug: (v) => v.toLowerCase().replace(/\s+/g, '-'),
  }
})
// ---------------- MOCK CONFIG ----------------
vi.mock(import('config/Config'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    APP_CONFIG: {
      AFFILIATE_DATA_VAR: 'AFF_DATA',
      CACHE_TIME_LIMIT: 100000,
    },
  }
})

// ---------------- MOCK LOGGER ----------------
vi.mock('logger/Logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))
// ---------------- MOCK JOTAI ----------------
vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    atom: vi.fn(),
    useAtomValue: () => ({
      caseData: [
        {
          affiliate_code: 'A1',
          affiliate: 'Plant1',
          region: 'Europe',
          regionName: 'Europe',
        },
      ],
    }),
  }
})
// ---------------- MOCK ROUTER ----------------
const navigateMock = vi.fn()
vi.mock('react-router-dom', () => ({
  NavLink: ({ children }) => <a>{children}</a>,
  useNavigate: () => navigateMock,
  useParams: () => ({}),
  useRouteLoaderData: () => ({
    decodedToken: { affiliate_code: 'A1' },
    isCorporate: true,
  }),
}))
// ---------------- MOCK CHILD COMPONENTS ----------------
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader' />,
}))
vi.mock('components/elements/performance_log/PerformanceLog', () => ({
  default: ({ children }) => <>{children}</>,
}))
vi.mock('components/ui/numbered_circle/NumberedCircle', () => ({
  default: ({ handleClick }) => (
    <button data-testid='number-circle' onClick={handleClick}>
      Circle
    </button>
  ),
}))
vi.mock(
  'components/visuals/common/landing_pages_top_kpi/LandingPagesTopKpi',
  () => ({
    default: () => <div data-testid='top-kpi' />,
  }),
)
// ---------------- SETUP ----------------
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})
// ================= PURE FUNCTION TESTS ================
describe('fetchAndSaveAffiliateData', () => {
  it('returns empty array when no data', async () => {
    getLandingMock.mockResolvedValue({})
    const res = await fetchAndSaveAffiliateData()
    expect(res).toEqual([])
  })
  it('stores and returns affiliate data', async () => {
    getLandingMock.mockResolvedValue({
      data: [
        {
          regionName: 'Europe',
          affiliateCount: 2,
          affiliates: [{ name: 'A' }],
        },
      ],
    })
    const res = await fetchAndSaveAffiliateData()
    expect(res.length).toBe(1)
    expect(localStorage.getItem('AFF_DATA')).toBeTruthy()
  })
})
describe('getValidAffiliateData', () => {
  it('fetches when no cache exists', async () => {
    getLandingMock.mockResolvedValue({ data: [] })
    const res = await getValidAffiliateData()
    expect(res).toEqual([])
  })
  it('returns cached data if valid', async () => {
    localStorage.setItem(
      'AFF_DATA',
      JSON.stringify({
        time: Date.now(),
        data: [{ test: 1 }],
      }),
    )
    const res = await getValidAffiliateData()
    expect(res).toEqual([{ test: 1 }])
  })
})
describe('handleAffiliateUserNavigation', () => {
  it('navigates when affiliate matches', () => {
    handleAffiliateUserNavigation(
      [{ affiliate_code: 'X', region: 'EU', affiliate: 'A' }],
      'X',
      navigateMock,
    )
  })
  it('logs out when unauthorized', () => {
    global.alert = vi.fn()
    handleAffiliateUserNavigation([], 'X', navigateMock)
    expect(global.alert).toHaveBeenCalled()
  })
})
describe('redirectToAffiliate', () => {
  it('redirects affiliate user', () => {
    redirectToAffiliate(
      { isCorporate: false, isAffiliateUser: true },
      { caseData: [] },
      navigateMock,
    )
  })
  it('logs out non affiliate user', () => {
    global.alert = vi.fn()
    redirectToAffiliate(
      { isCorporate: false, isAffiliateUser: false },
      { caseData: [] },
      navigateMock,
    )
  })
})
describe('getMapVals', () => {
  it('returns mapped coords', () => {
    const res = getMapVals('americas')
    expect(res.left).toBeDefined()
  })
  it('returns default coords', () => {
    const res = getMapVals('unknown')
    expect(res.top).toBe('21%')
  })
})
// ================= COMPONENT TEST =====================
describe('Corporate Component', () => {
  it('shows loader initially', () => {
    render(<Corporate />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })
  it('renders page after data load and handles map click', async () => {
    getLandingMock.mockResolvedValue({
      data: [
        {
          regionName: 'Europe',
          affiliateCount: 1,
          opportunityEnergyBills: 10,
          opportunityCo2: 20,
          seecGain: 30,
          affiliates: [],
        },
      ],
    })
    render(<Corporate />)
    await waitFor(() => {
      expect(screen.getByTestId('top-kpi')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('number-circle'))
  })
})
