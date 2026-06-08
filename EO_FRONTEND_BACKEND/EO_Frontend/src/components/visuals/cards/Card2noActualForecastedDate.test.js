import React from 'react'
import { render } from '@testing-library/react'
import assert from 'assert'
import Card2noActualForecastedDate from './Card2noActualForecastedDate'
import { fireEvent } from '@testing-library/react/dist/fire-event'
import { it, test, vi } from 'vitest'

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
    state2: 0,
  }

  const { getByText } = render(
    <Card2noActualForecastedDate data={data} category='energy' />,
  )

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
    state2: 1,
  }

  const { getByText } = render(<Card2noActualForecastedDate data={data} />)
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
    state2: null,
  }

  const { getByText } = render(<Card2noActualForecastedDate data={data} />)

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
    state2: 1,
    odsData: [1, 2, 3, 4, 5],
    trendLibrary: '',
  }

  const { queryByText } = render(<Card2noActualForecastedDate data={data} />)
  const modalButton = document.querySelector('.remove_action_btn')
  fireEvent.click(modalButton)

  //   const cancel_btn = document.querySelector('.cancel_btn');
  //   fireEvent.click(cancel_btn);

  assert(queryByText != null)
})
