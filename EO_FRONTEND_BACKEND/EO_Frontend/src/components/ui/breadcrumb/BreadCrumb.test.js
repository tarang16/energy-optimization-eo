import { render } from '@testing-library/react'
import assert from 'assert'
import * as dom from 'react-router-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, vi } from 'vitest'
import BreadCrumb from './BreadCrumb'

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/mock-pathname', // Replace with the pathname you expect to use in your test
    }),
    useParams: () => ({
      region: 'mock-region',
      affiliate: 'mock-affiliate',
      plant: 'mock-plant',
      system: 'mock-system',
    }),
  }
})

describe('BreadCrumb Component', () => {
  it('renders corporate link when no parameters are given', () => {
    vi.spyOn(dom, 'useLocation').mockReturnValue({ pathname: '/' })
    vi.spyOn(dom, 'useParams').mockReturnValue({})

    const { getByRole } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
    // Assert that the rendered breadcrumb includes the corporate link
    assert.ok(getByRole('link', { name: /SABIC/i }))
  })

  it("renders Dashboard link when location pathname includes 'user-management-roles'", () => {
    const mockedParams = {}
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/user-management-roles',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/user-management-roles']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )

    // Assert that the rendered breadcrumb includes the Dashboard link
    assert.ok(getByRole('link', { name: /DASHBOARD/i }))
  })

  it("renders Workflow link when location pathname includes 'user-management-workflow'", () => {
    const mockedParams = {}
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/user-management-workflow',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/user-management-workflow']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
    // Assert that the rendered breadcrumb includes the USER MANAGEMENT link
    assert.ok(getByRole('link', { name: /WORKFLOW/i }))
  })

  it('renders region link correctly', () => {
    const mockedParams = { region: 'middle+east' }
    vi.spyOn(dom, 'useLocation').mockReturnValue({ pathname: '/middle+east' })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/middle+east']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
    // Assert that the rendered breadcrumb includes the region link
    assert.ok(getByRole('link', { name: /MIDDLE EAST/i }))
  })

  it("renders region link correctly when 'region' key is provided", () => {
    const mockedParams = { region: 'middle+east' }
    vi.spyOn(dom, 'useLocation').mockReturnValue({ pathname: '/' })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
    // Assert that the rendered breadcrumb includes the region link
    assert.ok(getByRole('link', { name: /MIDDLE EAST/i }))
  })

  it('renders region link and separator when conditions are met', () => {
    const mockedParams = { region: 'middle+east', affiliate: 'arrazi' }
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/afiliate',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole, getByText } = render(
      <MemoryRouter initialEntries={['/afiliate']}>
        <Routes>
          <Route path='/:region/:affiliate?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
    // Assert that the rendered breadcrumb includes the region link and separator
    assert.ok(getByText('ARRAZI'))
  })

  it("renders Error Logging link when location pathname includes 'error-logging'", () => {
    const mockedParams = {}
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/error-logging',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/error-logging']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
    // Assert that the rendered breadcrumb includes the ERROR LOGGING link
    assert.ok(getByRole('link', { name: /ERROR LOGGING/i }))
  })

  it("renders Activity Tracker link when location pathname includes 'activity-tracker'", () => {
    const mockedParams = {}
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/activity-tracker',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/activity-tracker']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
    // Assert that the rendered breadcrumb includes the ACTIVITY TRACKER link
    assert.ok(getByRole('link', { name: /ACTIVITY TRACKER/i }))
  })

  it("renders Performance Tracker link when location pathname includes 'performance-tracker'", () => {
    const mockedParams = {}
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/performance-tracker',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/performance-tracker']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
    // Assert that the rendered breadcrumb includes the PERFORMANCE TRACKER link
    assert.ok(getByRole('link', { name: /PERFORMANCE TRACKER/i }))
  })

  it("renders Workflow link when location pathname includes 'inbox_workflow'", () => {
    const mockedParams = {}
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/inbox_workflow',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/inbox_workflow']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
    // Assert that the rendered breadcrumb includes the WORKFLOW link
    assert.ok(getByRole('link', { name: /WORKFLOW/i }))
  })

  it("renders Value Creation link when location pathname includes 'user-management-vc'", () => {
    const mockedParams = {}
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/user-management-vc',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/user-management-vc']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
    // Assert that the rendered breadcrumb includes the VALUE CREATION link
    assert.ok(getByRole('link', { name: /VALUE CREATION/i }))
  })

  it('correctly modifies params when pathname includes "analysis"', () => {
    const mockedParams = {}
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/analysis',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/analysis']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
  })

  it('correctly modifies params when pathname includes "/virtual-engineering"', () => {
    const mockedParams = {}
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/virtual-engineering',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/virtual-engineering']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
  })

  it('correctly modifies params when pathname includes "/health-check-system"', () => {
    const mockedParams = {}
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/health-check-system',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/health-check-system']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
  })

  it('correctly modifies params when pathname includes "/user-management-configuration"', () => {
    const mockedParams = {}
    vi.spyOn(dom, 'useLocation').mockReturnValue({
      pathname: '/user-management-configuration',
    })
    vi.spyOn(dom, 'useParams').mockReturnValue(mockedParams)
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/user-management-configuration']}>
        <Routes>
          <Route path='/:region?' element={<BreadCrumb />} />
        </Routes>
      </MemoryRouter>,
    )
  })
})
