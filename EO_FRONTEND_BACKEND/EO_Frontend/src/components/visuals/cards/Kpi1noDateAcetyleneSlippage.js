import moment from 'moment'
import { convertFormulaToHtml, formatNumbers } from 'utills/utilities'
import classes from './Cards.module.scss'
import CardTrends from './CardTrends'
export default function Kpi1noDateAcetyleneSlippage({
  data,
  category,
  actualTime,
  caseId,
  odsData,
  showOdsButton = true,
  library_name,
}) {
  const getActualStateTextColor = (state) => {
    if (state === 1) {
      return 'text_primary_orange'
    } else {
      return 'text_primary_blue'
    }
  }
  const isMatchingCategory =
    data?.category
      ?.toLowerCase()
      ?.includes(category?.toLowerCase()?.replace('_ods', '')) &&
    `position-relative ${classes.box}`
  return (
    <div
      className={`d-flex justify-content-center h-100 bg_primary_bg position-relative px-1 hoverAction ${library_name}${isMatchingCategory}`}
      data-static-id='Kpi1noDateAcetyleneSlippage.js_div_6e93a8'
    >
      <div
        className='h-100 flexCenterContainer flex-column'
        style={{
          gap: '.8vmin',
        }}
        data-static-id='Kpi1noDateAcetyleneSlippage.js_div_2bdfaf'
      >
        <div
          className='d-flex justify-content-end align-items-center flex-column h-50'
          data-static-id='Kpi1noDateAcetyleneSlippage.js_div_afdf21'
        >
          <div
            className='text-12-bold text-center'
            style={{
              lineHeight: '1.4vmin',
            }}
            data-static-id='Kpi1noDateAcetyleneSlippage.js_div_55267f'
          >
            {convertFormulaToHtml('ACETYLENE SLIPPAGE PREDICTION')}
          </div>
        </div>
        <div
          style={{
            lineHeight: '1vmin',
            gap: '.8vmin',
          }}
          className='d-flex justify-content-between  h-50'
          data-static-id='Kpi1noDateAcetyleneSlippage.js_div_713c5b'
        >
          <div
            className='d-flex  flex-column align-items-center'
            data-static-id='Kpi1noDateAcetyleneSlippage.js_div_4fe71d'
          >
            <p
              className='text-10-light mb-0 text-center'
              data-static-id='Kpi1noDateAcetyleneSlippage.js_p_832d82'
            >
              PROBABILITY
            </p>
            <p
              className='text-10-light mb-0 text-center'
              data-static-id='Kpi1noDateAcetyleneSlippage.js_p_515d79'
            >
              (%)
            </p>
            <p
              className={`text-12-bold justify-content-center align-items-center ${getActualStateTextColor(data.state)}`}
              style={{
                margin: '.4vmin 0',
              }}
              data-static-id='Kpi1noDateAcetyleneSlippage.js_p_50e8a8'
            >
              {data.value1 != null ? formatNumbers(data.value1) : '--'}
            </p>
          </div>
          <div
            className='d-flex justify-content-start align-items-center  flex-column'
            data-static-id='Kpi1noDateAcetyleneSlippage.js_div_24cc18'
          >
            <p
              className='text-10-light mb-0 text-center'
              data-static-id='Kpi1noDateAcetyleneSlippage.js_p_83c06d'
            >
              TIMESTAMP
            </p>
            <p
              className={
                'text_primary_gray_2 text-10-bold text-center mb-0 d-flex flex-column justify-content-center align-items-center'
              }
              style={{
                margin: '.4vmin 0',
              }}
              data-static-id='Kpi1noDateAcetyleneSlippage.js_p_950d0c'
            >
              {data.value3 != null ? (
                <>
                  <span
                    className='text_primary_gray_2'
                    style={{
                      margin: '.3vmin 0',
                    }}
                    data-static-id='Kpi1noDateAcetyleneSlippage.js_span_776175'
                  >
                    {moment(parseInt(data.value3))
                      .format('DD-MMM-YY')
                      ?.toUpperCase()}
                  </span>
                  <span
                    className='text_primary_gray_2'
                    data-static-id='Kpi1noDateAcetyleneSlippage.js_span_0f395d'
                  >
                    {moment(parseInt(data.value3))
                      .format('hh:mm a')
                      ?.toUpperCase()}
                  </span>
                </>
              ) : (
                ''
              )}
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
        tagName={data?.tagName2}
        baseIntervalDuration={5}
      />
    </div>
  )
}
