import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import * as jotai from 'jotai'
import * as ReactRouter from 'react-router-dom'
import * as utilities from 'utills/utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Dashboard from './Dashboard'
// Mock react-router-dom's useParams and Outlet

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: vi.fn(),
    Outlet: vi.fn(() => <div data-testid='mock-outlet' />),
  }
})

// Mock utilities
vi.mock('utills/utilities', () => ({
  getAffiliateIdByName: vi.fn(),
  getAffiliateIdByCaseID: vi.fn(),
}))

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})

describe('Dashboard component', () => {
  const mockCtxData = {
    caseData: {
      'case-123': { id: 'affiliate-001' },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders error message when caseId is falsy (null)', () => {
    vi.spyOn(jotai, 'useAtomValue').mockReturnValue(mockCtxData)
    utilities.getAffiliateIdByName.mockReturnValue(null)
    ReactRouter.useParams.mockReturnValue({ affiliate: 'unknown' })

    render(<Dashboard />)

    expect(screen.getByText(/Invalid System name/i)).toBeInTheDocument()
  })

  it('calls getAffiliateIdByName and getAffiliateIdByCaseID with correct params', () => {
    const spyCtx = vi.spyOn(jotai, 'useAtomValue').mockReturnValue(mockCtxData)
    const spyName = utilities.getAffiliateIdByName.mockReturnValue('case-123')
    const spyCase =
      utilities.getAffiliateIdByCaseID.mockReturnValue('affiliate-001')

    const params = { affiliate: 'affiliate-001' }
    ReactRouter.useParams.mockReturnValue(params)

    render(<Dashboard />)

    expect(spyCtx).toHaveBeenCalledTimes(1)
    expect(spyName).toHaveBeenCalledWith(params.affiliate, mockCtxData.caseData)
    expect(spyCase).toHaveBeenCalledWith('case-123', mockCtxData.caseData)
  })
})
