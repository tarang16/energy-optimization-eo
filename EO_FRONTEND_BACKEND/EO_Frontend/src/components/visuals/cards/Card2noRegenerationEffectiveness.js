import moment from 'moment'
import { convertFormulaToHtml, formatNumbers } from 'utills/utilities'
import classes from './Cards.module.scss'
import CardTrends from './CardTrends'
export default function Card2noRegenerationEffectiveness({
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
      className={`d-flex justify-content-center h-100 bg_primary_bg position-relative px-1 hoverAction ${library_name} ${isMatchingCategory}`}
      data-static-id='Card2noRegenerationEffectiveness.js_div_63cb13'
    >
      <div
        className='h-100 flexCenterContainer flex-column'
        style={{
          gap: '.6vmin',
        }}
        data-static-id='Card2noRegenerationEffectiveness.js_div_baa29d'
      >
        <div
          className='d-flex justify-content-end align-items-center flex-column h-50'
          data-static-id='Card2noRegenerationEffectiveness.js_div_56de2d'
        >
          <div
            className='text-12-bold text-center text-break'
            style={{
              lineHeight: '1.4vmin',
            }}
            data-static-id='Card2noRegenerationEffectiveness.js_div_5ba27d'
          >
            {convertFormulaToHtml(displayName)}
          </div>
          <div
            className='text-12-light'
            style={{
              lineHeight: '1vmin',
              marginTop: '.2vmin',
            }}
            data-static-id='Card2noRegenerationEffectiveness.js_div_297543'
          >
            {convertFormulaToHtml('(%)')}
          </div>
        </div>
        <div
          style={{
            lineHeight: '1vmin',
            gap: '1.5vmin',
          }}
          className='d-flex justify-content-between  h-50'
          data-static-id='Card2noRegenerationEffectiveness.js_div_edbf50'
        >
          <div
            className='d-flex  flex-column align-items-center'
            data-static-id='Card2noRegenerationEffectiveness.js_div_35809f'
          >
            <p
              className='text-10-light mb-0 text-center'
              data-static-id='Card2noRegenerationEffectiveness.js_p_e5696d'
            >
              {convertFormulaToHtml(leftTitle)}
            </p>
            <p
              className={`text-12-bold justify-content-center align-items-center ${getActualStateTextColor(data.state)}`}
              style={{
                margin: '.4vmin 0',
              }}
              data-static-id='Card2noRegenerationEffectiveness.js_p_b720ec'
            >
              {data.value1 != null ? formatNumbers(data.value1) : '--'}
            </p>
            <p
              className={
                'text_primary_gray_2 text-10-bold mb-0 align-items-center'
              }
              data-static-id='Card2noRegenerationEffectiveness.js_p_83016c'
            >
              {data.value3 != null
                ? `(${moment(parseInt(data.value3)).format('DD-MMM-YY')})`
                : ''}
            </p>
          </div>
          <div
            className='d-flex justify-content-start align-items-center  flex-column'
            data-static-id='Card2noRegenerationEffectiveness.js_div_998cf0'
          >
            <p
              className='text-10-light mb-0 text-center'
              data-static-id='Card2noRegenerationEffectiveness.js_p_df1157'
            >
              {convertFormulaToHtml(rightTitle)}
            </p>
            <p
              className={`${getActualStateTextColor(data.state2)} text-12-bold`}
              style={{
                margin: '.4vmin 0',
              }}
              data-static-id='Card2noRegenerationEffectiveness.js_p_7f9a14'
            >
              {data.value2 != null ? formatNumbers(data.value2) : '--'}
            </p>
            <p
              className={
                'text_primary_gray_2 text-10-bold mb-0 align-items-center'
              }
              data-static-id='Card2noRegenerationEffectiveness.js_p_baeb6b'
            >
              {data.value4 != null
                ? `(${moment(parseInt(data.value4)).format('DD-MMM-YY')})`
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
