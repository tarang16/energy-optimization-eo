import { render, screen, within } from '@testing-library/react'
import ScoreBoardTable from './ScoreBoardTable'
import assert from 'assert'
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

describe('ScoreBoardTable', () => {
  const columns = ['CUMULATIVE OPPORTUNITIES', 'ACTUAL']
  const data = [
    {
      title: 'PRODUCTION GAIN',
      uom: 'MT',
      actual: 816689,
    },
    {
      title: 'ENERGY REDUCTION',
      uom: 'MMBTU',
      actual: 5238548,
    },
    {
      title: 'CO<sub>2</sub> REDUCTION',
      uom: 'MT',
      actual: 589257,
    },
  ]

  it('renders ScoreBoardTable component with data', () => {
    render(<ScoreBoardTable columns={columns} data={data} />)

    // Check if the component renders properly
    assert(screen.getByText('PRODUCTION GAIN'))
    assert(screen.getByText('ENERGY REDUCTION'))

    const co2ReductionElements = screen.getAllByText((content, element) => {
      const hasText = (str) => element.textContent.includes(str)
      return hasText('CO') && hasText('2') && hasText('REDUCTION')
    })

    assert(co2ReductionElements.length > 0)
  })

  it('renders ScoreBoardTable component with no data', () => {
    render(<ScoreBoardTable columns={columns} data={[]} />)

    // Check if the component renders properly when there is no data
    assert(screen.queryByText('PRODUCTION GAIN') === null)
    assert(screen.queryByText('ENERGY REDUCTION') === null)

    const co2ReductionElements = screen.queryAllByText((content, element) => {
      const hasText = (str) => element.textContent.includes(str)
      return hasText('CO') && hasText('2') && hasText('REDUCTION')
    })

    assert(co2ReductionElements.length === 0)
  })
})
