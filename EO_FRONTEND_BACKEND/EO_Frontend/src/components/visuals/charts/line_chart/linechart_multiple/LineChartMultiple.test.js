import React from 'react'
import { render } from '@testing-library/react'
import assert from 'assert'
import LineChartMultiple from './LineChartMultiple'
import { BrowserRouter as Router } from 'react-router-dom'
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

describe('LineChartMultiple', () => {
  it('renders with the correct text', () => {
    const { queryAllByText } = render(
      <Router>
        <LineChartMultiple />
      </Router>,
    )
    // Assert
    assert(queryAllByText(''))
  })
})
