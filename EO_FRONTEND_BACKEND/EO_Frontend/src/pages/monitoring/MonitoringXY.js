import Loader from 'components/ui/loader/Loader'
import MonitoringTable from 'components/visuals/table/MonitoringTable'
import Table from 'components/visuals/table/Table'
import variables from 'config/scss/variables'
import binBlueICon from 'assets/sabic_icons/common/bin_blue.svg'
import infoBlueIcon from 'assets/sabic_icons/common/timeinfo_blue.svg'
import leftArrow from 'assets/sabic_icons/monitoring/arrow_left.svg'
import rightArrow from 'assets/sabic_icons/monitoring/arrow_right.svg'
import { AppAtom } from 'atoms/AppAtom'
import {
  monitoringTableData,
  monitoringXYChartData,
  monitoringXYSelectedRow,
  monitoringXYSelectedRowId,
  monitoringXYXAxis,
} from 'atoms/MonitoringAtom'
import { activeFavoriteTrendsAtom } from 'atoms/SidebarAtom'
import PerformanceLog from 'components/elements/performance_log/PerformanceLog'
import ChartWrapperXY from 'components/visuals/charts/line_chart/linechart_multiple/ChartWrapperXY'
import SignleTitleCardWithDropdown from 'components/visuals/common/single_title_card/SignleTitleCardWithDropdown'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import Logger from 'logger/Logger'
import moment from 'moment'
import { colorsArr, dottedTrendArr } from 'pages/monitoring/Monitoring'
import React, { useCallback, useEffect, useState } from 'react'
import { Form, OverlayTrigger } from 'react-bootstrap'
import { PaginationControl } from 'react-bootstrap-pagination-control'
import Tooltip from 'react-bootstrap/Tooltip'
import { useOutletContext, useParams } from 'react-router-dom'
import {
  getMonitoringCategories,
  getMonitoringData,
} from 'services/CurrentServices'
import { getFavouriteByTrendId } from 'services/FavoriteService'
import {
  convertFormulaToHtml,
  getValsBaseOnCondition,
  slugToText,
} from 'utills/utilities'
import styles from './Monitoring.module.scss'
const monitoringXYHeaders = [
  'CATEGORY',
  'PARAMETER',
  'DESIGN',
  'ACTUAL',
  'OPTIMUM',
  'Y-AXIS',
  'X-AXIS',
]
export function setCategoryObjData(filteredData, setCategoryObj) {
  let category_obj = {}
  for (let categoryI of filteredData) {
    const category = categoryI[0]
    if (category in category_obj) {
      category_obj[category][0] += 1
    } else {
      category_obj[category] = [1, 0]
    }
  }
  setCategoryObj(category_obj)
}
export function getValue(val) {
  if (val == null || val == undefined) {
    return '-'
  } else {
    return val
  }
}
export function getDesignValue(val) {
  if (val == null || val == undefined) {
    return 'N/A'
  } else {
    return val
  }
}
export function getStateColor(val) {
  if (val == 1) {
    return 'text_primary_orange'
  } else {
    return ''
  }
}
const MAX_RECORDS = 20

