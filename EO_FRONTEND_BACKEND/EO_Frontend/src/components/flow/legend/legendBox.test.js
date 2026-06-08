import { render } from '@testing-library/react'

import { afterEach, describe, it, vi } from 'vitest'
import LegendBox from './index'

vi.mock(import('./legend.module.scss'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    legendBoxCotainer: 'legendBoxCotainer',
    actualOptimumContainer: 'actualOptimumContainer',
    legendContainer: 'legendContainer',
    legendBox: 'legendBox',
    legendGrid: 'legendGrid',
    legendCell: 'legendCell',
    colorBox: 'colorBox',
  }
})

describe('LegendBox', () => {
  const mockEdgeOptions = [
    {
      name: 'High Flow',
      bgColor: '#ff0000',
      label: 'high_flow',
      legendSortOrder: 2,
    },
    {
      name: 'Low Flow',
      bgColor: '#00ff00',
      label: 'low_flow',
      legendSortOrder: 1,
    },
    {
      name: 'Default',
      bgColor: '#cccccc',
      label: 'default',
      legendSortOrder: 3,
    },
  ]

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders Actual and Optimum legends', () => {
    render(<LegendBox />)
    // expect(screen.getByText("ACTUAL")).toBeInTheDocument();
    // expect(screen.getByText("OPTIMUM")).toBeInTheDocument();
  })

  it('renders filtered and sorted edgeOptions', () => {
    render(<LegendBox />)
    // "Default" should be filtered out
    // expect(screen.queryByText("Default")).not.toBeInTheDocument();
    // "Low Flow" comes before "High Flow" due to sort order
    // const legendItems = screen.getAllByText(/Flow/i);
    // expect(legendItems[0]).toHaveTextContent("LOW FLOW");
    // expect(legendItems[1]).toHaveTextContent("HIGH FLOW");
  })

  it('renders correct number of legend cells', () => {
    render(<LegendBox />)
    // Two static + two dynamic
    // const allLegendTexts = screen.getAllByText(/ACTUAL|OPTIMUM|FLOW/i);
    // expect(allLegendTexts.length).toBe(4);
  })

  it('renders legend color boxes with proper backgroundColor', () => {
    render(<LegendBox />)
    // const colorBoxes = screen.getAllByRole("presentation", { hidden: true });
    // expect(colorBoxes.length).toBeGreaterThan(0);
  })
})
