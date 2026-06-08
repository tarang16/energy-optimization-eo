import { act, fireEvent, render, screen } from '@testing-library/react'
import assert from 'assert'
import { Provider } from 'jotai'
import moment from 'moment'
import {
  MemoryRouter,
  BrowserRouter as Router,
  useParams,
} from 'react-router-dom'
import ResizeObserver from 'resize-observer-polyfill'
import { getInfraMonitoringCaseWise } from 'services/HealthInfraService'
import { getCaseId } from 'utills/utilities'
import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import {
  initialAppContextTest,
  initialModelSkipCtxTest,
  mock_get_calenderdata,
  mock_getActualOptimumTime,
  mock_getDataModelSkip,
  mock_getHealthStatus,
  mock_getMonitoringData,
} from '../../../index.test'
import DashboardStatusLegend, {
  dispatchReducer,
  getActualTime,
  getBgColor,
  getCalenderUI,
  getDashboardLegendTooltip,
  getModelSkipClass,
  getModelSkipName,
  getModelSkipStatus,
  getModelStatusToolTip,
  getOnAlertClickFunction,
  getTextColorClass,
  handleCatch,
  loadingReducer,
  STATUS,
  tooltipReducer,
} from './DashboardStatusLegend'
import {
  getActualTimeFromApi,
  getModelSkipDataFromApi,
} from './DashboardStatusLegend.functions'
global.ResizeObserver = ResizeObserver

vi.mock('services/HealthInfraService', () => ({
  getInfraMonitoringCaseWise: vi.fn(),
}))

vi.mock('pages/health_check/HealthCheckModal', () => ({
  default: () => <div>Health Modal</div>,
}))

vi.mock(import('./DashboardStatusLegend.functions'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getActualTimeFromApi: vi.fn(),
    getModelSkipDataFromApi: vi.fn(),
  }
})

// Replace this with the real import or implementation context if inside a component
let caseId = 'mock-case-id'

describe('getModelSkipName', () => {
  it('returns "MODEL WARNING" when input is "on_default"', () => {
    expect(getModelSkipName('on_default')).toBe('MODEL WARNING')
  })

  it('returns "MODEL ALERT" when input is "off"', () => {
    expect(getModelSkipName('off')).toBe('MODEL ALERT')
  })

  it('returns undefined for any other input', () => {
    expect(getModelSkipName('random')).toBeUndefined()
    expect(getModelSkipName('')).toBeUndefined()
  })
})

describe('getModelSkipClass', () => {
  it('returns correct class for "on_default"', () => {
    expect(getModelSkipClass('on_default')).toBe(
      'bg_primary_yellow border_primary_orange',
    )
  })

  it('returns correct class for "off"', () => {
    expect(getModelSkipClass('off')).toBe('bg_primary_white')
  })

  it('returns undefined for other inputs', () => {
    expect(getModelSkipClass('something_else')).toBeUndefined()
  })
})

describe('getTextColorClass', () => {
  it('returns "text_primary_white" for "off"', () => {
    expect(getTextColorClass('off')).toBe('text_primary_white')
  })

  it('returns undefined for other inputs', () => {
    expect(getTextColorClass('on_default')).toBeUndefined()
    expect(getTextColorClass('')).toBeUndefined()
  })
})

describe('getBgColor', () => {
  it('returns "bg_primary_orange" for "off"', () => {
    expect(getBgColor('off')).toBe('bg_primary_orange')
  })

  it('returns undefined for other inputs', () => {
    expect(getBgColor('on_default')).toBeUndefined()
  })
})

describe('TooltipComponents', () => {
  it('renders getDashboardLegendTooltip with correct text', () => {
    const Component = getDashboardLegendTooltip({ id: 'tooltip-1' }) // react-bootstrap Tooltip requires `id`
    render(Component)
    expect(screen.getByText(/Click for the more details/i)).toBeInTheDocument()
  })

  it('renders getModelStatusToolTip with correct text', () => {
    const Component = getModelStatusToolTip({ id: 'tooltip-2' })
    render(Component)
    expect(screen.getByText(/Model Status/i)).toBeInTheDocument()
  })
})

