import Loader from 'components/ui/loader/Loader'
import moment from 'moment-timezone'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useLocation, useParams } from 'react-router-dom'
import styles from './ActivityTracker.module.scss'
import arrow_down_blue from 'assets/sabic_new_icons/arrow_down_blue.svg'
import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import BarChart from 'components/visuals/charts/bar_chart/BarChart'
import SingleTitleCard from 'components/visuals/common/single_title_card/SingleTitleCard'
import MultiSelectV2 from 'components/visuals/dropdown/multi_select/MultiSelectV2'
import SortableTableWithTooltip from 'components/visuals/table/sortable_table_with_tooltip/SortableTableWithTooltip'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { ADMIN_STATS } from 'config/Config'
import variables from 'config/scss/variables'
import { useAtomValue } from 'jotai'
import Logger from 'logger/Logger'
import { processAffiliateData } from 'pages/AFFILIATES_DROPDOWNS/SingleSelect/SingleSelectAffiliateDropDowns.function'
import { PaginationControl } from 'react-bootstrap-pagination-control'
import {
  getUserStatisticsCount,
  getUserStatisticsGraphData,
  getUsersStatisticssLogs,
} from 'services/AdminServices'
import { fetchScreenData } from 'utills/utilities'
import screenTimeIcon from '../../assets/sabic_icons/common/blue_clock_icon_gray_background.svg'
import distinctusersIcon from '../../assets/sabic_icons/disinctUsers/distinctusers.svg'
import Affiliate_Tab_Changer from './Affiliate_Tab_Changer'
import MultiSelectAffiliateDropDowns from './MultiSelectAffiliateDropDowns'
const UserStatistics = () => {
  const location = useLocation()
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData
  const [screenData, setScreenData] = useState([])
  const [allScreenData, setAllScreenData] = useState([])
  const [selectedScreen, setSelectedScreen] = useState([])
  const [activeUsers, setActiveUsers] = useState(0)
  const [selectedData, setSelectedData] = useState({
    affiliate: [],
    caseId: '',
    selectedAffiliate: [],
  })
  const [dateRange, setDateRange] = useState([
    moment().subtract(7, 'days').toDate(),
    moment().toDate(),
  ])
  const [ascOrder, setAscOrder] = useState(0)
  const token = useAtomValue(TokenAtom)
  const tableHeader = [
    {
      title: 'USER',
    },
    {
      title: 'SCREEN',
    },
    {
      title: 'TOTAL DURATION (MINS/DAY)',
      icon: (
        <img
          data-testid={'sort-icon'}
          src={arrow_down_blue}
          alt='Icon-sort'
          style={{
            filter: 'unset',
            transform: ascOrder === 0 ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
          onClick={() => handleSorting()}
          data-static-id='UserStatistics.js_img_9ff387'
        />
      ),
    },
  ]
  const [DPStartDate, setDPStartDate] = useState(dateRange[0])
  const [DPEndDate, setDPEndDate] = useState(dateRange[1])
  const [tableData, setTableData] = useState([])
  const [graphData, setGraphData] = useState({
    timeWiseData: [],
    distinctUsersData: [],
  })
  const [graphLoading, setGraphLoading] = useState(true)
  const [statisticsCountData, setStatisticsCountData] = useState()
  const [tableLoading, setTableLoading] = useState(false)
  const [chartTab, setChartTab] = useState('affiliate')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(1)
  const tabs = [
    {
      key: 'affiliate',
      label: 'Affiliate',
    },
    {
      key: 'daywise',
      label: 'Daywise',
    },
  ]
  useEffect(() => {
    const { affiliateDropDownArray } = processAffiliateData(ctxData, token)
    setSelectedData((prev) => ({
      ...prev,
      affiliate: [...affiliateDropDownArray],
    }))
  }, [ctxData])
  useEffect(() => {
    const fetchScreen = async () => {
      const tempData = await fetchScreenData()
      if (tempData?.length > 0) {
        setScreenData(tempData)
        setAllScreenData(tempData)
        setSelectedScreen([tempData[0]])
      } else {
        setScreenData([])
        setAllScreenData([])
        setSelectedScreen([])
      }
    }
    fetchScreen()
  }, [])
  function getdistinctUsersData(response) {
    const distinctUsersData = response.data.distinctUsersData || []
    let result = distinctUsersData.map((item) => item.distinctUsers)
    let count = 0
    result.forEach((num) => {
      count += num
    })
    return count
  }
  const getGraphData = async ({
    isAllScreen,
    screenIDs,
    isAllAffiliate,
    affiliateIds,
    chartTab,
  }) => {
    try {
      const response = await getUserStatisticsGraphData(
        DPStartDate,
        DPEndDate,
        isAllScreen ? undefined : screenIDs,
        !isAllAffiliate && affiliateIds.length ? affiliateIds : undefined,
        chartTab.toLowerCase() === 'daywise' ? 1 : 0,
      )
      if (response?.statuscode == 200) {
        const activeUsers = getdistinctUsersData(response)
        setActiveUsers(activeUsers)
        setGraphData(response.data)
      } else {
        setActiveUsers(0)
        setGraphData({
          timeWiseData: [],
          distinctUsersData: [],
        })
      }
    } catch (error) {
      Logger.error('Error fetching graph data:', error)
      setGraphLoading(false)
      setGraphData({
        timeWiseData: [],
        distinctUsersData: [],
      })
    } finally {
      setGraphLoading(false)
    }
  }
  useEffect(() => {
    ;(async () => {
      const fetchGraphData = async () => {
        setGraphLoading(true)
        let screenIDs = ''
        selectedScreen.forEach((item, i) => {
          screenIDs += `${i === 0 ? '' : ','}${item.tag_name}`
        })
        const isAllScreen = selectedScreen.some(
          (item) => item.display_name === 'All',
        )
        let affiliateIds = ''
        const isAllAffiliate = selectedData.selectedAffiliate.some(
          (item) => item.display_name === 'All',
        )
        selectedData.selectedAffiliate.forEach((item, i) => {
          affiliateIds += `${i === 0 ? '' : ','}${item?.tag_name ?? ''}`
        })
        getGraphData({
          isAllScreen,
          screenIDs,
          isAllAffiliate,
          affiliateIds,
          chartTab,
        })
      }
      await fetchGraphData()
    })()
  }, [DPStartDate, DPEndDate, chartTab, selectedScreen, selectedData])
  useEffect(() => {
    const fetchStatisticsCount = async () => {
      try {
        const response = await getUserStatisticsCount(DPStartDate, DPEndDate)
        if (response?.statuscode === 200) {
          setStatisticsCountData(response.data)
        } else {
          setStatisticsCountData()
        }
      } catch (error) {
        setStatisticsCountData()
        Logger.log('error', error)
      }
    }
    fetchStatisticsCount()
    setPage(1)
  }, [DPStartDate, DPEndDate])
  useEffect(() => {
    const fetchAccessLogs = async () => {
      try {
        setTableLoading(true)
        const response = await getUsersStatisticssLogs(
          DPStartDate,
          DPEndDate,
          page,
          ADMIN_STATS.STATS_RECORDS_PER_PAGE,
          ascOrder,
        )
        if (response.statuscode === 200) {
          const tempData = response.data.map((item) => {
            const minutes = parseFloat(
              item.screenAccessedTimeInSec / 60,
            ).toFixed(1)
            let screenAccessedTime = minutes === '0.0' ? '0.1' : minutes
            return [
              item.employeeName || '-',
              item.screenName,
              screenAccessedTime,
            ]
          })
          setTableData(tempData)
          setTotal(response.pageCount * response.pageSize)
        } else {
          setTableData([])
          setTotal(0)
        }
      } catch (error) {
        Logger.error('Error fetching data:', error)
        setTotal(0)
        setTableData([])
      } finally {
        setTableLoading(false)
      }
    }
    fetchAccessLogs()
  }, [DPStartDate, DPEndDate, page, ascOrder])
  const handleSorting = () => {
    const newOrder = ascOrder === 0 ? 1 : 0
    setAscOrder(newOrder)
    if (newOrder == 0 || newOrder == 1) {
      setPage(0)
    }
  }
  const handleStartDateChange = (date) => {
    TRACKEVENTOBJ.userStatistics.handleStartDateChange(
      {
        location,
      },
      date,
    )
    setDPStartDate(date)
    setDateRange([date, dateRange[1]])
  }
  const handleEndDateChange = (date) => {
    TRACKEVENTOBJ.userStatistics.handleEndDateChange(
      {
        location,
      },
      date,
    )
    setDPEndDate(date)
    setDateRange([dateRange[0], date])
  }
  const onSelectScreen = (data, value) => {
    setSelectedScreen(data)
    TRACKEVENTOBJ.userStatistics.handleFilterChange(
      {
        params,
        caseData,
        location,
      },
      value,
      'screen',
    )
  }
  useEffect(() => {
    const isAllAff = selectedData.selectedAffiliate.some(
      (val) => val.display_name.toLowerCase() === 'all',
    )
    if (isAllAff || selectedData.selectedAffiliate.length === 0) {
      setScreenData(allScreenData)
    } else {
      const filteredScreen = allScreenData.filter((screen) => {
        return !(
          screen.display_name == 'ADMIN' ||
          screen.display_name == 'SABIC CORPORATE'
        )
      })
      setScreenData(filteredScreen)
    }
  }, [selectedData])
  const handleAffiliateChange = (affiliates, isAll) => {
    if (isAll) {
      setSelectedData((prev) => {
        return {
          ...prev,
          selectedAffiliate: [
            {
              display_name: 'All',
              tag_name: 'All',
            },
            ...affiliates,
          ],
        }
      })
    } else {
      setSelectedData((prev) => {
        return {
          ...prev,
          selectedAffiliate: affiliates,
        }
      })
    }
  }
  const tabLabel = chartTab.toLowerCase()
  const suffix = tabLabel === 'daywise' ? tabLabel : tabLabel + 'wise'
  function renderAffiliateBarChart(graphLoading, graphData) {
    if (graphLoading) {
      return <Loader />
    } else if (graphData && !graphLoading) {
      /* istanbul ignore next */
      return (
        <BarChart
          disableExport={true}
          chartData={graphData?.timeWiseData}
          dataKey='avgScreenTimeInMin'
          isDateAxis={chartTab.toLowerCase() === 'daywise'}
          fieldKey={
            chartTab.toLowerCase() === 'daywise'
              ? 'timeWiseEpoch'
              : 'affiliateName'
          }
          barColor={variables.primary_blue}
          exportTitle={`average_screen_time_${suffix}`}
          startDate={DPStartDate}
          endDate={DPEndDate}
        />
      )
    } else {
      return (
        <span
          className='d-flex justify-content-center align-items-center h-100 text-14-regular'
          data-static-id='UserStatistics.js_span_de4b72'
        >
          No Data to Show
        </span>
      )
    }
  }
  return (
    <div
      className={`w-100 ${styles.userStatisticsContainer}`}
      data-static-id='UserStatistics.js_div_a373b1'
    >
      <div
        className={`${styles.topDescriptionContainer} d-flex`}
        data-static-id='UserStatistics.js_div_9a6fa0'
      >
        <p
          className={`text-12-regular text-uppercase mb-0 text_primary_gray_2 mt_03 ${styles.descriptionText}`}
          data-static-id='UserStatistics.js_p_1391de'
        >
          This page shows the usage metrics for different screens. Page filters
          can be used to filter out specific screens of affiliate/plant/system
          and the graphs will show the metrics for dashboard usage with respect
          to the users. For ex. SABIC corresponds to screen usage time of all
          non affiliate users.
        </p>
        <div
          className={`${styles.filterContainer}`}
          data-static-id='UserStatistics.js_div_16154a'
        >
          <div
            className={`d-flex align-items-center justify-content-end gap-4 h-100 ${styles.calenderFilterContainer}`}
            data-static-id='UserStatistics.js_div_6d7142'
          >
            <div
              className='d-flex align-items-center gap-2'
              data-static-id='UserStatistics.js_div_996099'
            >
              <p
                className='mb-0 text-16-regular mt_03 text-uppercase text_primary_gray'
                data-static-id='UserStatistics.js_p_27cfab'
              >
                From{' '}
                <span
                  className='text-16-bold ms-1'
                  data-static-id='UserStatistics.js_span_61cb73'
                >
                  :
                </span>
              </p>
              <div
                className={`${styles.filterItem} customDatePicker`}
                data-testid={'Date-Field-From'}
                data-static-id='UserStatistics.js_div_32e2fe'
              >
                <DatePicker
                  className='text-14-regular text_primary_gray'
                  dateFormat='dd-MMM-yyyy'
                  selected={DPStartDate}
                  maxDate={DPEndDate}
                  minDate={moment('2023-01-01T00:00:00').toDate()}
                  onChange={handleStartDateChange}
                  id='from-date'
                />
              </div>
            </div>
            <div
              className='d-flex align-items-center gap-2'
              data-static-id='UserStatistics.js_div_5e3953'
            >
              <p
                className='mb-0 text-16-regular mt_03 text-uppercase text_primary_gray'
                data-static-id='UserStatistics.js_p_17f66b'
              >
                To{' '}
                <span
                  className='text-16-bold ms-1'
                  data-static-id='UserStatistics.js_span_ac32b2'
                >
                  :
                </span>
              </p>
              <div
                className={`${styles.filterItem} customDatePicker`}
                data-testid={'Date-Field-End'}
                data-static-id='UserStatistics.js_div_3a7e32'
              >
                <DatePicker
                  className='text-14-regular text_primary_gray'
                  dateFormat='dd-MMM-yyyy'
                  selected={DPEndDate}
                  maxDate={new Date()}
                  onChange={handleEndDateChange}
                  minDate={DPStartDate}
                  id='end-date'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`${styles.divider}`}
        data-static-id='UserStatistics.js_div_d1400d'
      ></div>
      <div
        className={`${styles.USmainContainer}`}
        data-static-id='UserStatistics.js_div_2bf100'
      >
        <div
          className={styles.user_statistics_middle_container}
          data-static-id='UserStatistics.js_div_42ca1f'
        >
          <div
            className={styles.user_statistics_left_container}
            data-static-id='UserStatistics.js_div_fa2ca2'
          >
            <div
              className={`${styles.StatisticsCardContainer}`}
              data-static-id='UserStatistics.js_div_ff3c0f'
            >
              <div
                className={`${styles.StatisticsCard} w-100`}
                data-static-id='UserStatistics.js_div_b7329c'
              >
                <div
                  className={`${styles.imgContainer}`}
                  data-static-id='UserStatistics.js_div_244e58'
                >
                  <img
                    alt=''
                    src={screenTimeIcon}
                    data-static-id='UserStatistics.js_img_4c434f'
                  />
                </div>
                <div data-static-id='UserStatistics.js_div_8ef9cd'>
                  <h2
                    className={`text-14-regular mt_03 ${styles.headerText}`}
                    data-static-id='UserStatistics.js_h2_189365'
                  >
                    AVERAGE SCREEN TIME{' '}
                    <span
                      className='text-12-regular text_primary_gray_2'
                      data-static-id='UserStatistics.js_span_02117d'
                    >
                      (MINS/DAY/USER)
                    </span>
                  </h2>
                  <p
                    className={'text-16-bold mb-0'}
                    data-static-id='UserStatistics.js_p_0402f4'
                  >
                    {statisticsCountData?.avgScreenTimeInMin || '-'}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`${styles.TableSingleCardContainer}`}
              data-static-id='UserStatistics.js_div_7f9b85'
            >
              <SingleTitleCard
                title={
                  <>
                    <span
                      className='text-14-bold'
                      data-static-id='UserStatistics.js_span_70fe00'
                    >
                      DASHBOARD ACCESS LOG
                    </span>
                    <span
                      className='ms-2 text_primary_gray_2 text-12-bold'
                      data-static-id='UserStatistics.js_span_81fd1a'
                    >
                      ({moment(DPStartDate).format('DD MMM yyyy')} -{' '}
                      {moment(DPEndDate).format('DD MMM yyyy')})
                    </span>
                  </>
                }
              >
                {tableLoading ? (
                  <Loader />
                ) : (
                  <div
                    className={`${styles.UArightTableContainer} h-100`}
                    data-static-id='UserStatistics.js_div_4f65c0'
                  >
                    <div
                      className={`${styles.tableContainer}`}
                      data-static-id='UserStatistics.js_div_9055eb'
                    >
                      <SortableTableWithTooltip
                        headers={tableHeader}
                        data={tableData}
                        leftAlignColumns={[0, 1]}
                        dataFn={page}
                        tooltipColumns={3}
                      />
                    </div>
                    <div
                      className={`paginationContainer ${styles.userStaticsPagination}`}
                      data-static-id='UserStatistics.js_div_38472c'
                    >
                      <PaginationControl
                        page={page}
                        between={4}
                        total={total}
                        limit={ADMIN_STATS.STATS_RECORDS_PER_PAGE}
                        changePage={(newPage) => {
                          setPage(newPage)
                        }}
                        ellipsis={1}
                      />
                    </div>
                  </div>
                )}
              </SingleTitleCard>
            </div>
          </div>
          <div
            className={`${styles.user_statistics_right_container}`}
            data-static-id='UserStatistics.js_div_3064ac'
          >
            <div
              className={`${styles.topContainer}`}
              data-static-id='UserStatistics.js_div_b5d8ed'
            >
              <p
                className={`text-12-bold mb-0 text-uppercase text_primary_gray_2 ${styles.descriptionText}`}
                data-static-id='UserStatistics.js_p_e05a76'
              >
                Page Level Filters
              </p>
              <div
                className={`text-14-regular ${styles.filterRow}`}
                data-static-id='UserStatistics.js_div_37bc86'
              >
                <div
                  className={`${styles.singleSelectUserStaticsDropdown}`}
                  data-static-id='UserStatistics.js_div_3b1931'
                >
                  <MultiSelectAffiliateDropDowns
                    handleAffiliateChange={handleAffiliateChange}
                    isDropdownEvent
                  />
                </div>
                <div
                  className={'d-flex flex-column justify-content-center'}
                  data-static-id='UserStatistics.js_div_442b42'
                >
                  <span
                    className='mb-0 text-14-bold text-uppercase text_primary_gray'
                    data-static-id='UserStatistics.js_span_15511c'
                  >
                    Screen :
                  </span>
                  <div
                    className={`${styles.multiSelectHeightContainer}`}
                    data-static-id='UserStatistics.js_div_ff6d4b'
                  >
                    <MultiSelectV2
                      data={screenData}
                      onChange={onSelectScreen}
                      position='1'
                    />
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`${styles.cardContainerWrapper}`}
              data-static-id='UserStatistics.js_div_d10e13'
            >
              <div
                className={`h-50 ${styles.cardContainer}`}
                data-static-id='UserStatistics.js_div_41b457'
              >
                <SingleTitleCard
                  title={
                    <>
                      <span
                        className='text-14-bold ms-2'
                        data-static-id='UserStatistics.js_span_da7bc0'
                      >
                        AVERAGE SCREEN TIME
                      </span>
                      <span
                        className='text-12-bold ms-1 text_primary_gray_2'
                        data-static-id='UserStatistics.js_span_ebb0d7'
                      >
                        (MINS/DAY/USER)
                      </span>
                    </>
                  }
                  extraClasses='card-header'
                >
                  <Affiliate_Tab_Changer
                    tabsData={tabs}
                    onTabChange={(tab) => {
                      setChartTab(tab)
                    }}
                    setSelectedData={setSelectedData}
                  />
                  {renderAffiliateBarChart(graphLoading, graphData)}
                </SingleTitleCard>
              </div>
              <div
                className={`h-50 ${styles.cardContainer}`}
                data-static-id='UserStatistics.js_div_49ef55'
              >
                <SingleTitleCard
                  title={
                    <span
                      className='text-14-bold  ms-2'
                      data-static-id='UserStatistics.js_span_abf1bf'
                    >
                      Number of distinct users
                    </span>
                  }
                  extraClasses='card-header'
                >
                  {chartTab.toLowerCase() !== 'daywise' && (
                    <Affiliate_Tab_Changer
                      text={`Total Distinct Users: ${activeUsers}`}
                      imgSrc={distinctusersIcon}
                    />
                  )}

                  {graphLoading && <Loader />}
                  {graphData && !graphLoading /* istanbul ignore next */ ? (
                    <BarChart
                      disableExport={true}
                      chartData={graphData?.distinctUsersData}
                      dataKey='distinctUsers'
                      isDateAxis={chartTab.toLowerCase() === 'daywise'}
                      fieldKey={
                        chartTab.toLowerCase() === 'daywise'
                          ? 'timeWiseEpoch'
                          : 'affiliateName'
                      }
                      chartTitle='NO OF USERS'
                      barColor={variables.primary_yellow}
                      exportTitle={`total_distinct_users_${suffix}`}
                      startDate={DPStartDate}
                      endDate={DPEndDate}
                    />
                  ) : (
                    <div
                      className='d-flex justify-content-center align-items-center text-14-regular h-100'
                      data-static-id='UserStatistics.js_div_044b08'
                    >
                      No Data to Show
                    </div>
                  )}
                </SingleTitleCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default UserStatistics
