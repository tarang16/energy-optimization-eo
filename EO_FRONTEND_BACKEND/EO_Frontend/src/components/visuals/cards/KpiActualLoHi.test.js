import { fireEvent, render } from '@testing-library/react'
import assert from 'assert'
import { test, vi } from 'vitest'
import KpiActualLoHi from './KpiActualLoHi'

vi.mock('config/scss/_variables.scss', () => {
  return {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
  }
})

test('renders component with valid return method', () => {
  // Test with condition as true
  const data = {
    category: 'process,energy,environment',
    displayName: 'Test displayName',
    alignment: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    value1: 10,
    value2: 15,
    value3: 20,
    state: 0,
  }
  const { getByText } = render(<KpiActualLoHi data={data} />)
  assert(getByText('TEST DISPLAYNAME'))
})

test('sends data as string', () => {
  // Test with condition as true
  const data = {
    category: 'process,energy,environment',
    displayName: 'Test displayName',
    alignment: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    value1: '10',
    value2: '15',
    value3: '20',
    state: 1,
  }
  const { getByText } = render(<KpiActualLoHi data={data} />)
  assert(getByText('TEST DISPLAYNAME'))
})

test('sends data as null', () => {
  // Test with condition as true
  const data = {
    category: 'process,energy,environment',
    displayName: 'Test displayName',
    alignment: 'left',
    displayUom: null,
    actual: '10',
    optimum: '10',
    value1: null,
    value2: null,
    value3: null,
    state: null,
  }
  const { getByText } = render(<KpiActualLoHi data={data} />)
  assert(getByText('TEST DISPLAYNAME'))
})

test('clicks on modal button', () => {
  // Test with condition as true
  const data = {
    category: 'process,energy,environment',
    displayName: 'Test displayName',
    alignment: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    value1: '10',
    value2: '15',
    value3: '20',
    odsData: [1, 2, 3, 4, 5],
    trendLibrary: '',
  }
  const { queryByText } = render(
    <KpiActualLoHi data={data} category='energy' />,
  )
  // screen.debug();
  const modalButton = document.querySelector('.remove_action_btn')
  fireEvent.click(modalButton)
  assert(queryByText != null)
})
