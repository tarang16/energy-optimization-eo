import { convertFormulaToHtml, formatNumbers } from 'utills/utilities'
import classes from './Cards.module.scss'
import CardTrends from './CardTrends'
export default function Card2no({
  data,
  category,
  actualTime,
  caseId,
  odsData,
  showOdsButton = true,
  library_name,
  isDa = false,
}) {
  const isMatchingCategory =
    data?.category
      ?.toLowerCase()
      ?.includes(category?.toLowerCase()?.replace('_ods', '')) &&
    `position-relative ${classes.box}`
  return (
    <div
      className={`d-flex justify-content-center h-100 bg_primary_bg px-1 position-relative hoverAction ${library_name} ${isMatchingCategory}`}
      data-static-id='Card2no.js_div_cb9a18'
    >
      {isDa ? (
        <div
          className='da-span position-absolute'
          data-static-id='Card2no.js_div_c3069f'
        >
          DA
        </div>
      ) : (
        ''
      )}
      <div
        className='h-100 flexCenterContainer flex-column'
        data-static-id='Card2no.js_div_5b411f'
      >
        <div
          className='flexCenterContainer flex-column'
          data-static-id='Card2no.js_div_a8ffd8'
        >
          <p
            className='text-12-bold text-center text-break mb-1'
            data-static-id='Card2no.js_p_63d3b4'
          >
            {convertFormulaToHtml(data?.displayName?.toUpperCase())}
          </p>
          <p
            className='text-12-light text-center mb-0'
            style={{
              lineHeight: '1vmin',
            }}
            data-static-id='Card2no.js_p_57c41e'
          >
            {convertFormulaToHtml(
              data.displayUom ? `(${data?.displayUom?.toUpperCase()})` : '(-)',
            )}
          </p>
        </div>
        <div data-static-id='Card2no.js_div_b69949'>
          <span
            className={`text-14-bold mt-1 justify-content-center align-items-center ${data.state === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
            data-static-id='Card2no.js_span_b6cfc1'
          >
            {data.value1 != null ? formatNumbers(data.value1) : '--'}
          </span>
          <span
            className='text-12-light mx-2 text-12-regular'
            data-static-id='Card2no.js_span_dd2064'
          >
            |
          </span>
          <span
            className='text_primary_gray_2 text-14-bold mt-1'
            data-static-id='Card2no.js_span_21b6b2'
          >
            {data.value2 != null ? formatNumbers(data.value2) : '--'}
          </span>
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
