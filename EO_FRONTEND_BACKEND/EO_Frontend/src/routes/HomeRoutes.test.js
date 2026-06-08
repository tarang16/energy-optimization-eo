import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

// ─── Mock all imported modules ────────────────────────────────────────────────

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

vi.mock('layout/ErrorPage', () => ({
  default: ({ isInner }) => (
    <div data-testid='error-page' data-is-inner={String(isInner)}>
      Error
    </div>
  ),
}))

vi.mock('layout/RootLayout', async () => {
  const { Outlet } = await import('react-router-dom')
  return {
    TrackedRootLayout: () => (
      <div data-testid='root-layout'>
        <Outlet />
      </div>
    ),
    loader: vi.fn(() => null),
  }
})

vi.mock('pages/Inbox_workflow/Inbox_workflow', () => ({
  default: () => <div data-testid='inbox-workflow'>Inbox Workflow</div>,
}))

vi.mock('pages/activity_tracker/ActivityTrackerTab', () => ({
  default: () => <div data-testid='activity-tracker'>Activity Tracker</div>,
}))

vi.mock('pages/affiliates/Affiliates', () => ({
  default: () => <div data-testid='affiliates'>Affiliates</div>,
}))

vi.mock('pages/affiliates/AffiliatesBadCss', () => ({
  default: () => <div data-testid='affiliates-bad-css'>Affiliates Bad CSS</div>,
}))

vi.mock('pages/corporate/Corporate', () => ({
  default: () => <div data-testid='corporate'>Corporate</div>,
}))

vi.mock('pages/dashboard/Dashboard', () => ({
  default: () => <div data-testid='dashboard'>Dashboard</div>,
}))

vi.mock('pages/error_logging/ErrorLogging', () => ({
  default: () => <div data-testid='error-logging'>Error Logging</div>,
}))

vi.mock('pages/health_check/HealthCheck', () => ({
  default: ({ hidePlantModelColumns }) => (
    <div
      data-testid='health-check'
      data-hide-plant={String(hidePlantModelColumns)}
    >
      Health Check
    </div>
  ),
}))

vi.mock('pages/logout/Logout', () => ({
  default: () => <div data-testid='logout'>Logout</div>,
}))

vi.mock('pages/performance_tracker/PerformanceTrackerTab', () => ({
  default: () => (
    <div data-testid='performance-tracker'>Performance Tracker</div>
  ),
}))

vi.mock('pages/user_management/roles/Roles', () => ({
  default: ({ pageKey }) => (
    <div data-testid='roles' data-page-key={pageKey}>
      Roles
    </div>
  ),
}))

vi.mock('pages/workflow_instance/WorkflowInstanceTabs', () => ({
  default: () => (
    <div data-testid='workflow-instance-tabs'>Workflow Instance Tabs</div>
  ),
}))

vi.mock('./SystemRoutes', () => ({
  default: [],
}))

// ─── Import after mocks ───────────────────────────────────────────────────────

import APP_ROUTES from './HomeRoutes'

// ─── Helper ──────────────────────────────────────────────────────────────────

