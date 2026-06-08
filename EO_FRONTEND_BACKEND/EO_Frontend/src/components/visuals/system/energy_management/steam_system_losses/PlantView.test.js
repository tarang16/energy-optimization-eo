import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import * as CurrentServices from 'services/EnergyManagementService'
import { describe, expect, it, vi } from 'vitest'
import PlantView from './PlantView'

vi.mock(import('services/EnergyManagementService'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getSteamTrend: vi.fn(),
  }
})

vi.mock('@amcharts/amcharts5', () => {
  const disposeMock = vi.fn()

  return {
    Root: {
      new: vi.fn(() => ({
        _logo: { dispose: disposeMock },
        setThemes: vi.fn(),
        timezone: {},
        container: {
          children: [],
        },
        dispose: vi.fn(),
      })),
    },
    color: vi.fn(),
    Timezone: {
      new: vi.fn(() => ({})),
    },
  }
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

vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: ({ setExpandModal }) => {
    return (
      <div
        data-testid='combo-chart'
        onClick={() =>
          setExpandModal({ id: 'yAxis1', axisHeader: { text: 'Test Axis' } })
        }
      >
        ComboChart
      </div>
    )
  },
}))

vi.mock('components/visuals/common/modal/CustomModal', () => ({
  default: ({ children }) => {
    return <div data-testid='custom-modal'>{children}</div>
  },
}))

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))

const mockData = [
  {
    groupByCol: 'EG1',
    steamLetDownLosses: 0,
    steamVentsLosses: 0,
    steamDumpedLosses: 0,
    steamLossTarget: 0,
  },
  {
    groupByCol: 'EG2',
    steamLetDownLosses: 0,
    steamVentsLosses: 0,
    steamDumpedLosses: 0,
    steamLossTarget: 0,
  },
  {
    groupByCol: 'EG3',
    steamLetDownLosses: 45470.13899442576,
    steamVentsLosses: 23450.909610093917,
    steamDumpedLosses: 0,
    steamLossTarget: 915711.4831542969,
  },
  {
    groupByCol: 'ETH',
    steamLetDownLosses: 73241.91336989368,
    steamVentsLosses: 63090.322883297864,
    steamDumpedLosses: 0,
    steamLossTarget: 25550,
  },
  {
    groupByCol: 'LAO',
    steamLetDownLosses: 0,
    steamVentsLosses: 0,
    steamDumpedLosses: 0,
    steamLossTarget: 0,
  },
  {
    groupByCol: 'UTILITIES',
    steamLetDownLosses: 313204.69279132696,
    steamVentsLosses: 128085.15345649005,
    steamDumpedLosses: 323450.0666369481,
    steamLossTarget: 1080400,
  },
]

const componentPropsData = {
  selectedPlants: 'CO2,EG1,EG2,EG3,ETH,LAO,UTILITIES',
  caseId: 10,
  dateRange: ['2024-06-18T06:20:20.803Z', '2025-06-18T06:20:20.803Z'],
}

describe('PlantView', () => {
  it("'No Data found' message on data empty", async () => {
    CurrentServices.getSteamTrend.mockResolvedValueOnce({ data: [] })

    await act(async () => {
      render(
        <PlantView
          selectedPlants={componentPropsData.selectedPlants}
          caseId={componentPropsData.caseId}
          dateRange={componentPropsData.dateRange}
        />,
      )
    })

    expect(screen.getByText(/No Data found...../)).toBeInTheDocument()
  })

  it('renders loader while fetching data', async () => {
    await act(async () => {
      CurrentServices.getSteamTrend.mockResolvedValue({ data: mockData })

      render(
        <Router>
          <PlantView
            selectedPlants={componentPropsData.selectedPlants}
            caseId={componentPropsData.caseId}
            dateRange={componentPropsData.dateRange}
          />
        </Router>,
      )
    })
  })
})
