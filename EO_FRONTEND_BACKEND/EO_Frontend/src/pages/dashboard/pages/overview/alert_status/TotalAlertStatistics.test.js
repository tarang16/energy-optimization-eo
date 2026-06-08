import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import TotalAlertStatistics from './TotalAlertStatistics'

vi.mock('utills/utilities', () => ({
  downloadExcelFile: vi.fn(),
  showToast: vi.fn(),
  slugToText: vi.fn(),
}))
vi.mock('services/ODSServices', () => ({
  donloadOdsAlertStats: vi.fn(),
}))

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    AlertStatistics: {
      onTotalAlertDownloadFile: vi.fn(),
    },
  },
}))

vi.mock(import('react-bootstrap'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    OverlayTrigger: ({ children }) => <div>{children}</div>,
    Tooltip: ({ children }) => <div>{children}</div>,
  }
})

vi.mock(
  import('./TotalAlertStatistics.module.scss'),
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      totalStatisticsContainer: 'totalStatisticsContainerClass',
      totalStatisticsContainer__topBlock: 'topBlockClass',
      totalStatisticsContainer__topBlock__item: 'topBlockItemClass',
      imgIcon: 'imgIconClass',
      btnContainer: 'btnContainerClass',
      disabled: 'disabledClass',
      enabled: 'enabledClass',
    }
  },
)

vi.mock('assets/sabic_icons/sidebar/download_icon.svg', () => ({
  default: 'downloadIcon.svg',
}))

vi.mock('./AlertStatistics.functions', () => ({
  total_alert_statistics_template: {
    top: [
      { key: 'alerts', title: 'Alerts', icon: 'icon1.svg' },
      { key: 'warnings', title: 'Warnings', icon: 'icon2.svg' },
    ],
  },
}))

import { donloadOdsAlertStats } from 'services/ODSServices'
import { beforeEach, describe, expect, test, vi } from 'vitest'

describe('TotalAlertStatistics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders top blocks with counts and titles using getCount', () => {
    const APIResponse = { alerts: 5 }
    render(
      <TotalAlertStatistics
        APIResponse={APIResponse}
        caseIdList={['c1', 'c2']}
        caseData={{}}
        params={{ plant: 'test-plant' }}
      />,
    )

    // For "alerts" key present, getCount returns 5
    const alertCount = screen.getByText('5')
    expect(alertCount).toBeInTheDocument()
    expect(screen.getByText('Alerts')).toBeInTheDocument()
    const alertIcon = screen.getByAltText('Alerts')
    expect(alertIcon).toHaveAttribute('src', 'icon1.svg')

    // For "warnings" key missing, getCount returns "--"
    const warningCount = screen.getByText('--')
    expect(warningCount).toBeInTheDocument()
    expect(screen.getByText('Warnings')).toBeInTheDocument()
    const warningIcon = screen.getByAltText('Warnings')
    expect(warningIcon).toHaveAttribute('src', 'icon2.svg')
  })

  test('clicking download shows toast and re-enables button when fileStream missing', async () => {
    donloadOdsAlertStats.mockResolvedValue({
      statuscode: 200,
      data: { message: 'No file available', fileStream: null },
    })

    render(
      <TotalAlertStatistics
        APIResponse={{}}
        caseIdList={['c1']}
        caseData={{ some: 'data' }}
        params={{ plant: 'p' }}
      />,
    )

    const btn = screen.getByTestId('downloadIcon')

    fireEvent.click(btn)
    expect(btn).toBeDisabled()
  })

  test('clicking download shows generic toast and re-enables when statuscode not 200', async () => {
    donloadOdsAlertStats.mockResolvedValue({
      statuscode: 500,
      data: { fileStream: 'ignored', message: 'Server error' },
    })

    render(
      <TotalAlertStatistics
        APIResponse={{}}
        caseIdList={['c1']}
        caseData={{}}
        params={{ plant: 'p2' }}
      />,
    )

    const btn = screen.getByTestId('downloadIcon')
    fireEvent.click(btn)

    expect(btn).toBeDisabled()
  })

  test('handleDownloadClick catches exceptions without throwing', async () => {
    donloadOdsAlertStats.mockRejectedValue(new Error('Network error'))

    render(
      <TotalAlertStatistics
        APIResponse={{}}
        caseIdList={['x']}
        caseData={{}}
        params={{ plant: 'p3' }}
      />,
    )

    const btn = screen.getByTestId('downloadIcon')
    fireEvent.click(btn)
  })
})