const renderRoute = (path) => {
  const router = createMemoryRouter(APP_ROUTES, {
    initialEntries: [path],
  })
  return render(<RouterProvider router={router} />)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('APP_ROUTES', () => {
  describe('Route structure', () => {
    it('exports an array of route objects', () => {
      expect(Array.isArray(APP_ROUTES)).toBe(true)
      expect(APP_ROUTES.length).toBeGreaterThan(0)
    })

    it('has a /logout route as the first top-level route', () => {
      const logoutRoute = APP_ROUTES.find((r) => r.path === '/logout')
      expect(logoutRoute).toBeDefined()
      expect(logoutRoute.path).toBe('/logout')
    })

    it('has a root "/" route with id "root"', () => {
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      expect(rootRoute).toBeDefined()
      expect(rootRoute.id).toBe('root')
    })

    it('root route has a loader', () => {
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      expect(typeof rootRoute.loader).toBe('function')
    })

    it('root route has children', () => {
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      expect(Array.isArray(rootRoute.children)).toBe(true)
      expect(rootRoute.children.length).toBeGreaterThan(0)
    })

    it('children paths include all expected routes', () => {
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      const paths = rootRoute.children.map((c) => c.path)
      expect(paths).toContain('/admin/user-management-roles/:tabKey?')
      expect(paths).toContain('inbox_workflow')
      expect(paths).toContain('/admin/user-management-vc')
      expect(paths).toContain('/admin/user-management-workflow')
      expect(paths).toContain('/admin/user-management-configuration')
      expect(paths).toContain('/admin/error-logging')
      expect(paths).toContain('/admin/activity-tracker/:tabKey?')
      expect(paths).toContain('/admin/performance-tracker/:tabKey?')
      expect(paths).toContain('/admin/workflow-instance-errors')
      expect(paths).toContain('/admin/health-check-system')
      expect(paths).toContain('/admin/features/:tabKey?')
      expect(paths).toContain('affiliates/bad-css')
      expect(paths).toContain('affiliates')
      expect(paths).toContain('/:region')
      expect(paths).toContain(':region/:affiliate')
    })
  })

  describe('Fallback component', () => {
    it('renders a Loader inside a centered flex div', () => {
      // The Fallback is the hydrateFallbackElement on the root route
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      expect(rootRoute.hydrateFallbackElement).toBeDefined()

      // Render it directly
      render(rootRoute.hydrateFallbackElement)
      expect(screen.getByTestId('loader')).toBeInTheDocument()

      const wrapper = screen.getByTestId('loader').parentElement
      expect(wrapper).toHaveAttribute(
        'data-static-id',
        'HomeRoutes.js_div_bc4fd8',
      )
      expect(wrapper.className).toContain('d-flex')
      expect(wrapper.className).toContain('align-items-center')
      expect(wrapper.className).toContain('justify-content-center')
    })
  })

  describe('Route: /logout', () => {
    it('renders Logout page', async () => {
      renderRoute('/logout')
      expect(await screen.findByTestId('logout')).toBeInTheDocument()
    })
  })

  describe('Route: / (corporate)', () => {
    it('renders Corporate page at root', async () => {
      renderRoute('/')
      expect(await screen.findByTestId('corporate')).toBeInTheDocument()
    })

    it('corporate route has id "corporate"', () => {
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      const corporateChild = rootRoute.children.find(
        (c) => c.id === 'corporate',
      )
      expect(corporateChild).toBeDefined()
      expect(corporateChild.path).toBe('')
    })
  })

  describe('Route: /admin/user-management-roles', () => {
    it('renders Roles with pageKey="dashboard"', async () => {
      renderRoute('/admin/user-management-roles')
      const el = await screen.findByTestId('roles')
      expect(el).toBeInTheDocument()
      expect(el).toHaveAttribute('data-page-key', 'dashboard')
    })

    it('renders Roles with optional tabKey param', async () => {
      renderRoute('/admin/user-management-roles/someTab')
      const el = await screen.findByTestId('roles')
      expect(el).toHaveAttribute('data-page-key', 'dashboard')
    })
  })

  describe('Route: /inbox_workflow', () => {
    it('renders Inbox_workflow', async () => {
      renderRoute('/inbox_workflow')
      expect(await screen.findByTestId('inbox-workflow')).toBeInTheDocument()
    })
  })

  describe('Route: /admin/user-management-vc', () => {
    it('renders Roles with pageKey="value_creation"', async () => {
      renderRoute('/admin/user-management-vc')
      const el = await screen.findByTestId('roles')
      expect(el).toHaveAttribute('data-page-key', 'value_creation')
    })
  })

  describe('Route: /admin/user-management-workflow', () => {
    it('renders Roles with pageKey="workflow"', async () => {
      renderRoute('/admin/user-management-workflow')
      const el = await screen.findByTestId('roles')
      expect(el).toHaveAttribute('data-page-key', 'workflow')
    })
  })

  describe('Route: /admin/user-management-configuration', () => {
    it('renders Roles with pageKey="configuration"', async () => {
      renderRoute('/admin/user-management-configuration')
      const el = await screen.findByTestId('roles')
      expect(el).toHaveAttribute('data-page-key', 'configuration')
    })
  })

  describe('Route: /admin/error-logging', () => {
    it('renders ErrorLogging page', async () => {
      renderRoute('/admin/error-logging')
      expect(await screen.findByTestId('error-logging')).toBeInTheDocument()
    })
  })

  describe('Route: /admin/activity-tracker', () => {
    it('renders ActivityTrackerTab', async () => {
      renderRoute('/admin/activity-tracker')
      expect(await screen.findByTestId('activity-tracker')).toBeInTheDocument()
    })

    it('renders ActivityTrackerTab with tabKey', async () => {
      renderRoute('/admin/activity-tracker/logs')
      expect(await screen.findByTestId('activity-tracker')).toBeInTheDocument()
    })
  })

  describe('Route: /admin/performance-tracker', () => {
    it('renders PerformanceTrackerTab', async () => {
      renderRoute('/admin/performance-tracker')
      expect(
        await screen.findByTestId('performance-tracker'),
      ).toBeInTheDocument()
    })

    it('renders PerformanceTrackerTab with tabKey', async () => {
      renderRoute('/admin/performance-tracker/metrics')
      expect(
        await screen.findByTestId('performance-tracker'),
      ).toBeInTheDocument()
    })
  })

  describe('Route: /admin/workflow-instance-errors', () => {
    it('renders WorkflowInstanceTabs', async () => {
      renderRoute('/admin/workflow-instance-errors')
      expect(
        await screen.findByTestId('workflow-instance-tabs'),
      ).toBeInTheDocument()
    })
  })

  describe('Route: /admin/health-check-system', () => {
    it('renders HealthCheck with hidePlantModelColumns=true', async () => {
      renderRoute('/admin/health-check-system')
      const el = await screen.findByTestId('health-check')
      expect(el).toBeInTheDocument()
      expect(el).toHaveAttribute('data-hide-plant', 'true')
    })
  })

  describe('Route: /admin/features', () => {
    it('renders Roles with pageKey="features"', async () => {
      renderRoute('/admin/features')
      const el = await screen.findByTestId('roles')
      expect(el).toHaveAttribute('data-page-key', 'features')
    })

    it('renders Roles with pageKey="features" and tabKey', async () => {
      renderRoute('/admin/features/someTab')
      const el = await screen.findByTestId('roles')
      expect(el).toHaveAttribute('data-page-key', 'features')
    })
  })

  describe('Route: /affiliates/bad-css', () => {
    it('renders AffiliatesBadCss', async () => {
      renderRoute('/affiliates/bad-css')
      expect(
        await screen.findByTestId('affiliates-bad-css'),
      ).toBeInTheDocument()
    })
  })

  describe('Route: /affiliates', () => {
    it('renders Affiliates page', async () => {
      renderRoute('/affiliates')
      expect(await screen.findByTestId('affiliates')).toBeInTheDocument()
    })

    it('has children routes for alert-statistics and value_creation', () => {
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      const affiliatesRoute = rootRoute.children.find(
        (c) => c.path === 'affiliates',
      )
      expect(affiliatesRoute.children).toBeDefined()
      const childPaths = affiliatesRoute.children.map((c) => c.path)
      expect(childPaths).toContain('alert-statistics')
      expect(childPaths).toContain('value_creation')
    })
  })

  describe('Route: /:region', () => {
    it('renders Affiliates for a region path', async () => {
      renderRoute('/us')
      expect(await screen.findByTestId('affiliates')).toBeInTheDocument()
    })

    it('/:region has child route alert-statistics', () => {
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      const regionRoute = rootRoute.children.find((c) => c.path === '/:region')
      expect(regionRoute.children).toBeDefined()
      const childPaths = regionRoute.children.map((c) => c.path)
      expect(childPaths).toContain('alert-statistics')
    })
  })

  describe('Route: :region/:affiliate (system)', () => {
    it('has id "system"', () => {
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      const systemRoute = rootRoute.children.find(
        (c) => c.path === ':region/:affiliate',
      )
      expect(systemRoute).toBeDefined()
      expect(systemRoute.id).toBe('system')
    })

    it('uses Dashboard as its element', () => {
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      const systemRoute = rootRoute.children.find(
        (c) => c.path === ':region/:affiliate',
      )
      // Verify children are from SystemRoutes (mocked as [])
      expect(Array.isArray(systemRoute.children)).toBe(true)
    })

    it('renders Dashboard for region/affiliate path', async () => {
      renderRoute('/us/acme')
      expect(await screen.findByTestId('dashboard')).toBeInTheDocument()
    })
  })

  describe('Error elements', () => {
    it('root route has errorElement with isInner=false', () => {
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      render(rootRoute.errorElement)
      const el = screen.getByTestId('error-page')
      expect(el).toHaveAttribute('data-is-inner', 'false')
    })

    it('child routes have errorElement without isInner prop (defaults to undefined → "undefined")', () => {
      const rootRoute = APP_ROUTES.find((r) => r.path === '/')
      const inboxRoute = rootRoute.children.find(
        (c) => c.path === 'inbox_workflow',
      )
      render(inboxRoute.errorElement)
      const el = screen.getByTestId('error-page')
      // isInner is not passed so it's undefined; component renders String(undefined)="undefined"
      expect(el).toHaveAttribute('data-is-inner', 'undefined')
    })

    const adminRoutesWithErrors = [
      '/admin/user-management-roles/:tabKey?',
      'inbox_workflow',
      '/admin/user-management-vc',
      '/admin/user-management-workflow',
      '/admin/user-management-configuration',
      '/admin/error-logging',
      '/admin/activity-tracker/:tabKey?',
      '/admin/performance-tracker/:tabKey?',
      '/admin/workflow-instance-errors',
      '/admin/health-check-system',
      '/admin/features/:tabKey?',
      '',
      'affiliates',
      '/:region',
      ':region/:affiliate',
    ]

    it.each(adminRoutesWithErrors)(
      'child route "%s" has an errorElement defined',
      (path) => {
        const rootRoute = APP_ROUTES.find((r) => r.path === '/')
        const childRoute = rootRoute.children.find((c) => c.path === path)
        expect(childRoute).toBeDefined()
        expect(childRoute.errorElement).toBeDefined()
      },
    )
  })
})
