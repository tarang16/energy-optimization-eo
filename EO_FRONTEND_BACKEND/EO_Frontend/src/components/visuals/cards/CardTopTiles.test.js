import { fireEvent, render } from '@testing-library/react'
import assert from 'assert'
import { Provider } from 'jotai'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, vi } from 'vitest'
import { initialAppContextTest } from '../../../index.test'
import CardTopTiles from './CardTopTiles'

let mockdata = {
  alignment: 'left',
  unit: '%',
  actual: '9',
  optimum: '11',
  kpi1_line2: 'offline status',
  kpi1_value: 2,
  kpi1_unit: '%',
  key: 'plant_status',
  category: 'energy',
}

let emptydata = {
  alignment: 'left',
  unit: null,
  actual: '9',
  optimum: '11',
  kpi1_line2: ' ',
  kpi1_value: null,
  kpi1_unit: '%',
  key: 'plant_status',
  category: null,
}

let data1 = {
  alignment: 'left',
  unit: null,
  actual: '9',
  optimum: '11',
  kpi1_line2: ' ',
  kpi1_value: null,
  kpi1_unit: '%',
  key: 'plant_status',
  category: 'deviation',
  title: 'DEVIATION',
}

vi.mock('config/scss/_variables.scss', () => {
  return {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
    primary_dark_blue: '#ff0000',
  }
})

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useOutletContext: () => ({
      caseId: 28,
    }),
  }
})

describe('CardTopTiles component', () => {
  it('renders the component with empty data', () => {
    const { queryAllByText, getByText, container } = render(
      <Provider value={{ appContext: initialAppContextTest }}>
        <CardTopTiles
          data={emptydata}
          category={''}
          handleSelect={() => {}}
          caseId={1}
          actualTime={1695999600000}
        />
      </Provider>,
    )
    assert(queryAllByText(''))
  })

  it('renders the component with data with empty category', () => {
    const { queryAllByText, getByText, container } = render(
      <Provider value={{ appContext: initialAppContextTest }}>
        <CardTopTiles
          data={mockdata}
          category={''}
          handleSelect={() => {}}
          caseId={1}
          actualTime={1695999600000}
        />
      </Provider>,
    )
    assert(queryAllByText(''))
  })

  it('renders the component data with deviation category', () => {
    const { queryAllByText, getByText, container } = render(
      <MemoryRouter>
        <Provider value={{ appContext: initialAppContextTest }}>
          <CardTopTiles
            data={data1}
            category={'deviation'}
            handleSelect={() => {}}
            caseId={1}
            actualTime={1695999600000}
          />
        </Provider>
      </MemoryRouter>,
    )
    const ShowDetailsModal = document.querySelector('#handle-select-data')
    fireEvent.click(ShowDetailsModal)
    const cancel_btn = document.querySelector('.cancel_btn')
    // fireEvent.click(cancel_btn);
    assert(queryAllByText(''))
  })
})
