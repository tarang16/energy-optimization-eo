import React from 'react'
import { render } from '@testing-library/react'
import assert from 'assert'
import CustomModal from './CustomModal'
import { describe, it, test, vi } from 'vitest'

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

describe('CustomModal component', () => {
  it('renders CustomModal', () => {
    const { queryAllByText } = render(<CustomModal />)
    assert(queryAllByText != undefined)
  })
})
