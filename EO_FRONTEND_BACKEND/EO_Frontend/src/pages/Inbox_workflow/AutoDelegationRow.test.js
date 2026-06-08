import { fireEvent, render, screen } from '@testing-library/react'
import moment from 'moment'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Row, { customStyles } from './AutoDelegationRow'
vi.mock('components/ui/search_bar/SearchBar', () => ({
  default: ({ onSearch }) => (
    <button
      data-testid='searchbar'
      onClick={() => onSearch({ employeeId: 123, label: 'John Doe' })}
    >
      SearchBar
    </button>
  ),
}))
vi.mock('components/ui/switch/Switch', () => ({
  default: ({ checked, onChange }) => (
    <input
      data-testid='switch'
      type='checkbox'
      checked={checked}
      onChange={onChange}
    />
  ),
}))
vi.mock('react-datepicker', () => ({
  default: ({ onChange }) => (
    <button
      data-testid='datepicker'
      onClick={() => onChange(new Date('2025-01-01'))}
    >
      DatePicker
    </button>
  ),
}))
vi.mock('utills/utilities', () => ({
  getKSAMomentWithTimeAsZero: (date) => moment(date).startOf('day'),
}))
vi.mock('./AutoDelegation.function', () => ({
  formatDate: (date) => `formatted-${date.valueOf()}`,
}))
vi.mock(import('./AutoDelegation.module.scss'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    DatePickerContainer: 'date-container',
    InputContainer: 'input-container',
  }
})
const baseRow = {
  assigneToName: 'Alice',
  active: true,
  notAvailableUptoEpoch: null,
  affiliateId: 'AFF-1',
}
const setup = (override = {}) => {
  const setDelegateData = vi.fn()
  const delegateData = [{ ...baseRow, ...override }]
  render(
    <table>
      <tbody>
        <Row
          data={delegateData[0]}
          index={0}
          delegateData={delegateData}
          setDelegateData={setDelegateData}
        />
      </tbody>
    </table>,
  )
  return { setDelegateData }
}
describe('AutoDelegation Row', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders SearchBar when active', () => {
    setup({ active: true })
    expect(screen.getByTestId('searchbar')).toBeInTheDocument()
  })
  it('renders disabled input when inactive', () => {
    setup({ active: false })
    expect(screen.getByPlaceholderText('Search..')).toBeDisabled()
  })
  it('handles RC (SearchBar) change', () => {
    const { setDelegateData } = setup()
    fireEvent.click(screen.getByTestId('searchbar'))
    const updated = setDelegateData.mock.calls[0][0][0]
    expect(updated.assignedTo).toBe('123')
    expect(updated.assignedToEmployeeName).toBe('John Doe')
  })
  it('handles date change', () => {
    const { setDelegateData } = setup()
    fireEvent.click(screen.getByTestId('datepicker'))
    const updated = setDelegateData.mock.calls[0][0][0]
  })
  it('handles active toggle', () => {
    const { setDelegateData } = setup({ active: true })
    fireEvent.click(screen.getByTestId('switch'))
    const updated = setDelegateData.mock.calls[0][0][0]
    expect(updated.active).toBe(false)
  })
})
describe('customStyles', () => {
  const provided = { test: true }
  it('control style', () => {
    const res = customStyles.control(provided)
    expect(res.height).toBe('4.5vmin')
  })
  it('input style', () => {
    const res = customStyles.input(provided)
    expect(res.margin).toBe('0')
  })
  it('menu style', () => {
    const res = customStyles.menu(provided)
    expect(res.marginTop).toBe('0')
  })
  it('valueContainer style', () => {
    const res = customStyles.valueContainer(provided)
    expect(res.padding).toBe('1vmin')
  })
  it('option style (focused)', () => {
    const res = customStyles.option(provided, {
      isFocused: true,
      isSelected: false,
    })
    expect(res.cursor).toBe('pointer')
  })
  it('option style (not focused)', () => {
    const res = customStyles.option(provided, {
      isFocused: false,
      isSelected: false,
    })
    expect(res.fontSize).toBe('1.4vmin')
  })
  it('indicatorsContainer style', () => {
    const res = customStyles.indicatorsContainer(provided)
    expect(res.display).toBe('flex')
  })
  it('menuPortal style', () => {
    const res = customStyles.menuPortal(provided)
    expect(res.zIndex).toBe(9999)
  })
})
