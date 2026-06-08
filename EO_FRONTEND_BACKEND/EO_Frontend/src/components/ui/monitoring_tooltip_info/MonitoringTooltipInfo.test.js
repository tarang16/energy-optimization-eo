import { render } from '@testing-library/react'
import assert from 'assert'
import { convertFormulaToHtml } from 'utills/utilities'
import { describe, it, vi } from 'vitest'
import MonitoringTooltipInfo from './MonitoringTooltipInfo'

vi.mock('utills/utilities', () => ({
  convertFormulaToHtml: vi.fn(),
}))

describe('MonitoringTooltipInfo', () => {
  it('renders with performance and match data', () => {
    const data = [
      {
        category: 'performance',
        tagName: 'tag1',
        parameter: 'param1',
        uom: 'uom1',
        actual: 1,
        optimum: 2,
      },
      {
        category: 'match',
        tagName: 'tag2',
        parameter: 'param2',
        uom: 'uom2',
        actual: 3,
        optimum: 4,
      },
    ]
    convertFormulaToHtml.mockReturnValue('Mocked Formula')
    const { getByText } = render(<MonitoringTooltipInfo data={data} />)
    // Check if the component renders the expected content
    assert(getByText('OPTIMIZATION OBJECTIVE'))
    assert(getByText('OPTIMIZATION CONDITION'))
    // Check if the convertFormulaToHtml function is called with the correct arguments
    assert.strictEqual(convertFormulaToHtml.mock.calls[0][0], 'PARAM1')
    assert.strictEqual(convertFormulaToHtml.mock.calls[1][0], '(UOM1)')
    assert.strictEqual(convertFormulaToHtml.mock.calls[2][0], 'PARAM2')
    assert.strictEqual(convertFormulaToHtml.mock.calls[3][0], '(UOM2)')
  })

  it('renders with performance and match data null or undefined optimum', () => {
    const data = [
      {
        category: 'performance',
        tagName: 'tag1',
        parameter: 'param1',
        uom: 'uom1',
        actual: 1,
      },
      {
        category: 'match',
        tagName: 'tag2',
        parameter: 'param2',
        uom: 'uom2',
        actual: 3,
      },
    ]
    convertFormulaToHtml.mockReturnValue('Mocked Formula')
    const { getByText } = render(<MonitoringTooltipInfo data={data} />)
    // Check if the component renders the expected content
    assert(getByText('OPTIMIZATION OBJECTIVE'))
    assert(getByText('OPTIMIZATION CONDITION'))
    // Check if the convertFormulaToHtml function is called with the correct arguments
    assert.strictEqual(convertFormulaToHtml.mock.calls[0][0], 'PARAM1')
    assert.strictEqual(convertFormulaToHtml.mock.calls[1][0], '(UOM1)')
    assert.strictEqual(convertFormulaToHtml.mock.calls[2][0], 'PARAM2')
    assert.strictEqual(convertFormulaToHtml.mock.calls[3][0], '(UOM2)')
  })

  it('renders with performance and match data null or undefined actual & unit', () => {
    const data = [
      {
        category: 'performance',
        tagName: 'tag1',
        parameter: 'param1',
        optimum: 2,
      },
      { category: 'match', tagName: 'tag2', parameter: 'param2', optimum: 4 },
    ]
    convertFormulaToHtml.mockReturnValue('Mocked Formula')
    const { getByText } = render(<MonitoringTooltipInfo data={data} />)
    // Check if the component renders the expected content
    assert(getByText('OPTIMIZATION OBJECTIVE'))
    assert(getByText('OPTIMIZATION CONDITION'))
    // Check if the convertFormulaToHtml function is called with the correct arguments
    assert.strictEqual(convertFormulaToHtml.mock.calls[0][0], 'PARAM1')
  })

  it('renders with empty arrey data', () => {
    const { getByText } = render(<MonitoringTooltipInfo data={[]} />)
    // Check if the component renders the expected content when data is empty
    assert(getByText('OPTIMIZATION OBJECTIVE'))
    assert(getByText('OPTIMIZATION CONDITION'))
  })

  it('renders with empty data', () => {
    const { getByText } = render(<MonitoringTooltipInfo />)
    // Check if the component renders the expected content when data is empty
    assert(getByText('OPTIMIZATION OBJECTIVE'))
    assert(getByText('OPTIMIZATION CONDITION'))
  })
})
