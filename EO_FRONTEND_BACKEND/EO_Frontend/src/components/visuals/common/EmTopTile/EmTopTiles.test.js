import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { AppAtom } from 'atoms/AppAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { Provider as JotaiProvider } from 'jotai'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import EmTopTiles from './EmTopTiles'

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: vi.fn(),
    NavLink: ({ children, ...props }) => <a {...props}>{children}</a>,
  }
})

vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    EmTopTiles: {
      onTileClick: vi.fn(),
    },
  },
}))

describe('EmTopTiles', () => {
  const mockData = [
    {
      id: '1',
      key: 'plant_status',
      value: 1,
      urlKey: 'plant1',
      icon: 'icon1.svg',
      title: 'Plant Status',
      uom: 'units',
      showTooltip: true,
      tooltipdatakey: 'tooltip1',
      reconciled: true,
      reconciledVal: 123.456,
    },
    {
      id: '2',
      key: 'some_metric',
      value: 50,
      targetVal: 40,
      urlKey: 'metric2',
      icon: null,
      title: 'Some Metric',
      uom: 'kWh',
      showTooltip: false,
      reconciled: false,
    },
  ]

  const mockAppAtom = { caseData: { id: 'case123' } }

  const renderComponent = (data = mockData, className = '') => {
    TRACKEVENTOBJ.EmTopTiles.onTileClick.mockClear()

    return render(
      <JotaiProvider initialValues={[[AppAtom, mockAppAtom]]}>
        <MemoryRouter>
          <EmTopTiles data={data} className={className} />
        </MemoryRouter>
      </JotaiProvider>,
    )
  }

  it('renders Loader if data is not array or missing', () => {
    const { container } = renderComponent(null)
  })

  it('renders correct number of tiles', () => {
    renderComponent()
    const boxes = screen.getAllByTestId('em-kpi-box')
    expect(boxes.length).toBe(mockData.length)
  })

  it('displays "ONLINE" or "OFFLINE" for plant_status key', () => {
    renderComponent()
    expect(screen.getByText('ONLINE')).toBeInTheDocument()
  })

  it('displays formatted title with HTML for other keys', () => {
    renderComponent()
    expect(screen.getByText('Some Metric')).toBeInTheDocument()
  })

  it('applies correct color class based on value and targetVal', () => {
    renderComponent()

    const orangeClass = 'color_primary_orange'
    const blueClass = 'color_primary_blue'

    // The second mockData item value(50) > targetVal(40) => orange color
    const metricBox = screen
      .getAllByTestId('em-kpi-box')[1]
      .querySelector('span.text-18-regular')
    expect(metricBox.className).toMatch(new RegExp(orangeClass))

    // The first mockData item has no targetVal => primary gray color (we can check the class contains 'color_primary_gray')
    const plantBox = screen
      .getAllByTestId('em-kpi-box')[0]
      .querySelector('span.text-18-regular')
    expect(plantBox.className).toMatch(/color_primary_gray/)
  })

  it('shows tooltip icon if showTooltip is true', () => {
    renderComponent()
    const tooltipImgs = screen.getAllByAltText('')
    // There should be at least one info icon
    expect(tooltipImgs.length).toBeGreaterThan(0)
  })

  it('renders reconciled section if reconciled is true', () => {
    renderComponent()
    expect(screen.getByText(/RECONCILED/i)).toBeInTheDocument()
    expect(screen.getByText('123.46')).toBeInTheDocument() // reconciledVal formatted to 2 decimals
  })
})
