import { AppAtom } from 'atoms/AppAtom'
import CaseUnderProgress from 'components/ui/case_under_progress/CaseUnderProgress'
import Loader from 'components/ui/loader/Loader'
import Card1no from 'components/visuals/cards/Card1no'
import Card2no from 'components/visuals/cards/Card2no'
import Card2noActualForecastedDate from 'components/visuals/cards/Card2noActualForecastedDate'
import Card2noActualForecastedDateDynamicDisplay from 'components/visuals/cards/Card2noActualForecastedDateDynamicDisplay'
import Card2noActualRem from 'components/visuals/cards/Card2noActualRem'
import Card2noRegenerationEffectiveness from 'components/visuals/cards/Card2noRegenerationEffectiveness'
import Kpi1noDate from 'components/visuals/cards/Kpi1noDate'
import Kpi1noDateAcetyleneSlippage from 'components/visuals/cards/Kpi1noDateAcetyleneSlippage'
import Kpi2DateCatalystChangeover from 'components/visuals/cards/Kpi2DateCatalystChangeover'
import KpiActualLoHi from 'components/visuals/cards/KpiActualLoHi'
import SingleTitleCard from 'components/visuals/common/single_title_card/SingleTitleCard'
import { useAtomValue } from 'jotai'
import React, { useEffect, useRef, useState } from 'react'
export function getCardComponent(
  kipobj,
  caseId,
  actualTime,
  isCritical = true,
) {
  const libraryMapping = {
    kpi_1_number: Card1no,
    kpi_1_text: Card1no,
    kpi_2_number: Card2no,
    kpi_actual_remaining: Card2noActualRem,
    kpi_actual_forecasted_date: Card2noActualForecastedDate,
    kpi_actual_forecast_date_dynamic_display:
      Card2noActualForecastedDateDynamicDisplay,
    kpi_actual_equivalent: Card2noActualRem,
    kpi_2_number_r2_r3: Card2noActualRem,
    kpi_2_number_eth_prop: Card2noActualRem,
    kpi_actual_lo_hi: KpiActualLoHi,
    kpi_actual_remaining_date: Card2noActualForecastedDate,
    kpi_2no_2date_dynamic_library: Card2noRegenerationEffectiveness,
    kpi_2date_dynamic_library: Kpi2DateCatalystChangeover,
    kpi_1no_date: Kpi1noDate,
    kpi_1no_date_acetylene_slippage: Kpi1noDateAcetyleneSlippage,
    kpi_2_number_r2_r3_da: Card2noActualRem,
    kpi_1_number_da: Card1no,
    kpi_2_number_da: Card2no,
    kpi_actual_forecasted_date_da: Card2noActualForecastedDate,
  }
  const textMapping = {
    kpi_actual_equivalent: ['ACTUAL', 'EQUIVALENT', false, false, false],
    kpi_2_number_r2_r3: ['R2', 'R3', false, false, false],
    kpi_2_number_eth_prop: ['ETHYLENE', 'PROPYLENE', false, false, false],
    kpi_actual_remaining_date: ['', '', false, true],
    kpi_actual_remaining: ['Actual', 'Remaining', true, true],
    kpi_2_number_r2_r3_da: ['R2', 'R3', false, false, true],
    kpi_1_number_da: [false, false, false, false, true],
    kpi_2_number_da: [false, false, false, false, true],
    kpi_actual_forecasted_date_da: [false, false, false, false, true],
  }
  const Component = libraryMapping[kipobj.library]
  if (isCritical) {
    kipobj = {
      ...kipobj,
    }
  }
  let compParams = ['', '', '', '']
  if (Object.keys(textMapping).includes(kipobj.library)) {
    compParams = textMapping[kipobj.library]
  }
  if (Component) {
    return (
      <Component
        data={kipobj}
        caseId={caseId}
        actualTime={actualTime}
        text1={compParams[0]}
        text2={compParams[1]}
        isOptimumEnabled={compParams[2]}
        isRemaining={compParams[3]}
        isDa={compParams[4]}
        showOdsButton={isCritical ? false : true}
        library_name={kipobj.library}
      />
    )
  } else {
    return (
      <p
        className='text-14-regular text-center w-100 h-100 d-flex justify-content-center align-items-center'
        data-static-id='ProcessCriticalParameters.js_p_b23928'
      >
        INVALID LIBRARY.
      </p>
    )
  }
}
export function setOnMouseLeave(setIsHovered) {
  setTimeout(() => {
    setIsHovered(false)
  }, 30000)
}
export default function ProcessCriticalParameters({
  data = [],
  isLoading,
  caseId,
  actualTime,
}) {
  if (Array.isArray(data)) {
    data = data.sort((a, b) => a.kpiSortID - b.kpiSortID)
  }
  const scrollRef = useRef(null)
  const direction = useRef('down')
  const [isHovered, setIsHovered] = useState(false)
  const ctxData = useAtomValue(AppAtom)
  useEffect(() => {
    let interval
    if (!isHovered) {
      interval = setInterval(() => {
        const scrollElement = scrollRef.current
        const cardHeight =
          scrollRef?.current?.children?.length > 0
            ? scrollRef?.current?.children[0].clientHeight
            : 112
        if (!scrollElement) return
        handleDirection(scrollElement, cardHeight)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isHovered])
  const handleDirection = (scrollElement, cardHeight) => {
    if (direction.current === 'down') {
      if (
        scrollElement.scrollTop + scrollElement.clientHeight >=
        scrollElement.scrollHeight
      ) {
        direction.current = 'up'
      } else {
        scrollElement.scrollTop += cardHeight
      }
    } else {
      if (scrollElement.scrollTop <= 0) {
        direction.current = 'down'
      } else {
        scrollElement.scrollTop -= cardHeight
      }
    }
  }
  return (
    <SingleTitleCard
      title={`Key Parameters`}
      extraClasses={'m-0 h-100 overflow-hidden'}
    >
      {isLoading ? (
        <Loader />
      ) : (
        <div
          ref={scrollRef}
          style={{
            overflowY: 'auto',
            height: '100%',
            scrollBehavior: 'smooth',
            overflowX: 'hidden',
          }}
          data-static-id='ProcessCriticalParameters.js_div_18570a'
        >
          {data?.length > 0 && ctxData?.actualTime ? (
            <div
              id='card-kpis'
              className='w-100 h-100 d-flex flex-wrap'
              onMouseOver={() => setIsHovered(true)}
              onMouseLeave={() => setOnMouseLeave(setIsHovered)}
              data-static-id='ProcessCriticalParameters.js_div_589eb8'
            >
              {data.map((kipobj) => {
                return (
                  <React.Fragment key={kipobj.tagName}>
                    <div
                      key={kipobj.tagName}
                      className={'h-50 px-1 py-1'}
                      style={
                        data.length > 4
                          ? {
                              width: 'calc((100% / 3) - 3px)',
                            }
                          : {
                              width: 'calc((100% / 2) - 3px)',
                            }
                      }
                      data-static-id='ProcessCriticalParameters.js_div_a3112f'
                    >
                      {getCardComponent(kipobj, caseId, actualTime)}
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          ) : (
            <CaseUnderProgress />
          )}
        </div>
      )}
    </SingleTitleCard>
  )
}
