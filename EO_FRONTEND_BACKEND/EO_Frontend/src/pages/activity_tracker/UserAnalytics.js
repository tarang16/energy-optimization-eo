import arrow_down_blue from 'assets/sabic_new_icons/arrow_down_blue.svg'
import Loader from 'components/ui/loader/Loader'
import SearchBar from 'components/ui/search_bar/SearchBar'
import HorizontalBarChart from 'components/visuals/charts/bar_chart/HorizontalBarChart'
import LineChartUserAnalytics from 'components/visuals/charts/line_chart/linechart_multiple/LineChartUserAnalytics'
import SignleTitleCardWithDropdown from 'components/visuals/common/single_title_card/SignleTitleCardWithDropdown'
import SingleTitleCard from 'components/visuals/common/single_title_card/SingleTitleCard'
import SortableTableWithTooltip from 'components/visuals/table/sortable_table_with_tooltip/SortableTableWithTooltip'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { ADMIN_STATS } from 'config/Config'
import Logger from 'logger/Logger'
import moment from 'moment-timezone'
import { useEffect, useState } from 'react'
import { PaginationControl } from 'react-bootstrap-pagination-control'
import DatePicker from 'react-datepicker'
import { useLocation } from 'react-router-dom'
import {
  getUserAnalyticsLogs,
  getUserAnalyticsScreenWise,
} from 'services/AdminServices'
import { fetchScreenData } from 'utills/utilities'
import styles from './ActivityTracker.module.scss'
export default function UserAnalytics({ dataFn }) {
  const location = useLocation()
  const [DPStartDate, setDPStartDate] = useState(
    moment().subtract('7', 'days').toDate(),
  )
  const [DPEndDate, setDPEndDate] = useState(moment().toDate())
  const [screenData, setScreenData] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedScreen, setSelectedScreen] = useState([])
  const [tableData, setTableData] = useState([])
  const [chartData, setChartData] = useState()
  const [tableLoading, setTableLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingScreen, setIsLoadingScreen] = useState(true)
  const [tooltipData, setTooltipData] = useState([])
  const [total, setTotal] = useState(1)
  const [page, setPage] = useState(1)
  const [ascOrder, setAscOrder] = useState(0)
  useEffect(() => {
    const fetchScreen = async () => {
      if (!selectedUser) return
      const tempData = await fetchScreenData()
      if (tempData?.length > 0) {
        setScreenData(tempData)
        setSelectedScreen([tempData[0]])
      } else {
        setScreenData([])
        setSelectedScreen([])
      }
    }
    fetchScreen()
  }, [selectedUser])
  useEffect(() => {
    const fetchAccessLogs = async () => {
      try {
        if (!selectedUser?.employeeId) {
          return
        }
        setTableLoading(true)
        const response = await getUserAnalyticsLogs(
          DPStartDate,
          DPEndDate,
          selectedUser.employeeId,
          page,
          ADMIN_STATS.ANALYTICS_RECORDS_PER_PAGE,
          ascOrder,
        )
        const tempData = []
        if (response.statuscode === 200) {
          const tooltipData = response.data.map((item) => ({
            functionalityName: item.functionalityName,
            screenName: item.screenName,
          }))
          setTooltipData(tooltipData)
          response.data.forEach((item) =>
            tempData.push([
              item.affiliatePlantSystem?.trim().length
                ? item.affiliatePlantSystem
                : 'N/A',
              item.screenName,
              moment(item.createdOnEpoch).format('DD-MMM-YY hh:mm A'),
              parseFloat(item.screenDurationInSec / 60).toFixed(1) === '0.0'
                ? '0.1'
                : parseFloat(item.screenDurationInSec / 60).toFixed(1),
              // <div
              //   className="text-white text-14-regular"
              //   key={`${item.screenDurationInSec}-${item.functionalityName}-${item.userActionName}`}
              // >
              //   <div className="text-white">
              //     Functionality Name: {item.functionalityName}
              //   </div>
              //   <div className="text-white">
              //     User Action Name: {item.userActionName}
              //   </div>
              // </div>,
            ]),
          )
          setTableData(tempData)
          setTotal(response.pageCount * response.pageSize)
        } else {
          setTableData([])
          setTotal(0)
        }
      } catch (error) {
        setTableData([])
        setTotal(0)
      } finally {
        setTableLoading(false)
      }
    }
    fetchAccessLogs()
  }, [
    DPStartDate,
    DPEndDate,
    selectedUser,
    page,
    ADMIN_STATS.STATS_RECORDS_PER_PAGE,
    ascOrder,
  ])
  useEffect(() => {
    setIsLoading(true)
    setIsLoadingScreen(true)
    setPage(1)
  }, [DPStartDate, DPEndDate, selectedUser])
  useEffect(() => {
    const fetchAnalyticsChartData = async () => {
      try {
        if (!selectedUser?.employeeId) {
          return
        }
        setIsLoadingScreen(true)
        let screenIDs = ''
        selectedScreen.forEach((item, i) => {
          screenIDs += `${i === 0 ? '' : ','}${item.tag_name}`
        })
        const isAll = selectedScreen.some((item) => item.tag_name === 'all')
        const response = await getUserAnalyticsScreenWise(
          DPStartDate,
          DPEndDate,
          selectedUser?.employeeId,
          isAll ? undefined : screenIDs,
        )
        if (response.statuscode === 200) {
          setChartData(response.data)
        } else {
          setChartData()
        }
      } catch (error) {
        setChartData()
        Logger.log('error', error)
      } finally {
        setIsLoadingScreen(false)
        setIsLoading(false)
      }
    }
    fetchAnalyticsChartData()
  }, [DPStartDate, DPEndDate, selectedUser, selectedScreen])
  const header = [
    {
      title: 'AFFILIATE',
    },
    {
      title: 'SCREEN NAME',
    },
    {
      title: 'CREATED ON',
      icon: (
        <img
          src={arrow_down_blue}
          alt='Icon 2'
          style={{
            filter: 'unset',
            transform: ascOrder === 0 ? 'rotate(0deg)' : 'rotate(180deg)',
            marginRight: '1.5vmin',
          }}
          onClick={() => handleSorting()}
          data-static-id='UserAnalytics.js_img_2cd0a9'
        />
      ),
    },
    {
      title: 'DURATION (MINS/DAY)',
    },
  ]
  const customColumnWidths = ['35', '22', '30', '13']
  const handleSorting = () => {
    const newOrder = ascOrder === 0 ? 1 : 0
    setAscOrder(newOrder)
    if (newOrder == 0 || newOrder == 1) {
      setPage(0)
    }
  }
  const handleSearch = (user) => {
    TRACKEVENTOBJ.userAnalytics.handleSearch(
      {
        location,
      },
      user,
    )
    setSelectedUser(user)
  }
  const handleSelectScreen = (screen) => {
    setSelectedScreen(screen)
  }
  const handleStartDateChange = (date) => {
    TRACKEVENTOBJ.userAnalytics.handleStartDateChange(
      {
        location,
      },
      date,
    )
    const tempDate = new Date(moment(date))
    setDPStartDate(tempDate)
  }
  const handleEndDateChange = (date) => {
    TRACKEVENTOBJ.userAnalytics.handleEndDateChange(
      {
        location,
      },
      date,
    )
    const tempDate = new Date(moment(date))
    setDPEndDate(tempDate)
  }
  const getContent = () => {
    let content
    if (isLoading) {
      content = <Loader />
    } else if (chartData) {
      /* istanbul ignore next */
      content = (
        <HorizontalBarChart
          disableExport={true}
          chartData={chartData?.screenWiseAccess ?? []}
          exportTitle='average_screen_time_screen_wise'
          startDate={DPStartDate}
          endDate={DPEndDate}
        />
      )
    } else {
      content = (
        <p
          className='d-flex text-14-regular text-uppercase justify-content-center align-items-center h-100'
          data-static-id='UserAnalytics.js_p_7259f4'
        >
          No Data to Show
        </p>
      )
    }
    return content
  }
  return (
    <div
      className={styles.userAnalyticsContainer}
      data-static-id='UserAnalytics.js_div_b96a22'
    >
      <div
        className={`${styles.descriptionContainer}`}
        data-static-id='UserAnalytics.js_div_f2c7bd'
      >
        <p
          className='text-12-regular text-uppercase mb-0 text_primary_gray_2 mt_03'
          data-static-id='UserAnalytics.js_p_8f988a'
        >
          This page shows the usage metrics for any user selected. The activity
          logs and the time spent on specific screens for a user can be seen
          once the user is selected.
        </p>
      </div>
      <div
        className={`d-flex justify-content-between align-items-center ${styles.filterContainer}`}
        data-static-id='UserAnalytics.js_div_9f88f3'
      >
        <div
          className={styles.searchBarHeight}
          data-static-id='UserAnalytics.js_div_c12179'
        >
          <SearchBar
            onSearch={handleSearch}
            pageKey={''}
            title={'Search user'}
            hideValue={false}
            isClearable
          />
        </div>
        {/* <div className="text-16-bold">
          {selectedUser?.employeeName.replace(",", " ") || ""}
         </div> */}
        <div
          className={`d-flex align-items-center gap-4 ${styles.datePickerWrapper}`}
          data-static-id='UserAnalytics.js_div_69eed7'
        >
          <div
            className='h-100 d-flex align-items-center'
            data-static-id='UserAnalytics.js_div_e7bf6d'
          >
            <span
              className='text-16-regular mt_03 me-2 text-uppercase'
              data-static-id='UserAnalytics.js_span_054951'
            >
              From{' '}
              <span
                className='text-16-bold ms-1'
                data-static-id='UserAnalytics.js_span_5856d3'
              >
                :
              </span>
            </span>
            <div
              className={`customDatePicker datePickerWidth ${styles.datePickerOuterContainer} me-2 d-flex h-100`}
              data-static-id='UserAnalytics.js_div_51e01a'
            >
              <DatePicker
                className='text-14-regular text_primary_gray'
                dateFormat='dd-MMM-yyyy'
                selected={DPStartDate}
                maxDate={DPEndDate}
                onChange={handleStartDateChange}
                //   popperClassName={styles.popupClass}
                //   popperPlacement="bottom-end"
                //   popperProps={{ positionFixed: true }}
              />
            </div>
          </div>
          <div
            className='h-100 d-flex align-items-center'
            data-static-id='UserAnalytics.js_div_430a62'
          >
            <span
              className='text-16-regular  mt_03 me-2 text-uppercase'
              data-static-id='UserAnalytics.js_span_31e9c9'
            >
              To
              <span
                className='text-16-bold ms-1'
                data-static-id='UserAnalytics.js_span_276c55'
              >
                :
              </span>
            </span>
            <div
              className={`customDatePicker datePickerWidth type2 ${styles.datePickerOuterContainer} h-100  text-12-bold`}
              data-static-id='UserAnalytics.js_div_448283'
            >
              <DatePicker
                className='text-14-regular text_primary_gray'
                dateFormat='dd-MMM-yyyy'
                selected={DPEndDate}
                maxDate={new Date()}
                onChange={handleEndDateChange}
                minDate={DPStartDate}
                //   popperClassName={styles.popupClass}
                //   popperPlacement="bottom-end"
                //   popperProps={{ positionFixed: true }}
                //   maxDate={moment(eTime).toDate()}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`d-flex ${styles.userAnalyticsbottomContainer}`}
        data-static-id='UserAnalytics.js_div_9b3bf4'
      >
        {selectedUser ? (
          <>
            <div
              className={`w-50 h-100 ${styles.UAleftContainer}`}
              data-static-id='UserAnalytics.js_div_c67f4b'
            >
              <div
                className='h-50'
                data-static-id='UserAnalytics.js_div_41a61b'
              >
                <SingleTitleCard
                  extraClasses='m-0 h-100'
                  title={
                    <>
                      <span
                        className='text-14-bold'
                        data-static-id='UserAnalytics.js_span_f9f835'
                      >
                        AVERAGE SCREEN TIME
                      </span>
                      <span
                        className='text-12-bold ms-1 text_primary_gray_2'
                        data-static-id='UserAnalytics.js_span_b29eec'
                      >
                        (MINS/DAY)
                      </span>
                    </>
                  }
                >
                  {getContent()}
                </SingleTitleCard>
              </div>
              <div
                className='h-50'
                data-static-id='UserAnalytics.js_div_419198'
              >
                <SignleTitleCardWithDropdown
                  extraClasses='m-0 h-100'
                  title={'SCREEN USAGE TREND'}
                  dropDownItems={screenData}
                  dropdownTitle={'SCREEN'}
                  onSelectChange={handleSelectScreen}
                >
                  <>
                    {isLoadingScreen && <Loader />}
                    {chartData ? (
                      <LineChartUserAnalytics
                        disableExport={true}
                        data={chartData?.dayWiseScreenAccess}
                        exportTitle='screen_usage_trend'
                        startDate={DPStartDate}
                        endDate={DPEndDate}
                      />
                    ) : (
                      <p
                        className='d-flex text-14-regular text-uppercase mb-0 justify-content-center align-items-center h-100'
                        data-static-id='UserAnalytics.js_p_da96f8'
                      >
                        No Data to Show
                      </p>
                    )}
                  </>
                </SignleTitleCardWithDropdown>
              </div>
            </div>
            <div
              className={`w-50 h-100 ${styles.UArightContainer}`}
              data-static-id='UserAnalytics.js_div_c6ae59'
            >
              <SingleTitleCard
                extraClasses='m-0 h-100'
                title={
                  <>
                    <span
                      className='text-14-bold'
                      data-static-id='UserAnalytics.js_span_76e8e7'
                    >
                      DASHBOARD ACCESS LOG
                    </span>
                  </>
                }
              >
                {tableLoading ? (
                  <Loader />
                ) : (
                  <div
                    className={`${styles.UArightTableContainer} h-100`}
                    data-static-id='UserAnalytics.js_div_f965ad'
                  >
                    <div
                      className={`${styles.tableContainer} w-100`}
                      data-static-id='UserAnalytics.js_div_46ec1c'
                    >
                      <SortableTableWithTooltip
                        headers={header}
                        data={tableData}
                        customColumnWidths={customColumnWidths}
                        leftAlignColumns={[0, 1, 2]}
                        dataFn={page}
                        tooltipColumns={4}
                        tooltipData={tooltipData}
                        renderTooltip={(rowIndex, columnIndex) => {
                          const tooltipInfo = tooltipData.find(
                            (item) =>
                              item.functionalityName ===
                                tableData[rowIndex][1] &&
                              item.screenName === tableData[rowIndex][1],
                          )
                          return (
                            <div data-static-id='UserAnalytics.js_div_32f382'>
                              <p data-static-id='UserAnalytics.js_p_9a6d8f'>
                                Functionality Name:
                                {tooltipInfo.functionalityName}
                              </p>
                              <p data-static-id='UserAnalytics.js_p_b6139e'>
                                Screen Name: {tooltipInfo.screenName}
                              </p>
                            </div>
                          )
                        }}
                      />
                    </div>

                    <div
                      className={`paginationContainer ${styles.userStaticsPagination}`}
                      data-static-id='UserAnalytics.js_div_5e67c9'
                    >
                      <PaginationControl
                        page={page}
                        between={4}
                        total={total}
                        limit={ADMIN_STATS.ANALYTICS_RECORDS_PER_PAGE}
                        changePage={(page) => {
                          setPage(page)
                        }}
                        ellipsis={1}
                      />
                    </div>
                  </div>
                )}
              </SingleTitleCard>
            </div>
          </>
        ) : (
          <div
            className='text-16-regular w-100 text-center d-flex align-items-center justify-content-center py-2 text-uppercase'
            style={{
              height: 'calc(100% - 8vmin)',
            }}
            data-static-id='UserAnalytics.js_div_37fe89'
          >
            Please select user
          </div>
        )}
      </div>
    </div>
  )
}