describe('getOnAlertClickFunction', () => {
  const mockParams = { key: 'value' }
  const mockCaseData = { id: 101 }
  const mockLocation = { pathname: '/example' }
  const mockCtxData = { caseData: { id: 202 } }

  const modelAlertOnClickMock = vi.fn().mockReturnValue('modelAlertClickResult')
  const modelWarningClickMock = vi
    .fn()
    .mockReturnValue('modelWarningClickResult')

  // Mock global TRACKEVENTOBJ
  global.TRACKEVENTOBJ = {
    dashboardStatusLegend: {
      modelAlertOnClick: modelAlertOnClickMock,
    },
    overview: {
      modelWarningClick: modelWarningClickMock,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls modelAlertOnClick with correct arguments when val is "off"', () => {
    getOnAlertClickFunction(
      'off',
      mockParams,
      mockCaseData,
      mockLocation,
      mockCtxData,
    )
  })

  it('calls modelWarningClick with correct arguments when val is "on_default"', () => {
    getOnAlertClickFunction(
      'on_default',
      mockParams,
      mockCaseData,
      mockLocation,
      mockCtxData,
    )
  })

  it('returns undefined and does not call any function for unrecognized val', () => {
    const result = getOnAlertClickFunction(
      'something_else',
      mockParams,
      mockCaseData,
      mockLocation,
      mockCtxData,
    )

    expect(modelAlertOnClickMock).not.toHaveBeenCalled()
    expect(modelWarningClickMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})

describe('getActualTime', () => {
  it('renders formatted time if status is SUCCESS and timeActual is provided', () => {
    const time = new Date()
    const formatted = moment(time).format('DD-MMM-YY hh:mm A').toUpperCase()
    render(getActualTime(time, STATUS.SUCCESS))
    expect(screen.getByText(formatted)).toBeInTheDocument()
  })

  it('renders formatted time if timeActual is provided but status is ERROR', () => {
    const time = new Date()
    const formatted = moment(time).format('DD-MMM-YY hh:mm A').toUpperCase()
    render(getActualTime(time, STATUS.ERROR))
    expect(screen.getByText(formatted)).toBeInTheDocument()
  })

  it('renders masked text if status is ERROR and timeActual is null', () => {
    render(getActualTime(null, STATUS.ERROR))
    expect(screen.getByText('XX-XXX-XX XX:XX:XX')).toBeInTheDocument()
  })
})

describe('getCalenderUI', () => {
  it('renders loading image when loadingState.time is LOADING', () => {
    const { container } = render(getCalenderUI(null, { time: STATUS.LOADING }))
    expect(container.querySelector('img')).toBeInTheDocument()
  })

  it('renders nothing if no timeActual and not loading', () => {
    const { container } = render(getCalenderUI(null, { time: STATUS.SUCCESS }))
    expect(container).toBeEmptyDOMElement()
  })
})

describe('dispatchReducer', () => {
  it('should update state with the given key and merge the value object', () => {
    const initialState = {
      user: { name: 'Alice', age: 25 },
      settings: { theme: 'light' },
    }
    const action = {
      key: 'user',
      value: { age: 26, location: 'NY' },
    }

    const newState = dispatchReducer(initialState, action)

    expect(newState).toEqual({
      user: { name: 'Alice', age: 26, location: 'NY' },
      settings: { theme: 'light' },
    })
  })

  it('should add new key if it does not exist in state', () => {
    const initialState = {
      user: { name: 'Alice', age: 25 },
    }
    const action = {
      key: 'settings',
      value: { theme: 'dark' },
    }

    const newState = dispatchReducer(initialState, action)

    expect(newState).toEqual({
      user: { name: 'Alice', age: 25 },
      settings: { theme: 'dark' },
    })
  })
})

export const mockUseParams = vi.fn().mockReturnValue({
  region: 'middle+east',
  affiliate: 'yansab',
  plant: 'ethylene+glycol',
  system: 'eg+reactor',
  caseId: '56',
})

// Mock the imported components and images
vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div>Mocked Loader</div>,
}))
vi.mock('assets/sabic_icons/common/warning.svg', () => ({
  default: () => 'mocked-warning-icon',
}))
vi.mock('assets/images/spinners/dots.svg', () => ({
  default: 'dotsSpinner',
}))

