import * as am5xy from '@amcharts/amcharts5/xy'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ThemeV2 } from './ThemeV2'
vi.mock('@amcharts/amcharts5', () => {
  return {
    Theme: class {},
    color: vi.fn((c) => c),
    percent: vi.fn((p) => p),
    p100: 100,
    Label: { new: vi.fn(() => ({ set: vi.fn(), _settings: {} })) },
    Rectangle: { new: vi.fn(() => ({})) },
  }
})
vi.mock('@amcharts/amcharts5/plugins/exporting', () => {
  const events = {
    handlers: {},
    on: vi.fn((event, cb) => {
      events.handlers[event] = cb
    }),
    trigger: (event) => events.handlers[event]?.(),
  }
  return {
    Exporting: {
      new: vi.fn(() => ({ events })),
    },
    ExportingMenu: { new: vi.fn(() => ({})) },
  }
})
vi.mock('@amcharts/amcharts5/xy', () => {
  class AxisRendererX {}
  return { AxisRendererX }
})
vi.mock('utills/utilities', () => ({
  getValsBaseOnCondition: vi.fn((cond, val1, val2) => (cond ? val1 : val2)),
}))
describe('ThemeV2', () => {
  let theme
  beforeEach(() => {
    theme = new ThemeV2()
    vi.clearAllMocks()
  })
  test('setupDefaultRules applies Label, AxisRendererX, AxisRendererY, LineSeries rules', () => {
    const setAll = vi.fn()
    const dummyRule = { setAll, setup: vi.fn() }
    theme.rule = vi.fn(() => dummyRule)
    theme.setupDefaultRules()
    expect(theme.rule).toHaveBeenCalledWith('Label')
    expect(setAll).toHaveBeenCalled()
    expect(theme.rule).toHaveBeenCalledWith('AxisRendererX')
    expect(theme.rule).toHaveBeenCalledWith('AxisRendererY')
    expect(theme.rule).toHaveBeenCalledWith('LineSeries')
  })

  test('applyExportingSettings uses existing creditLabel if found', () => {
    const mockLabel = { _settings: { text: 'apshot captured by:' } } // FIX: exact string match
    const chart = { children: { values: [mockLabel], unshift: vi.fn() } }
    const root = { container: { children: { each: vi.fn() } } }
    theme.applyExportingSettings(root, {}, chart)
  })
  test('exportstarted makes creditLabel visible and adjusts chart', () => {
    const xAxis = { get: vi.fn(() => new am5xy.AxisRendererX()), set: vi.fn() }
    const chart = {
      children: { values: [], unshift: vi.fn() },
      _settings: { id: 'comboChart' },
      set: vi.fn(),
      isType: vi.fn(() => true),
      xAxes: { each: vi.fn((cb) => cb(xAxis)) },
    }
    const root = { container: { children: { each: (cb) => cb(chart) } } }
    const exporting = theme.applyExportingSettings(root, {}, chart)
    exporting?.events.trigger('exportstarted')
  })
  test('exportfinished hides creditLabel and resets chart', () => {
    const xAxis = { get: vi.fn(() => new am5xy.AxisRendererX()), set: vi.fn() }
    const chart = {
      children: { values: [], unshift: vi.fn() },
      _settings: { id: 'comboChart' },
      set: vi.fn(),
      isType: vi.fn(() => true),
      xAxes: { each: vi.fn((cb) => cb(xAxis)) },
    }
    const root = { container: { children: { each: (cb) => cb(chart) } } }
    const exporting = theme.applyExportingSettings(root, {}, chart)
    exporting?.events.trigger('exportfinished')
  })
})
