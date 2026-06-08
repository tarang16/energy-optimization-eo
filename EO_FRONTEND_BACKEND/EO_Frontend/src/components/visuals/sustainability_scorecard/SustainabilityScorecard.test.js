import { act, render } from '@testing-library/react'
import assert from 'assert'
import { afterAll, beforeAll, describe, expect, it, test, vi } from 'vitest'
import SustainabilityScorecard, {
  plantDataToPredictedData,
  updateDataStore,
} from './SustainabilityScorecard'

import '@testing-library/jest-dom'
import {
  mock_get_landing_affiliate_score_card,
  mock_get_scorecard_plant_data,
} from '../../../index.test'

let mockApiData = mock_get_scorecard_plant_data

vi.mock('config/scss/_variables.scss', () => ({
  default: {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
    primary_dark_blue: '#ff0000',
  },
}))

vi.mock('services/ConfigServices', () => ({
  getLandingAffiliateScoreCard: () => mock_get_landing_affiliate_score_card,
  getScorecardPlantData: () => mockApiData,
}))

vi.mock('config/Config', () => ({
  APP_CONFIG: {
    CACHE_REFRESH_MIN_DURATION: 6000000,
    CACHE_TIME_LIMIT: 10 * 60 * 1000,
  },
  SUSTAINABILITY_SCORECARD: {
    REFRESH_DATA: 3000,
  },
}))

const trackEvent = vi.fn()

const data = {
  affiliateCode: '1400',
  affiliateName: 'ARRAZI',
  plantName: 'ARRAZI-3',
  plantsCount: 2,
  systemsCount: 6,
  prodOppSum: 142.9,
  energyOppSum: 2121.9,
  envOppSum: 141.8,
  urlAffiliateImage:
    'data:image/png;base64,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',
  plants: [
    {
      plantName: 'ARRAZI-3',
      plantStatus: 'ONLINE',
      systemsCount: 3,
      prodOppSum: 2.6,
      energyOppSum: 125.1,
      envOppSum: 8.4,
      systems: [
        {
          caseID: 2,
          systemName: 'BOILER SYSTEM SUPPLY',
          prodOpp: 0,
          energyOpp: 0,
          envOpp: 0,
          systemStatus: 'ONLINE',
          deviationOverdue: 0,
          deviationActive: 10,
          isActive: 1,
          timeStamp: '2023-12-20T07:00:00',
          timeStampEpoch: 1703044800000,
        },
        {
          caseID: 1,
          systemName: 'REFORMER PERFORMANCE MANAGEMENT',
          prodOpp: 2.6,
          energyOpp: 125.1,
          envOpp: 8.4,
          systemStatus: 'ONLINE',
          deviationOverdue: 0,
          deviationActive: 19,
          isActive: 1,
          timeStamp: '2023-10-27T11:00:00',
          timeStampEpoch: 1698393600000,
        },
        {
          caseID: 3,
          systemName: 'SYNTHESIS PERFORMANCE MANAGEMENT',
          prodOpp: 0,
          energyOpp: 0,
          envOpp: 0,
          systemStatus: 'ONLINE',
          deviationOverdue: 0,
          deviationActive: 19,
          isActive: 1,
          timeStamp: '2023-10-14T23:00:00',
          timeStampEpoch: 1697313600000,
        },
      ],
    },
    {
      plantName: 'ARRAZI-4',
      plantStatus: 'ONLINE',
      systemsCount: 3,
      prodOppSum: 140.3,
      energyOppSum: 1996.8,
      envOppSum: 133.4,
      systems: [
        {
          caseID: 5,
          systemName: 'BOILER SYSTEM SUPPLY',
          prodOpp: 70.8,
          energyOpp: 320,
          envOpp: 21.1,
          systemStatus: 'ONLINE',
          deviationOverdue: 0,
          deviationActive: 10,
          isActive: 1,
          timeStamp: '2023-10-16T10:00:00',
          timeStampEpoch: 1697439600000,
        },
        {
          caseID: 4,
          systemName: 'REFORMER PERFORMANCE MANAGEMENT',
          prodOpp: 0,
          energyOpp: 801.4,
          envOpp: 53.6,
          systemStatus: 'ONLINE',
          deviationOverdue: 0,
          deviationActive: 21,
          isActive: 1,
          timeStamp: '2023-09-19T08:00:00',
          timeStampEpoch: 1695099600000,
        },
        {
          caseID: 6,
          systemName: 'SYNTHESIS PERFORMANCE MANAGEMENT',
          prodOpp: 69.5,
          energyOpp: 875.4,
          envOpp: 58.7,
          systemStatus: 'ONLINE',
          deviationOverdue: 0,
          deviationActive: 20,
          isActive: 1,
          timeStamp: '2023-09-12T23:00:00',
          timeStampEpoch: 1694548800000,
        },
      ],
    },
  ],
  regionName: 'MIDDLE EAST',
}
describe('Corporate', () => {
  it('renders with the correct text', () => {
    const { queryAllByText } = render(
      <SustainabilityScorecard
        config={{
          showSustainabilityPredicted: true,
          value1: 123,
          state: 1,
          category: 'energy',
        }}
        data={data}
        affiliateCode={'1400'}
        isPlant
        susData={{ 1400: [] }}
        trackEvent
      />,
    )
    // Assert
    assert(queryAllByText(''))
  })

  it('renders with the correct text', () => {
    const { queryAllByText } = render(
      <SustainabilityScorecard
        config={{
          showSustainabilityPredicted: true,
          value1: 123,
          state: 1,
          category: 'energy',
        }}
        data={data}
        affiliateCode={'1400'}
        isPlant
        susData={{ 1400: [{ upto: 0, landingSustainabiltyAffiliates: [] }] }}
        trackEvent
      />,
    )
    // Assert
    assert(queryAllByText(''))
  })

  it('renders with the correct text', () => {
    const { queryAllByText } = render(
      <SustainabilityScorecard
        config={{
          showSustainabilityPredicted: true,
          value1: 123,
          state: 1,
          category: 'energy',
        }}
        data={data}
        affiliateCode={'1400'}
        isPlant
        susData={{
          1400: [{ upto: 0, landingSustainabiltyAffiliates: [{ plants: [] }] }],
        }}
        trackEvent
      />,
    )
    // Assert
    assert(queryAllByText(''))
  })

  it('renders with the correct text', () => {
    const { queryAllByText } = render(
      <SustainabilityScorecard
        config={{
          showSustainabilityPredicted: true,
          value1: 123,
          state: 1,
          category: 'energy',
        }}
        data={{ production: 1400 }}
        affiliateCode={'1400'}
        isPlant
        trackEvent
      />,
    )
    // Assert
    assert(queryAllByText(''))
  })

  it('renders with the correct text', () => {
    act(() => {
      mockApiData = {
        data: [],
        errormsg: '',
        statuscode: 200,
      }
    })

    const { queryAllByText } = render(
      <SustainabilityScorecard
        config={{
          showSustainabilityPredicted: true,
          value1: 123,
          state: 1,
          category: 'energy',
        }}
        data={{}}
      />,
    )
    // Assert
    assert(queryAllByText(''))
  })
})

