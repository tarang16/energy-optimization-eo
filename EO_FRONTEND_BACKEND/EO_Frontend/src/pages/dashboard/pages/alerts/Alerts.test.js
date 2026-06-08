import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Alerts from './Alerts'

// vi.mock('./Alerts.module.scss', () => ({}));
// @ts-expect-error
vi.mock(import('./Alerts.module.scss'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
  }
})

vi.mock('react-bootstrap', () => {
  const React = require('react')
  return {
    __esModule: true,
    Tabs: ({ children, onSelect, defaultActiveKey }) => (
      <div data-testid='tabs' data-default={defaultActiveKey}>
        {React.Children.map(children, (child) =>
          React.cloneElement(child, { onSelect }),
        )}
      </div>
    ),
    Tab: ({ eventKey, title, onSelect, children }) => (
      <div>
        <button
          data-testid={`tab-header-${eventKey}`}
          onClick={() => onSelect(eventKey)}
        >
          {title}
        </button>
        <div data-testid={`tab-content-${eventKey}`}>{children}</div>
      </div>
    ),
  }
})

let mockParams = { CCPKey: 'alert-management', AlertKey: 'alert-management' }
let mockLocation = { pathname: '/base/alerts/alert-management' }
const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  useLocation: () => mockLocation,
  useOutletContext: () => ({}),
}))

vi.mock('jotai', () => ({
  __esModule: true,
  atom: vi.fn((init) => init),
  useAtomValue: vi.fn(() => ({ caseData: [{ id: 42 }] })),
  useSetAtom: vi.fn(),
}))

vi.mock('config/ActivityTrackerConfig', () => {
  const onTabChange = vi.fn()
  return {
    __esModule: true,
    TRACKEVENTOBJ: { CCP: { onTabChange } },
  }
})

vi.mock('components/visuals/table/operation_decision_support/ODS', () => ({
  default: () => <div data-testid='ods'>ODS</div>,
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('../overview/alert_status/AlertStatisticsModal', () => ({
  default: () => <div data-testid='stats-modal'>Stats</div>,
}))

describe('Alerts component', () => {
  // const { TRACKEVENTOBJ } = require('config/ActivityTrackerConfig');
  beforeEach(() => {
    vi.clearAllMocks()
    mockParams = {
      CCPKey: 'alert-management',
      AlertKey: 'alert-management',
    }
    mockLocation = { pathname: '/base/alerts/alert-management' }
  })

  it('renders ODS on the alert-management tab', () => {
    render(<Alerts />)
    expect(screen.getByTestId('tabs')).toHaveAttribute(
      'data-default',
      'alert-management',
    )

    expect(screen.getByTestId('ods')).toBeInTheDocument()
    expect(screen.queryByTestId('loader')).toBeNull()
    expect(screen.queryByTestId('stats-modal')).toBeNull()
  })

  it('renders loader + stats modal on alert-statistics tab', () => {
    mockParams.AlertKey = 'alert-statistics'
    mockLocation.pathname = '/base/alerts/alert-statistics'
    render(<Alerts />)
    expect(screen.getByTestId('tabs')).toHaveAttribute(
      'data-default',
      'alert-statistics',
    )
  })

  it('tracks & navigates when clicking statistics tab header', () => {
    render(<Alerts />)
    const btn = screen.getByTestId('tab-header-alert-statistics')
    fireEvent.click(btn)
    expect(TRACKEVENTOBJ.CCP.onTabChange).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/base/alerts/alert-statistics')
  })

  it('tracks & navigates when clicking management tab header', () => {
    render(<Alerts />)
    const btn = screen.getByTestId('tab-header-alert-management')
    fireEvent.click(btn)
    expect(TRACKEVENTOBJ.CCP.onTabChange).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/base/alerts/alert-management')
  })
})
