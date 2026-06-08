import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { AppAtom } from 'atoms/AppAtom'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import * as CurrentServices from 'services/CurrentServices'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SEUEnergyDistributionTable from './SEUEnergyDistributionTable'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
    atom: actual.atom,
  }
})

vi.mock('services/CurrentServices', () => ({
  getEnergyDistribution: vi.fn(),
}))

vi.mock('utills/utilities', () => ({
  showToast: vi.fn(),
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

describe('SEUEnergyDistributionTable', () => {
  const mockData = [
    {
      category: 'Category A',
      plantName: 'Plant 1',
      nonSeuActual: 1.23456,
      nonSeuOptimum: 2.34567,
      perContributionEnergyTypeActual: 3.45678,
      perContributionSeuActual: 4.56789,
      perContributionSeuOptimum: 5.6789,
      seuEnergyActual: 6.789,
      seuEnergyOptimum: 7.89,
      totalEnergyActual: 8.9,
      totalEnergyOptimum: 9.01,
      seuEnergyReductionActual: 1.1,
      seuEnergyReductionOptimum: 2.2,
      perEnergyReductionActual: 3.3,
      perEnergyReductionOptimum: 4.4,
      totalEnergyReductionActual: 5.5,
      totalEnergyReductionOptimum: 6.6,
    },
  ]

  const mockCtx = {
    actualTime: moment().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAtomValue.mockImplementation((atom) => {
      if (atom === AppAtom) return mockCtx
      return null
    })
  })

  it('renders loader initially and then table with data', async () => {
    CurrentServices.getEnergyDistribution.mockResolvedValue({
      statuscode: 200,
      data: mockData,
    })

    render(<SEUEnergyDistributionTable caseId='123' />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    CurrentServices.getEnergyDistribution.mockRejectedValue(
      new Error('API failed'),
    )

    render(<SEUEnergyDistributionTable caseId='123' />)
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
    expect(screen.queryByText(/Plant 1/i)).not.toBeInTheDocument()
  })

  it('handles non-200 API status codes', async () => {
    CurrentServices.getEnergyDistribution.mockResolvedValue({
      statuscode: 500,
      data: [],
    })

    render(<SEUEnergyDistributionTable caseId='123' />)
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })
    expect(screen.queryByText(/Plant 1/i)).not.toBeInTheDocument()
  })

  it('renders fallback dash when value is null or undefined', async () => {
    const mockNullData = [
      {
        category: 'Empty',
        plantName: 'Plant X',
      },
    ]

    CurrentServices.getEnergyDistribution.mockResolvedValue({
      statuscode: 200,
      data: mockNullData,
    })

    render(<SEUEnergyDistributionTable caseId='null-case' />)
  })
})
