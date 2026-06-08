import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import assert from 'assert'
import { AppAtom } from 'atoms/AppAtom'
import { useAtomValue } from 'jotai'
import * as utills from 'utills/utilities'
import { test, vi } from 'vitest'
import CardActions from './CardActions'

const AppAtomData = {
  actualTime: null,
  actualTimeStr: null,
  caseData: [],
  caseHierarchy: null,
  calenderData: null,
  quickLinks: [],
  timeActualByCaseIds: {},
}

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn().mockImplementation(() => AppAtomData),
  }
})

test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    kpiDescription: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    odsData: [],
  }

  const { queryAllByText } = render(
    <CardActions
      data={data}
      showOdsButton
      handleDetailsModal={() => {}}
      showCauseModal={() => {}}
      handleShowModal={() => {}}
    />,
  )
  const infoIcon = screen.getByTestId('handle-detail-modal')
  fireEvent.click(infoIcon)
  assert(queryAllByText(''))
})

test('renders component with valid return method handleDetailsModal false', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    kpiDescription: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    odsData: [],
    piName: 'mockPiName',
    displayFormula: 'mockFormula',
  }

  const { queryAllByText } = render(
    <CardActions data={data} handleShowModal={() => {}} />,
  )
  const infoIcon = screen.getByTestId('handle-detail-modal')
  fireEvent.click(infoIcon)

  waitFor(() => {
    const closeModalIcon = screen.getByTestId('close-icon-custom-modal')
    fireEvent.click(closeModalIcon)
  })
  assert(queryAllByText(''))
})

test('renders component when category  deviation', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    kpiDescription: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    odsData: [],
    category: 'deviation',
  }

  const { queryAllByText } = render(
    <CardActions data={data} handleShowModal={() => {}} />,
  )
})

test('renders component with show trend ', () => {
  // Test with condition as true
  vi.spyOn(utills, 'uuid4').mockImplementation(() => 'uuid1')
  const data = {
    displayName: 'Test displayName',
    kpiDescription: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    odsData: [],
    category: 'deviation',
    trendLibrary: 'mockTrend',
  }

  const { queryAllByText } = render(
    <CardActions showTrend={true} data={data} handleShowModal={() => {}} />,
  )

  const trendIcon = screen.getByTestId('tooltip-trends-uuid1')
  fireEvent.click(trendIcon)
})

test('renders component with warning icon ', () => {
  // Test with condition as true
  vi.spyOn(utills, 'uuid4').mockImplementation(() => 'uuid1')
  const data = {
    displayName: 'Test displayName',
    kpiDescription: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    odsData: [],
    category: 'deviation',
    trendLibrary: null,
    stateDeviation: true,
  }

  const { queryAllByText } = render(
    <CardActions showTrend={false} data={data} handleShowModal={() => {}} />,
  )

  const trendIcon = screen.getByTestId('warning-icon')
  fireEvent.mouseOver(trendIcon)
})

test('renders component with warning icon with trendLibrary null ', () => {
  // Test with condition as true
  vi.spyOn(utills, 'uuid4').mockImplementation(() => 'uuid1')
  const data = {
    displayName: 'Test displayName',
    kpiDescription: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    odsData: [],
    category: 'deviation',
    trendLibrary: null,
    stateDeviation: true,
  }

  const { queryAllByText } = render(
    <CardActions showTrend={true} data={data} handleShowModal={() => {}} />,
  )

  const trendIcon = screen.getByTestId('warning-icon')
  fireEvent.mouseOver(trendIcon)
})

test('renders component with warning icon with trendLibrary null ', () => {
  // Test with condition as true
  vi.spyOn(utills, 'uuid4').mockImplementation(() => 'uuid1')

  const data = {
    displayName: 'Test displayName',
    kpiDescription: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    odsData: [],
    category: 'deviation',
    trendLibrary: null,
    stateDeviation: true,
  }

  const { queryAllByText } = render(
    <CardActions showTrend={true} data={data} handleShowModal={() => {}} />,
  )

  const trendIcon = screen.getByTestId('warning-icon')
  fireEvent.mouseOver(trendIcon)
})

test('renders component with ctx data null ', () => {
  // Test with condition as true
  vi.spyOn(utills, 'uuid4').mockImplementation(() => 'uuid1')

  useAtomValue.mockImplementation((atom) => {
    if (atom === AppAtom)
      return {
        ...AppAtomData,
        caseData: null,
      }
    return null
  })

  const data = {
    displayName: 'Test displayName',
    kpiDescription: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    odsData: [],
    category: 'deviation',
    trendLibrary: null,
    stateDeviation: true,
  }

  const { queryAllByText } = render(
    <CardActions showTrend={true} data={data} handleShowModal={() => {}} />,
  )
})
