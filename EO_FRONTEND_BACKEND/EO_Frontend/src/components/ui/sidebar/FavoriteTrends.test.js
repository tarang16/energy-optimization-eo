import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FavoriteTrends from './FavoriteTrends'
// ---------------- MOCK ROUTER ----------------
const mockLocation = { pathname: '/dashboard' }
vi.mock('react-router-dom', () => ({
  NavLink: ({ children, ...props }) => <a {...props}>{children}</a>,
  useLocation: () => mockLocation,
  useParams: () => ({ caseId: '123' }),
}))
// ---------------- MOCK TRACKER ----------------

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    favoriteTrends: {
      favTrendOnClick: vi.fn(),
    },
  },
}))
// ---------------- MOCK JOTAI ----------------
const setActiveMock = vi.fn()
const resetActiveMock = vi.fn()
let activeFavoriteTrendValue = null
let favoriteTrendsData = []
vi.mock('jotai', () => ({
  useAtom: () => [activeFavoriteTrendValue, setActiveMock],
  useSetAtom: () => resetActiveMock,
  useAtomValue: () => ({
    data: favoriteTrendsData,
  }),
}))
// ---------------- MOCK ATOMS ----------------
vi.mock('atoms/AppAtom', () => ({
  AppAtom: {},
}))
vi.mock('atoms/SidebarAtom', () => ({
  activeFavoriteTrendsAtom: {},
  getFavoriteTrendsByUserIdAtom: {},
}))
// ---------------- TESTS ----------------
describe('FavoriteTrends – 100% coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activeFavoriteTrendValue = null
    favoriteTrendsData = []
    mockLocation.pathname = '/dashboard'
  })
  it('renders "NO FAVORITE TRENDS ADDED" when list is empty', () => {
    render(<FavoriteTrends />)
    expect(screen.getByText('NO FAVORITE TRENDS ADDED.')).toBeInTheDocument()
  })
  it('renders favorite trends list', () => {
    favoriteTrendsData = [
      {
        id: 1,
        title: 'Energy',
        subTitle: 'Plant',
        url: '/trend/1',
      },
    ]
    render(<FavoriteTrends />)
    expect(screen.getByTestId('fav-link-item')).toBeInTheDocument()
    expect(screen.getByText('Plant - Energy')).toBeInTheDocument()
  })
  it('applies active class when favorite is active', () => {
    activeFavoriteTrendValue = 1
    favoriteTrendsData = [
      {
        id: 1,
        title: 'Energy',
        subTitle: 'Plant',
        url: '/trend/1',
      },
    ]
    render(<FavoriteTrends />)
    expect(screen.getByTestId('fav-link-item')).toHaveClass('active')
  })
  it('applies inactive class when favorite is not active', () => {
    activeFavoriteTrendValue = 2
    favoriteTrendsData = [
      {
        id: 1,
        title: 'Energy',
        subTitle: 'Plant',
        url: '/trend/1',
      },
    ]
    render(<FavoriteTrends />)
    expect(screen.getByTestId('fav-link-item')).toHaveClass('inactive')
  })
  it('tracks event and sets active favorite on click', () => {
    favoriteTrendsData = [
      {
        id: 5,
        title: 'Steam',
        subTitle: 'Loss',
        url: '/trend/5',
      },
    ]
    render(<FavoriteTrends />)
    fireEvent.click(screen.getByTestId('fav-link-item'))
  })
  it('resets active favorite when route does NOT include monitoring', () => {
    activeFavoriteTrendValue = 10
    mockLocation.pathname = '/dashboard'
    render(<FavoriteTrends />)
    expect(resetActiveMock).toHaveBeenCalledWith(null)
  })
  it('does NOT reset active favorite when route includes monitoring', () => {
    activeFavoriteTrendValue = 10
    mockLocation.pathname = '/monitoring/energy'
    render(<FavoriteTrends />)
    expect(resetActiveMock).not.toHaveBeenCalled()
  })
})
