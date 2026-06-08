import { AppAtom } from 'atoms/AppAtom'
import Loader from 'components/ui/loader/Loader'
import SingleTitleCard from 'components/visuals/common/single_title_card/SingleTitleCard'
import ExpandableTable from 'components/visuals/table/ExpandableTable'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getOptimizerOutput } from 'services/OptimizationService'
import {
  CompareValuesWithSymbol,
  digitDecimal,
  getValsBaseOnCondition,
} from 'utills/utilities'
import energyBill_Icon from '../../../../../src/assets/sabic_icons/energyBill_icons/energyBill.svg'
import {
  default as classes,
  default as styles,
} from './Optimization.module.scss'
export default function OptimizationOutput({
  mode,
  isRunOptimizerClick,
  outputData,
  refetch,
  isLoadingData,
}) {
  const appContext = useAtomValue(AppAtom)
  const { caseId } = useOutletContext()
  const [expandedRowsKey, setExpandedRowsKey] = useState({
    0: true,
  })
  const [tableData, setTableData] = useState([])
  const [energyBillData, setEnergyBillData] = useState({})
  const [actualData, setActualData] = useState([])
  const headers = [
    {
      key: 'parameter',
      label: 'Parameter',
    },
    {
      key: 'actual',
      label: 'Actual',
    },
    {
      key: 'optimum',
      label: getValsBaseOnCondition(
        mode === 'whatIf',
        'Estimated Optimum',
        'Optimum',
      ),
    },
    {
      key: 'benefit',
      label: 'Benefit',
      uom: '($/Hr)',
    },
  ]
  function getStatusClass(status) {
    if (
      `${status}`?.toLowerCase() === 'undefined' ||
      `${status}`?.toLowerCase() === 'null'
    ) {
      return 'white'
    } else if (status) {
      return 'green'
    } else {
      return 'grey'
    }
  }
  function getDisplayName(name, uom) {
    if (name) {
      if (uom) {
        return `${name} (${uom})`
      } else {
        return `${name}`
      }
    } else {
      return '-'
    }
  }
  const showOptimumInWhatIf = mode === 'whatIf' && isRunOptimizerClick
  const getBenefitActual = (value) => {
    if (value === null) return 0
    return value
  }
  const statusDotClass = (row) => {
    let col = 'text_primary_gray'
    const colCode = {
      1: 'text_primary_orange',
    }
    if (mode !== 'whatIf') {
      col = colCode?.[row.polarityActual] ?? 'text_primary_gray'
    }
    if (showOptimumInWhatIf) {
      col = colCode?.[row.polarityActual] ?? 'text_primary_gray'
    }
    return col
  }
  const getCountDisplay = (value, count) => {
    let actualOrOptimiumValue
    if (value === 0) {
      actualOrOptimiumValue = '0'
    } else if (value !== null) {
      actualOrOptimiumValue = digitDecimal(value)
    } else {
      actualOrOptimiumValue = '-'
    }
    return `${getValsBaseOnCondition(count, count, '')} (${actualOrOptimiumValue})`
  }
  const processOutputData = (data) => {
    const categoryData = handleCategory(data)
    let energyBill = {}
    categoryData['Energy Bill']?.forEach((item) => {
      energyBill = getValsBaseOnCondition(
        item.tagName === 'Objective',
        {
          ...energyBill,
          objective: item,
        },
        {
          ...energyBill,
          opportunity: item,
        },
      )
    })
    setEnergyBillData(energyBill)
    const finalData = Object.entries(categoryData)
      .filter((item) => {
        const [key] = item
        return key.toLowerCase() !== 'energy bill'
      })
      .map((item) => {
        const [key, value] = item
        const showBenefitsSum = value.some(
          (val) => val.flagAggregation === true,
        )
        const aggregationData = value.filter(
          (val) => val.flagAggregation === true,
        )
        let aggregationObj = aggregationData?.reduce(
          (acc, curr) => {
            curr.flagAggregation &&
              (() => {
                acc['actual'] += getValsBaseOnCondition(
                  curr.actual,
                  curr.actual,
                  0,
                )
                acc['optimum'] += getValsBaseOnCondition(
                  curr.optimum,
                  curr.optimum,
                  0,
                )
              })()
            !isNaN(curr.benefitActual) &&
              (() => {
                acc['benefit'] += curr.benefitActual
              })()
            return acc
          },
          {
            actual: 0,
            optimum: 0,
            benefit: 0,
          },
        )
        const actualCount = aggregationData?.reduce(
          (acc, curr) =>
            acc + getValsBaseOnCondition(curr.statusActual === 1, 1, 0),
          0,
        )
        const optimumCount = aggregationData?.reduce(
          (acc, curr) =>
            acc + getValsBaseOnCondition(curr.statusOptimum === 1, 1, 0),
          0,
        )
        const shouldShowAggregationActualCount = aggregationData?.reduce(
          (acc, curr) =>
            acc + getValsBaseOnCondition(curr.statusActual === 0, 0, 1),
          0,
        )
        const shouldShowAggregationOptimumCount = aggregationData?.reduce(
          (acc, curr) =>
            acc + getValsBaseOnCondition(curr.statusOptimum === 0, 0, 1),
          0,
        )
        const zeroAggregation = [
          ...new Set(
            aggregationData?.map((item) => {
              if (
                (item.flagAggregation === true &&
                  item.actual === 0 &&
                  (item.statusActual === 0 || item.statusActual === null)) ||
                (item.optimum === 0 &&
                  (item.statusOptimum === 0 || item.statusOptimum === null))
              ) {
                return `0 (0)`
              } else {
                return (
                  getValsBaseOnCondition(
                    item.actual !== null,
                    item.actual,
                    '-',
                  ) ||
                  getValsBaseOnCondition(
                    item.optimum !== null,
                    item.optimum,
                    '-',
                  )
                )
              }
            }),
          ),
        ]
        let actualCountDisplay = getValsBaseOnCondition(
          shouldShowAggregationActualCount,
          getCountDisplay(aggregationObj?.actual, actualCount),
          zeroAggregation,
        )
        let optimumCountDisplay = '-'
        if (
          CompareValuesWithSymbol('||', mode !== 'whatIf', showOptimumInWhatIf)
        ) {
          optimumCountDisplay = getValsBaseOnCondition(
            shouldShowAggregationOptimumCount,
            getCountDisplay(aggregationObj?.optimum, optimumCount),
            zeroAggregation,
          )
        }
        let benefitsDisplay = getValsBaseOnCondition(
          CompareValuesWithSymbol('||', mode !== 'whatIf', showOptimumInWhatIf),
          getValsBaseOnCondition(
            showBenefitsSum,
            digitDecimal(aggregationObj?.benefit),
            '',
          ),
          '-',
        )
        const commonTableData = [
          `${key}`,
          actualCountDisplay,
          optimumCountDisplay,
          benefitsDisplay,
        ]
        return {
          data: commonTableData,
          children: value.map((row) => {
            let optimumDisplay = getValsBaseOnCondition(
              mode !== 'whatIf' || showOptimumInWhatIf,
              getValsBaseOnCondition(row.optimum === null, '-', row.optimum),
              '-',
            )
            return [
              getDisplayName(row.uiDisplayName, row.uomName),
              <>
                <span
                  className={`me-1 dots ${getStatusClass(row.statusActual)}`}
                  data-static-id='OptimizationOutput.js_span_2341c0'
                />

                <span
                  className={`me-1  ${statusDotClass(row)} `}
                  data-static-id='OptimizationOutput.js_span_f6d19d'
                >
                  {getValsBaseOnCondition(row.actual === null, '-', row.actual)}
                </span>
              </>,
              <>
                {getValsBaseOnCondition(
                  CompareValuesWithSymbol(
                    '||',
                    mode !== 'whatIf',
                    showOptimumInWhatIf,
                  ),
                  <span
                    className={`me-1 dots ${getStatusClass(row.statusOptimum)}`}
                    data-static-id='OptimizationOutput.js_span_b8aec9'
                  />,
                  <></>,
                )}
                {optimumDisplay}
              </>,
              getValsBaseOnCondition(
                CompareValuesWithSymbol(
                  '||',
                  mode !== 'whatIf',
                  showOptimumInWhatIf,
                ),
                getBenefitActual(row.benefitActual),
                '-',
              ),
            ]
          }),
        }
      })
    setTableData(finalData)
  }
  useEffect(() => {
    if (actualData?.length && !isRunOptimizerClick) {
      processOutputData(actualData)
    }
  }, [isRunOptimizerClick, actualData])
  const fetchData = async () => {
    const resp = await getOptimizerOutput(caseId, appContext?.actualTime)
    if (resp?.statuscode === 200) {
      setActualData(resp.data)
    }
  }
  useEffect(() => {
    if (caseId && appContext?.actualTime) {
      fetchData()
    }
  }, [caseId, appContext?.actualTime, mode])
  useEffect(() => {
    if (outputData?.length && isRunOptimizerClick) {
      processOutputData(outputData)
    }
  }, [outputData, isRunOptimizerClick])
  useEffect(() => {
    if (refetch > 0 && caseId && appContext?.actualTime) {
      fetchData()
    }
  }, [refetch, caseId, appContext?.actualTime])
  const handleCategory = (data) => {
    const tempData = {}
    data.forEach((item) => {
      if (tempData[item.category]) {
        tempData[item.category] = [...tempData[item.category], item]
      } else {
        tempData[item.category] = [item]
      }
    })
    return tempData
  }
  const handleExpandCollapseAll = (value) => {
    setExpandedRowsKey((prev) => {
      let expandKeys = prev
      tableData.forEach((element, i) => {
        expandKeys = {
          ...expandKeys,
          [i]: value,
        }
      })
      return expandKeys
    })
  }
  const extraComponent = (
    <div
      className={`d-flex ${styles.optimizationOutputContainer_Component} justify-content-between align-items-center`}
      data-static-id='OptimizationOutput.js_div_d16eb5'
    >
      <div
        className={` d-flex justify-content-between align-items-center gap-1 ${styles.optimizationSwitchContainer} `}
        data-static-id='OptimizationOutput.js_div_a1be81'
      >
        <div
          className={`d-flex justify-content-center align-items-center gap-1 ${styles.dotsHeight}`}
          data-static-id='OptimizationOutput.js_div_668480'
        >
          <div
            className={`${styles.dots} ${styles.green} `}
            data-static-id='OptimizationOutput.js_div_9d9efc'
          ></div>
          <div
            className={` text-12-bold text-uppercase primary_gray ${styles.dotsDiv}`}
            data-static-id='OptimizationOutput.js_div_43889f'
          >
            ON
          </div>
        </div>

        <div
          className={`d-flex justify-content-between align-items-center gap-1`}
          data-static-id='OptimizationOutput.js_div_360088'
        >
          <div
            className={`${styles.dots} ${styles.grey}`}
            data-static-id='OptimizationOutput.js_div_de3cfe'
          ></div>
          <div
            className={`text-12-bold text-uppercase primary_gray ${styles.dotsDiv} `}
            data-static-id='OptimizationOutput.js_div_322df6'
          >
            OFF
          </div>
        </div>
      </div>
      <div
        className={`${styles.RightBorder}`}
        data-static-id='OptimizationOutput.js_div_fb443a'
      ></div>

      <div
        className={`d-flex ${classes.ButtonContainer} ${styles.optimizationOutputButtonContainers}`}
        data-static-id='OptimizationOutput.js_div_042dce'
      >
        <button
          className={`text-12-regular me-1 text-uppercase`}
          onClick={() => handleExpandCollapseAll(true)}
          data-static-id='OptimizationOutput.js_button_c3fbc4'
        >
          <span
            className={`mt_03 text_primary_blue fw-600`}
            data-static-id='OptimizationOutput.js_span_7e91f5'
          >
            Expand all
          </span>
        </button>
        <button
          className={`text-12-regular  text-uppercase text-nowrap`}
          onClick={() => handleExpandCollapseAll(false)}
          data-static-id='OptimizationOutput.js_button_e9f035'
        >
          <span
            className={`mt_03 text_primary_blue fw-600`}
            data-static-id='OptimizationOutput.js_span_cf6160'
          >
            Collapse all
          </span>
        </button>
      </div>
    </div>
  )
  let displayValue = '-'
  if (mode !== 'whatIf') {
    displayValue = energyBillData?.opportunity?.actual ?? '-'
  } else if (showOptimumInWhatIf) {
    displayValue = energyBillData?.opportunity?.optimum ?? '-'
  }
  return (
    <div
      className={`w-100 h-100 position-relative ${styles.optimizationOutputOverlayContainer}`}
      data-static-id='OptimizationOutput.js_div_2e762e'
    >
      {isLoadingData && <Loader />}
      <SingleTitleCard
        title='OUTPUT'
        RightHtml={extraComponent}
        extraClasses={`${styles.optimizationOutputContainer} mx-0 my-0`}
      >
        <div
          className={`${styles.optimizationOutputExpandableContainer} ${styles.bottoms}`}
          data-static-id='OptimizationOutput.js_div_f4be34'
        >
          <div
            id='optimization-output-table'
            data-testid='optimization-output-table'
            className={`${styles.expandableTableContainer}`}
            data-static-id='OptimizationOutput.js_div_f109b2'
          >
            <ExpandableTable
              headers={headers}
              data={tableData}
              expandedRowsKey={expandedRowsKey}
              customColumnWidths={
                mode !== 'whatIf' ? [49, 17, 17, 17] : [60, 20, 20]
              }
            />
          </div>
          <div
            id='energy-bills'
            data-testid='energy-bills'
            className={`${styles.optimizationEneryBillContainer}`}
            data-static-id='OptimizationOutput.js_div_38d279'
          >
            <div
              className={`d-flex ${styles.energyBillIconContainer} d-flex align-items-center `}
              data-static-id='OptimizationOutput.js_div_3e7dc3'
            >
              <h1
                className='mt_03 text-14-bold primary_gray text-uppercase'
                data-static-id='OptimizationOutput.js_h1_114b0e'
              >
                ENERGY BILL{' '}
                <span
                  className='me-2'
                  data-static-id='OptimizationOutput.js_span_c9b78a'
                >
                  (USD/HR)
                </span>
              </h1>

              <div
                className={`${styles.energyBillIcon_img} flexCenterContainer`}
                data-static-id='OptimizationOutput.js_div_3ebc80'
              >
                <img
                  src={energyBill_Icon}
                  alt='energyBill'
                  data-static-id='OptimizationOutput.js_img_6058e7'
                />
              </div>
            </div>
            <div
              className={`${styles.optimizationEneryBillCardContainer}`}
              data-static-id='OptimizationOutput.js_div_1c0d5f'
            >
              <div
                className={`${styles.energyBill}`}
                data-static-id='OptimizationOutput.js_div_8c4283'
              >
                <span
                  className={`text-12-regular text_primary_gray_2 text-uppercase text-nowrap`}
                  data-static-id='OptimizationOutput.js_span_41c1ee'
                >
                  CURRENT VALUE
                </span>
                <div
                  className={`text-12-bold text-center mt-2  text-uppercase`}
                  data-static-id='OptimizationOutput.js_div_3850a9'
                >
                  {energyBillData?.objective?.actual ?? '-'}
                </div>
              </div>

              <div
                className={`${styles.energyBill}`}
                data-static-id='OptimizationOutput.js_div_7f739d'
              >
                <span
                  className='text-12-regular text_primary_gray_2 text-uppercase text-nowrap'
                  data-static-id='OptimizationOutput.js_span_1d34f5'
                >
                  OPTIMUM
                </span>
                <div
                  className={`text-12-bold text-center mt-2  text-uppercase`}
                  data-static-id='OptimizationOutput.js_div_3b2316'
                >
                  {mode !== 'whatIf' || showOptimumInWhatIf
                    ? (energyBillData?.objective?.optimum ?? '-')
                    : '-'}
                </div>
              </div>

              <div
                className={`${styles.energyBill} `}
                data-static-id='OptimizationOutput.js_div_434b8f'
              >
                <span
                  className='text-12-regular text_primary_gray_2 text-uppercase'
                  data-static-id='OptimizationOutput.js_span_667075'
                >
                  {getValsBaseOnCondition(
                    CompareValuesWithSymbol(
                      '||',
                      mode?.toLowerCase() !== 'whatif',
                      showOptimumInWhatIf,
                    ),
                    'OPPORTUNITY',
                    'OPPORTUNITY/LOSS',
                  )}
                </span>

                <div
                  className={`text-12-bold text-center mt-2  text-uppercase`}
                  data-static-id='OptimizationOutput.js_div_f80702'
                >
                  {displayValue}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SingleTitleCard>
    </div>
  )
}
