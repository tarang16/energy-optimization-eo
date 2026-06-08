import binBlueICon from 'assets/sabic_icons/common/bin_blue.svg'
import dotted_trend_primary_blue from 'assets/sabic_icons/common/dotted_trend_primary_blue.svg'
import dotted_trend_primary_dark_blue from 'assets/sabic_icons/common/dotted_trend_primary_dark_blue.svg'
import dotted_trend_primary_gray_3 from 'assets/sabic_icons/common/dotted_trend_primary_gray_3.svg'
import dotted_trend_primary_green from 'assets/sabic_icons/common/dotted_trend_primary_green.svg'
import dotted_trend_primary_orange from 'assets/sabic_icons/common/dotted_trend_primary_orange.svg'
import dotted_trend_primary_white from 'assets/sabic_icons/common/dotted_trend_primary_white.svg'
import dotted_trend_primary_yellow from 'assets/sabic_icons/common/dotted_trend_primary_yellow.svg'
import infoBlueIcon from 'assets/sabic_icons/common/timeinfo_blue.svg'
import leftArrow from 'assets/sabic_icons/monitoring/arrow_left.svg'
import rightArrow from 'assets/sabic_icons/monitoring/arrow_right.svg'
import { AppAtom } from 'atoms/AppAtom'
import {
  monitoringChartData,
  monitoringSelectedRow,
  monitoringSelectedRowId,
} from 'atoms/MonitoringAtom'
import { activeFavoriteTrendsAtom } from 'atoms/SidebarAtom'
import PerformanceLog from 'components/elements/performance_log/PerformanceLog'
import Loader from 'components/ui/loader/Loader'
import LineChartMultipleMonitoring from 'components/visuals/charts/line_chart/linechart_multiple/LineChartMultipleMonitoring'
import SignleTitleCardWithDropdown from 'components/visuals/common/single_title_card/SignleTitleCardWithDropdown'
import MonitoringTable from 'components/visuals/table/MonitoringTable'
import Table from 'components/visuals/table/Table'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import variables from 'config/scss/variables'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import Logger from 'logger/Logger'
import moment from 'moment'
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
const colorsArr = [
  variables.primary_orange,
  variables.primary_green,
  variables.primary_dark_blue,
  variables.primary_yellow,
  variables.primary_blue,
  variables.primary_gray_3,
  variables.primary_white,
]
const dottedTrendArr = {}
dottedTrendArr[variables.primary_orange] = dotted_trend_primary_orange
dottedTrendArr[variables.primary_green] = dotted_trend_primary_green
dottedTrendArr[variables.primary_dark_blue] = dotted_trend_primary_dark_blue
dottedTrendArr[variables.primary_gray_3] = dotted_trend_primary_gray_3
dottedTrendArr[variables.primary_yellow] = dotted_trend_primary_yellow
dottedTrendArr[variables.primary_blue] = dotted_trend_primary_blue
dottedTrendArr[variables.primary_white] = dotted_trend_primary_white
export { colorsArr, dottedTrendArr }
export const monitoringHeaders = [
  'CATEGORY',
  'PARAMETER',
  'DESIGN',
  'ACTUAL',
  'OPTIMUM',
  '',
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
export function getCheckedRow(isTrue) {
  return isTrue ? true : false
}
export const MAX_RECORDS = 20

/* istanbul ignore next */
export default function Monitoring() {
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const initEndTime = ctxData?.actualTime || moment.now().valueOf()
  const { caseId } = useOutletContext()
  const [monitoringData, setMonitoringData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(1)
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [categoryObj, setCategoryObj] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [chartDataAtom, setChartDataAtom] = useAtom(monitoringChartData)
  const [selectedRowAtom, setSelectedRowAtom] = useAtom(monitoringSelectedRow)
  const [selectedRowIdAtom, setselectedRowIdAtom] = useAtom(
    monitoringSelectedRowId,
  )
  const [activeFavoriteTrend, setActiveFavoriteTrend] = useAtom(
    activeFavoriteTrendsAtom,
  )
  const [favTrendData, setFavoriteTrendData] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [selectedCategory, setSelectedCategory] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const resetActiveFavTrend = useSetAtom(activeFavoriteTrendsAtom)
  useEffect(() => {
    ;(async () => {
      if (activeFavoriteTrend && monitoringData?.length) {
        const resp = await getFavouriteByTrendId(activeFavoriteTrend)
        if (resp?.data?.isMonitoringXY) {
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
        setChartDataAtom((prevData) => ({
          ...prevData,
          [caseId]: {
            caseId: caseId,
            tagsList: [],
            endTime: ctxData?.actualTime || initEndTime,
          },
        }))
        setTimeout(() => {
          resp.data.tagDetails.map((item, itemIndex) => {
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
              if (checkBoxElement) {
                checkBoxElement.checked = true
              }
            })
        }, 20)
      }
    })()
  }, [monitoringData, activeFavoriteTrend])
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
        chartDataAtom[caseId].tagsList.map((selectedTag) => {
          const checkBoxElement = document.getElementById(
            `checkbox-${selectedTag[6]}`,
          )
          if (checkBoxElement) {
            checkBoxElement.checked = true
          }
        })
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
  const handleSearchChange = (value) => {
    setSearchQuery(value.toLowerCase())
  }
  const processMonitoringData = useCallback(
    async (
      actualTime = '',
      searchQuery = '',
      selectedCategory = '',
      chartDataAtom = {},
    ) => {
      setIsLoadingCompleted(false)
      try {
        if (!actualTime || !caseId) {
          setIsLoadingCompleted(true)
          return
        }
        const tempActualTime = moment(actualTime)
        const { data, pageCount } = await getMonitoringData(
          caseId,
          tempActualTime,
          selectedCategory,
          searchQuery,
          page,
        )
        setTotal(pageCount + 1)
        const filteredData = prepareData(data)
        setMonitoringData(filteredData)
        setCategoryObjData(filteredData, setCategoryObj)
        setIsLoadingCompleted(true)
        setTimeout(() => {
          chartDataAtom[caseId]?.tagsList.map((selectedTag) => {
            const checkBoxElement = document.getElementById(
              `checkbox-${selectedTag.tagName}-${selectedTag.category}`,
            )
            if (checkBoxElement) {
              checkBoxElement.checked = true
            }
          })
        }, 0)
      } catch (err) {
        Logger.log('err', err)
        setIsLoadingCompleted(true)
      }
    },
    [ctxData?.actualTime, JSON.stringify(categoryData), page],
  )
  const prepareData = (data) => {
    return data
      .sort((a, b) => a.sortID - b.sortID)
      .map((obj, i) => {
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
            data-static-id='Monitoring.js_span_f735ca'
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
            data-static-id='Monitoring.js_div_5a4834'
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
                  (tag) => tag.tagName === obj.tagName && !activeFavoriteTrend,
                )
              }
              data-testid={`checkbox-${obj.tagName}`}
              id={`checkbox-${obj.tagName}-${obj.category}`}
              onChange={(e) => {
                TRACKEVENTOBJ.Monitoring.handleSelected({
                  data: obj,
                  params: params,
                  caseData: ctxData?.caseData,
                })
                handleSelected(e, obj, i)
              }}
            />
          </div>,
          obj.state,
          obj.parameter?.toUpperCase(),
          obj.uom?.toUpperCase(),
          obj.displayFormula,
          obj?.displayDescription?.toUpperCase(),
          obj?.piName ? obj?.piName?.toUpperCase() : '',
        ]
      })
  }
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
  const isColorAvailable = (condition, filteredColor) => {
    return condition ? filteredColor[0] : `${variables.primary_white}`
  }
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
    const tagShowed = tempChartDataAtom[caseId].tagsList.filter(
      (item) => item.show,
    )
    if (tagShowed.length < 5 || !e.target.checked) {
      tempValue[caseId].map((item) => {
        if (item.includes(row.tagName)) {
          let newRow = []
          item.map((it) => newRow.push(it))
          newRow[0] = (
            <div
              className='d-flex justify-content-start align-items-center ps-2'
              data-static-id='Monitoring.js_div_581c95'
            >
              <button
                className='backgroundGrayButton me-2'
                data-static-id='Monitoring.js_button_0fdf95'
              >
                <img
                  src={binBlueICon}
                  alt=''
                  className='blueOnHover'
                  onClick={() => handleUnselectTag(row, rowIndex)}
                  height={20}
                  data-static-id='Monitoring.js_img_8201fe'
                />
              </button>
              <button
                className='backgroundGrayButton me-2'
                data-static-id='Monitoring.js_button_f5c2b1'
              >
                <OverlayTrigger
                  placement='right'
                  overlay={
                    <Tooltip
                      id={row.tagName}
                      style={{
                        zIndex: 999,
                      }}
                      place='top'
                      data-static-id='Monitoring.js_Tooltip_0a50b8'
                    >
                      <div
                        className={'react-tooltips '}
                        data-static-id='Monitoring.js_div_c5adb2'
                      >
                        <span
                          className='text-12-primary d-block text-white'
                          data-static-id='Monitoring.js_span_9604aa'
                        >
                          Tag Name: {convertFormulaToHtml(row.tagName)}
                        </span>
                        <span
                          className='text-12-primary d-block text-white overflow-scoll'
                          data-static-id='Monitoring.js_span_2cbcf6'
                        >
                          Formula:{' '}
                          {convertFormulaToHtml(row?.displayFormula) || 'N/A'}
                        </span>
                      </div>
                    </Tooltip>
                  }
                >
                  <img
                    data-tooltip-id={row.tagName}
                    src={infoBlueIcon}
                    // height={20}
                    data-static-id='Monitoring.js_img_f9bdbe'
                  />
                </OverlayTrigger>
              </button>
              <div
                className={`me-2 ${styles.trendIconContainer}`}
                data-static-id='Monitoring.js_div_de0ac2'
              >
                <i
                  className='icon-trend text-24-regular'
                  style={{
                    color: isColorAvailable(e.target.checked, filteredColor),
                  }}
                  data-static-id='Monitoring.js_i_505f6d'
                ></i>
              </div>

              <Form.Check
                reverse
                name={'group1'}
                type={'checkbox'}
                defaultChecked={e.target.checked}
                id={`trend-checkbox-${row.tagName}-${row?.category}`}
                data-testid={`trend-checkbox-${row.tagName}`}
                onChange={(e) =>
                  handleSelectedChartTag(e, row, rowIndex, color)
                }
                className={`me-2  ${styles.formCheckContainer}`}
              />
              <div className='mt-1' data-static-id='Monitoring.js_div_5213f9'>
                {convertFormulaToHtml(row.parameter?.toUpperCase())}
                {convertFormulaToHtml(` (${row?.uom?.toUpperCase()})`)}
              </div>
            </div>
          )
          newRow[2] = (
            <div
              className='d-flex justify-content-center'
              data-static-id='Monitoring.js_div_99699f'
            >
              <div
                className={`me-2 ${styles.trendIconContainer}`}
                data-static-id='Monitoring.js_div_7f7046'
              >
                <img
                  alt=''
                  src={
                    dottedTrendArr[
                      isColorAvailable(e.target.checked, filteredColor)
                    ]
                  }
                  data-static-id='Monitoring.js_img_284004'
                />
              </div>
              <Form.Check
                reverse
                name='group1'
                type={'checkbox'}
                defaultChecked={
                  document.getElementById(
                    `optimum-checkbox-${row.tagName}-${row?.category}`,
                  ).checked
                }
                id={`optimum-checkbox-${row.tagName}-${row?.category}`}
                onChange={(e) => handleTagOptimum(e, row, color)}
              />
            </div>
          )
          newRow[8] = getCheckedRow(!e.target.checked)
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
        const tempTagData = prevVal[caseId].tagsList.map((item) => {
          if (item.tagName === row.tagName) {
            return {
              ...item,
              show: !item.show,
              serisColor: isColorAvailable(e.target.checked, filteredColor),
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
              data-static-id='Monitoring.js_div_6207eb'
            >
              <div
                className={`me-2 ${styles.trendIconContainer}`}
                data-static-id='Monitoring.js_div_cec174'
              >
                <img
                  alt=''
                  src={dottedTrendArr[color]}
                  data-static-id='Monitoring.js_img_d6b78a'
                />
              </div>
              <Form.Check
                reverse
                name='group1'
                type={'checkbox'}
                defaultChecked={e.target.checked}
                id={`optimum-checkbox-${row.tagName}-${row?.category}`}
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
      const tempTagData = prevVal[caseId].tagsList.map((item) => {
        if (item.tagName === row.tagName) {
          return {
            ...item,
            isOptimumEnabled: !item.isOptimumEnabled,
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
          const tempTagData = tempChartData[caseId].tagsList.filter(
            (item) => item.tagName === row.tagName,
          )
          let newItem = []
          item.map((it) => newItem.push(it))
          newItem[3] = (
            <div
              className='d-flex justify-content-center'
              data-static-id='Monitoring.js_div_23456d'
            >
              <Form.Check
                reverse
                name='group1'
                type={'checkbox'}
                defaultChecked={e.target.checked}
                id={`autoYaxis-checkbox-${row.tagName}-${row?.category}`}
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
      const tempTagData = prevVal[caseId].tagsList.map((item) =>
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
    <div className={'d-flex '} data-static-id='Monitoring.js_div_bb6c18'>
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
        data-static-id='Monitoring.js_button_36fafd'
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
                data-static-id='Monitoring.js_input_38fe72'
              />
            )
            newItem[5] = (
              <input
                id={`input-max-${row.tagName}`}
                defaultValue={max}
                type='number'
                data-static-id='Monitoring.js_input_560d58'
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
        const tempTagData = prevVal[caseId].tagsList.map((item) => {
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
      data-static-id='Monitoring.js_input_2803cd'
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
  const handleSelectionAdd = (row, rowIndex, isFavTrend) => {
    let tempSelectedRowAtom = JSON.parse(JSON.stringify(selectedRowAtom))
    setSelectedRowAtom((prevVal) => {
      tempSelectedRowAtom = prevVal
      return {
        ...prevVal,
      }
    })
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
      setSelectedRowAtom((prevVal) => {
        let stateVal = ''
        stateVal = {
          ...prevVal,
          [caseId]: [...prevVal[caseId], selectedItem],
        }
        return stateVal
      })
    } catch (err) {
      Logger.log(err, 'check error')
    }
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
    const tagIndex = chartData[caseId].tagsList.findIndex(
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
    const tempTagsList = prevVal[caseId].tagsList.filter(
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
        data-static-id='Monitoring.js_div_5c9eb1'
      >
        <button
          className='backgroundGrayButton  me-2'
          data-static-id='Monitoring.js_button_485e03'
        >
          <img
            src={binBlueICon}
            alt=''
            onClick={() => handleUnselectTag(row, rowIndex)}
            height={20}
            data-static-id='Monitoring.js_img_9ce31a'
          />
        </button>
        <button
          className='backgroundGrayButton  me-2'
          data-static-id='Monitoring.js_button_a8f1b2'
        >
          <OverlayTrigger
            placement='right'
            overlay={
              <Tooltip
                className={`tooltip_container ${styles.infoIconTooltip}`}
                id={row.tagName}
                style={{
                  zIndex: 999,
                }}
                place='top'
                data-static-id='Monitoring.js_Tooltip_59beda'
              >
                <div
                  className={'react-tooltips '}
                  data-static-id='Monitoring.js_div_10f6e4'
                >
                  <span
                    className='text-12-primary d-block text-white'
                    data-static-id='Monitoring.js_span_854db1'
                  >
                    Tag Name : {convertFormulaToHtml(row.tagName)}
                  </span>
                  <span
                    className='text-12-primary d-block text-white overflow-scoll'
                    data-static-id='Monitoring.js_span_5d0ba0'
                  >
                    Formula :{' '}
                    {convertFormulaToHtml(row?.displayFormula) || 'N/A'}
                  </span>
                </div>
              </Tooltip>
            }
          >
            <img
              data-tooltip-id={row.tagName}
              src={infoBlueIcon}
              // height={20}
              data-static-id='Monitoring.js_img_161898'
            />
          </OverlayTrigger>
        </button>
        <div
          className={`me-2 ${styles.trendIconContainer}`}
          data-static-id='Monitoring.js_div_a9e918'
        >
          <i
            className='icon-trend text-24-regular'
            style={{
              color: isShow ? color : `${variables.primary_white}`,
            }}
            data-static-id='Monitoring.js_i_8c1fcb'
          ></i>
        </div>

        <Form.Check
          reverse
          name={'group1'}
          type={'checkbox'}
          defaultChecked={isShow}
          id={`trend-checkbox-${row.tagName}-${row?.category}`}
          data-testid={`trend-checkbox-${row.tagName}`}
          onChange={(e) => handleSelectedChartTag(e, row, rowIndex, color)}
          className={`me-2  ${styles.formCheckContainer}`}
        />
        <div
          key={row?.parameter || ''}
          className='mt-1'
          data-static-id='Monitoring.js_div_a29bc6'
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
        data-static-id='Monitoring.js_div_c20eda'
      >
        <div
          className={`me-2 ${styles.trendIconContainer}`}
          data-static-id='Monitoring.js_div_602284'
        >
          <img
            alt=''
            src={dottedTrendArr[isShow ? color : `${variables.primary_white}`]}
            data-static-id='Monitoring.js_img_6b83b8'
          />
        </div>
        <Form.Check
          reverse
          name='group1'
          type={'checkbox'}
          defaultChecked={row?.isOptimumEnabled ?? false}
          id={`optimum-checkbox-${row.tagName}-${row?.category}`}
          onChange={(e) =>
            handleTagOptimum(
              e,
              row,
              isShow ? color : `${variables.primary_white}`,
            )
          }
        />
      </div>,
      <div
        key={`autoYaxis-${row.tagName}`}
        className='d-flex justify-content-center'
        data-static-id='Monitoring.js_div_96ddd1'
      >
        <Form.Check
          reverse
          name='group1'
          type={'checkbox'}
          defaultChecked={row?.isAutoYAxis ?? true}
          id={`autoYaxis-checkbox-${row.tagName}-${row?.category}`}
          onChange={(e) => handleTagYaxis(e, row)}
        />
      </div>,
      row.min,
      row.max,
      row.tagName,
      <div
        key={row.tagName}
        className='d-flex align-items-center me-1'
        data-static-id='Monitoring.js_div_5e69b9'
      >
        <button
          id={`button-apply-${row.tagName}`}
          disabled={true}
          className='backgroundGrayButtonMonitoring text-13-regular text-uppercase border-0 cursor-not-allowed'
          style={{
            borderRadius: '.3vmin',
          }}
          data-static-id='Monitoring.js_button_75af9f'
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
      const tempTagsList = prevVal[caseId].tagsList.filter(
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
    document.getElementById(
      `checkbox-${row.tagName}-${row?.category}`,
    ).checked = false
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
    )
    setSearchQuery('')
  }
  const handleSelectedRowUpdate = (data) => {
    let tempTagData = []
    setChartDataAtom((prevVal) => {
      prevVal[caseId].tagsList.map((item) => {
        if (
          item.tagName?.toLowerCase() == data[0].tagName?.toLowerCase() &&
          item.isAutoYAxis
        ) {
          tempTagData.push({
            ...item,
            min: data[0].min,
            max: data[0].max,
            defaultMin: data[0].min,
            defaultMax: data[0].max,
          })
        } else {
          tempTagData.push(item)
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
    setSelectedRowAtom((prevVal) => {
      const newData = []
      ;(prevVal[caseId] ?? []).map((item) => {
        const newItem = []
        item.map((it) => newItem.push(it))
        const isUpdateReq = tempTagData.some(
          (tag) => tag.tagName === item[6] && tag.isAutoYAxis,
        )
        if (
          item[6]?.toLowerCase().includes(data[0].tagName?.toLowerCase()) &&
          isUpdateReq
        ) {
          newItem[4] = data[0].min
          newItem[5] = data[0].max
          newData.push(newItem)
        } else {
          newData.push(item)
        }
      })
      return {
        ...prevVal,
        [caseId]: newData,
      }
    })
  }
  const handleUpdateMinMAx = (min, max, data) => {
    setSelectedRowAtom((prevVal) => {
      const tempData = []
      prevVal[caseId].map((item) => {
        let newItem = []
        item.map((it) => newItem.push(it))
        if (item[6]?.toLowerCase().includes(data.tagName?.toLowerCase())) {
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
    setChartDataAtom((prevVal) => {
      const tempTagList = prevVal[caseId].tagsList.map((item) => {
        if (item.tagName?.toLowerCase() === data.tagName?.toLowerCase()) {
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
        data-static-id='Monitoring.js_div_494294'
      >
        <div
          className={`${styles.cardCcollapseWidth} h-100 position-relative d-flex`}
          style={{
            width: currentWidth + '%',
          }}
          data-static-id='Monitoring.js_div_fd90a7'
        >
          <div
            className='h-100'
            style={{
              width: 'calc(100% - 4vmin)',
            }}
            data-static-id='Monitoring.js_div_99d074'
          >
            <div
              style={{
                height: '68%',
              }}
              id='monitoring-linechart'
              data-testid='monitoring-linechart'
              className={`${styles.lineChartContainer}`}
              data-static-id='Monitoring.js_div_93c5a1'
            >
              {Object.keys(chartDataAtom).length !== 0 &&
              chartDataAtom[caseId] ? (
                <LineChartMultipleMonitoring
                  data={chartDataAtom[caseId]}
                  actualTime={ctxData?.actualTime}
                  isExpandIcon
                  handleSelectedRowUpdate={handleSelectedRowUpdate}
                  setIsLoading={setIsLoading}
                  exportTitle={slugToText(params.affiliate)}
                  from='monitoring'
                  handleUpdateMinMAx={handleUpdateMinMAx}
                  caseId={caseId}
                  favTrendData={favTrendData}
                  monitoringData={monitoringData}
                  isExpanded={isExpanded}
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
              data-static-id='Monitoring.js_div_8a9bdf'
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
                rowDisableCol={8}
                data-static-id='Monitoring.js_Table_22e683'
              />
            </div>
          </div>
          <div
            className='d-flex align-items-center justify-content-center'
            style={{
              width: '4vmin',
            }}
            data-static-id='Monitoring.js_div_95e361'
          >
            {!isExpanded ? (
              <div
                id='expand-trend'
                data-testid='expand-trend'
                className={`w-100 ${styles.sideCollapsed}`}
                onClick={() => setIsExpanded(!isExpanded)}
                data-static-id='Monitoring.js_div_0afa1d'
              >
                <img
                  alt=''
                  src={rightArrow}
                  data-static-id='Monitoring.js_img_8ca45f'
                />
                <p
                  className='m-0 text-center text-16-regular'
                  data-static-id='Monitoring.js_p_c2f086'
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
                data-static-id='Monitoring.js_div_3f5832'
              >
                <img
                  alt=''
                  src={leftArrow}
                  data-static-id='Monitoring.js_img_5f64db'
                />
                <p
                  className='m-0 text-center text-16-regular'
                  data-static-id='Monitoring.js_p_376432'
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
          data-static-id='Monitoring.js_div_e320ff'
        >
          <SignleTitleCardWithDropdown
            title='KEY PARAMETERS'
            dropDownItems={categoryData}
            onSelectChange={handleCategoryChange}
            handleSearchChange={handleSearchChange}
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
              data-static-id='Monitoring.js_div_fa3db2'
            >
              {getValsBaseOnCondition(
                !isLoadingCompleted,
                <Loader />,
                getValsBaseOnCondition(
                  monitoringData?.length === 0,
                  <div
                    className='w-100 h-100 d-flex align-items-center justify-content-center'
                    data-static-id='Monitoring.js_div_37e676'
                  >
                    <p
                      className='text-12-regular'
                      data-static-id='Monitoring.js_p_2a6dc1'
                    >
                      No Data Found
                    </p>
                  </div>,
                  <MonitoringTable
                    data={monitoringData}
                    headers={monitoringHeaders}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    customColumnWidths={[0, 43, 15, 15, 15, 12]}
                    stateColumn={[5, 6, 7, 9, 10, 11, 12, 13, 14]}
                    rowspanDict={categoryObj}
                    rowspanColumn={0}
                    useRearrangedData={true}
                    leftAlignColumns={[0, 1]}
                    stateDisplayColumn={4}
                    isAction
                    isLoadingData={isLoading}
                    defaultCategoryBorder={monitoringHeaders.length}
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
              data-static-id='Monitoring.js_div_55dde8'
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
