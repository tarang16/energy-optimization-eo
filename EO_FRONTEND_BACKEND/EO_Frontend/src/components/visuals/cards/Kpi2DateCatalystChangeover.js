import moment from 'moment'
import { convertFormulaToHtml } from 'utills/utilities'
import classes from './Cards.module.scss'
import CardTrends from './CardTrends'
export default function Kpi2DateCatalystChangeover({
  data,
  category,
  actualTime,
  caseId,
  odsData,
  showOdsButton = true,
  library_name,
}) {
  const nameStr = data?.displayName?.split(';')
  const displayName = nameStr?.length ? nameStr[0] : ''
  const leftTitle = nameStr?.length ? nameStr[1] : ''
  const rightTitle = nameStr?.length ? nameStr[2] : ''
  const isMatchingCategory =
    data?.category
      ?.toLowerCase()
      ?.includes(category?.toLowerCase()?.replace('_ods', '')) &&
    `position-relative ${classes.box}`
  return (
    <div
      className={`d-flex justify-content-center h-100 bg_primary_bg position-relative px-1 hoverAction ${library_name}${isMatchingCategory}`}
      data-static-id='Kpi2DateCatalystChangeover.js_div_3e8c46'
    >
      <div
        className='h-100 flexCenterContainer flex-column'
        style={{
          gap: '.6vmin',
        }}
        data-static-id='Kpi2DateCatalystChangeover.js_div_48d972'
      >
        <div
          className='d-flex justify-content-end align-items-center flex-column h-50'
          data-static-id='Kpi2DateCatalystChangeover.js_div_7fcbcc'
        >
          <div
            className='text-12-bold text-center text-break'
            style={{
              lineHeight: '1.4vmin',
            }}
            data-static-id='Kpi2DateCatalystChangeover.js_div_30bfe4'
          >
            {convertFormulaToHtml(displayName)}
          </div>
        </div>
        <div
          style={{
            lineHeight: '1vmin',
            gap: '1.5vmin',
            margin: '1vmin 0',
          }}
          className='d-flex justify-content-between  h-50'
          data-static-id='Kpi2DateCatalystChangeover.js_div_567390'
        >
          <div
            className='d-flex  flex-column align-items-center'
            data-static-id='Kpi2DateCatalystChangeover.js_div_495c94'
          >
            <p
              className='text-10-light mb-0 text-center'
              data-static-id='Kpi2DateCatalystChangeover.js_p_7c47cf'
            >
              {convertFormulaToHtml(leftTitle)}
            </p>
            <p
              className={
                'text_primary_blue text-12-bold mb-0 align-items-center'
              }
              style={{
                margin: '.4vmin 0',
              }}
              data-static-id='Kpi2DateCatalystChangeover.js_p_437f4b'
            >
              {data.value1 != null
                ? `${moment(parseInt(data.value1)).format('DD-MMM-YY')}`
                : ''}
            </p>
          </div>
          <div
            className='d-flex justify-content-start align-items-center  flex-column'
            data-static-id='Kpi2DateCatalystChangeover.js_div_745b26'
          >
            <p
              className='text-10-light mb-0 text-center'
              data-static-id='Kpi2DateCatalystChangeover.js_p_5cca72'
            >
              {convertFormulaToHtml(rightTitle)}
            </p>
            <p
              className={
                'text_primary_blue text-12-bold mb-0 align-items-center'
              }
              style={{
                margin: '.4vmin 0',
              }}
              data-static-id='Kpi2DateCatalystChangeover.js_p_28fdbd'
            >
              {data.value2 != null
                ? `${moment(parseInt(data.value2)).format('DD-MMM-YY')}`
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
