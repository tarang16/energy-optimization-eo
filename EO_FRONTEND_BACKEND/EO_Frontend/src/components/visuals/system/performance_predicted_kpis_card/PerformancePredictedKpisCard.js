import { AppAtom } from 'atoms/AppAtom'
import CaseUnderProgress from 'components/ui/case_under_progress/CaseUnderProgress'
import { useAtomValue } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import {
  getCardComponent,
  setOnMouseLeave,
} from '../process_critical_parameters/ProcessCriticalParameters'
export function onScroll(scrollRef, direction) {
  const scrollElement = scrollRef.current
  const cardHeight =
    scrollRef?.current?.children?.length > 0
      ? scrollRef?.current?.children[0].clientHeight
      : 112
  if (!scrollElement) return
  if (scrollElement.scrollHeight <= scrollElement.clientHeight) {
    return
  }
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
export default function PerformancePredictedKpisCard({
  data = [],
  caseId,
  actualTime,
  maxBoxesInRow,
  isPerformance,
}) {
  const containerRef = useRef(null)
  const [isLoading, setLoading] = useState(true)
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
      interval = setInterval(() => onScroll(scrollRef, direction), 1000)
    }
    return () => clearInterval(interval)
  }, [isHovered])
  useEffect(() => {
    if (isLoading && containerRef && containerRef.current) setLoading(false)
  }, [isLoading])
  let widthStyle = ''
  if (isPerformance) {
    if (maxBoxesInRow === 5) {
      widthStyle = {
        width: 'calc(100% / 5)',
      }
    } else {
      let columns
      if (data.length > 2) {
        columns = 3
      } else if (data.length > 1) {
        columns = 2
      } else {
        columns = 1
      }
      widthStyle = {
        width: `calc(100% / ${columns})`,
      }
    }
  } else {
    widthStyle = {
      width: `calc(100% / ${maxBoxesInRow})`,
    }
  }
  return (
    <>
      <div
        className='h-100 d-flex align-items-center justify-content-center'
        onMouseOver={() => setIsHovered(true)}
        onMouseLeave={() => setOnMouseLeave(setIsHovered)}
        ref={scrollRef}
        style={{
          overflowY: 'auto',
          scrollBehavior: 'smooth',
        }}
        data-static-id='PerformancePredictedKpisCard.js_div_6d3cd9'
      >
        {data?.length !== 0 && ctxData?.actualTime ? (
          <div
            id='card-kpis'
            className='w-100 h-100 d-flex flex-wrap'
            data-static-id='PerformancePredictedKpisCard.js_div_391f04'
          >
            {data.map((kipobj, index) => (
              <div
                key={kipobj.tagName}
                className={'h-50 px-1 py-1'}
                style={widthStyle}
                data-static-id='PerformancePredictedKpisCard.js_div_0657d2'
              >
                {getCardComponent(kipobj, caseId, actualTime, false)}
              </div>
            ))}
          </div>
        ) : (
          <CaseUnderProgress />
        )}
      </div>
    </>
  )
}
