import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TopTileTooltip from './TopTileTooltip'
// ---------------- MOCK utilities ----------------
vi.mock('utills/utilities', () => ({
  CompareValuesWithSymbol: vi.fn(() => true),
  formatWithUnitNum: vi.fn((v) => `FMT(${v})`),
  formatWithUnitNumNa: vi.fn((v) => `NA_FMT(${v})`),
  getValsBaseOnCondition: vi.fn((cond, val, fallback) =>
    cond ? val : fallback,
  ),
}))
import {
  CompareValuesWithSymbol,
  formatWithUnitNum,
  formatWithUnitNumNa,
  getValsBaseOnCondition,
} from 'utills/utilities'
// ---------------- HELPERS ----------------
const renderComp = (title, apiData = {}) =>
  render(<TopTileTooltip data={{ title }} apiData={apiData} />)
// ---------------- TESTS ----------------
describe('TopTileTooltip – 100% coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders PURCHASED ENERGY CONSUMPTION path', () => {
    renderComp('PURCHASED ENERGY CONSUMPTION', {
      energyConsumedElectricity: 10,
      energyConsumedFuel: 20,
      energyConsumedSteam: 30,
      reconciledEnergyConsumedElectricity: 5,
      reconciledEnergyConsumedFuel: 6,
      reconciledEnergyConsumedCrudeOil: 7,
    })
    expect(screen.getByText('PURCHASED ENERGY CONSUMPTION')).toBeInTheDocument()
    expect(formatWithUnitNum).toHaveBeenCalled()
    expect(formatWithUnitNumNa).toHaveBeenCalled()
    expect(CompareValuesWithSymbol).toHaveBeenCalled()
    expect(getValsBaseOnCondition).toHaveBeenCalled()
  })
  it('renders SEU ENPI NET path', () => {
    renderComp('SEU ENPI NET', {
      opportunity: -10,
      improvementPotential: 5,
    })
    expect(screen.getByText('SEU ENPI NET')).toBeInTheDocument()
    expect(screen.getAllByText('GJ').length).toBeGreaterThan(0)
    expect(formatWithUnitNum).toHaveBeenCalled()
    expect(getValsBaseOnCondition).toHaveBeenCalled()
  })
  it('renders AIR SYSTEM PERFORMANCE path', () => {
    renderComp('AIR SYSTEM PERFORMANCE', {
      motorsEnpiDollar: 10,
      turbinesENPIDollar: 20,
      motorsConsumptionGJ: 30,
      turbineConsumptionGJ: 40,
    })
    expect(screen.getByText('AIR SYSTEM PERFORMANCE')).toBeInTheDocument()
    expect(formatWithUnitNum).toHaveBeenCalled()
    expect(CompareValuesWithSymbol).toHaveBeenCalled()
    expect(getValsBaseOnCondition).toHaveBeenCalled()
  })
  it('renders COOLING WATER PERFORMANCE path', () => {
    renderComp('COOLING WATER PERFORMANCE', {
      cwEnergy: 10,
      cwENPI: 20,
      cwCost: 30,
      coolingWaterLoad: 100,
    })
    expect(screen.getByText('COOLING WATER PERFORMANCE')).toBeInTheDocument()
    expect(formatWithUnitNum).toHaveBeenCalled()
    expect(CompareValuesWithSymbol).toHaveBeenCalled()
    expect(getValsBaseOnCondition).toHaveBeenCalled()
  })
  it('renders STEAM SYSTEM LOSSES path', () => {
    renderComp('STEAM SYSTEM LOSSES', {
      steamVentsDollar: 10,
      steamLetDownDollar: 20,
      steamDumpedDollar: 30,
      steamVentGJ: 5,
      steamLetDownGJ: 6,
      steamDumpedGJ: 7,
      steamLossTargetDollar: 50,
      steamLossTargetGJ: 60,
    })
    expect(screen.getByText('STEAM SYSTEM LOSSES')).toBeInTheDocument()
    expect(formatWithUnitNum).toHaveBeenCalled()
    expect(CompareValuesWithSymbol).toHaveBeenCalled()
    expect(getValsBaseOnCondition).toHaveBeenCalled()
  })
  it('renders safely when title does not match any condition', () => {
    renderComp('UNKNOWN TITLE', {})
    expect(screen.getByText('UNKNOWN TITLE')).toBeInTheDocument()
    expect(formatWithUnitNum).not.toHaveBeenCalled()
    expect(getValsBaseOnCondition).not.toHaveBeenCalled()
  })
  it('handles null / undefined apiData safely', () => {
    render(<TopTileTooltip data={{ title: 'SEU ENPI NET' }} />)
    expect(screen.getByText('SEU ENPI NET')).toBeInTheDocument()
    expect(getValsBaseOnCondition).toHaveBeenCalled()
  })
})