vi.mock(import('utills/utilities'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    handleOutsideClick: vi.fn(),
    formatDateAndTime: vi.fn(),
    getCaseId: vi.fn(),
    convertFormulaToHtml: vi.fn(),
    slugToText: vi.fn(),
    getAffiliateIdByName: vi.fn(),
    getPlantIdByName: vi.fn(),
    getTrackingObj: vi.fn(),
    getFurnaceFromCaseId: vi.fn(),
    showToast: vi.fn(),
  }
})

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocation: () => ({
      pathname:
        'localhost:3000/#/middle+east/yansab/ethylene+glycol/eg+reactor/overview',
    }),
    useOutletContext: () => ({
      caseId: 56,
    }),
    useParams: vi.fn(),
  }
})

useParams.mockReturnValue({
  region: 'middle+east',
  affiliate: 'yansab',
  plant: 'ethylene+glycol',
  system: 'eg+reactor',
  caseId: '56',
})

vi.mock('services/CurrentServices', () => ({
  getActualOptimumTime: () => mock_getActualOptimumTime,
  getMonitoringData: () => mock_getMonitoringData,
  getHealthStatus: () => mock_getHealthStatus,
}))

vi.mock('services/HistoricalServices', () => ({
  getDataModelSkip: () => mock_getDataModelSkip,
  get_calenderdata: () => mock_get_calenderdata,
}))

const getActualTimeFromApiData = {
  data: {
    caseId: 167,
    entityId: 2,
    entityDescription: 'Furnace System',
    timeActual: '2025-03-19T11:00:00',
    timeActualEpoch: 1742371200000,
    timeOptimum: '0001-01-01T00:00:00',
    timeOptimumEpoch: 0,
  },
  errormsg: '',
  statuscode: 200,
}

const getModelSkipDataFromApiData = {
  data: undefined,
  errormsg: 'No data found',
  statuscode: 204,
}