describe('Testing for the Function', () => {
  //   test("Testing for the itemToData Function", () => {
  //     const items = {
  //       affiliateSapID: 1400,
  //       affiliateName: "ARRAZI",
  //       prodOppSum: 17,
  //       energyOppSum: 661,
  //       envOppSum: 44,
  //       plants: [
  //         {
  //           plantName: "ARRAZI-3",
  //           prodOppSum: 6,
  //           energyOppSum: 154,
  //           envOppSum: 10,
  //           systems: [
  //             {
  //               caseID: 1,
  //               systemName: "REFORMER PERFORMANCE MANAGEMENT",
  //               prodOpp: 0,
  //               energyOpp: 0,
  //               envOpp: 0,
  //               isActive: 1,
  //             },
  //             {
  //               caseID: 3,
  //               systemName: "SYNTHESIS PERFORMANCE MANAGEMENT",
  //               prodOpp: 6,
  //               energyOpp: 154,
  //               envOpp: 10,
  //               isActive: 1,
  //             },
  //           ],
  //         },
  //         {
  //           plantName: "ARRAZI-4",
  //           prodOppSum: 11,
  //           energyOppSum: 507,
  //           envOppSum: 34,
  //           systems: [
  //             {
  //               caseID: 4,
  //               systemName: "REFORMER PERFORMANCE MANAGEMENT",
  //               prodOpp: 0,
  //               energyOpp: 374,
  //               envOpp: 25,
  //               isActive: 1,
  //             },
  //             {
  //               caseID: 6,
  //               systemName: "SYNTHESIS PERFORMANCE MANAGEMENT",
  //               prodOpp: 11,
  //               energyOpp: 133,
  //               envOpp: 9,
  //               isActive: 1,
  //             },
  //           ],
  //         },
  //       ],
  //     };
  //     const data = {
  //       plantName: "ARRAZI-4",
  //       plantStatus: "ONLINE",
  //       systemsCount: 3,
  //       prodOppSum: 375.1,
  //       energyOppSum: 6847.2,
  //       envOppSum: 463.2,
  //       systems: [
  //         {
  //           caseID: 5,
  //           systemName: "BOILER SYSTEM SUPPLY",
  //           prodOpp: 107.1,
  //           energyOpp: 643.8,
  //           envOpp: 43.2,
  //           systemStatus: "ONLINE",
  //           deviationOverdue: 0,
  //           deviationActive: 10,
  //           isActive: 1,
  //           timeStamp: "2023-12-29T07:00:00",
  //           timeStampEpoch: 1703822400000,
  //         },
  //         {
  //           caseID: 4,
  //           systemName: "REFORMER PERFORMANCE MANAGEMENT",
  //           prodOpp: 0,
  //           energyOpp: 2991.8,
  //           envOpp: 202.6,
  //           systemStatus: "ONLINE",
  //           deviationOverdue: 0,
  //           deviationActive: 22,
  //           isActive: 1,
  //           timeStamp: "2024-01-29T22:00:00",
  //           timeStampEpoch: 1706554800000,
  //         },
  //         {
  //           caseID: 6,
  //           systemName: "SYNTHESIS PERFORMANCE MANAGEMENT",
  //           prodOpp: 268,
  //           energyOpp: 3211.6,
  //           envOpp: 217.4,
  //           systemStatus: "ONLINE",
  //           deviationOverdue: 0,
  //           deviationActive: 21,
  //           isActive: 1,
  //           timeStamp: "2024-01-29T20:00:00",
  //           timeStampEpoch: 1706547600000,
  //         },
  //       ],
  //       affiliateCode: "1400",
  //     };
  //     const datawithDifferentPlantName = {
  //       plantName: "ARRAZI-999",
  //       plantStatus: "ONLINE",
  //       systemsCount: 3,
  //       prodOppSum: 375.1,
  //       energyOppSum: 6847.2,
  //       envOppSum: 463.2,
  //       systems: [
  //         {
  //           caseID: 5,
  //           systemName: "BOILER SYSTEM SUPPLY",
  //           prodOpp: 107.1,
  //           energyOpp: 643.8,
  //           envOpp: 43.2,
  //           systemStatus: "ONLINE",
  //           deviationOverdue: 0,
  //           deviationActive: 10,
  //           isActive: 1,
  //           timeStamp: "2023-12-29T07:00:00",
  //           timeStampEpoch: 1703822400000,
  //         },
  //         {
  //           caseID: 4,
  //           systemName: "REFORMER PERFORMANCE MANAGEMENT",
  //           prodOpp: 0,
  //           energyOpp: 2991.8,
  //           envOpp: 202.6,
  //           systemStatus: "ONLINE",
  //           deviationOverdue: 0,
  //           deviationActive: 22,
  //           isActive: 1,
  //           timeStamp: "2024-01-29T22:00:00",
  //           timeStampEpoch: 1706554800000,
  //         },
  //         {
  //           caseID: 6,
  //           systemName: "SYNTHESIS PERFORMANCE MANAGEMENT",
  //           prodOpp: 268,
  //           energyOpp: 3211.6,
  //           envOpp: 217.4,
  //           systemStatus: "ONLINE",
  //           deviationOverdue: 0,
  //           deviationActive: 21,
  //           isActive: 1,
  //           timeStamp: "2024-01-29T20:00:00",
  //           timeStampEpoch: 1706547600000,
  //         },
  //       ],
  //       affiliateCode: "1400",
  //     };

  //     // Call the function with the mock data with false condition
  //     const result = itemToData(items, data, false);

  //     const result2 = itemToData(items, data, true);

  //     const result3 = itemToData(items, datawithDifferentPlantName, true);

  //     // Assert that the result is an array
  //     expect(Array.isArray(result)).toBe(true);
  //     expect(Array.isArray(result2)).toBe(true);
  //     expect(Array.isArray(result3)).toBe(true);

  //     // Assert the length of the array
  //     expect(result).toHaveLength(3);
  //     expect(result2).toHaveLength(3);
  //     expect(result3).toHaveLength(3);

  //     // Assert the properties of each object in the array
  //     expect(result[0]).toEqual({
  //       title: "PRODUCTION GAIN",
  //       uom: "MT",
  //       actual: 17,
  //     });
  //     expect(result[1]).toEqual({
  //       title: "ENERGY REDUCTION",
  //       uom: "MMBTU",
  //       actual: 661,
  //     });
  //     expect(result[2]).toEqual({
  //       title: "CO<sub>2</sub> REDUCTION",
  //       uom: "MT",
  //       actual: 44,
  //     });

  //     // Testing when the condition is false

  //     expect(result2[0]).toEqual({
  //       title: "PRODUCTION GAIN",
  //       uom: "MT",
  //       actual: 11,
  //     });
  //     expect(result2[1]).toEqual({
  //       title: "ENERGY REDUCTION",
  //       uom: "MMBTU",
  //       actual: 507,
  //     });
  //     expect(result2[2]).toEqual({
  //       title: "CO<sub>2</sub> REDUCTION",
  //       uom: "MT",
  //       actual: 34,
  //     });

  //     // Testing when the no plant is matched

  //     expect(result3[0]).toEqual({
  //       title: "PRODUCTION GAIN",
  //       uom: "MT",
  //       actual: "*",
  //     });
  //     expect(result3[1]).toEqual({
  //       title: "ENERGY REDUCTION",
  //       uom: "MMBTU",
  //       actual: "*",
  //     });
  //     expect(result3[2]).toEqual({
  //       title: "CO<sub>2</sub> REDUCTION",
  //       uom: "MT",
  //       actual: "*",
  //     });
  //   });

  const affiliateCode = 1400
  const data = [
    {
      upto: 'today',
      landingSustainabiltyAffiliates: [],
    },
    {
      upto: 'yesterday',
      landingSustainabiltyAffiliates: [],
    },
    {
      upto: 'month',
      landingSustainabiltyAffiliates: [],
    },
    {
      upto: 'year',
      landingSustainabiltyAffiliates: [
        {
          affiliateSapID: 1400,
          affiliateName: 'ARRAZI',
          prodOppSum: 17,
          energyOppSum: 661,
          envOppSum: 44,
          plants: [
            {
              plantName: 'ARRAZI-3',
              prodOppSum: 6,
              energyOppSum: 154,
              envOppSum: 10,
              systems: [
                {
                  caseID: 1,
                  systemName: 'REFORMER PERFORMANCE MANAGEMENT',
                  prodOpp: 0,
                  energyOpp: 0,
                  envOpp: 0,
                  isActive: 1,
                },
                {
                  caseID: 3,
                  systemName: 'SYNTHESIS PERFORMANCE MANAGEMENT',
                  prodOpp: 6,
                  energyOpp: 154,
                  envOpp: 10,
                  isActive: 1,
                },
              ],
            },
            {
              plantName: 'ARRAZI-4',
              prodOppSum: 11,
              energyOppSum: 507,
              envOppSum: 34,
              systems: [
                {
                  caseID: 4,
                  systemName: 'REFORMER PERFORMANCE MANAGEMENT',
                  prodOpp: 0,
                  energyOpp: 374,
                  envOpp: 25,
                  isActive: 1,
                },
                {
                  caseID: 6,
                  systemName: 'SYNTHESIS PERFORMANCE MANAGEMENT',
                  prodOpp: 11,
                  energyOpp: 133,
                  envOpp: 9,
                  isActive: 1,
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  const setDataStore = vi.fn()

  test('Testing for the updateDataStore function', () => {
    const dataStore = {}
    updateDataStore(affiliateCode, data, dataStore, setDataStore)
    expect(setDataStore).toHaveBeenCalled()

    // Getting the function passed to the UseState Setter Function
    const updateFunction = setDataStore.mock.calls[0][0]

    // Ensure the update function updates the state correctly
    const prevState = {}
    const updatedState = updateFunction(prevState)
    expect(updatedState).toEqual({ [affiliateCode]: data })
  })

  test('Testing for the plantDataToPredictedData function', () => {
    const data = mockApiData.data.data
    const type = 'year'
    const plantName = 'OLEFINS 1'
    const setIsPredictedLoading = vi.fn()
    const setPredictedDataStore = vi.fn()
    const setPredictedData = vi.fn()

    // Calling without any props
    plantDataToPredictedData()

    // calling when there is no data
    const emptyData = []
    plantDataToPredictedData(
      emptyData,
      type,
      plantName,
      setIsPredictedLoading,
      setPredictedDataStore,
      setPredictedData,
    )

    expect(setIsPredictedLoading).toHaveBeenCalled()
    const tempPredictedLoading = {}
    tempPredictedLoading[type] = 1
    const prevState1 = {}
    const updateFunction1 = setIsPredictedLoading.mock.calls[0][0]
    const updatedState1 = updateFunction1(prevState1)
    expect(updatedState1).toEqual({ [type]: 1 })

    // Calling with the Real Data

    plantDataToPredictedData(
      data,
      type,
      plantName,
      setIsPredictedLoading,
      setPredictedDataStore,
      setPredictedData,
    )

    // expect(setPredictedDataStore).toHaveBeenCalled();
    // const prevState2 = {};
    // prevState2[plantName] = {};
    // const output = [
    //   {
    //     title: "CUMULATIVE PRODUCTION",
    //     uom: "MT",
    //     actual: data.production,
    //     optimum: data.productionPlan,
    //   },
    //   {
    //     title: "AVG. ENERGY INTENSITY",
    //     uom: "GJ/MT",
    //     actual: data.energyIntensity,
    //     optimum: data.energyIntensityPlan,
    //   },
    //   {
    //     title: "AVG. CAPACITY UTILIZATION",
    //     uom: "%",
    //     actual: data.capacityUtilization,
    //     optimum: data.capacityUtilizationPlan,
    //   },
    //   {
    //     title: "AVG. YIELD",
    //     uom: "%",
    //     actual: data.yield,
    //     optimum: data.yieldPlan,
    //   },
    // ];
    // const updateFunction2 = setPredictedDataStore.mock.calls[0][0];
    // const updatedState2 = updateFunction2(prevState2);
    // expect(updatedState2).toEqual(prevState2[plantName][type]: output );
  })

  test('fetchAffiliateScoreCard function', async () => {
    const affiliateCode = 'exampleAffiliateCode'
    const mockData = [
      {
        upto: 'today',
        landingSustainabiltyAffiliates: [
          {
            title: 'PRODUCTION GAIN',
            uom: 'MT',
            actual: 100,
          },
        ],
      },
    ]
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({ data: mockData }),
    })
    const { getByText } = render(
      <SustainabilityScorecard data={{ affiliateCode }} />,
    )
    // Restore the original fetch function
    global.fetch.mockRestore()
  })

  test('refreshPredictedData function', async () => {
    const affiliateCode = 'exampleAffiliateCode'
    const plantName = 'examplePlantName'
    // Mock the API call
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({
        production: 200,
        energyIntensity: 300,
        // Add other properties as needed
      }),
    })
    // Mock useState and useEffect
    // const useStateSpy = vi.spyOn(React, 'useState');
    // useStateSpy.mockReturnValueOnce([{ today: 0 }, vi.fn()]);
    // useStateSpy.mockReturnValueOnce([[], vi.fn()]);
    // useStateSpy.mockReturnValueOnce([{ yesterday: -1, today: -1, month: -1, year: -1 }, vi.fn()]);
    // useStateSpy.mockReturnValueOnce([false, vi.fn()]);
    // useStateSpy.mockReturnValueOnce([{}, vi.fn()]);
    // useStateSpy.mockReturnValueOnce([[], vi.fn()]);
    // useStateSpy.mockReturnValueOnce([{ yesterday: 1, today: 1, month: 1, year: 1 }, vi.fn()]);
    // const useEffectSpy = vi.spyOn(React, 'useEffect');
    // useEffectSpy.mockImplementationOnce((fn) => fn());
    // Render the component
    const { getByText } = render(
      <SustainabilityScorecard
        data={{ affiliateCode, plantName }}
        isPlant={true}
        loadingPlantData={true}
      />,
    )
    // // Wait for data to be refreshed
    // await waitFor(() => {
    //   expect(getByText('200')).toBeInTheDocument(); // Assuming 200 is the actual value for production
    //   // Add assertions for other data properties
    // });
    // Restore the original fetch function and React hooks
    global.fetch.mockRestore()
    // useStateSpy.mockRestore();
    // useEffectSpy.mockRestore();
  })
})

describe('SustainabilityScorecard timer mocking', () => {
  let originalInterval

  beforeAll(() => {
    originalInterval = global.setInterval
  })

  afterAll(() => {
    global.setInterval = originalInterval
  })

  test('refreshes predicted data when interval expires', async () => {
    vi.useFakeTimers()

    await act(async () => {
      const { queryAllByText } = render(
        <SustainabilityScorecard
          data={data}
          affiliateCode={'1400'}
          isPlant={true}
          susData={{ 1400: [] }}
          trackEvent
        />,
      )
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    vi.useRealTimers()
  })
})
