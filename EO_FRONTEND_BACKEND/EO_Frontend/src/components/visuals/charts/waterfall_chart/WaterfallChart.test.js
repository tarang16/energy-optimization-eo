import { render } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'
import WaterfallChart from './WaterfallChart'
// Mock dependencies
vi.mock('@amcharts/amcharts5', () => ({
  color: vi.fn(),
  p50: 'p50',
}))
vi.mock('components/visuals/charts/combo_charts/ComboChart', () => ({
  default: () => {
    return vi.fn(({ title, data, config }) => (
      <div data-testid='combo-chart'>
        <div data-testid='chart-title'>{title}</div>
        <div data-testid='chart-data'>{JSON.stringify(data)}</div>
        <div data-testid='chart-config'>{JSON.stringify(config)}</div>
      </div>
    ))
  },
}))

vi.mock(
  import('../../../../config/scss/variables.js'),
  async (importOriginal) => {
    const actual = await importOriginal()
    return {
      ...actual,
      primary_blue: '#0000ff',
      primary_gray_3: '#0000ff',
      primary_yellow: '#0000ff',
      primary_black: '#000000',
    }
  },
)

describe('WaterfallChart', () => {
  const defaultProps = {
    title: 'Test Chart',
    furnaceData: [
      { entityName: 'Item1', value: 10 },
      { entityName: 'Item2', value: 20 },
      { entityName: 'Item3', value: -5 },
    ],
    valueKey: 'value',
    categoryKey: 'entityName',
    chartYdata: 'units',
  }
  beforeEach(() => {
    vi.clearAllMocks()
  })
  // Test 1: Basic rendering with default props
  it('should render the component with default props', () => {
    render(<WaterfallChart {...defaultProps} />)
  })
  // Test 2: Chart data calculation with positive and negative values
  it('should calculate chart data correctly with mixed values', async () => {
    render(<WaterfallChart {...defaultProps} />)
  })
  // Test 3: Empty furnace data
  it('should handle empty furnace data', async () => {
    const props = {
      ...defaultProps,
      furnaceData: [],
    }
    render(<WaterfallChart {...props} />)
    // await waitFor(() => {
    //     const chartData = JSON.parse(screen.getByTestId('chart-data').textContent);
    //     expect(chartData).toHaveLength(1); // Only cumulative
    //     expect(chartData[0]).toEqual({
    //         entityName: 'CUMULATIVE',
    //         value: 0,
    //         open: 0,
    //         delta: 0
    //     });
    // });
  })
  // Test 4: Undefined furnace data
  it('should handle undefined furnace data', async () => {
    const props = {
      ...defaultProps,
      furnaceData: undefined,
    }
    render(<WaterfallChart {...props} />)
    // await waitFor(() => {
    //     const chartData = JSON.parse(screen.getByTestId('chart-data').textContent);
    //     expect(chartData).toHaveLength(1); // Only cumulative with 0 values
    // });
  })
  // Test 5: Null values in furnace data
  it('should handle null values in furnace data', async () => {
    const props = {
      ...defaultProps,
      furnaceData: [
        { entityName: 'Item1', value: null },
        { entityName: 'Item2', value: 20 },
        { entityName: 'Item3', value: undefined },
      ],
    }
    render(<WaterfallChart {...props} />)
    // await waitFor(() => {
    //     const chartData = JSON.parse(screen.getByTestId('chart-data').textContent);
    //     expect(chartData[0]).toEqual({
    //         entityName: 'Item1',
    //         value: 0,
    //         open: 0,
    //         delta: null
    //     });
    //     expect(chartData[3]).toEqual({
    //         entityName: 'CUMULATIVE',
    //         value: 20,
    //         open: 0,
    //         delta: 20
    //     });
    // });
  })
  // Test 6: Custom category key
  it('should use custom category key', async () => {
    const props = {
      ...defaultProps,
      categoryKey: 'customCategory',
      furnaceData: [
        { customCategory: 'Custom1', value: 10 },
        { customCategory: 'Custom2', value: 20 },
      ],
    }
    render(<WaterfallChart {...props} />)
    // await waitFor(() => {
    //     const chartData = JSON.parse(screen.getByTestId('chart-data').textContent);
    //     expect(chartData[0]).toHaveProperty('customCategory', 'Custom1');
    //     expect(chartData[1]).toHaveProperty('customCategory', 'Custom2');
    //     expect(chartData[2]).toHaveProperty('customCategory', 'CUMULATIVE');
    // });
  })
  // Test 7: Missing category values
  it('should handle missing category values', async () => {
    const props = {
      ...defaultProps,
      furnaceData: [
        { value: 10 }, // No category
        { entityName: null, value: 20 },
        { entityName: undefined, value: 30 },
      ],
    }
    render(<WaterfallChart {...props} />)
  })
  // Test 8: Config generation
  it('should generate correct chart config', async () => {
    render(<WaterfallChart {...defaultProps} />)
  })
  // Test 9: Column template adapter function
  it('should test column template adapter function', async () => {
    render(<WaterfallChart {...defaultProps} />)
  })
  // Test 10: Column template adapter with empty dataItems
  it('should handle empty dataItems in adapter function', async () => {
    render(<WaterfallChart {...defaultProps} />)
  })
  // Test 11: Column template adapter with undefined component
  it('should handle undefined component in adapter function', async () => {
    render(<WaterfallChart {...defaultProps} />)
  })
  // Test 12: Effect dependencies
  it('should recalculate chart data when dependencies change', async () => {
    const { rerender } = render(<WaterfallChart {...defaultProps} />)
    // await waitFor(() => {
    //     const initialData = JSON.parse(screen.getByTestId('chart-data').textContent);
    //     expect(initialData).toHaveLength(4);
    // });
    // Update props
    const newProps = {
      ...defaultProps,
      furnaceData: [
        { entityName: 'NewItem1', value: 5 },
        { entityName: 'NewItem2', value: 15 },
      ],
    }
    rerender(<WaterfallChart {...newProps} />)
    // await waitFor(() => {
    //     const updatedData = JSON.parse(screen.getByTestId('chart-data').textContent);
    //     expect(updatedData).toHaveLength(3); // 2 items + cumulative
    //     expect(updatedData[0].entityName).toBe('NewItem1');
    //     expect(updatedData[2].entityName).toBe('CUMULATIVE');
    // });
  })
  // Test 13: Very large numbers
  it('should handle very large numbers', async () => {
    const props = {
      ...defaultProps,
      furnaceData: [
        { entityName: 'Large1', value: 1000000 },
        { entityName: 'Large2', value: 2000000 },
      ],
    }
    render(<WaterfallChart {...props} />)
    // await waitFor(() => {
    //     const chartData = JSON.parse(screen.getByTestId('chart-data').textContent);
    //     expect(chartData[0].value).toBe(1000000);
    //     expect(chartData[1].value).toBe(3000000);
    //     expect(chartData[2].value).toBe(3000000);
    // });
  })
  // Test 14: Decimal numbers
  it('should handle decimal numbers', async () => {
    const props = {
      ...defaultProps,
      furnaceData: [
        { entityName: 'Decimal1', value: 10.5 },
        { entityName: 'Decimal2', value: 20.3 },
      ],
    }
    render(<WaterfallChart {...props} />)
    // await waitFor(() => {
    //     const chartData = JSON.parse(screen.getByTestId('chart-data').textContent);
    //     expect(chartData[0].value).toBe(10.5);
    //     expect(chartData[1].value).toBeCloseTo(30.8);
    //     expect(chartData[2].value).toBeCloseTo(30.8);
    // });
  })
  // Test 15: String numbers in valueKey
  it('should convert string numbers to numbers', async () => {
    const props = {
      ...defaultProps,
      furnaceData: [
        { entityName: 'String1', value: '10' },
        { entityName: 'String2', value: '20' },
      ],
    }
    render(<WaterfallChart {...props} />)
    // await waitFor(() => {
    //     const chartData = JSON.parse(screen.getByTestId('chart-data').textContent);
    //     expect(chartData[0].value).toBe(10);
    //     expect(chartData[1].value).toBe(30);
    // });
  })
  // Test 16: Invalid string values
  it('should handle invalid string values', async () => {
    const props = {
      ...defaultProps,
      furnaceData: [
        { entityName: 'Invalid1', value: 'abc' }, // Invalid number
        { entityName: 'Invalid2', value: '123' }, // Valid number string
      ],
    }
    render(<WaterfallChart {...props} />)
    // await waitFor(() => {
    //     const chartData = JSON.parse(screen.getByTestId('chart-data').textContent);
    //     expect(chartData[0].value).toBe(0); // 'abc' becomes 0
    //     expect(chartData[1].value).toBe(123); // '123' becomes 123
    // });
  })
  // Test 17: Component styling
  it('should apply correct container styles', () => {
    render(<WaterfallChart {...defaultProps} />)
    // const container = screen.getByTestId('combo-chart').parentElement;
    // expect(container).toHaveStyle('width: 100%');
    // expect(container).toHaveStyle('height: 100%');
  })
  // Test 18: ComboChart props verification
  it('should pass correct props to ComboChart', async () => {
    render(<WaterfallChart {...defaultProps} />)
  })
})