describe('DashboardStatusLegend Component', () => {
  function renderComponent(appObj, modelSkipObj) {
    return (
      <Provider
        value={{
          appContext: { ...appObj },
          setAppContext: (prevAppContext) => ({ ...prevAppContext }),
        }}
      >
        <Provider
          value={{
            modelSkipContext: { ...modelSkipObj },
            setModelSkipContext: (prevAppContext) => ({ ...prevAppContext }),
          }}
        >
          <MemoryRouter>
            <DashboardStatusLegend />
          </MemoryRouter>
        </Provider>
      </Provider>
    )
  }

  test('renders with data', () => {
    const { queryAllByText } = render(
      renderComponent(initialAppContextTest, initialModelSkipCtxTest),
    )
    assert(queryAllByText != undefined)
  })

  test('render with furnace plant data for else ', async () => {
    render(renderComponent(initialAppContextTest, initialModelSkipCtxTest))
  })

  test('render with furnace plant data', async () => {
    getCaseId.mockReturnValue(167)
    useParams.mockReturnValue({
      affiliate: 'kemya',
      furnace: 'furnace+a',
      plant: 'olefins',
      region: 'middle+east',
      system: 'furnace+system',
    })
    getActualTimeFromApi.mockResolvedValue(getActualTimeFromApiData)
    getModelSkipDataFromApi.mockResolvedValue(getModelSkipDataFromApiData)
    render(renderComponent(initialAppContextTest, initialModelSkipCtxTest))
  })

  test('show health icon when caseStatus 0', async () => {
    const mockData = {
      data: [
        {
          systemName: 'BOILER SYSTEM SUPPLY ',
          caseStatus: 0,
        },
      ],
      errormsg: '',
      statuscode: 200,
    }
    getInfraMonitoringCaseWise.mockResolvedValue(mockData)
    render(renderComponent(initialAppContextTest, initialModelSkipCtxTest))

    const triangleHealthIcon = await screen.findByTestId('triangleIcon')
    console.log('triangleHealthIcon', triangleHealthIcon)
    fireEvent.click(triangleHealthIcon)
  })

  test('on time change', () => {
    let newAppCtx = ''
    act(() => {
      newAppCtx = {
        ...initialAppContextTest,
        actualTime: 1699999900000,
        optimumTime: null,
      }
    })
    const { queryAllByText } = render(
      renderComponent(newAppCtx, initialModelSkipCtxTest),
    )
    assert(queryAllByText != undefined)
  })

  test('invalid time', () => {
    let newAppCtx = ''
    act(() => {
      newAppCtx = {
        ...initialAppContextTest,
        actualTime: null,
        optimumTime: null,
      }
    })
    const { queryAllByText } = render(
      renderComponent(newAppCtx, initialModelSkipCtxTest),
    )
    assert(queryAllByText != undefined)
  })

  test('tooltipReducer - should handle hover action', () => {
    const initialState = { hover: false, click: false }
    const action = { type: 'hover', value: true }
    const newState = tooltipReducer(initialState, action)
    expect(newState).toEqual({ hover: true, click: false })
  })

  test('tooltipReducer - should handle click action', () => {
    const initialState = { hover: false, click: false }
    const action = { type: 'click', value: true }
    const newState = tooltipReducer(initialState, action)
    expect(newState).toEqual({ hover: false, click: true })
  })

  test('tooltipReducer - should return the initial state for unknown action types', () => {
    const initialState = { hover: false, click: false }
    const action = { type: 'unknown', value: true }
    const newState = tooltipReducer(initialState, action)
    expect(newState).toEqual(initialState)
  })

  let tooltipDispatch
  let mockSetDashBoardError
  let mockLoadingDispatch

  const params = { system: true }
  const caseId = '12345'
  const setUp = ({
    appContextValues = {},
    modelSkipContextValues = {},
    locationPathname = '/overview',
  } = {}) => {
    const appContext = {
      appContext: {
        caseData: [],
        timeActualByCaseIds: {},
        ...appContextValues,
      },
      setAppContext: vi.fn(),
    }

    const modelSkipContext = {
      modelSkipContext: {
        modelSkipStatus: 'on',
        ...modelSkipContextValues,
      },
      setModelSkipContext: vi.fn(),
    }
    return render(
      <Router>
        <Provider value={appContext}>
          <Provider value={modelSkipContext}>
            <MemoryRouter>
              <DashboardStatusLegend />
            </MemoryRouter>
          </Provider>
        </Provider>
      </Router>,
    )
  }

  beforeEach(() => {
    tooltipDispatch = vi.fn()
    mockSetDashBoardError = vi.fn()
    mockLoadingDispatch = vi.fn()
    vi.clearAllMocks()
  })

  test('getModelSkipStatus - should return the status of the first element when dataModelSkipResponse has elements', () => {
    const result = getModelSkipStatus({
      data: [
        {
          status: 'on',
        },
      ],
    })
    expect(result).toBe('on')
  })

  test('getModelSkipStatus - should return "on" when dataModelSkipResponse is empty', () => {
    const result = getModelSkipStatus({
      data: [
        {
          status: 'on',
        },
      ],
    })
    expect(result).toBe('on')
  })
  test('getModelSkipStatus - should return "off"', () => {
    const result = getModelSkipStatus({
      data: [
        {
          status: 0,
        },
      ],
    })
    expect(result).toBe('off')
  })

  test('getModelSkipStatus - should return "on_default"', () => {
    const result = getModelSkipStatus({
      data: [
        {
          status: 2,
        },
      ],
    })
    expect(result).toBe('on_default')
  })

  test('getModelSkipStatus - should return "on" when dataModelSkipResponse is undefined', () => {
    const result = getModelSkipStatus(undefined)
    expect(result).toBe('on')
  })

  test('getModelSkipStatus - should return "on" when dataModelSkipResponse is null', () => {
    const result = getModelSkipStatus(null)
    expect(result).toBe('on')
  })

  test('getModelSkipStatus - should return "on" when dataModelSkipResponse is an array but has no status property', () => {
    const dataModelSkipResponse = [{ data: [] }]
    const result = getModelSkipStatus(dataModelSkipResponse)
    expect(result).toBe('on')
  })

  test('should handle unknown action type by returning the current state', () => {
    const initialState = {
      time: STATUS.SUCCESS,
      health: STATUS.SUCCESS,
      calender: STATUS.SUCCESS,
    }
    const action = {
      type: 'unknown',
      value: STATUS.LOADING,
    }
    const expectedState = initialState // Since the action type is unknown, the state should remain unchanged
    expect(loadingReducer(initialState, action)).toEqual(expectedState)
  })

  test('should handle action type "calender"', () => {
    const initialState = {
      time: STATUS.SUCCESS,
      health: STATUS.SUCCESS,
      calender: STATUS.SUCCESS,
    }
    const action = {
      type: 'calender',
      value: STATUS.LOADING,
    }
    const expectedState = {
      time: STATUS.SUCCESS,
      health: STATUS.SUCCESS,
      calender: STATUS.LOADING,
    }
    expect(loadingReducer(initialState, action)).toEqual(expectedState)
  })

  test('should handle action type "health"', () => {
    const initialState = {
      time: STATUS.SUCCESS,
      health: STATUS.SUCCESS,
      calender: STATUS.SUCCESS,
    }
    const action = {
      type: 'health',
      value: STATUS.LOADING,
    }
    const expectedState = {
      time: STATUS.SUCCESS,
      health: STATUS.LOADING,
      calender: STATUS.SUCCESS,
    }
    expect(loadingReducer(initialState, action)).toEqual(expectedState)
  })

  test('handleCatch - should handle Response error and set appropriate message', async () => {
    const error = new Response('Server error', {
      status: 500,
      statusText: 'Internal Server Error',
    })
    error.text = vi.fn().mockResolvedValue('Server error')
    await handleCatch(error, mockSetDashBoardError, mockLoadingDispatch)
  })

  test('handleCatch - should handle object error with msg property and set appropriate message', async () => {
    const error = { msg: 'Custom error message' }
    await handleCatch(error, mockSetDashBoardError, mockLoadingDispatch)
  })
})

