import React from 'react'
import { render } from '@testing-library/react'
import SingleTitleCard from './SingleTitleCardWithRightAction'
import assert from 'assert'
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
  const { getByText } = render(<SingleTitleCard title='TEST TITLE' />)
  assert(getByText('TEST TITLE'))
})
