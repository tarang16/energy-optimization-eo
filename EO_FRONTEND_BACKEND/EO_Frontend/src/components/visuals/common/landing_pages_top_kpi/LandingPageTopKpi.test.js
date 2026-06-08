import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { describe, test, vi } from 'vitest'
import { mock_LandingPageTopKpiData } from '../../../../index.test'
import LandingPagesTopKpi from './LandingPagesTopKpi'

const mockedUsedNavigate = vi.fn()

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: () => mockedUsedNavigate,
  }
})

describe('LandingPageTopKpi Component', () => {
  test('renders landing page top kpi component', async () => {
    let screen = ''
    act(() => {
      screen = render(
        <Router>
          <LandingPagesTopKpi
            data={mock_LandingPageTopKpiData}
            className=''
            handleSelect={() => undefined}
            category='energy'
            activeBoxes={[0]}
          />
        </Router>,
      )
    })
    await waitFor(() => {
      const kpiBox = screen.getAllByTestId('kpi-box')
      fireEvent.click(kpiBox[5])
      fireEvent.click(kpiBox[0])
    })
  })
})
