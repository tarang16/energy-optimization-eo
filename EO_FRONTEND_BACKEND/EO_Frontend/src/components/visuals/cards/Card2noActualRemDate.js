import { convertFormulaToHtml } from 'utills/utilities'
import classes from './Cards.module.scss'
import CardTrends from './CardTrends'
export default function Card2noActualRemDate({
  data,
  category,
  actualTime,
  showOdsButton = true,
  caseId,
  odsData,
}) {
  const isMatchingCategory =
    data?.category
      ?.toLowerCase()
      ?.includes(category?.toLowerCase()?.replace('_ods', '')) &&
    `position-relative ${classes.box}`
  return (
    <div
      className={`d-flex justify-content-center h-100 bg_primary_bg position-relative px-1 hoverAction ${isMatchingCategory}`}
      data-static-id='Card2noActualRemDate.js_div_e5f337'
    >
      <div
        className='h-100 flexCenterContainer flex-column'
        data-static-id='Card2noActualRemDate.js_div_39d011'
      >
        <div
          className='flexCenterContainer flex-column'
          data-static-id='Card2noActualRemDate.js_div_64e60d'
        >
          <div
            className='text-12-bold text-center text-break pb-1'
            style={{
              lineHeight: '1.5vmin',
            }}
            data-static-id='Card2noActualRemDate.js_div_5801da'
          >
            {convertFormulaToHtml(data?.displayName?.toUpperCase())}
          </div>
          <div
            className='text-12-light'
            style={{
              lineHeight: '1vmin',
            }}
            data-static-id='Card2noActualRemDate.js_div_1d4672'
          >
            {convertFormulaToHtml(
              data.displayUom ? `(${data?.displayUom?.toUpperCase()})` : '',
            )}
          </div>
        </div>
        <div
          style={{
            lineHeight: '1vmin',
          }}
          className='d-flex justify-content-between pt-2'
          data-static-id='Card2noActualRemDate.js_div_4fd5f2'
        >
          <div
            className='flexCenterContainer flex-column pr-10'
            data-static-id='Card2noActualRemDate.js_div_6ccd99'
          >
            <span
              className='text-10-light'
              data-static-id='Card2noActualRemDate.js_span_1b06f9'
            >
              ACTUAL
            </span>
            <span
              className={`text-14-bold mt-1 justify-content-center align-items-center ${data.state === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
              data-static-id='Card2noActualRemDate.js_span_a56d6a'
            >
              {data.value1 != null ? data.value1 : '--'}
            </span>
          </div>
          <div
            className='flexCenterContainer flex-column'
            data-static-id='Card2noActualRemDate.js_div_9d68b2'
          >
            <span
              className='text-10-light'
              data-static-id='Card2noActualRemDate.js_span_533e14'
            >
              REMAINING
            </span>
            <span
              className='text_primary_gray_2 text-14-bold mt-1 '
              data-static-id='Card2noActualRemDate.js_span_e158ff'
            >
              {data.value2 != null ? data.value2 : '--'}
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
