import moment from 'moment'
import { convertFormulaToHtml, formatNumbers } from 'utills/utilities'
import classes from './Cards.module.scss'
import CardTrends from './CardTrends'
export default function Kpi1noDate({
  data,
  category,
  actualTime,
  caseId,
  odsData,
  showOdsButton = true,
  isRemaining = false,
  library_name,
}) {
  const isMatchingCategory =
    data?.category
      ?.toLowerCase()
      ?.includes(category?.toLowerCase()?.replace('_ods', '')) &&
    `position-relative ${classes.box}`
  return (
    <div
      className={`d-flex justify-content-center h-100 bg_primary_bg position-relative px-1 hoverAction ${library_name}${isMatchingCategory}`}
      data-static-id='Kpi1noDate.js_div_f65f5b'
    >
      <div
        className='h-100 flexCenterContainer flex-column'
        style={{
          gap: '.8vmin',
        }}
        data-static-id='Kpi1noDate.js_div_3465d6'
      >
        <div
          className='d-flex justify-content-end align-items-center flex-column h-50'
          data-static-id='Kpi1noDate.js_div_b7bfe9'
        >
          <div
            className='text-12-bold text-center text-break pb-1'
            style={{
              lineHeight: '1.5vmin',
            }}
            data-static-id='Kpi1noDate.js_div_22c505'
          >
            {convertFormulaToHtml(data?.displayName?.toUpperCase())}
          </div>
          <div
            className='text-12-light'
            style={{
              lineHeight: '1vmin',
            }}
            data-static-id='Kpi1noDate.js_div_c60dc2'
          >
            {convertFormulaToHtml(
              data.displayUom ? `(${data?.displayUom?.toUpperCase()})` : '(-)',
            )}
          </div>
        </div>
        <div
          style={{
            lineHeight: '1vmin',
          }}
          className='h-50'
          data-static-id='Kpi1noDate.js_div_919f64'
        >
          <div
            className='d-flex  flex-column align-items-center '
            data-static-id='Kpi1noDate.js_div_ab7bda'
          >
            <span
              className={`text-14-bold justify-content-center align-items-center ${data.state === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
              data-static-id='Kpi1noDate.js_span_5e3976'
            >
              {data.value1 != null ? formatNumbers(data.value1) : '--'}
            </span>
          </div>
          <div
            className='d-flex text-center'
            data-static-id='Kpi1noDate.js_div_ff66a0'
          >
            <p
              className={
                'text-10-bold mb-0 align-items-center text_primary_gray_2'
              }
              data-static-id='Kpi1noDate.js_p_cc4dfc'
            >
              {data.value2 != null
                ? `(${moment(parseInt(data.value2)).format('DD-MMM-YY')})`
                : ''}
            </p>
          </div>
        </div>
      </div>

      <CardTrends
        data={data}
        caseId={caseId}
        actualTime={actualTime}
        category={category}
        showOdsButton={showOdsButton}
        odsData={odsData}
        tagName={data?.tagName}
      />
    </div>
  )
}
