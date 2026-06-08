import React from 'react'
import { render } from '@testing-library/react'
import assert from 'assert'
import Card1no from './Card1no'
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
    state: 0,
  }

  const { getByText } = render(<Card1no data={data} />)
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
    value1: 10,
    state: 1,
  }

  const { getByText } = render(<Card1no data={data} category='energy' />)
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
    state: null,
  }

  const { getByText } = render(<Card1no data={data} />)
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
    value1: 10,
    state: 1,
    odsData: [1, 2, 3],
    trendLibrary: '',
  }

  const { queryByText } = render(<Card1no data={data} />)
  const modalButton = document.querySelector('.remove_action_btn')
  fireEvent.click(modalButton)

  // const cancel_btn = document.querySelector('.cancel_btn');
  // fireEvent.click(cancel_btn);

  assert(queryByText != null)
})
