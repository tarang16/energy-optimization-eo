import moment from 'moment'
import { convertFormulaToHtml, formatNumbers } from 'utills/utilities'
import classes from './Cards.module.scss'
import CardTrends from './CardTrends'
export default function Card2noActualForecastedDate({
  data,
  category,
  actualTime,
  caseId,
  odsData,
  showOdsButton = true,
  isRemaining = false,
  library_name,
  isDa = false,
}) {
  const get_state2_text_color = () => {
    const state2_val = data?.state2
    if (state2_val === null) {
      return 'text_primary_gray_2'
    } else if (state2_val === 1) {
      return 'text_primary_orange'
    } else {
      return 'text_primary_gray_2'
    }
  }
  const isMatchingCategory =
    data?.category
      ?.toLowerCase()
      ?.includes(category?.toLowerCase()?.replace('_ods', '')) &&
    `position-relative ${classes.box}`
  return (
    <div
      className={`d-flex justify-content-center h-100 bg_primary_bg position-relative px-1 hoverAction ${library_name} ${isMatchingCategory}`}
      data-static-id='Card2noActualForecastedDate.js_div_5b3641'
    >
      {isDa ? (
        <div
          className='da-span position-absolute'
          data-static-id='Card2noActualForecastedDate.js_div_334240'
        >
          DA
        </div>
      ) : (
        ''
      )}
      <div
        className='h-100 flexCenterContainer flex-column'
        style={{
          gap: '.8vmin',
        }}
        data-static-id='Card2noActualForecastedDate.js_div_dad512'
      >
        <div
          className='d-flex justify-content-end align-items-center flex-column h-50'
          data-static-id='Card2noActualForecastedDate.js_div_5e7f62'
        >
          <div
            className='text-12-bold text-center text-break pb-1'
            style={{
              lineHeight: '1.5vmin',
            }}
            data-static-id='Card2noActualForecastedDate.js_div_ac24de'
          >
            {convertFormulaToHtml(data?.displayName?.toUpperCase())}
          </div>
          <div
            className='text-12-light'
            style={{
              lineHeight: '1vmin',
            }}
            data-static-id='Card2noActualForecastedDate.js_div_dfdf0e'
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
          className='d-flex justify-content-between  h-50'
          data-static-id='Card2noActualForecastedDate.js_div_4e5264'
        >
          <div
            className='d-flex  flex-column align-items-center pr-10'
            data-static-id='Card2noActualForecastedDate.js_div_2f8891'
          >
            <span
              className='text-10-light'
              data-static-id='Card2noActualForecastedDate.js_span_aa384b'
            >
              ACTUAL
            </span>
            <span
              className={`text-14-bold justify-content-center align-items-center ${data.state === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
              style={{
                margin: '.4vmin 0',
              }}
              data-static-id='Card2noActualForecastedDate.js_span_a5e818'
            >
              {data.value1 != null ? formatNumbers(data.value1) : '--'}
            </span>
          </div>
          <div
            className='d-flex justify-content-start align-items-center  flex-column'
            data-static-id='Card2noActualForecastedDate.js_div_45cb36'
          >
            <p
              className='text-10-light mb-0'
              data-static-id='Card2noActualForecastedDate.js_p_9f3022'
            >
              {isRemaining ? 'REMAINING' : 'FORECASTED'}
            </p>
            <p
              className={`${get_state2_text_color()} text-14-bold`}
              style={{
                margin: '.4vmin 0',
              }}
              data-static-id='Card2noActualForecastedDate.js_p_8142ab'
            >
              {data.value2 != null ? formatNumbers(data.value2) : '--'}
            </p>
            <p
              className={
                'text_primary_gray_2 text-10-bold mb-0 align-items-center'
              }
              data-static-id='Card2noActualForecastedDate.js_p_a1c08d'
            >
              {data.value3 != null
                ? `(${moment(parseInt(data.value3)).format('DD-MMM-YY')})`
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
