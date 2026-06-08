// ============================================================
// FILE 4: HealthCheck.test.jsx
// ============================================================
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import { ROLES } from 'config/Config'
import { useAtomValue } from 'jotai'
import { BrowserRouter as Router } from 'react-router-dom'
import { showToast } from 'utills/utilities'
import { describe, expect, it, vi } from 'vitest'
import HealthCheck from './HealthCheck'
const mockData = [
  {
    affiliateName: 'Affiliate1',
    plantName: 'Plant1',
    systemName: 'System1',
    caseStatus: 1,
    lastruntimeEpoch: 1627891200,
    diffInMinute: 30,
    caseStatusMessage:
      'All systems are functioning within normal parameters and no issues have been detected in the last operational cycle.',
    piTag: 'Tag1',
  },
]
const tokenAtom = {
  decodedToken: {
    role: ROLES.ADMIN,
  },
}
vi.mock('moment', () => ({
  default: (input) => ({
    tz: () => ({
      format: () => '01-Jan-2024 10:00 AM',
    }),
  }),
}))
vi.mock('config/scss/_variables.scss', () => ({
  default: {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
  },
}))
vi.mock('components/visuals/dropdown/multi_select/MultiSelectV2', () => ({
  default: (props) => (
    <select
      data-testid='single-select-click'
      multiple
      onChange={(e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(
          (option) => ({ display_name: option.value, tag_name: option.value }),
        )
        props.onChange(selectedOptions)
      }}
    >
      {props.data.map((item, index) => (
        <option key={index} value={item.display_name}>
          {item.display_name}
        </option>
      ))}
    </select>
  ),
}))
vi.mock('components/visuals/health_status_info/HealthStatusInfo', () => ({
  default: () => <div data-testid='health-status-info'></div>,
}))
vi.mock('services/HealthInfraService')
vi.mock('utills/utilities', () => ({
  getAuthTokenLocal: vi.fn(),
  showToast: vi.fn(),
  convertFormulaToHtml: vi.fn(),
  genRandomNumber: vi.fn(),
  getTrackingObj: vi.fn(),
  uuid4: vi.fn(() => 'mock-uuid'),
  getUserTimeValue: vi.fn(() => 'mock-time'),
}))
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})
const renderComponent = () => {
  return render(
    <Router>
      <HealthCheck />
    </Router>,
  )
}
describe('HealthCheck Component', () => {
  it('redirects non-admin users to home page', async () => {
    renderComponent()
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        'NOT AUTHORIZED TO VIEW THE RESOURCE, NAVIGATING TO MAIN PAGE.',
      )
    })
  })
  it('test with admin user', async () => {
    const appContextData = {
      caseData: [
        { affiliate: 'Affiliate1', case_id: '1' },
        { affiliate: 'Affiliate2', case_id: '2' },
      ],
    }
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === AppAtom) return appContextData
      if (atom === TokenAtom) return { role: ROLES.ADMIN }
      return null
    })
    renderComponent()
  })
  it('populates dropdown with context data', async () => {
    const appContextData = {
      caseData: [
        { affiliate: 'Affiliate1', case_id: '1' },
        { affiliate: 'Affiliate2', case_id: '2' },
      ],
    }
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === AppAtom) return appContextData
      if (atom === TokenAtom) return tokenAtom
      return null
    })
    renderComponent()
    const singleSelectEvents = screen.getAllByTestId('single-select-click')
    fireEvent.click(singleSelectEvents[0])
    const DropDownffiliates = document.querySelectorAll(
      '#single-select-icon-click',
    )
    fireEvent.click(DropDownffiliates[0])
    fireEvent.click(DropDownffiliates[1])
  })
})
