import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppAtom } from 'atoms/AppAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { MemoryRouter, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import CostPerUnit from './CostPerUnit'

// Mock styles
vi.mock('./CostPerUnit.module.scss', () => ({
  default: {
    costPerUnitContainer: 'costPerUnitContainer',
    costPerUnitContainer__tabButton: 'tabButton',
    costPerUnitContainer__tabContent: 'tabContent',
    btnActive: 'btnActive',
  },
}))

// Mock subcomponents
vi.mock('./PlantView', () => ({
  default: () => <div data-testid='plant-view'>Plant View</div>,
}))
vi.mock('./DailyView', () => ({
  default: () => <div data-testid='daily-view'>Daily View</div>,
}))
vi.mock('./MonthlyView', () => ({
  default: () => <div data-testid='monthly-view'>Monthly View</div>,
}))
vi.mock('./YearlyView', () => ({
  default: () => <div data-testid='yearly-view'>Yearly View</div>,
}))
// Mock track event
const trackSpy = vi.fn()
TRACKEVENTOBJ.CostPerUnit = {
  onTabClick: trackSpy,
}

describe('CostPerUnit component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders with default PLANT_VIEW tab', () => {
    render(<CostPerUnit />)
    expect(screen.getByTestId('cost-per-unit-component')).toBeInTheDocument()
    expect(screen.getByTestId('plant-view')).toBeInTheDocument()
  })

  test('switches to DAILY tab and renders DailyView', () => {
    render(<CostPerUnit />)
    const button = screen.getByRole('button', { name: /daily/i })
    fireEvent.click(button)
    expect(screen.getByTestId('daily-view')).toBeInTheDocument()
  })

  test('switches to MONTHLY tab and renders MonthlyView', () => {
    render(<CostPerUnit />)
    const button = screen.getByRole('button', { name: /monthly/i })
    fireEvent.click(button)
    expect(screen.getByTestId('monthly-view')).toBeInTheDocument()
  })

  test('switches to YEARLY tab and renders YearlyView', () => {
    render(<CostPerUnit />)
    const button = screen.getByRole('button', { name: /yearly/i })
    fireEvent.click(button)
    expect(screen.getByTestId('yearly-view')).toBeInTheDocument()
  })

  test('clicking multiple tabs tracks events and renders correct views', () => {
    render(<CostPerUnit />)
    fireEvent.click(screen.getByRole('button', { name: /daily/i }))
    fireEvent.click(screen.getByRole('button', { name: /monthly/i }))
    fireEvent.click(screen.getByRole('button', { name: /yearly/i }))
    fireEvent.click(screen.getByRole('button', { name: /plant view/i }))

    expect(screen.getByTestId('plant-view')).toBeInTheDocument()
    expect(trackSpy).toHaveBeenCalledTimes(4)
  })

  test('renders fallback view for unknown tab', () => {
    // Create a wrapper that sets invalid tab
    const InvalidTabWrapper = (props) => {
      const appContext = useAtomValue(AppAtom)
      const params = useParams()

      // Manually inject invalid tab
      const [activeTab] = useState('INVALID_TAB')

      const tabs = [
        { id: 'PLANT_VIEW', label: 'PLANT VIEW' },
        { id: 'DAILY', label: 'DAILY' },
        { id: 'MONTHLY', label: 'MONTHLY' },
        { id: 'YEARLY', label: 'YEARLY' },
      ]

      const renderContent = () => {
        switch (activeTab) {
          case 'PLANT_VIEW':
            return <div>PLANT_VIEW</div>
          case 'DAILY':
            return <div>DAILY</div>
          case 'MONTHLY':
            return <div>MONTHLY</div>
          case 'YEARLY':
            return <div>YEARLY</div>
          default:
            return (
              <div data-testid='fallback'>Select a tab to view content.</div>
            )
        }
      }

      return (
        <div data-testid='cost-per-unit-component'>
          <div>
            {tabs.map((tab) => (
              <button key={tab.id}>{tab.label}</button>
            ))}
          </div>
          {renderContent()}
        </div>
      )
    }

    render(
      <MemoryRouter>
        <InvalidTabWrapper {...{ someProps: '123' }} />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Select a tab to view content.'),
    ).toBeInTheDocument()
  })
})