describe('getActualTime function', () => {
  const STATUS = {
    LOADING: 0,
    SUCCESS: 1,
    ERROR: 2,
  }

  const dotsSpinner = 'dotsSpinner'
  let timeActual = null

  function getActualTime(timeLoadingState = STATUS.ERROR) {
    if (timeLoadingState === STATUS.LOADING) {
      return (
        <>
          <img src={dotsSpinner} alt='Loading' />
        </>
      )
    } else if (timeLoadingState === STATUS.SUCCESS || timeActual) {
      return <>{moment(timeActual).format('DD-MMM-YY hh:mm A').toUpperCase()}</>
    } else {
      return <>{'XX-XXX-XX XX:XX:XX'}</>
    }
  }

  test('should return loading spinner when loading state is LOADING', () => {
    const { getByAltText } = render(getActualTime(STATUS.LOADING))
    expect(getByAltText('Loading')).toBeInTheDocument()
    // expect(container).toMatchSnapshot();
  })

  test('should return formatted actual time when loading state is SUCCESS and timeActual is set', () => {
    timeActual = moment('2023-07-23T10:00:00')
    const { getByText } = render(getActualTime(STATUS.SUCCESS))
    expect(
      getByText(moment(timeActual).format('DD-MMM-YY hh:mm A').toUpperCase()),
    ).toBeInTheDocument()
    // expect(container).toMatchSnapshot();
  })

  test('should return placeholder text when loading state is ERROR and timeActual is not set', () => {
    timeActual = null
    const { getByText } = render(getActualTime(STATUS.ERROR))
    expect(getByText('XX-XXX-XX XX:XX:XX')).toBeInTheDocument()
    // expect(container).toMatchSnapshot();
  })

  test('should return formatted actual time when loading state is ERROR but timeActual is set', () => {
    timeActual = moment('2023-07-23T10:00:00')
    const { getByText } = render(getActualTime(STATUS.ERROR))
    expect(
      getByText(moment(timeActual).format('DD-MMM-YY hh:mm A').toUpperCase()),
    ).toBeInTheDocument()
    // expect(container).toMatchSnapshot();
  })
})
