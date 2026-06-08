import no_image_icon from 'assets/images/no_image_icon.png'
import path_icon from 'assets/sabic_icons/alert_status_icon/view_arrow_icon_2color.svg'
import minus_Icon from 'assets/sabic_icons/table/table_minus_icon.svg'
import plus_Icon from 'assets/sabic_icons/table/table_plus_icon.svg'
import arrow_down_blue from 'assets/sabic_new_icons/arrow_down_blue.svg'
import arrow_down_gray from 'assets/sabic_new_icons/arrow_down_gray.svg'
import IconTrend from 'assets/sabic_new_icons/predicted_action2.svg'
import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom } from 'atoms/RootAtom'
import LineChartMultiple from 'components/visuals/charts/line_chart/linechart_multiple/LineChartMultiple'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import DOMPurify from 'dompurify'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  formatNumbers,
  genRandomNumber,
  getValsBaseOnCondition,
  slugToText,
  uuid4,
} from 'utills/utilities'
import styles from './CollapsibleTable.module.scss'
export function getFilteredCaseIdBySystemAccess(
  filtered_obj = [],
  token = null,
) {
  let caseId = ''
  filtered_obj.forEach((obj) => {
    if (token?.systemList.includes('' + obj.affiliate_code)) {
      caseId += `${caseId === '' ? '' : ','}${obj.affiliate_code}`
    }
  })
  return caseId
}
export function getVerifiedCaseIds(filtered_obj = [], token = {}) {
  let caseId = ''
  if (token?.isPartialCorporate || token?.isAffiliateUser) {
    caseId = getFilteredCaseIdBySystemAccess(filtered_obj, token)
  } else if (token?.isCorporate) {
    filtered_obj.forEach(
      (obj) => (caseId += `${caseId === '' ? '' : ','}${obj.caseID}`),
    )
  }
  return caseId
}
const CollapsibleTable = ({
  rows,
  headers,
  config = {},
  source = 'affiliate',
  collapseKey,
  isExpanded,
  screen = 'AFFILIATE',
  isDefaultSelected,
}) => {
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const params = useParams()
  const location = useLocation()
  const token = useAtomValue(TokenAtom)
  const [sortedColumn, setSortedColumn] = useState(
    config?.l1?.defaultSortColumn?.length > 0
      ? config.l1.defaultSortColumn[0]
      : null,
  )
  const [activeRows, setActiveRows] = useState(
    isExpanded && rows.length > 0 ? [rows[0]?.data?.plantName] : [],
  )
  const [filteredRows, setFilteredRows] = useState(rows)
  const [sortingOrders, setSortingOrders] = useState(
    sortedColumn !== null
      ? {
          [sortedColumn]: 'onLoad',
        }
      : {},
  )
  const [expandedRows, setExpandedRows] = useState(
    isExpanded && rows.length > 0 ? [rows[0]?.data?.plantName] : [],
  )
  const [affiliateCaseId, setAffiliateCaseId] = useState('')
  const [affiliateTrendsName, setAffiliateTrendsName] = useState('')
  const [elementId, setElementId] = useState('')
  const [showModalSkip, setShowModalSkip] = useState(false)
  useEffect(() => {
    if (Array.isArray(rows) && rows.length >= 1 && sortedColumn !== null) {
      handleSorting(sortedColumn, true)
    }
  }, [rows])
  useEffect(() => {
    if (isDefaultSelected && rows?.length && !activeRows?.length) {
      const firstRow = rows[0]
      setActiveRows([firstRow?.data?.affiliateName])
    }
  }, [isDefaultSelected, rows, activeRows])

  /* istanbul ignore next */
  const handleTrendOpportunity = (affiliateData) => {
    const affiliateName = affiliateData.data.affiliateName?.toLowerCase()
    const filtered_obj = ctxData.caseData.filter(
      (caseItem) =>
        caseItem?.affiliate?.toLowerCase() === affiliateName?.toLowerCase(),
    )
    const caseId = getVerifiedCaseIds(filtered_obj, token) || ''
    setShowModalSkip(false)
    setAffiliateCaseId(caseId)
    setAffiliateTrendsName(affiliateData.data.affiliateName)
  }

  /* istanbul ignore next */
  const extractPlantName = (plantName) => {
    return plantName.indexOf('</span>') > -1
      ? plantName.substr(32, plantName.indexOf('</span>') - 32)
      : plantName
  }

  /* istanbul ignore next */
  const filterCasesByPlant = (
    ctxData,
    filterKey,
    plantName,
    affiliate_name = null,
  ) => {
    return ctxData?.caseData?.filter((caseItem) => {
      const hasMatchingPlant =
        caseItem[filterKey]?.toLowerCase() === plantName?.toLowerCase()
      const hasMatchingAffiliate = affiliate_name
        ? caseItem.affiliate?.toLowerCase() === affiliate_name?.toLowerCase()
        : true
      return hasMatchingPlant && hasMatchingAffiliate
    })
  }

  /* istanbul ignore next */
  const getPlantAndSystemFromName = (plantName) => {
    const openingCurlyIndex = plantName.indexOf('{') + 1
    const closingCurlyIndex = plantName.indexOf('}')
    const plant = plantName.substring(openingCurlyIndex, closingCurlyIndex)
    const system = plantName.includes('</span>')
      ? plantName.substring(32, plantName.indexOf('</span>') - 32)
      : plantName
    return {
      plant,
      system,
    }
  }
  const filterPlantSystemAffiliate = (ctxData, plant, system, affiliate_name) =>
    ctxData.caseData.filter(
      (caseItem) =>
        caseItem['plant']?.toLowerCase() === plant.trim()?.toLowerCase() &&
        caseItem['system']?.toLowerCase() === system.trim()?.toLowerCase() &&
        caseItem['affiliate']?.toLowerCase() ===
          affiliate_name.trim()?.toLowerCase(),
    )
  const handlePlantTrendOpportunity = (
    plantName,
    filterKey,
    affiliate_name = null,
  ) => {
    let filtered_obj = null
    let titleString = ''
    const getAffiliateName = () =>
      affiliate_name || slugToText(params?.affiliate)
    const setTrendTitle = (obj, includeSystem = false) => {
      const { affiliate, plant, system } = obj[0]
      titleString =
        `OPPORTUNITY TREND - ${affiliate} | ${plant}` +
        getValsBaseOnCondition(includeSystem && system, ` | ${system}`, '')
      setAffiliateTrendsName(titleString)
    }
    affiliate_name = getAffiliateName()
    if (filterKey === 'plant') {
      plantName = extractPlantName(plantName)
      setShowModalSkip(false)
      filtered_obj = filterCasesByPlant(
        ctxData,
        filterKey,
        plantName,
        affiliate_name,
      )
      if (filtered_obj.length !== 0) setTrendTitle(filtered_obj)
    } else {
      setShowModalSkip(true)
      if (plantName.includes('</span>') && plantName.includes('{')) {
        const { plant, system } = getPlantAndSystemFromName(plantName)
        filtered_obj = filterPlantSystemAffiliate(
          ctxData,
          plant,
          system,
          affiliate_name,
        )
        if (filtered_obj.length !== 0) setTrendTitle(filtered_obj, true)
      } else {
        filtered_obj = filterCasesByPlant(ctxData, filterKey, plantName)
      }
    }
    const caseId = getVerifiedCaseIds(filtered_obj, token) || ''
    setAffiliateCaseId(caseId)
    return titleString
  }
  const handleImgCellClick = (
    cellIndex,
    cellId,
    row,
    rowIndex,
    configs,
    key,
  ) => {
    TRACKEVENTOBJ.CollapsibleTable.handleImgCellClick(
      {
        params,
        caseData,
      },
      screen,
      row,
    )
    const isCollapseCell = cellIndex === 0 && cellId !== 'subTable'
    const updateActiveRows = () => {
      const targetRowIdentifier = collapseKey ? row.data[collapseKey] : rowIndex
      const tempActiveRows = activeRows.slice()
      if (!tempActiveRows.includes(targetRowIdentifier)) {
        setActiveRows(collapseKey ? [targetRowIdentifier] : [rowIndex])
      }
    }
    const handleCallback = () => {
      configs.callback(row)
      if (isCollapseCell) {
        handleRowClick(key)
      }
    }
    if (isCollapseCell) {
      updateActiveRows()
    }
    handleCallback()
  }
  const getImageSrc = (key) => {
    return activeRows.includes(key) ? minus_Icon : plus_Icon
  }

  /* istanbul ignore next */
  const handleClickTrendIcon = (cellValue, affiliate_name) => {
    handlePlantTrendOpportunity(
      cellValue,
      source === 'plant' ? 'system' : 'plant',
      affiliate_name,
    )
  }
  const checkActiveRow = (row, rowIndex) => {
    let tempActiveRows = activeRows.slice()
    if (
      !tempActiveRows.includes(collapseKey ? row.data[collapseKey] : rowIndex)
    ) {
      tempActiveRows = collapseKey ? [row.data[collapseKey]] : [rowIndex]
    } else {
      tempActiveRows.splice(
        tempActiveRows.indexOf(collapseKey ? row.data[collapseKey] : rowIndex),
        1,
      )
    }
    return tempActiveRows
  }
  const handleImgPlusClick = (
    cellIndex,
    cellId,
    row,
    rowIndex,
    configs,
    key,
  ) => {
    TRACKEVENTOBJ.CollapsibleTable.handleImgPlusClick(
      {
        params,
        caseData,
      },
      screen,
      row,
    )
    if (cellIndex === 0 && cellId !== 'subTable') {
      let tempActiveRows = checkActiveRow(row, rowIndex)
      setActiveRows(tempActiveRows)
      configs.callback(row)
      handleRowClick(key)
    } else {
      configs.callback(row)
    }
  }
  /* istanbul ignore next */
  function generateImageCell({
    cellValue,
    cellIndex,
    cfg,
    cellId,
    rowIndex,
    key,
    row,
    configs,
  }) {
    return (
      <div
        className={`d-flex justify-content-between text-start w-100 h-100 ${styles.imgCell} img-cell`}
        onClick={() =>
          handleImgCellClick(cellIndex, cellId, row, rowIndex, configs, key)
        }
        data-static-id='CollapsibleTable.js_div_10cd04'
      >
        <div
          className={`d-flex justify-content-center align-items-center ${styles.imgCellMainImg} text-center`}
          data-static-id='CollapsibleTable.js_div_009fff'
        >
          <img
            alt=''
            className={'img-fluid'}
            onError={({ currentTarget }) => {
              currentTarget.onerror = null
              currentTarget.src = no_image_icon
            }}
            src={cellValue}
            data-static-id='CollapsibleTable.js_img_6e10f2'
          />
        </div>
        <div
          className={`${styles.imgCellPlusImg} d-flex justify-content-between flex-column`}
          data-static-id='CollapsibleTable.js_div_a0ef03'
        >
          <OverlayTrigger
            overlay={
              <Tooltip
                id='oppo-trend-aff-icon'
                role='tooltip'
                style={{
                  zIndex: 9999,
                }}
                data-static-id='CollapsibleTable.js_Tooltip_9a028e'
              >
                <div
                  className='text-center react-tooltips'
                  data-static-id='CollapsibleTable.js_div_2b9113'
                >
                  <p
                    className='text-14-regular  text-white text-center'
                    data-static-id='CollapsibleTable.js_p_6e1668'
                  >
                    VIEW OPPORTUNITY TREND
                  </p>
                </div>
              </Tooltip>
            }
          >
            <img
              alt=''
              id='oppo-trend-aff-icon'
              data-tooltip-id='oppo-trend-aff-icon'
              src={IconTrend}
              height={14}
              onClick={(e) => {
                e.stopPropagation()
                TRACKEVENTOBJ.CollapsibleTable.handleTrendOpportunity(
                  {
                    params,
                    caseData,
                  },
                  row,
                )
                setElementId('oppo-trend-aff')
                handleTrendOpportunity(filteredRows[rowIndex])
              }}
              data-static-id='CollapsibleTable.js_img_696901'
            />
          </OverlayTrigger>

          {Object.entries(row?.children?.rows || {})?.length ? (
            <img
              id='affiliate-+icon'
              src={`${getImageSrc(key)}`}
              alt='collapsible-icon-affiliate'
              data-testid='collapsible-icon'
              width={'100%'}
              // className={`${getActiveClass(key)}`}
              data-static-id='CollapsibleTable.js_img_7437fc'
            />
          ) : null}
        </div>
      </div>
    )
  }

  /* istanbul ignore next */
  function generateUrlCell({
    cellValue,
    cellIndex,
    cfg,
    cellId,
    rowIndex,
    key,
    row,
    configs,
  }) {
    return (
      <div
        className={`${styles.editContainer}`}
        onClick={() => {
          TRACKEVENTOBJ.CollapsibleTable.generateUrlCell(
            {
              params,
              caseData,
              location,
            },
            isExpanded,
            source,
            row,
          )
        }}
        data-static-id='CollapsibleTable.js_div_8302cb'
      >
        <Link to={cellValue} data-static-id='CollapsibleTable.js_Link_cce438'>
          <img
            alt=''
            src={path_icon}
            className={`${styles.editIcon}`}
            id={
              source == 'plant'
                ? 'Navig-plant-to-sys-overview'
                : 'Navig-aff-to-plant-icon'
            }
            data-static-id='CollapsibleTable.js_img_4f9e39'
          />
        </Link>
      </div>
    )
  }
  function generateStatusCell({
    cellValue,
    cellIndex,
    cfg,
    cellId,
    rowIndex,
    key,
    row,
    configs,
  }) {
    const getStatusClassName = (status) => {
      if (status === 'ONLINE') {
        return styles.greenPill
      } else if (status === 'STARTUP') {
        return styles.yellowPill
      } else {
        return styles.redPill
      }
    }
    if (cellValue?.includes(';;')) {
      const status = cellValue?.split(';;')[0]
      const spanStr = cellValue?.split(';;')[1]
      const cellClassName = getStatusClassName(status)
      return (
        <div
          className='statusTime h-100 d-flex flex-column align-items-center justify-content-center'
          data-static-id='CollapsibleTable.js_div_eeab2e'
        >
          <span
            className={`text-13-regular ${cellClassName}`}
            data-static-id='CollapsibleTable.js_span_0bbacd'
          >
            {status}
          </span>
          <span
            className='text-10-regular mt-2 text_primary_gray_2 time-span time-span-status'
            data-static-id='CollapsibleTable.js_span_cf8644'
          >
            {spanStr}
          </span>
        </div>
      )
    } else {
      const cellClassName = getStatusClassName(cellValue)
      return (
        <span
          className={`text-13-regular ${cellClassName}`}
          data-static-id='CollapsibleTable.js_span_c81b2c'
        >
          {cellValue}
        </span>
      )
    }
  }

  /* istanbul ignore next */
  function generateMainTableCell({
    cellValue,
    cellIndex,
    cfg,
    cellId,
    rowIndex,
    key,
    row,
    configs,
  }) {
    return (
      <div
        className={`d-flex justify-content-between position-relative  h-100 w-100 ${styles.imgCell} img-cell`}
        onClick={(e) =>
          handleImgPlusClick(cellIndex, cellId, row, rowIndex, configs, key)
        }
        data-static-id='CollapsibleTable.js_div_4d8b9e'
      >
        <div
          className={`${styles.imgCellMainImg} ${styles.customPaddingLeft} h-100 d-flex align-items-center justify-content-start`}
          data-static-id='CollapsibleTable.js_div_26af0a'
        >
          <span
            className={`${styles.activeFirstCell} text-start`}
            data-static-id='CollapsibleTable.js_span_46cbc4'
          >
            {cellValue}
          </span>
        </div>

        <div
          className={`${styles.imgCellPlusImg}  d-flex flex-column justify-content-between`}
          data-static-id='CollapsibleTable.js_div_cf0b58'
        >
          <img
            alt=''
            id='plant-pred-oppo-trend-icon'
            src={IconTrend}
            height={14}
            onClick={(e) => {
              e.stopPropagation()
              TRACKEVENTOBJ.CollapsibleTable.handlePlantTrendOpportunity(
                {
                  params,
                  caseData,
                },
                isExpanded,
                source,
                row,
              )
              setElementId('plant-pred-oppo-trend')
              handlePlantTrendOpportunity(cellValue, 'plant')
            }}
            data-static-id='CollapsibleTable.js_img_6960a5'
          />
          <img
            id='plant-+icon'
            src={`${getImageSrc(key)}`}
            alt='collapsible-icon-plant'
            data-testid='collapsible-icon'
            width={'100%'}
            // className={`${getActiveClass(key)}`}
            data-static-id='CollapsibleTable.js_img_c07593'
          />
        </div>
      </div>
    )
  }
  const generateSubtableCellForAddedCell = (cellValue, row) => {
    return (
      <div
        className='d-flex justify-content-between align-items-center text-link-parent'
        style={{
          padding: '.9vmin 0',
        }}
        data-static-id='CollapsibleTable.js_div_3f3e03'
      >
        <Link
          className='text-link-parent'
          onClick={() => {
            TRACKEVENTOBJ.CollapsibleTable.generateUrlCell(
              {
                params,
                caseData,
                location,
              },
              isExpanded,
              source,
              row,
            )
          }}
          to={row?.data?.customLink}
          data-static-id='CollapsibleTable.js_Link_65fd2c'
        >
          <div
            className={`${styles.subTable1stCell}`}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                cellValue
                  .replace('{', '<span class="d-none">')
                  .replace('}', '</span>'),
              ),
            }}
            data-static-id='CollapsibleTable.js_div_e20415'
          ></div>
        </Link>
        <img
          alt=''
          id={
            source == 'plant' ? 'systems-trend-icon' : 'oppo-trend-plant-icon'
          }
          className={`${styles.trendIconHover}`}
          src={IconTrend}
          height={14}
          onClick={() => {
            TRACKEVENTOBJ.CollapsibleTable.handleTrendOpportunityPlant(
              {
                params,
                caseData,
                location,
              },
              row,
              isExpanded,
              source,
            )
            setElementId(
              source == 'plant'
                ? 'systems-pred-oppo-trend'
                : 'oppo-trend-plant',
            )
            handleClickTrendIcon(cellValue, row?.data?.affiliateName)
          }}
          data-static-id='CollapsibleTable.js_img_deff4f'
        />
      </div>
    )
  }
  const generateSubtableCellForNewCell = (cellValue, row) => {
    return (
      <div
        className='d-flex justify-content-between align-items-center'
        style={{
          padding: '.9vmin 0',
        }}
        data-static-id='CollapsibleTable.js_div_351ea7'
      >
        <div
          className={`${styles.subTable1stCell}`}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              cellValue
                .replace('{', '<span class="d-none">')
                .replace('}', '</span>'),
            ),
          }}
          data-static-id='CollapsibleTable.js_div_63085d'
        ></div>
        <img
          alt=''
          className={`${styles.trendIconHover}`}
          src={IconTrend}
          height={14}
          onClick={() => {
            TRACKEVENTOBJ.CollapsibleTable.handleTrendOpportunityPlant(
              {
                params,
                caseData,
                location,
              },
              row,
              isExpanded,
              source,
            )
            handleClickTrendIcon(cellValue, row?.data?.affiliateName)
          }}
          data-static-id='CollapsibleTable.js_img_f2f5f8'
        />
      </div>
    )
  }
  /* istanbul ignore next */
  function generateSubtableCell({ cellValue, cellIndex, cfg, row }) {
    if (
      cfg?.text_url_position &&
      cfg?.text_url_position?.includes(cellIndex) &&
      row?.data?.customLink
    ) {
      return generateSubtableCellForAddedCell(cellValue, row)
    }
    return generateSubtableCellForNewCell(cellValue, row)
  }
  function generateCell(generateCellParameter) {
    const { cellValue, cellIndex, cfg, cellId, rowIndex, key, row, configs } =
      generateCellParameter
    if (cfg['imageColumns'].includes(cellIndex)) {
      return generateImageCell({
        cellValue,
        cellIndex,
        cfg,
        cellId,
        rowIndex,
        key,
        row,
        configs,
      })
    }
    if (cfg['url_position'].includes(cellIndex)) {
      return generateUrlCell({
        cellValue,
        cellIndex,
        cfg,
        cellId,
        rowIndex,
        key,
        row,
        configs,
      })
    }
    if (cfg['statusColumns'].includes(cellIndex)) {
      return generateStatusCell({
        cellValue,
        cellIndex,
        cfg,
        cellId,
        rowIndex,
        key,
        row,
        configs,
      })
    }
    if (cellIndex == 0 && cellId != 'subTable') {
      return generateMainTableCell({
        cellValue,
        cellIndex,
        cfg,
        cellId,
        rowIndex,
        key,
        row,
        configs,
      })
    }
    if (cellIndex === 0 && cellId == 'subTable') {
      return generateSubtableCell({
        cellValue,
        cellIndex,
        cfg,
        row,
      })
    }
    return cellValue !== null ? <>{formatNumbers(cellValue)}</> : <>-</>
  }
  const getDynamicSrc = (obj) => {
    let dynamicSrc
    if (obj.columnIndex === sortedColumn) {
      if (
        sortingOrders[obj.columnIndex] === 'desc' ||
        sortingOrders[obj.columnIndex] === 'asc'
      ) {
        dynamicSrc = arrow_down_blue
      } else {
        dynamicSrc = arrow_down_gray
      }
    } else {
      dynamicSrc = arrow_down_gray
    }
    return dynamicSrc
  }
  const getSpanVal = (obj, type) => {
    let spanVal = ''
    if (obj.children.length >= 1) {
      if (type === 'col') {
        spanVal = obj.children.length
      }
    } else {
      if (type === 'row') {
        spanVal = obj.children.length
      }
    }
    return spanVal
  }
  const getTransformStyle = (obj) => {
    return sortingOrders[obj.columnIndex] === 'asc' ? 'rotateX(180deg)' : 'none'
  }
  const getSrcChild = (child) => {
    let srcChild
    if (child.columnIndex === sortedColumn) {
      if (
        sortingOrders[child.columnIndex] === 'desc' ||
        sortingOrders[child.columnIndex] === 'asc'
      ) {
        srcChild = arrow_down_blue
      } else {
        srcChild = arrow_down_gray
      }
    } else {
      srcChild = arrow_down_gray
    }
    return srcChild
  }
  function generateHeaders(headers, cfg) {
    return (
      <>
        <tr
          style={{
            borderBottom: '0px',
          }}
          className='h-50'
          data-static-id='CollapsibleTable.js_tr_d82097'
        >
          {headers.map((obj, index) => {
            let dynamicSrc = getDynamicSrc(obj)
            return (
              <th
                style={{
                  width:
                    cfg && cfg['columnWidths'].length == headers.length
                      ? `calc(${cfg['columnWidths'][index]}%)`
                      : `calc(100% / ${headers.length})`,
                }}
                key={`${obj.title}_${genRandomNumber()}`}
                className={'text-12-bold text_primary_gray text-center'}
                rowSpan={getSpanVal(obj, 'row')}
                colSpan={getSpanVal(obj, 'col')}
                data-static-id='CollapsibleTable.js_th_5163e2'
              >
                <div
                  className={`d-flex w-100 align-items-center justify-content-center h-100 ${obj.children.length && styles.custom_border_bottom}`}
                  data-static-id='CollapsibleTable.js_div_e44210'
                >
                  <div
                    className='d-flex flex-column w-100 align-items-center justify-content-center h-100'
                    data-static-id='CollapsibleTable.js_div_9753ff'
                  >
                    {obj.icon && (
                      <img
                        alt=''
                        src={obj.icon}
                        className={styles.icons}
                        data-static-id='CollapsibleTable.js_img_b536ee'
                      />
                    )}
                    <div
                      className='d-flex text-14-regular text_primary_gray text-center'
                      data-static-id='CollapsibleTable.js_div_d118fb'
                    >
                      <span
                        className='mt-1'
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(obj.title),
                        }}
                        data-static-id='CollapsibleTable.js_span_7ce50a'
                      ></span>
                      {obj.uom && (
                        <span
                          className='text-12-regular text_primary_gray_2'
                          data-static-id='CollapsibleTable.js_span_607f94'
                        >
                          {' '}
                          ({obj.uom})
                        </span>
                      )}
                    </div>
                  </div>
                  {obj.sortable && (
                    <div
                      className={styles.sortIconContainer}
                      data-static-id='CollapsibleTable.js_div_71be34'
                    >
                      <img
                        className={styles.sortIconImg}
                        onClick={() => {
                          TRACKEVENTOBJ.CollapsibleTable.handleSorting(
                            {
                              params,
                              caseData,
                            },
                            screen,
                            obj,
                          )
                          handleSorting(obj.columnIndex)
                        }}
                        alt='Sort Icon-1'
                        src={dynamicSrc}
                        style={{
                          transform: getTransformStyle(obj),
                          pointerEvents: 'auto',
                          // sortingOrders[obj.columnIndex] === "asc"
                          //   ? "auto"
                          //   : "auto",
                        }}
                        data-static-id='CollapsibleTable.js_img_da081e'
                      ></img>
                    </div>
                  )}
                </div>
              </th>
            )
          })}
        </tr>
        <tr
          style={{
            borderTop: '0px',
          }}
          className='h-50'
          data-static-id='CollapsibleTable.js_tr_7a0ebc'
        >
          {headers.map((obj, index) => {
            return (
              obj.children.length >= 1 &&
              obj.children.map((child, i) => {
                let srcChild = getSrcChild(child)
                return (
                  <th
                    style={{
                      width:
                        cfg['columnWidths'].length == headers.length
                          ? `calc((${cfg['columnWidths'][index]} / ${obj.children.length})%)`
                          : `calc(${100 / headers.length / obj.children.length}%)`,
                    }}
                    key={`${obj.title}_child_${uuid4()}_${uuid4()}`}
                    className='text_primary_gray text-left py-1'
                    data-static-id='CollapsibleTable.js_th_420362'
                  >
                    <div
                      className={`d-flex align-items-center justify-content-between h-100 w-100  m-0
                                        ${obj.children.length === i + 1 ? styles.noBorder : styles.withBorder}
                        `}
                      data-static-id='CollapsibleTable.js_div_008bee'
                    >
                      {source == 'affiliate' ? (
                        <>
                          <div
                            className={`d-flex align-items-center justify-content-start w-100                               
                             p-0 m-0 `}
                            data-static-id='CollapsibleTable.js_div_b7edf6'
                          >
                            <img
                              alt=''
                              src={child.icon}
                              className={`${styles.ChildIcons}`}
                              data-static-id='CollapsibleTable.js_img_e22c7a'
                            />
                            <div
                              className='d-flex flex-column align-items-start'
                              data-static-id='CollapsibleTable.js_div_014619'
                            >
                              <span
                                className='text-13-regular'
                                dangerouslySetInnerHTML={{
                                  __html: DOMPurify.sanitize(child.title),
                                }}
                                data-static-id='CollapsibleTable.js_span_9dbd33'
                              ></span>
                              {child.uom && (
                                <span
                                  className='text-11-regular text_primary_gray_2'
                                  data-static-id='CollapsibleTable.js_span_b8ffb4'
                                >
                                  ({child.uom})
                                </span>
                              )}
                            </div>
                          </div>
                          {child.sortable && (
                            <div
                              className={`p-0 m-0 d-flex flex-column align-items-center justiy-content-center ${styles.sortIconContainer}`}
                              data-static-id='CollapsibleTable.js_div_60f92b'
                            >
                              <img
                                className={` ${styles.sortIconContainer}`}
                                onClick={() => {
                                  TRACKEVENTOBJ.CollapsibleTable.handleSorting(
                                    {
                                      params,
                                      caseData,
                                    },
                                    screen,
                                    child,
                                  )
                                  handleSorting(child.columnIndex)
                                }}
                                alt='Sort Icon-2'
                                src={srcChild}
                                style={{
                                  minWidth: '1.4vmin',
                                  maxWidth: '1.4vmin',
                                  transform: getTransformStyle(child),
                                  pointerEvents: 'auto',
                                  // sortingOrders[child.columnIndex] === "asc"
                                  //   ? "auto"
                                  //   : "auto",
                                }}
                                data-static-id='CollapsibleTable.js_img_13db05'
                              ></img>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <img
                            alt=''
                            src={child.icon}
                            className={`${styles.ChildIcons}`}
                            data-static-id='CollapsibleTable.js_img_c38e60'
                          />
                          <div data-static-id='CollapsibleTable.js_div_92d55f'>
                            <p
                              className='text-13-regular m-0'
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(child.title),
                              }}
                              data-static-id='CollapsibleTable.js_p_570479'
                            ></p>
                            {child.uom && (
                              <p
                                className='text-11-regular text_primary_gray_2 m-0 '
                                data-static-id='CollapsibleTable.js_p_d962bf'
                              >
                                ({child.uom})
                              </p>
                            )}
                          </div>
                          {child.sortable && (
                            <img
                              className={`222 ${styles.sortIconContainer}`}
                              onClick={() => {
                                TRACKEVENTOBJ.CollapsibleTable.handleSorting(
                                  {
                                    params,
                                    caseData,
                                  },
                                  screen,
                                  child,
                                )
                                handleSorting(child.columnIndex)
                              }}
                              alt='Sort Icon-3'
                              // src={
                              //   child.columnIndex === sortedColumn
                              //     ? sortingOrders[child.columnIndex] ===
                              //       "desc"
                              //       ? arrow_down_blue
                              //       : sortingOrders[child.columnIndex] ===
                              //         "asc"
                              //       ? arrow_down_blue
                              //       : arrow_down_gray
                              //     : arrow_down_gray
                              // }
                              src={srcChild}
                              style={{
                                minWidth: '1.4vmin',
                                maxWidth: '1.4vmin',
                                transform: getTransformStyle(child),
                                pointerEvents: 'auto',
                                // sortingOrders[child.columnIndex] === "asc"
                                //   ? "auto"
                                //   : "auto",
                              }}
                              data-static-id='CollapsibleTable.js_img_5f8c51'
                            ></img>
                          )}
                        </>
                      )}
                    </div>
                  </th>
                )
              })
            )
          })}
        </tr>
      </>
    )
  }
  function handleRowClick(rowKey) {
    setExpandedRows((prevRows) =>
      prevRows.includes(rowKey)
        ? prevRows.filter((key) => key !== rowKey)
        : [rowKey],
    )
  }
  function shouldDisplayRow(isSubTable, expandedRows, collapseKey, row) {
    return isSubTable ? !expandedRows.includes(row.data[collapseKey]) : false
  }
  function generateTableCell({
    cellValue,
    cellIndex,
    configs,
    cellId,
    rowIndex,
    key,
    row,
  }) {
    return (
      <td
        key={genRandomNumber()}
        className={`text-13-regular px-1 ${configs?.leftAlignColumns.includes(cellIndex) ? 'text-left left_spacing' : 'text-center'}`}
        data-bs-target={cellIndex === 0 ? `#demo${rowIndex}${cellId}` : ''}
        aria-expanded={cellIndex === 0 ? 'true' : ''}
        aria-controls={cellIndex === 0 ? `demo${rowIndex}${cellId}` : ''}
        style={
          {
            // borderRight:
            //   cellIndex === 0 ? `1px solid ${variables.primary_gray_4}` : "",
            // overflowWrap: "anywhere" ,
          }
        }
        data-static-id='CollapsibleTable.js_td_e292d1'
      >
        {generateCell({
          cellValue,
          cellIndex,
          cfg: configs,
          cellId,
          rowIndex,
          key,
          row,
          configs,
        })}
      </td>
    )
  }
  function generateTableRow({
    isWithoutHeader,
    styles,
    row,
    configs,
    cellId,
    isSubTable,
    key,
    rowIndex,
  }) {
    const handleMainRowClick = () => {
      const targetRowIdentifier = getValsBaseOnCondition(
        collapseKey,
        row.data[collapseKey],
        rowIndex,
      )
      const tempActiveRows = activeRows.slice()
      if (!tempActiveRows.includes(targetRowIdentifier)) {
        setActiveRows(
          getValsBaseOnCondition(
            collapseKey,
            [targetRowIdentifier],
            [rowIndex],
          ),
        )
      }
      configs?.callback(row)
    }
    return (
      <tr
        onClick={handleMainRowClick}
        key={`${row.data.plantName}_${genRandomNumber()}`}
        style={
          shouldDisplayRow(isSubTable, expandedRows, collapseKey, row)
            ? {
                display: 'none',
              }
            : {}
        }
        className={`${isWithoutHeader ? styles.sub : ''} ${styles.tblRow} ${Object.keys(row.children || {}).includes('rows') && (row.children?.rows?.length ?? 0) >= 1 ? styles.rowWithChildren : ''} ${activeRows.includes(key) && cellId === 'table' ? styles.activeRow : styles.inActiveRow} `}
        data-static-id='CollapsibleTable.js_tr_73804f'
      >
        {isSubTable ? (
          <td
            className='px-1'
            data-static-id='CollapsibleTable.js_td_7a33d9'
          ></td>
        ) : null}
        {row.vals.map((cellValue, cellIndex) =>
          generateTableCell({
            cellValue,
            cellIndex,
            configs,
            cellId,
            rowIndex,
            key,
            row,
          }),
        )}
      </tr>
    )
  }
  function getRowSystemsKey(systems) {
    if (!systems || systems.length === 0) {
      return ''
    }
    return systems.map((system) => system.caseID).join('')
  }
  function generateRows(
    rows,
    configs,
    isWithoutHeader,
    cellId,
    isSubTable = false,
  ) {
    return rows.map((row, rowIndex) => {
      let counter = rowIndex
      let key
      if (collapseKey) {
        key = row.data[collapseKey]
      } else if (activeRows.length > 0) {
        key = activeRows[0]
      } else {
        key = rowIndex
      }
      return (
        <React.Fragment
          key={`${row.data.plantName}_${getRowSystemsKey(row.data.systems)}_${counter}`}
        >
          {generateTableRow({
            isWithoutHeader,
            styles,
            row,
            configs,
            cellId,
            isSubTable,
            key,
            rowIndex,
          })}

          {Object.keys(row.children || {}).includes('rows') &&
          (row.children?.rows?.length ?? 0) >= 1 ? (
            <>
              {generateRows(
                row.children.rows,
                config['l2'],
                true,
                'subTable',
                true,
              )}
            </>
          ) : null}
        </React.Fragment>
      )
    })
  }
  function handleSorting(field, initialSort) {
    const currentOrder = sortingOrders[field]
    setSortedColumn(field)
    const newOrder = calculateNewOrder(currentOrder)
    setSortingOrders({
      ...sortingOrders,
      [field]: newOrder,
    })
    const sortedData = sortData([...rows], field, newOrder)
    const finalData = sortNestedRows(sortedData, field, newOrder)
    if (initialSort && isExpanded) {
      const firstDataItem = finalData[0]?.data
      setExpandedRows(finalData.length > 0 ? [firstDataItem?.plantName] : [])
      setActiveRows(finalData.length > 0 ? [firstDataItem?.plantName] : [])
    }
    setFilteredRows(finalData)
  }
  function calculateNewOrder(currentOrder) {
    switch (currentOrder) {
      case 'asc':
        return 'desc'
      case 'desc':
        return 'asc'
      case 'onLoad':
        setSortingOrders({})
        return 'desc'
      default:
        return 'asc'
    }
  }
  function sortData(data, field, order) {
    if (!Array.isArray(data)) return []
    const clonedData = [...data]
    return clonedData.sort((a, b) => {
      const aValue = parseInt(a['vals'][field])
      const bValue = parseInt(b['vals'][field])
      if (order === 'asc') return aValue - bValue
      if (order === 'desc') return bValue - aValue
      return 0
    })
  }
  function sortNestedRows(data, field, order) {
    return data.map((obj) => {
      const rows = obj?.children?.rows?.slice()
      const sortedRows = sortData(rows, field - 1, order)
      return {
        ...obj,
        children: {
          ...obj.children,
          rows: sortedRows,
        },
      }
    })
  }
  return (
    <div
      id='predicted-opportunities'
      data-static-id='CollapsibleTable.js_div_246a8c'
    >
      <table
        className={`${styles.table} w-100`}
        data-static-id='CollapsibleTable.js_table_ac7843'
      >
        <thead data-static-id='CollapsibleTable.js_thead_76ec94'>
          {generateHeaders(headers, config['l1'])}
        </thead>
        <tbody
          id={
            source == 'plant' ? 'plant-systems-list' : 'plant-list-selected-aff'
          }
          data-static-id='CollapsibleTable.js_tbody_63c516'
        >
          {generateRows(filteredRows, config['l1'], false, 'table')}
        </tbody>
      </table>
      <CustomModal
        show={affiliateCaseId}
        title={affiliateTrendsName}
        subTitle={null}
        hideModal={() => setAffiliateCaseId()}
        id={elementId}
      >
        <LineChartMultiple
          data={{
            caseId: affiliateCaseId,
            endTime: moment?.now(),
          }}
          // chartTypeEnabled = {false}
          chartType='opportunity'
          defaultChartType='line'
          isModalSkip={showModalSkip}
          exportTitle={affiliateTrendsName}
        />
      </CustomModal>
    </div>
  )
}
export default CollapsibleTable
