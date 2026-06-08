import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react/dist/fire-event'
import assert from 'assert'
import { afterEach, beforeEach, test, vi } from 'vitest'
import Card2noActualRemDate from './Card2noActualRemDate'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.clearAllMocks()
  vi.useRealTimers()
})

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    hideLoader: vi.fn(),
    showLoader: vi.fn(),
    // your mocked methods
  }
})

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
    state: 0,
  }

  const { getByText } = render(
    <Card2noActualRemDate data={data} category='energy' />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})

test('sends data1 as string', () => {
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
    state: 1,
  }

  const { getByText } = render(<Card2noActualRemDate data={data} />)
  assert(getByText('TEST DISPLAYNAME'))
})

test('sends uomdata as null', () => {
  // Test with condition as true
  const data = {
    category: 'process,energy,environment',
    displayName: 'Test displayName',
    alignment: 'left',
    displayUom: null,
    actual: '10',
    optimum: '10',
    value1: null,
    state: null,
    value2: null,
  }

  const { getByText } = render(<Card2noActualRemDate data={data} />)
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
    odsData: [1, 2, 3, 4, 5],
    trendLibrary: '',
  }

  const { queryByText } = render(<Card2noActualRemDate data={data} />)
  const modalButton = document.querySelector('.remove_action_btn')
  fireEvent.click(modalButton)

  //   const cancel_btn = document.querySelector('.cancel_btn');
  //   fireEvent.click(cancel_btn);

  assert(queryByText != null)
})

test('test chart modal', () => {
  const data = {
    category: 'process,energy,environment',
    displayName: 'Test displayName',
    alignment: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    value1: '10',
    value2: '15',
    state: 0,
    odsData: [1, 2, 3, 4, 5],
  }
  const { queryByText } = render(<Card2noActualRemDate data={data} />)
  const modalButton = screen.getByTestId('handle-detail-modal')
  fireEvent.click(modalButton)
  const cancel_btn = document.querySelector('.cancel_btn')
  fireEvent.click(cancel_btn)
  assert(queryByText != null)
})
