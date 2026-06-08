import { convertFormulaToHtml, formatNumbers } from 'utills/utilities'
import classes from './Cards.module.scss'
import CardTrends from './CardTrends'
export default function KpiActualLoHi({
  data,
  category,
  actualTime,
  caseId,
  odsData,
  showOdsButton = true,
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
      data-static-id='KpiActualLoHi.js_div_47b6f1'
    >
      <div
        className='h-100 flexCenterContainer flex-column'
        style={{
          gap: '.8vmin',
        }}
        data-static-id='KpiActualLoHi.js_div_6b58e5'
      >
        <div
          className='d-flex justify-content-end align-items-center flex-column h-50'
          data-static-id='KpiActualLoHi.js_div_14b050'
        >
          <div
            className='text-12-bold text-center text-break pb-1'
            style={{
              lineHeight: '1.5vmin',
            }}
            data-static-id='KpiActualLoHi.js_div_dee0ef'
          >
            {convertFormulaToHtml(data?.displayName?.toUpperCase())}
          </div>
          <div
            className='text-12-light'
            style={{
              lineHeight: '1vmin',
            }}
            data-static-id='KpiActualLoHi.js_div_019c7f'
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
          className='d-flex justify-content-between h-50'
          data-static-id='KpiActualLoHi.js_div_904999'
        >
          <div
            className='d-flex flex-column justify-content-center align-items-center pr-10'
            data-static-id='KpiActualLoHi.js_div_5acd87'
          >
            <span
              className='text-10-light text-center'
              data-static-id='KpiActualLoHi.js_span_a87041'
            >
              {' '}
              ACTUAL{' '}
            </span>
            <span
              className={`text-14-bold pt-1 justify-content-center align-items-center ${data.state === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
              data-static-id='KpiActualLoHi.js_span_e98d75'
            >
              {data.value1 != null ? formatNumbers(data.value1) : '--'}
            </span>
          </div>
          <div
            className='d-flex flex-column justify-content-center align-items-center pr-10'
            data-static-id='KpiActualLoHi.js_div_b13f90'
          >
            <span
              className='text-10-light text-center'
              data-static-id='KpiActualLoHi.js_span_7784b8'
            >
              LOWER LIMIT
            </span>
            <span
              className={
                'text-14-bold text_primary_gray_2 pt-1 justify-content-center align-items-center '
              }
              data-static-id='KpiActualLoHi.js_span_fd5780'
            >
              {data.value2 != null ? formatNumbers(data.value2) : '--'}
            </span>
          </div>
          <div
            className='d-flex flex-column justify-content-center align-items-center'
            data-static-id='KpiActualLoHi.js_div_c02c1b'
          >
            <span
              className='text-10-light text-center'
              data-static-id='KpiActualLoHi.js_span_abc379'
            >
              UPPER LIMIT
            </span>
            <span
              className={
                'text-14-bold text_primary_gray_2 pt-1 justify-content-center align-items-center '
              }
              data-static-id='KpiActualLoHi.js_span_1fb8e5'
            >
              {data.value3 != null ? formatNumbers(data.value3) : '--'}
            </span>
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
