import { convertFormulaToHtml, formatNumbers } from 'utills/utilities'
import classes from './Cards.module.scss'
import CardTrends from './CardTrends'
export default function Card2noActualRem({
  data,
  category,
  actualTime,
  caseId,
  odsData,
  text1 = 'ACTUAL',
  text2 = 'REMAINING',
  isOptimumEnabled = true,
  showOdsButton = true,
  library_name,
  isDa = false,
}) {
  const getClassNames = (isOptimumEnabled, dataState2) => {
    let classNames = 'text-14-bold mt-1'
    if (isOptimumEnabled) {
      classNames += ' text_primary_gray_2'
    } else if (dataState2 === 1) {
      classNames += ' text_primary_orange'
    } else {
      classNames += ' text_primary_blue'
    }
    return classNames
  }
  const isMatchingCategory =
    data?.category
      ?.toLowerCase()
      ?.includes(category?.toLowerCase()?.replace('_ods', '')) &&
    `position-relative ${classes.box}`
  return (
    <div
      className={`d-flex justify-content-center h-100 bg_primary_bg position-relative px-1 hoverAction ${library_name} ${isMatchingCategory}`}
      data-static-id='Card2noActualRem.js_div_706c5f'
    >
      {isDa ? (
        <div
          className='da-span position-absolute'
          data-static-id='Card2noActualRem.js_div_a17986'
        >
          DA
        </div>
      ) : (
        ''
      )}
      <div
        className='h-100 flexCenterContainer flex-column'
        data-static-id='Card2noActualRem.js_div_e2a1ca'
      >
        <div
          className='flexCenterContainer flex-column'
          data-static-id='Card2noActualRem.js_div_1e8734'
        >
          <div
            className='text-12-bold text-center text-break mb-1'
            data-static-id='Card2noActualRem.js_div_6b4551'
          >
            {convertFormulaToHtml(data?.displayName?.toUpperCase())}
          </div>
          <div
            className='text-12-light'
            style={{
              lineHeight: '1vmin',
            }}
            data-static-id='Card2noActualRem.js_div_d4081e'
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
          className='d-flex justify-content-between pt-2'
          data-static-id='Card2noActualRem.js_div_441d83'
        >
          <div
            className='flexCenterContainer flex-column pr-10'
            data-static-id='Card2noActualRem.js_div_b4c6d7'
          >
            <span
              className='text-10-light'
              data-static-id='Card2noActualRem.js_span_74817d'
            >
              {text1}
            </span>
            <span
              className={`text-14-bold mt-1 justify-content-center align-items-center ${data.state === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
              data-static-id='Card2noActualRem.js_span_168615'
            >
              {data.value1 != null ? formatNumbers(data.value1) : '--'}
            </span>
          </div>
          <div
            className='d-flex justify-content-start align-items-center flex-column'
            data-static-id='Card2noActualRem.js_div_169fdf'
          >
            <span
              className='text-10-light'
              data-static-id='Card2noActualRem.js_span_5b65dc'
            >
              {text2}
            </span>
            <span
              className={`${getClassNames(isOptimumEnabled, data.state2)} text-14-bold mt-1`}
              data-static-id='Card2noActualRem.js_span_059ad3'
            >
              {data.value2 != null ? formatNumbers(data.value2) : '--'}
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
        isLegendVisible={true}
      />
    </div>
  )
}
