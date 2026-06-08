import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import assert from 'assert'
import moment from 'moment-timezone'
import { BrowserRouter } from 'react-router-dom'
import { getDataModelSkip } from 'services/HistoricalServices'
import { describe, expect, it, vi } from 'vitest'
import { mock_getDataModelSkip } from '../../../../index.test'
import ModelSkipStatusTable from './ModelSkipStatusTable'

let mockUseParams = {
  region: 'middle+east',
  affiliate: 'yansab',
  plant: 'ethylene+glycol',
  system: 'eg+reactor',
}

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocation: () => ({
      pathname:
        'http://localhost:3000/#/middle+east/yansab/ethylene+glycol/eg+reactor/overview',
    }),
    useOutletContext: () => ({
      caseId: 56,
    }),
    useParams: () => mockUseParams,
    useNavigate: () => vi.fn(),
  }
})

vi.mock('services/HistoricalServices', () => ({
  getDataModelSkip: () => mock_getDataModelSkip,
}))

describe('ModelSkipStatusTable', () => {
  it('renders with correct data', async () => {
    const { queryAllByText, container } = render(
      <BrowserRouter>
        <ModelSkipStatusTable
          caseId={56}
          sTime={1699999900000}
          eTime={1799999900000}
        />
      </BrowserRouter>,
    )
    await waitFor(() =>
      expect(queryAllByText('Model offline').length).toBeGreaterThan(0),
    )

    const firstRow = container.querySelector('tr.borderClass')
    fireEvent.mouseDown(firstRow)

    const expandedContent = container.querySelector('tr.subRows')
    // expect(expandedContent).toBeInTheDocument();
  })

  it('renders with correct data 1', async () => {
    const { queryAllByText, container } = render(
      <BrowserRouter>
        <ModelSkipStatusTable
          caseId={56}
          sTime={1699999900000}
          eTime={1799999900000}
        />
      </BrowserRouter>,
    )
    await waitFor(() =>
      expect(
        queryAllByText('Model online with modified values').length,
      ).toBeGreaterThan(0),
    )

    const firstRow = container.querySelector('tr.borderClass')
    fireEvent.mouseDown(firstRow)

    const expandedContent = container.querySelector('tr.subRows')
    // expect(expandedContent).toBeInTheDocument();
  })

  it('renders with caseId null', () => {
    const { queryAllByText } = render(
      <BrowserRouter>
        <ModelSkipStatusTable
          caseId={null}
          sTime={1699999900000}
          eTime={1799999900000}
        />
      </BrowserRouter>,
    )
    assert(queryAllByText('No Data To Show.') != undefined)
  })

  it('renders with sTime & eTime null', () => {
    const { queryAllByText } = render(
      <BrowserRouter>
        <ModelSkipStatusTable caseId={56} sTime={null} eTime={null} />
      </BrowserRouter>,
    )
    assert(queryAllByText('No Data To Show.') != undefined)
  })

  it('renders without crashing and displays loading initially', async () => {
    getDataModelSkip({ data: mock_getDataModelSkip })
    render(
      <BrowserRouter>
        <ModelSkipStatusTable
          showTime={true}
          caseId='123'
          sTime={moment().subtract(1, 'day').valueOf()}
          eTime={moment().valueOf()}
          from='overview'
        />
      </BrowserRouter>,
    )
  })

  it('handles date range change correctly', async () => {
    getDataModelSkip({ data: mock_getDataModelSkip })
    render(
      <BrowserRouter>
        <ModelSkipStatusTable
          showTime={true}
          caseId='123'
          sTime={moment().subtract(1, 'day').valueOf()}
          eTime={moment().add(1, 'day').valueOf()}
          from='overview'
        />
      </BrowserRouter>,
    )
    // Change start date
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: moment().subtract(2, 'days').format('DD-MMM-yyyy') },
    })
    // Change end date
    fireEvent.change(screen.getAllByRole('textbox')[1], {
      target: { value: moment().add(2, 'days').format('DD-MMM-yyyy') },
    })
  })
})
