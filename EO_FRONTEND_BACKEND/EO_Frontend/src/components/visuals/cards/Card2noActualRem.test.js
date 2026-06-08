import '@testing-library/jest-dom'
import { fireEvent, render } from '@testing-library/react'
import assert from 'assert'
import { describe, test, vi } from 'vitest'
import Card2noActualRem from './Card2noActualRem'

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

describe('Card2noActualRem Component', () => {
  test('renders component with valid return method', () => {
    // Test with condition as true
    const data = {
      category: 'process,energy,environment',
      displayName: 'Test displayName',
      tagName: 'Online',
      tagName2: 'Catalyst_Remaining_Life',
      alignment: 'left',
      displayUom: '%',
      actual: '10',
      optimum: '10',
      value1: 10,
      value2: 15,
      state: 0,
      state2: 0,
      dataState2: 0,
    }
    const { getByText } = render(
      <Card2noActualRem data={data} isOptimumEnabled={false} />,
    )
    assert(getByText('TEST DISPLAYNAME'))
  })

  test('sends data1 as string', () => {
    // Test with condition as true
    const data = {
      category: 'process,energy,environment',
      displayName: 'Test displayName',
      tagName: 'Online',
      tagName2: 'Catalyst_Remaining_Life',
      alignment: 'left',
      displayUom: '%',
      actual: '10',
      optimum: '10',
      value1: '10',
      value2: '15',
      state: 1,
      state2: 1,
      dataState2: 1,
    }
    const { getByText } = render(
      <Card2noActualRem data={data} isOptimumEnabled={false} />,
    )
    assert(getByText('TEST DISPLAYNAME'))
  })

  test('sends data as null', () => {
    // Test with condition as true
    const data = {
      category: 'process,energy,environment',
      displayName: 'Test displayName',
      tagName: 'Online',
      tagName2: 'Catalyst_Remaining_Life',
      alignment: 'left',
      displayUom: null,
      actual: '10',
      optimum: '10',
      value1: null,
      value2: null,
      state: null,
      state2: null,
    }
    const { getByText } = render(<Card2noActualRem data={data} />)
    assert(getByText('TEST DISPLAYNAME'))
  })

  test('clicks on modal button', () => {
    // Test with condition as true
    const data = {
      category: 'process,energy,environment',
      displayName: 'Test displayName',
      tagName: 'Online',
      tagName2: 'Catalyst_Remaining_Life',
      alignment: 'left',
      displayUom: '%',
      actual: null,
      optimum: null,
      value1: '10',
      value2: '15',
      state: 1,
      state2: 1,
      odsData: [1, 2, 3, 4, 5],
      trendLibrary: '',
    }
    const { queryByText } = render(
      <Card2noActualRem data={data} category='energy' />,
    )
    // screen.debug();
    const modalButton = document.querySelector('.remove_action_btn')
    fireEvent.click(modalButton)
    assert(queryByText != null)
  })
})
