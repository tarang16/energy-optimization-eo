import { render, screen } from '@testing-library/react'
import * as CurrentServices from 'services/CurrentServices'
import { describe, expect, it, vi } from 'vitest'
import SystemTopTiles from './SystemTopTiles'

export const mockUseParams = vi.fn().mockReturnValue({
  region: 'middle+east',
  affiliate: 'yansab',
  plant: 'ethylene+glycol',
  system: 'eg+reactor',
  caseId: '56',
})
vi.mock('config/scss/_variables.scss', () => {
  return {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
    primary_dark_blue: '#ff0000',
  }
})
// Mock the API function
vi.mock('services/CurrentServices', () => ({
  get_system_toptile_data: vi.fn(),
}))

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocation: () => ({
      pathname:
        'localhost:3000/#/middle+east/yansab/ethylene+glycol/eg+reactor/overview',
    }),
    useOutletContext: () => ({
      caseId: 56,
    }),
    useParams: () => mockUseParams(),
  }
})

describe('SystemTopTiles', () => {
  it('handles undefined API response gracefully', async () => {
    CurrentServices.get_system_toptile_data.mockResolvedValueOnce(undefined)
    render(
      <SystemTopTiles
        caseId={6}
        actualTime={1693263600000}
        category='energy'
      />,
    )
    await screen.findByText('ENERGY BILL EFFICIENCY LOSS') // fallback defaults still render
  })

  it('re-fetches data when actualTime changes', async () => {
    const mockData = {
      data: {
        deviationActive: 5,
        deviationOverdue: 1,
      },
    }
    CurrentServices.get_system_toptile_data.mockResolvedValue(mockData)
    const { rerender } = render(
      <SystemTopTiles
        caseId={6}
        actualTime={1693263600000}
        category='deviation'
      />,
    )

    await screen.findByText('ACTIVE DEVIATION')
    rerender(
      <SystemTopTiles
        caseId={6}
        actualTime={1693263700000}
        category='deviation'
      />,
    )

    await screen.findByText('OVERDUE DEVIATION')
  })

  it('displays "-" for missing values', async () => {
    CurrentServices.get_system_toptile_data.mockResolvedValueOnce({
      data: {
        energyBillEfficiency: null,
        opportunityEnergyBills: null,
        deviationActive: null,
        deviationOverdue: null,
      },
    })

    render(
      <SystemTopTiles
        caseId={6}
        actualTime={1693263600000}
        category='energy'
      />,
    )

    await screen.findByText('ENERGY BILL EFFICIENCY LOSS')
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })
})
