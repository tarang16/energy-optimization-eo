import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import assert from 'assert'
import CauseTable from './CauseTable'
import { describe, it, test } from 'vitest'

const mockKpiData = {
  kpiType: 'performance',
  odsData: [
    {
      requestID: 4934,
      system: 'BOILER SYSTEM SUPPLY',
      deviationStatus: 'New',
      causeValueActual: 338.891765213207,
      causeValueOptimum: 345.433079131636,
      suggestion: 'Increase the Main steam temperature setpoint...',
      causeMessage: 'Main Steam Temperature Boiler B is low',
      causeUom: 'DEGC',
    },
  ],
}

describe('CauseTable Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<CauseTable kpiData={mockKpiData} />)
    assert.strictEqual(container.firstChild !== null, true)
  })

  it('renders without crashing with undefined kpiData', () => {
    const { container } = render(<CauseTable kpiData={undefined} />)
    assert.strictEqual(container.firstChild !== null, true)
  })

  it('renders without crashing with empty odsData', () => {
    const { container } = render(<CauseTable kpiData={{ odsData: [] }} />)
    assert.strictEqual(container.firstChild !== null, true)
  })

  //    test("Open workflow model by clicking alert icon", async () => {
  //      render(<CauseTable kpiData={mockKpiData} />);
  //      const suggestionImages = screen.getAllByRole("img")
  //      fireEvent.click(suggestionImages[0]);
  //    });
})
