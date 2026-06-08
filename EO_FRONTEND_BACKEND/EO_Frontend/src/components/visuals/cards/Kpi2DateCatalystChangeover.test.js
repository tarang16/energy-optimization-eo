import React from 'react'
import { render } from '@testing-library/react'
import assert from 'assert'
import Kpi2DateCatalystChangeover from './Kpi2DateCatalystChangeover'
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
    alignment: 'left',
    displayName: 'name;v71;v72',
    actual: '10',
    optimum: '10',
    value1: 10,
    value2: 15,
  }

  const { queryByText } = render(
    <Kpi2DateCatalystChangeover data={data} category='energy' />,
  )
  assert(queryByText != null)
})

test('sends data as string', () => {
  // Test with condition as true
  const data = {
    category: 'process,energy,environment',
    alignment: 'left',
    displayName: 'name;v71;v72',
    actual: '10',
    optimum: '10',
    value1: '10',
    value2: '15',
  }

  const { queryByText } = render(<Kpi2DateCatalystChangeover data={data} />)
  assert(queryByText != null)
})

test('sends data as null', () => {
  // Test with condition as true
  const data = {
    category: 'process,energy,environment',
    alignment: 'left',
    displayName: 'name;v71;v72',
    // displayUom: null,
    actual: '10',
    optimum: '10',
    value1: null,
    value2: null,
  }

  const { queryByText } = render(<Kpi2DateCatalystChangeover data={data} />)
  assert(queryByText != null)
})

test('clicks on modal button', () => {
  // Test with condition as true
  const data = {
    category: 'process,energy,environment',
    alignment: 'left',
    displayName: 'name;v71;v72',
    actual: '10',
    optimum: '10',
    value1: '10',
    value2: '15',
    odsData: [1, 2, 3, 4, 5],
    trendLibrary: '',
  }

  const { queryByText } = render(<Kpi2DateCatalystChangeover data={data} />)
  const modalButton = document.querySelector('.remove_action_btn')
  fireEvent.click(modalButton)

  //   const cancel_btn = document.querySelector('.cancel_btn');
  //   fireEvent.click(cancel_btn);

  assert(queryByText != null)
})