/* istanbul ignore next */
export default function MonitoringXY() {
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const initEndTime = ctxData?.actualTime || moment.now().valueOf()
  const { caseId } = useOutletContext()
  const [monitoringData, setMonitoringData] = useState([])
  const [filteredMonitoringApiData, setFilteredMonitoringApiData] = useState([])
  const [monitoringApiData, setMonitoringApiData] = useAtom(monitoringTableData)
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false)
  const [filteredData, setFilteredData] = useState([])
  const [finalFilteredData, setFinalFilteredData] = useState([])
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [categoryObj, setCategoryObj] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [chartDataAtom, setChartDataAtom] = useAtom(monitoringXYChartData)
  const [selectedRowAtom, setSelectedRowAtom] = useAtom(monitoringXYSelectedRow)
  const [monitoringXAtom, setMonitoringXAtom] = useAtom(monitoringXYXAxis)
  const [selectedRowIdAtom, setselectedRowIdAtom] = useAtom(
    monitoringXYSelectedRowId,
  )
  const [activeFavoriteTrend, setActiveFavoriteTrend] = useAtom(
    activeFavoriteTrendsAtom,
  )
  const [favTrendData, setFavoriteTrendData] = useState(null)
  const [categoryData, setCategoryData] = useState([
    {
      display_name: 'ALL',
      tag_name: '',
    },
  ])
  const [selectedCategory, setSelectedCategory] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [hAxisInfo, sethAxisInfo] = useState({
    tagName: null,
    index: -1,
  })
  const resetActiveFavTrend = useSetAtom(activeFavoriteTrendsAtom)
  useEffect(() => {
    ;(async () => {
      if (activeFavoriteTrend && monitoringData?.length) {
        const resp = await getFavouriteByTrendId(activeFavoriteTrend)
        if (!resp?.data?.isMonitoringXY) {
          setActiveFavoriteTrend(null)
          return
        }
        setFavoriteTrendData(resp.data)
        setSelectedRowAtom((prevVal) => ({
          ...prevVal,
          [caseId]: [],
        }))
        setselectedRowIdAtom((prevRows) => ({
          ...prevRows,
          [caseId]: [],
        }))
        setMonitoringXAtom((prevData) => ({
          ...prevData,
          [caseId]: {
            tagName: null,
            index: -1,
          },
        }))
        setChartDataAtom((prevData) => ({
          ...prevData,
          [caseId]: {
            caseId: caseId,
            tagsList: [],
            endTime: ctxData?.actualTime || initEndTime,
          },
        }))
        if (resp.data?.xAxisTagDetail) {
          setTimeout(() => {
            setMonitoringXAtom((prevData) => ({
              ...prevData,
              [caseId]: JSON.parse(
                resp.data.xAxisTagDetail.replaceAll("'", '"'),
              ),
            }))
          }, 20)
        }
        setTimeout(() => {
          resp?.data?.tagDetails.map((item, itemIndex) => {
            return handleSelectionAdd(
              JSON.parse(item.replaceAll("'", '"')),
              itemIndex,
              true,
            )
          })
        }, 10)
        setTimeout(() => {
          ;(resp.data?.tagDetails ?? [])
            .map((tags) => JSON.parse(tags.replaceAll("'", '"')))
            .map((selectedTag) => {
              const checkBoxElement = document.getElementById(
                `checkbox-${selectedTag.tagName}`,
              )
              handleCheckboxToggle(checkBoxElement)
            })
          if (hAxisInfo?.tagName) {
            const checkBoxElement = document.getElementById(
              `checkbox-${hAxisInfo?.tagName}-x-axis`,
            )
            handleCheckboxToggle(checkBoxElement)
          }
        }, 20)
      }
    })()
  }, [monitoringData, activeFavoriteTrend])
  const handleCheckboxToggle = (checkBoxElement) => {
    if (checkBoxElement) {
      checkBoxElement.checked = true
    }
  }
  useEffect(() => {
    if (!activeFavoriteTrend) {
      if (Object.keys(chartDataAtom).length === 0) {
        setChartDataAtom({
          [caseId]: {
            caseId: caseId,
            tagsList: [],
            endTime: ctxData?.actualTime || initEndTime,
          },
        })
      } else if (!chartDataAtom[caseId]) {
        setChartDataAtom((prevData) => {
          return {
            ...prevData,
            [caseId]: {
              caseId: caseId,
              tagsList: [],
              endTime: ctxData?.actualTime || initEndTime,
            },
          }
        })
      } else {
        chartDataAtom[caseId].tagsList?.map((selectedTag) => {
          const checkBoxElement = document.getElementById(
            `checkbox-${selectedTag[6]}`,
          )
          handleCheckboxToggle(checkBoxElement)
        })
        if (hAxisInfo?.tagName) {
          const checkBoxElement = document.getElementById(
            `checkbox-${hAxisInfo?.tagName}-x-axis`,
          )
          handleCheckboxToggle(checkBoxElement)
        }
      }
    }
  }, [ctxData?.actualTime])
  useEffect(() => {
    if (
      Object.keys(selectedRowIdAtom).length === 0 ||
      !selectedRowIdAtom[caseId]
    ) {
      setselectedRowIdAtom((prevRows) => {
        return {
          ...prevRows,
          [caseId]: [],
        }
      })
    }
  }, [ctxData?.actualTime])
  useEffect(() => {
    if (!activeFavoriteTrend) {
      if (Object.keys(selectedRowAtom).length === 0) {
        setSelectedRowAtom({
          [caseId]: [],
        })
      } else if (!selectedRowAtom[caseId]) {
        setSelectedRowAtom((prevRows) => {
          return {
            ...prevRows,
            [caseId]: [],
          }
        })
      }
    }
  }, [ctxData?.actualTime])
  let headersSelectedTag = [
    'PARAMETER',
    'CATEGORY',
    'OPTIMUM',
    'AUTO Y AXIS',
    'MIN',
    'MAX',
    '',
  ]
  const getCheckboxValue = (obj, cachedAxisInfo, i, hAxisInfo) => {
    if (obj?.tagName == cachedAxisInfo?.tagName) {
      return true
    } else if (i == hAxisInfo.index) {
      return true
    } else {
      return false
    }
  }
  const handleSearchChange = (value, filteredData) => {
    setSearchQuery(value.toLowerCase())
    if (value.length !== 0) {
      let tempData = filteredData.filter(
        (item) =>
          item[7].toLowerCase().includes(value.toLowerCase()) ||
          item[11].toLowerCase().includes(value.toLowerCase()),
      )
      setFinalFilteredData(tempData)
      setTimeout(() => {
        setCategoryObjData(tempData, setCategoryObj)
      }, 0)
    } else {
      setFinalFilteredData(filteredData)
      setCategoryObjData(filteredData, setCategoryObj)
    }
  }
  const prepareData = (data, cachedAxisInfo) => {
    return data
      ?.sort((a, b) => a.sortID - b.sortID)
      ?.map((obj, i) => {
        const category = obj.category.includes(',')
          ? obj.category.split(',').map((element) => element.trim())[0]
          : obj.category
        return [
          category?.toUpperCase(),
          <>
            {convertFormulaToHtml(obj.parameter?.toUpperCase())}
            {convertFormulaToHtml(` (${getValue(obj?.uom?.toUpperCase())})`)}
          </>,
          getDesignValue(obj.design),
          <span
            key={obj.actual}
            className={getStateColor(obj.state)}
            data-static-id='MonitoringXY.js_span_631c1b'
          >
            {getValue(obj.actual)}
          </span>,
          getValue(obj.optimum),
          obj.min,
          obj.max,
          obj.tagName,
          <div
            key={obj.tagName}
            className='d-flex justify-content-center'
            data-static-id='MonitoringXY.js_div_9233f6'
          >
            <Form.Check
              reverse
              name='group1'
              type={'checkbox'}
              defaultChecked={
                Object.keys(chartDataAtom).length !== 0 &&
                chartDataAtom[caseId] &&
                Object.keys(chartDataAtom[caseId]).length !== 0 &&
                chartDataAtom[caseId]?.tagsList?.some(
                  (tag) => tag.tagName == obj.tagName && !activeFavoriteTrend,
                )
              }
              data-testid={`checkbox-${obj.tagName}`}
              id={`checkbox-${obj.tagName}`}
              onChange={(e) => {
                TRACKEVENTOBJ.Monitoring.handleSelected({
                  data: obj,
                  params: params,
                  caseData: ctxData?.caseData,
                  axis: 'Y-Axis',
                })
                handleSelected(e, obj, i)
              }}
            />
          </div>,
          <div
            key={`${obj.tagName}-x-axis`}
            className='d-flex justify-content-center'
            data-static-id='MonitoringXY.js_div_b510e6'
          >
            <Form.Check
              name='groupXAxis'
              type={'radio'}
              checked={getCheckboxValue(obj, cachedAxisInfo, i, hAxisInfo)}
              data-testid={`checkbox-${obj.tagName}-x-axis`}
              id={`checkbox-${obj.tagName}-x-axis`}
              className='mt-0'
              onChange={(e) => {
                TRACKEVENTOBJ.Monitoring.handleSelected({
                  data: obj,
                  params: params,
                  caseData: ctxData?.caseData,
                  axis: 'X-Axis',
                })
                handleXAxisSelected(e, obj, i)
              }}
            />
          </div>,
          obj.parameter?.toUpperCase(),
          obj.uom?.toUpperCase(),
          obj.displayFormula,
          obj?.displayDescription?.toUpperCase(),
          obj?.piName ?? '',
        ]
      })
  }
  const processMonitoringData = useCallback(
    async (
      actualTime = '',
      searchQuery = '',
      selectedCategory = '',
      chartDataAtom = {},
      hAxisInfo = {},
    ) => {
      setIsLoadingCompleted(false)
      try {
        if (!ctxData?.actualTime || !caseId) {
          setIsLoadingCompleted(true)
          return
        }
        const tempActualTime = moment(ctxData.actualTime)
        const { data, pageCount } = await getMonitoringData(
          caseId,
          tempActualTime,
          selectedCategory,
          searchQuery,
          page,
        )
        setTotal(pageCount + 1)
        setMonitoringApiData(data)
        setFilteredMonitoringApiData(data)
        const cachedAxisInfo = monitoringXAtom[caseId]
        const filteredData = prepareData(data, cachedAxisInfo)
        setMonitoringData(filteredData)
        setFilteredData(filteredData)
        setFinalFilteredData(filteredData)
        setCategoryObjData(filteredData, setCategoryObj)
        setTimeout(() => {
          chartDataAtom[caseId]?.tagsList?.map((selectedTag) => {
            const checkBoxElement = document.getElementById(
              `checkbox-${selectedTag.tagName}`,
            )
            if (checkBoxElement) {
              checkBoxElement.checked = true
            }
          })
          if (hAxisInfo?.tagName) {
            const checkBoxElement = document.getElementById(
              `checkbox-${hAxisInfo?.tagName}-x-axis`,
            )
            if (checkBoxElement) {
              checkBoxElement.checked = true
            }
          }
        }, 0)
        setIsLoadingCompleted(true)
      } catch (err) {
        Logger.log('err', err)
        setIsLoadingCompleted(true)
      }
    },
    [ctxData?.actualTime, JSON.stringify(categoryData), page],
  )
  useEffect(() => {
    const isAll = selectedCategory.some(
      (item) => item.display_name?.toLowerCase() === 'all',
    )
    let selectedCat = null
    if (!isAll) {
      selectedCat = selectedCategory?.map((obj) => obj.tag_name)?.join(',')
    }
    processMonitoringData(
      ctxData?.actualTime,
      searchQuery,
      selectedCat,
      chartDataAtom,
      hAxisInfo,
    )
  }, [ctxData?.actualTime, JSON.stringify(categoryData), searchQuery, page])
  async function fetchCategories(caseId) {
    setIsLoadingCompleted(false)
    if (caseId) {
      const categories = await getMonitoringCategories(caseId)
      let uniqueCategories = []
      if (Array.isArray(categories?.data) && categories?.data?.length > 0) {
        uniqueCategories = categories?.data.map((obj) => obj.category)
      }
      const tempCatData = [
        {
          display_name: 'All',
          tag_name: null,
        },
        ...Array.from(uniqueCategories).map((obj) => ({
          display_name: obj,
          tag_name: obj?.toLowerCase(),
        })),
      ]
      setCategoryData(tempCatData)
      setSelectedCategory([tempCatData[0]])
    }
  }
  useEffect(() => {
    fetchCategories(caseId)
  }, [caseId])
  useEffect(() => {
    if (!searchQuery) setCategoryObjData(filteredData, setCategoryObj)
  }, [filteredData])
  const handleSelectedChartTag = (e, row, rowIndex, color) => {
    TRACKEVENTOBJ.Monitoring.onCheckboxClick({
      tagName: row?.tagName,
      key: 'Parameter',
      params: params,
      caseData: ctxData?.caseData,
    })
    const tempData = []
    let tempValue = []
    setSelectedRowAtom((prevValue) => {
      tempValue = prevValue
      return {
        ...prevValue,
      }
    })
    let filteredColor
    let tempChartDataAtom = JSON.parse(JSON.stringify(chartDataAtom))
    setChartDataAtom((prevVal) => {
      filteredColor = handleFilteredColor(row, prevVal, true)
      tempChartDataAtom = prevVal
      return {
        ...prevVal,
      }
    })
    const tagShowed = tempChartDataAtom[caseId]?.tagsList?.filter(
      (item) => item.show,
    )
    if (tagShowed.length < 5 || !e.target.checked) {
      tempValue[caseId]?.map((item) => {
        if (item.includes(row.tagName)) {
          let newRow = []
          item.map((it) => newRow.push(it))
          newRow[0] = (
            <div
              className='d-flex justify-content-start align-items-center ps-2'
              data-static-id='MonitoringXY.js_div_459694'
            >
              <button
                className='backgroundGrayButton me-2'
                data-static-id='MonitoringXY.js_button_ff8673'
              >
                <img
                  alt=''
                  src={binBlueICon}
                  className='blueOnHover'
                  onClick={() => handleUnselectTag(row, rowIndex)}
                  data-static-id='MonitoringXY.js_img_5c210b'
                />
              </button>
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip
                    id={row.tagName}
                    style={{
                      zIndex: 999,
                    }}
                    place='top'
                    data-static-id='MonitoringXY.js_Tooltip_57e824'
                  >
                    <div
                      className={'react-tooltips'}
                      data-static-id='MonitoringXY.js_div_82293d'
                    >
                      <span
                        className='text-12-primary d-block text-white'
                        data-static-id='MonitoringXY.js_span_f4ac0c'
                      >
                        Tag Name: {convertFormulaToHtml(row.tagName)}
                      </span>
                      <span
                        className='text-12-primary d-block text-white overflow-scoll'
                        data-static-id='MonitoringXY.js_span_d70893'
                      >
                        Formula:{' '}
                        {convertFormulaToHtml(row?.displayFormula) || 'N/A'}
                      </span>
                    </div>
                  </Tooltip>
                }
              >
                <button
                  className='backgroundGrayButton me-2'
                  data-static-id='MonitoringXY.js_button_5cd2c5'
                >
                  <img
                    alt=''
                    data-tooltip-id={row.tagName}
                    src={infoBlueIcon}
                    data-static-id='MonitoringXY.js_img_23d4b3'
                  />
                </button>
              </OverlayTrigger>

              <div
                className={`me-2 ${styles.trendIconContainer}`}
                data-static-id='MonitoringXY.js_div_c2708e'
              >
                <i
                  className='icon-trend text-24-regular'
                  style={{
                    color: getValsBaseOnCondition(
                      e.target.checked,
                      filteredColor[0],
                      `${variables.primary_white}`,
                    ),
                  }}
                  data-static-id='MonitoringXY.js_i_727b19'
                ></i>
              </div>

              <Form.Check
                reverse
                name={'group1'}
                type={'checkbox'}
                defaultChecked={e.target.checked}
                id={`trend-checkbox-${row.tagName}`}
                data-testid={`trend-checkbox-${row.tagName}`}
                onChange={(e) =>
                  handleSelectedChartTag(e, row, rowIndex, color)
                }
                className={`me-2  ${styles.formCheckContainer}`}
              />
              <div className='mt-1' data-static-id='MonitoringXY.js_div_cadcd4'>
                {convertFormulaToHtml(row.parameter?.toUpperCase())}
                {convertFormulaToHtml(` (${row?.uom?.toUpperCase()})`)}
              </div>
            </div>
          )
          newRow[2] = (
            <div
              className='d-flex justify-content-center'
              data-static-id='MonitoringXY.js_div_505b7b'
            >
              <div
                className={`me-2 ${styles.trendIconContainer}`}
                data-static-id='MonitoringXY.js_div_e51114'
              >
                <img
                  alt=''
                  src={
                    dottedTrendArr[
                      getValsBaseOnCondition(
                        e.target.checked,
                        filteredColor[0],
                        `${variables.primary_white}`,
                      )
                    ]
                  }
                  data-static-id='MonitoringXY.js_img_e851da'
                />
              </div>
              <Form.Check
                reverse
                name='group1'
                type={'checkbox'}
                defaultChecked={
                  document.getElementById(`optimum-checkbox-${row.tagName}`)
                    .checked
                }
                id={`optimum-checkbox-${row.tagName}`}
                onChange={(e) => handleTagOptimum(e, row, color)}
              />
            </div>
          )
          const rowVal = getValsBaseOnCondition(e.target.checked, false, true)
          newRow[8] = rowVal
          tempData.push(newRow)
        } else {
          tempData.push(item)
        }
      })
      setSelectedRowAtom((prevRows) => {
        return {
          ...prevRows,
          [caseId]: tempData,
        }
      })
      setChartDataAtom((prevVal) => {
        const tempTagData = prevVal[caseId]?.tagsList.map((item) => {
          if (item.tagName === row.tagName) {
            return {
              ...item,
              show: !item.show,
              serisColor: getValsBaseOnCondition(
                e.target.checked,
                filteredColor[0],
                `${variables.primary_white}`,
              ),
            }
          } else {
            return item
          }
        })
        return {
          ...prevVal,
          [caseId]: {
            ...prevVal[caseId],
            tagsList: tempTagData,
          },
        }
      })
    } else {
      alert("You can't select more than 5 tags")
    }
  }
  const handleTagOptimum = (e, row, color) => {
    TRACKEVENTOBJ.Monitoring.onCheckboxClick({
      tagName: row?.tagName,
      key: 'Optimum',
      params: params,
      caseData: ctxData?.caseData,
    })
    const tempData = []
    setSelectedRowAtom((prevRow) => {
      prevRow[caseId].map((item) => {
        if (item.includes(row.tagName)) {
          let newRow = []
          item.map((it) => newRow.push(it))
          newRow[2] = (
            <div
              className='d-flex justify-content-center'
              data-static-id='MonitoringXY.js_div_f62aa4'
            >
              <div
                className={`me-2 ${styles.trendIconContainer}`}
                data-static-id='MonitoringXY.js_div_d212bb'
              >
                <img
                  alt=''
                  src={dottedTrendArr[color]}
                  data-static-id='MonitoringXY.js_img_88e1b3'
                />
              </div>
              <Form.Check
                reverse
                name='group1'
                type={'checkbox'}
                defaultChecked={e.target.checked}
                id={`optimum-checkbox-${row.tagName}`}
                onChange={(e) => handleTagOptimum(e, row, color)}
              />
            </div>
          )
          tempData.push(newRow)
        } else {
          tempData.push(item)
        }
      })
      return {
        ...prevRow,
        [caseId]: tempData,
      }
    })
    setChartDataAtom((prevVal) => {
      const tempTagData = prevVal[caseId]?.tagsList.map((item) => {
        const value = getValsBaseOnCondition(
          item.tagName === row.tagName,
          {
            ...item,
            isOptimumEnabled: !item.isOptimumEnabled,
          },
          item,
        )
        return value
      })
      return {
        ...prevVal,
        [caseId]: {
          ...prevVal[caseId],
          tagsList: tempTagData,
        },
      }
    })
  }
  const handleTagYaxis = (e, row) => {
    TRACKEVENTOBJ.Monitoring.onCheckboxClick({
      tagName: row?.tagName,
      key: 'Auto Y Axis',
      params: params,
      caseData: ctxData?.caseData,
    })
    let tempChartData
    setChartDataAtom((prevVal) => {
      tempChartData = JSON.parse(JSON.stringify(prevVal))
      return tempChartData
    })
    setSelectedRowAtom((prevRows) => {
      let rows = JSON.parse(JSON.stringify(prevRows))
      const newData = []
      prevRows[caseId].map((item) => {
        if (item.includes(row.tagName)) {
          const tempTagData = tempChartData[caseId]?.tagsList.filter(
            (item) => item.tagName === row.tagName,
          )
          let newItem = []
          item.map((it) => newItem.push(it))
          newItem[3] = (
            <div
              className='d-flex justify-content-center'
              data-static-id='MonitoringXY.js_div_cbe464'
            >
              <Form.Check
                reverse
                name='group1'
                type={'checkbox'}
                defaultChecked={e.target.checked}
                id={`autoYaxis-checkbox-${row.tagName}`}
                onChange={(e) => handleTagYaxis(e, row)}
              />
            </div>
          )
          if (e.target.checked) {
            newItem[4] = tempTagData[0]?.defaultMin
            newItem[5] = tempTagData[0]?.defaultMax
            newItem[7] = createApplyButton(row, true, rows)
          } else {
            newItem[7] = createApplyButton(row, false, rows)
            newItem[4] = createInputField(
              `input-min-${row.tagName}`,
              newItem[4],
            )
            newItem[5] = createInputField(
              `input-max-${row.tagName}`,
              newItem[5],
            )
          }
          newData.push(newItem)
        } else {
          newData.push(item)
        }
      })
      return {
        ...prevRows,
        [caseId]: newData,
      }
    })
    setChartDataAtom((prevVal) => {
      const tempTagData = prevVal[caseId]?.tagsList.map((item) =>
        item.tagName === row.tagName
          ? {
              ...item,
              min: item.defaultMin,
              max: item.defaultMax,
              isAutoYAxis: !item.isAutoYAxis,
            }
          : item,
      )
      return {
        ...prevVal,
        [caseId]: {
          ...prevVal[caseId],
          tagsList: tempTagData,
        },
      }
    })
  }
  const createApplyButton = (row, disabled, rows) => (
    <div className='d-flex' data-static-id='MonitoringXY.js_div_ce078f'>
      <button
        id={`button-apply-${row.tagName}`}
        disabled={disabled}
        className={`${disabled ? 'backgroundGrayButtonMonitoring text-13-regular text-uppercase cursor-not-allowed' : 'backgroundBlueButtonMonitoring text-13-regular text-uppercase text_primary_white'} py-1 border-0`}
        style={{
          borderRadius: '.3vmin',
          border: 'none',
        }}
        onClick={(e) => {
          TRACKEVENTOBJ.Monitoring.onApplyClick({
            tagName: row?.tagName,
            params: params,
            caseData: ctxData?.caseData,
          })
          handleApplyButtonClick(e, row, caseId)
        }}
        data-static-id='MonitoringXY.js_button_47f403'
      >
        Apply
      </button>
    </div>
  )
  function handleApplyButtonClick(e, row, caseId) {
    const min = document.getElementById(`input-min-${row.tagName}`).value
    const max = document.getElementById(`input-max-${row.tagName}`).value
    if (Number(min) > Number(max)) {
      alert('Min value should not be greater then Max value')
    } else if (Number(max) < Number(min)) {
      alert('Max value should not be less then Min value')
    } else {
      setSelectedRowAtom((prevRows) => {
        const newData = []
        prevRows[caseId].map((item) => {
          if (item.includes(row.tagName)) {
            let newItem = []
            item.map((it) => newItem.push(it))
            newItem[4] = (
              <input
                id={`input-min-${row.tagName}`}
                defaultValue={min}
                type='number'
                data-static-id='MonitoringXY.js_input_4ad006'
              />
            )
            newItem[5] = (
              <input
                id={`input-max-${row.tagName}`}
                defaultValue={max}
                type='number'
                data-static-id='MonitoringXY.js_input_dc6613'
              />
            )
            newData.push(newItem)
          } else {
            newData.push(item)
          }
        })
        return {
          ...prevRows,
          [caseId]: newData,
        }
      })
      setChartDataAtom((prevVal) => {
        const tempTagData = prevVal[caseId]?.tagsList.map((item) => {
          if (item.tagName === row.tagName) {
            return {
              ...item,
              min,
              max,
            }
          } else {
            return item
          }
        })
        return {
          ...prevVal,
          [caseId]: {
            ...prevVal[caseId],
            tagsList: tempTagData,
          },
        }
      })
    }
  }
  const createInputField = (id, defaultValue) => (
    <input
      id={id}
      defaultValue={defaultValue}
      type='number'
      className={`${styles.customInputMonitoring}`}
      data-static-id='MonitoringXY.js_input_659031'
    />
  )
  const handleSelected = (e, row, rowIndex) => {
    if (e.target.checked) {
      handleSelectionAdd(row, rowIndex, false)
    } else {
      handleSelectionRemove(row, rowIndex)
    }
    resetActiveFavTrend(null)
  }
  const handleXAxisSelected = (e, row, rowIndex) => {
    setMonitoringXAtom((prevRows) => {
      return {
        ...prevRows,
        [caseId]: {
          tagName: row?.tagName,
          index: rowIndex,
          parameter: row?.parameter,
        },
      }
    })
  }
  useEffect(() => {
    if (monitoringXAtom[caseId]) {
      const row = monitoringXAtom[caseId]
      sethAxisInfo({
        tagName: row?.tagName,
        index: row.index,
        parameter: row.parameter,
      })
    }
  }, [monitoringXAtom])
  useEffect(() => {
    if (hAxisInfo?.index != null) {
      // Sort the data
      const sortedData = filteredMonitoringApiData.toSorted(
        (a, b) => a.sortID - b.sortID,
      )
      const cachedAxisInfo = monitoringXAtom[caseId]
      // Map the sorted data
      const filteredData = sortedData.map((obj, i) => {
        const category = obj.category.includes(',')
          ? obj.category.split(',').map((element) => element.trim())[0]
          : obj.category
        return [
          category?.toUpperCase(),
          <>
            {convertFormulaToHtml(obj.parameter?.toUpperCase())}
            {convertFormulaToHtml(` (${getValue(obj?.uom?.toUpperCase())})`)}
          </>,
          getDesignValue(obj.design),
          <span
            key={obj.actual}
            className={getStateColor(obj.state)}
            data-static-id='MonitoringXY.js_span_851ac2'
          >
            {getValue(obj.actual)}
          </span>,
          getValue(obj.optimum),
          obj.min,
          obj.max,
          obj.tagName,
          <div
            key={obj.tagName}
            className='d-flex justify-content-center'
            data-static-id='MonitoringXY.js_div_c7ebdd'
          >
            <Form.Check
              reverse
              name='group1'
              type={'checkbox'}
              defaultChecked={
                Object.keys(chartDataAtom).length !== 0 &&
                chartDataAtom[caseId] &&
                Object.keys(chartDataAtom[caseId]).length !== 0 &&
                chartDataAtom[caseId]?.tagsList?.some(
                  (tag) => tag.tagName == obj.tagName && !activeFavoriteTrend,
                )
              }
              data-testid={`checkbox-${obj.tagName}`}
              id={`checkbox-${obj.tagName}`}
              onChange={(e) => handleSelected(e, obj, i)}
            />
          </div>,
          <div
            key={`${obj.tagName}-x-axis`}
            className='d-flex justify-content-center'
            data-static-id='MonitoringXY.js_div_627e2c'
          >
            <Form.Check
              name='groupXAxis'
              type={'radio'}
              checked={getCheckboxValue(obj, cachedAxisInfo, i, hAxisInfo)}
              data-testid={`checkbox-${obj.tagName}-x-axis`}
              id={`checkbox-${obj.tagName}-x-axis`}
              onChange={(e) => handleXAxisSelected(e, obj, i)}
              className='mt-0'
            />
          </div>,
          obj.state,
          obj.parameter?.toUpperCase(),
          obj.uom?.toUpperCase(),
          obj.displayFormula,
          obj?.displayDescription?.toUpperCase(),
        ]
      })

      // Set the filtered data
      setFilteredData(filteredData)
      if (searchQuery) handleSearchChange(searchQuery, filteredData)
      else setFinalFilteredData(filteredData)
    }
  }, [hAxisInfo])
  const handleSelectionAdd = (row, rowIndex, isFavTrend) => {
    let tempSelectedRowAtom = JSON.parse(JSON.stringify(selectedRowAtom))
    setSelectedRowAtom((prevVal) => {
      tempSelectedRowAtom = prevVal
      return {
        ...prevVal,
      }
    })
    const isExists = tempSelectedRowAtom[caseId].some((item) =>
      item.includes(row.tagName),
    )
    if (!isExists) {
      try {
        let filteredColor
        setChartDataAtom((prevVal) => {
          filteredColor = handleFilteredColor(row, prevVal)
          const newData = handleChartDataUpdate(prevVal, row, filteredColor)
          return {
            ...prevVal,
            [caseId]: newData,
          }
        })
        setselectedRowIdAtom((prev) => {
          return {
            ...prev,
            [caseId]: [...prev[caseId], rowIndex],
          }
        })
        const selectedItem = handleSelectedItem(
          row,
          rowIndex,
          filteredColor[0],
          tempSelectedRowAtom[caseId]?.length < 5,
        )
        handleSelectedRow(selectedItem, isFavTrend)
      } catch (err) {
        Logger.log(err, 'check error')
      }
    }
  }
  const handleSelectedRow = (selectedItem, isFavTrend) => {
    setSelectedRowAtom((prevVal) => {
      return {
        ...prevVal,
        [caseId]: [...prevVal[caseId], selectedItem],
      }
    })
  }
  const handleSelectionRemove = (row, rowIndex) => {
    setChartDataAtom((prevVal) => handleChartDataRemove(prevVal, row))
    setselectedRowIdAtom((prev) => {
      const newData = prev[caseId].filter(
        (selectedRowIndex) => selectedRowIndex !== rowIndex,
      )
      return {
        ...prev,
        [caseId]: newData,
      }
    })
    setSelectedRowAtom((rows) => {
      const newData = rows[caseId].filter((item) => item[6] !== row.tagName)
      return {
        ...rows,
        [caseId]: newData,
      }
    })
  }
  const handleFilteredColor = (row, chartData, isUpdate) => {
    const tagIndex = chartData[caseId]?.tagsList.findIndex(
      (item) => item.tagName === row.tagName,
    )
    const tempTagsList = chartData[caseId].tagsList
    if (tagIndex === -1 || isUpdate) {
      return colorsArr.filter(
        (color) => !tempTagsList.some((tag) => tag.serisColor === color),
      )
    } else {
      return []
    }
  }
  const handleChartDataUpdate = (prevVal, row, filteredColor) => {
    const tagIndex = prevVal[caseId].tagsList.findIndex(
      (item) => item.tagName === row.tagName,
    )
    const tempTagsList = [...prevVal[caseId].tagsList]
    if (tagIndex === -1) {
      tempTagsList.push({
        tagName: row.tagName,
        isOptimumEnabled: row.isOptimumEnabled ?? false,
        isAutoYAxis: row.isAutoYAxis ?? true,
        defaultMin: row.min,
        defaultMax: row.max,
        min: row.min,
        max: row.max,
        show: tempTagsList.length < 5,
        serisColor:
          tempTagsList.length < 5
            ? filteredColor[0]
            : `${variables.primary_white}`,
        displayName: row.parameter ? row.parameter : row.tagName,
        category: row.category,
        parameter: row.parameter,
        valueDecimal: row.valueDecimal,
      })
    }
    return {
      ...prevVal[caseId],
      tagsList: tempTagsList,
    }
  }
  const handleChartDataRemove = (prevVal, row) => {
    const tempTagsList = prevVal[caseId]?.tagsList.filter(
      (item) => item.tagName !== row.tagName,
    )
    return {
      ...prevVal,
      [caseId]: {
        ...prevVal[caseId],
        tagsList: tempTagsList,
      },
    }
  }
  const handleSelectedItem = (row, rowIndex, color, isShow) => {
    const selectedItem = [
      <div
        key={row.tagName}
        className='d-flex justify-content-start align-items-center ps-2'
        data-static-id='MonitoringXY.js_div_3bdfad'
      >
        <button
          className='backgroundGrayButton me-2'
          data-static-id='MonitoringXY.js_button_882cc1'
        >
          <img
            alt=''
            src={binBlueICon}
            onClick={() => handleUnselectTag(row, rowIndex)}
            height={20}
            data-static-id='MonitoringXY.js_img_5aadef'
          />
        </button>
        <OverlayTrigger
          placement='right'
          overlay={
            <Tooltip
              id={row.tagName}
              style={{
                zIndex: 999,
              }}
              place='top'
              data-static-id='MonitoringXY.js_Tooltip_51fe14'
            >
              <div
                className={'react-tooltips'}
                data-static-id='MonitoringXY.js_div_5adc4c'
              >
                <span
                  className='text-12-primary d-block text-white'
                  data-static-id='MonitoringXY.js_span_feaf26'
                >
                  Tag Name: {convertFormulaToHtml(row.tagName)}
                </span>
                <span
                  className='text-12-primary d-block text-white overflow-scoll'
                  data-static-id='MonitoringXY.js_span_fb1116'
                >
                  Formula: {convertFormulaToHtml(row?.displayFormula) || 'N/A'}
                </span>
              </div>
            </Tooltip>
          }
        >
          <button
            className='backgroundGrayButton me-2'
            data-static-id='MonitoringXY.js_button_271c2d'
          >
            <img
              alt=''
              data-tooltip-id={row.tagName}
              src={infoBlueIcon}
              height={20}
              data-static-id='MonitoringXY.js_img_4728d4'
            />
          </button>
        </OverlayTrigger>

        <div
          className={`me-2 ${styles.trendIconContainer}`}
          data-static-id='MonitoringXY.js_div_abe424'
        >
          <i
            className='icon-trend text-24-regular'
            style={{
              color: isShow ? color : `${variables.primary_white}`,
            }}
            data-static-id='MonitoringXY.js_i_bd7068'
          ></i>
        </div>

        <Form.Check
          reverse
          name={'group1'}
          type={'checkbox'}
          defaultChecked={isShow}
          id={`trend-checkbox-${row.tagName}`}
          data-testid={`trend-checkbox-${row.tagName}`}
          onChange={(e) => handleSelectedChartTag(e, row, rowIndex, color)}
          className={`me-2  ${styles.formCheckContainer}`}
        />
        <div
          key={row?.parameter || ''}
          className='mt-1'
          data-static-id='MonitoringXY.js_div_3fca7a'
        >
          {convertFormulaToHtml(row?.parameter?.toUpperCase())}
          {row?.uom
            ? convertFormulaToHtml(` (${row?.uom?.toUpperCase()})`)
            : ''}
        </div>
      </div>,
      row?.category?.toUpperCase() || '',
      <div
        key={row.tagName}
        className='d-flex justify-content-center'
        data-static-id='MonitoringXY.js_div_be40eb'
      >
        <div
          className={`me-2 ${styles.trendIconContainer}`}
          data-static-id='MonitoringXY.js_div_6bb01d'
        >
          <img
            alt=''
            src={dottedTrendArr[isShow ? color : `${variables.primary_white}`]}
            data-static-id='MonitoringXY.js_img_2dc5af'
          />
        </div>
        <Form.Check
          reverse
          name='group1'
          type={'checkbox'}
          disabled={!isShow}
          defaultChecked={row?.isOptimumEnabled ?? false}
          id={`optimum-checkbox-${row.tagName}`}
          onChange={(e) => handleTagOptimum(e, row, color)}
        />
      </div>,
      <div
        key={`autoYaxis-${row.tagName}`}
        className='d-flex justify-content-center'
        data-static-id='MonitoringXY.js_div_cde843'
      >
        <Form.Check
          reverse
          name='group1'
          type={'checkbox'}
          defaultChecked={row?.isAutoYAxis ?? true}
          id={`autoYaxis-checkbox-${row.tagName}`}
          onChange={(e) => handleTagYaxis(e, row)}
        />
      </div>,
      row.min,
      row.max,
      row.tagName,
      <div
        key={row.tagName}
        className='d-flex align-items-center me-1'
        data-static-id='MonitoringXY.js_div_cdf3b2'
      >
        <button
          id={`button-apply-${row.tagName}`}
          disabled={true}
          className='backgroundGrayButtonMonitoring text-13-regular text-uppercase  border-0 cursor-not-allowed'
          style={{
            borderRadius: '.3vmin',
          }}
          data-static-id='MonitoringXY.js_button_b5b72c'
        >
          Apply
        </button>
      </div>,
      !isShow,
    ]
    return selectedItem
  }
  const handleUnselectTag = (row, rowIndex) => {
    TRACKEVENTOBJ.Monitoring.onDeleteClick({
      tagName: row?.tagName,
      params: params,
      caseData: ctxData?.caseData,
    })
    setChartDataAtom((prevVal) => {
      const tempTagsList = prevVal[caseId]?.tagsList.filter(
        (item) => item.tagName !== row.tagName,
      )
      return {
        ...prevVal,
        [caseId]: {
          ...prevVal[caseId],
          tagsList: tempTagsList,
        },
      }
    })
    setSelectedRowAtom((rows) => {
      const newData = rows[caseId].filter((item) => {
        return item[6] !== row.tagName
      })
      return {
        ...rows,
        [caseId]: newData,
      }
    })
    setselectedRowIdAtom((rows) => {
      const newData = rows[caseId].filter((row) => row !== rowIndex)
      return {
        ...rows,
        [caseId]: newData,
      }
    })
    resetActiveFavTrend(null)
    document.getElementById(`checkbox-${row.tagName}`).checked = false
  }
  const currentHeight = isExpanded ? '-50' : '0'
  const currentWidth = isExpanded ? '100' : '55'
  function handleCategoryChange(value, pos) {
    TRACKEVENTOBJ.Monitoring.onDropDownChange({
      value: pos?.display_name,
      key: 'Category',
      params: params,
      caseData: ctxData?.caseData,
    })
    setSelectedCategory(value)
    const isAll = value.some(
      (item) => item.display_name?.toLowerCase() === 'all',
    )
    let selectedCat = null
    if (!isAll) {
      selectedCat = value?.map((obj) => obj.tag_name)?.join(',')
    }
    processMonitoringData(
      ctxData?.actualTime,
      searchQuery,
      selectedCat,
      chartDataAtom,
      hAxisInfo,
    )
    setSearchQuery('')
  }
  const handleUpdateMinMAx = (min, max, data) => {
    let tempTagData = []
    setChartDataAtom((prevVal) => {
      tempTagData = prevVal[caseId].tagsList
      const tempTagList = prevVal[caseId]?.tagsList.map((item) => {
        if (
          item.tagName?.toLowerCase() === data.tagName?.toLowerCase() &&
          item.isAutoYAxis
        ) {
          return {
            ...item,
            defaultMin: data.min,
            defaultMax: data.max,
            min: data.min,
            max: data.max,
          }
        } else {
          return item
        }
      })
      return {
        ...prevVal,
        [caseId]: {
          ...prevVal[caseId],
          tagsList: tempTagList,
        },
      }
    })
    setSelectedRowAtom((prevVal) => {
      const tempData = []
      prevVal[caseId].map((item) => {
        let newItem = []
        item.map((it) => newItem.push(it))
        const isUpdateReq = tempTagData.some(
          (tag) => tag.tagName === item[6] && tag.isAutoYAxis,
        )
        if (
          item[6]?.toLowerCase().includes(data.tagName?.toLowerCase()) &&
          isUpdateReq
        ) {
          newItem[4] = min
          newItem[5] = max
          tempData.push(newItem)
        } else {
          tempData.push(item)
        }
      })
      return {
        ...prevVal,
        [caseId]: tempData,
      }
    })
  }
  if (chartDataAtom?.endTime === null && initEndTime !== null) {
    setChartDataAtom((prevChartData) => ({
      ...prevChartData,
      endTime: initEndTime,
    }))
  }
  return (
    <PerformanceLog
      api_url={['get_monitoring_data']}
      componentName='Monitoring'
      actionName='onLoad'
      screenName='Monitoring'
      isActive={1}
    >
      <div
        className='d-flex w-100 h-100 position-relative'
        data-static-id='MonitoringXY.js_div_304cc5'
      >
        <div
          className={`${styles.cardCcollapseWidth} h-100 position-relative d-flex`}
          style={{
            width: currentWidth + '%',
          }}
          data-static-id='MonitoringXY.js_div_9baba8'
        >
          <div
            className='h-100'
            style={{
              width: 'calc(100% - 4vmin)',
            }}
            data-static-id='MonitoringXY.js_div_3d146e'
          >
            <div
              style={{
                height: '68%',
              }}
              id='monitoring-linechart'
              data-testid='monitoring-linechart'
              className={`${styles.lineChartContainer}`}
              data-static-id='MonitoringXY.js_div_3d3e4a'
            >
              {Object.keys(chartDataAtom).length !== 0 &&
              chartDataAtom[caseId] ? (
                <ChartWrapperXY
                  data={chartDataAtom[caseId]}
                  hAxisInfo={hAxisInfo}
                  actualTime={ctxData?.actualTime}
                  isExpandIcon
                  setIsLoading={setIsLoading}
                  exportTitle={slugToText(params.affiliate)}
                  from='MONITORING XY-PLOTS'
                  handleUpdateMinMAx={handleUpdateMinMAx}
                  caseId={caseId}
                  favTrendData={favTrendData}
                  monitoringData={monitoringApiData}
                />
              ) : (
                <Loader />
              )}
            </div>
            <div
              style={{
                height: 'calc(100% - 68% - 30px)',
              }}
              id='monitoring-table'
              data-testid='monitoring-table'
              className={`${styles.lineChartContainer}`}
              data-static-id='MonitoringXY.js_div_a2072d'
            >
              <Table
                data={selectedRowAtom[caseId]}
                headers={
                  isExpanded
                    ? headersSelectedTag
                    : headersSelectedTag.slice(0, 3)
                }
                colSpanMonitoring={[0, 1]}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                customColumnWidths={
                  isExpanded ? [45, 15, 10, 10, 10, 10] : [55, 35, 10]
                }
                stateColumn={isExpanded ? [6, 8] : [3, 4, 5, 6, 7, 8]}
                // selectedCheckbox={selectedSubRowId}
                rowDisableCol={8}
                // leftAlignColumns={[1]}
                data-static-id='MonitoringXY.js_Table_d88f43'
              />
            </div>
          </div>
          <div
            className='d-flex align-items-center justify-content-center'
            style={{
              width: '4vmin',
            }}
            data-static-id='MonitoringXY.js_div_50abb5'
          >
            {!isExpanded ? (
              <div
                id='expand-trend'
                data-testid='expand-trend'
                className={`w-100 ${styles.sideCollapsed}`}
                onClick={() => setIsExpanded(!isExpanded)}
                data-static-id='MonitoringXY.js_div_e4ceb5'
              >
                <img
                  alt=''
                  src={rightArrow}
                  data-static-id='MonitoringXY.js_img_7a7b2c'
                />
                <p
                  className='m-0 text-center text-16-regular'
                  data-static-id='MonitoringXY.js_p_088ecd'
                >
                  EXPAND TRENDS
                </p>
              </div>
            ) : null}
            {isExpanded ? (
              <div
                id='expand-key-parameter'
                data-testid='expand-key-parameter'
                className={`w-100 ${styles.sideExpanded}`}
                onClick={() => setIsExpanded(!isExpanded)}
                data-static-id='MonitoringXY.js_div_58b336'
              >
                <img
                  alt=''
                  src={leftArrow}
                  data-static-id='MonitoringXY.js_img_4c3af5'
                />
                <p
                  className='m-0 text-center text-16-regular'
                  data-static-id='MonitoringXY.js_p_fb605d'
                >
                  KEY PARAMETERS
                </p>
              </div>
            ) : null}
          </div>
        </div>
        <div
          className={`${styles.cardCcollapse} h-100 position-absolute`}
          id='key-parameter-monitoring-table'
          data-testid='key-parameter-monitoring-table'
          style={{
            right: currentHeight + '%',
            width: '45%',
          }}
          data-static-id='MonitoringXY.js_div_3d1e7c'
        >
          <SignleTitleCardWithDropdown
            title='KEY PARAMETERS'
            dropDownItems={categoryData}
            onSelectChange={handleCategoryChange}
            handleSearchChange={(value) =>
              handleSearchChange(value, filteredData)
            }
            onBlur={(value) => {
              TRACKEVENTOBJ.Monitoring.onDropDownChange({
                value: value,
                key: 'SEARCH',
                params: params,
                caseData: ctxData?.caseData,
              })
            }}
            searchQuery={searchQuery}
          >
            <div
              className='w-100'
              style={{
                height: getValsBaseOnCondition(total, '93%', '100%'),
              }}
              data-static-id='MonitoringXY.js_div_b889da'
            >
              {getValsBaseOnCondition(
                !isLoadingCompleted,
                <Loader />,
                getValsBaseOnCondition(
                  monitoringData?.length === 0,
                  <div
                    className='w-100 h-100 d-flex align-items-center justify-content-center'
                    data-static-id='MonitoringXY.js_div_056f19'
                  >
                    <p
                      className='text-12-regular'
                      data-static-id='MonitoringXY.js_p_c98051'
                    >
                      No Data Found
                    </p>
                  </div>,
                  <MonitoringTable
                    data={finalFilteredData}
                    headers={monitoringXYHeaders}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    customColumnWidths={[0, 23, 13, 13, 13, 10, 10]}
                    stateColumn={[5, 6, 7, 10, 11, 12, 13, 14]}
                    // selectedCheckbox={selectedRowId}
                    rowspanDict={categoryObj}
                    rowspanColumn={0}
                    useRearrangedData={true}
                    leftAlignColumns={[0, 1]}
                    stateDisplayColumn={4}
                    isAction
                    isLoadingData={isLoading}
                    isLoadingCompleted={isLoadingCompleted}
                    defaultCategoryBorder={monitoringXYHeaders.length}
                    extraClass={styles.columnWidthMonitoringTable}
                  />,
                ),
              )}
            </div>
            <div
              className='w-100 paginationContainer'
              style={{
                height: getValsBaseOnCondition(total, '5%', '0'),
              }}
              data-static-id='MonitoringXY.js_div_9b45cf'
            >
              <PaginationControl
                page={page}
                between={4}
                total={total * MAX_RECORDS}
                limit={MAX_RECORDS}
                changePage={(page) => {
                  setPage(page)
                }}
                ellipsis={1}
              />
            </div>
          </SignleTitleCardWithDropdown>
        </div>
      </div>
    </PerformanceLog>
  )
}
