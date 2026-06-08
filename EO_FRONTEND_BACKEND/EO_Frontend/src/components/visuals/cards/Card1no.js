import { convertFormulaToHtml, formatNumbers } from 'utills/utilities'
import classes from './Cards.module.scss'
import CardTrends from './CardTrends'
export default function Card1no({
  data,
  category,
  actualTime,
  caseId,
  odsData,
  showOdsButton = true,
  library_name,
  isDa = false,
}) {
  let value1
  if (data?.value1 && typeof data.value1 !== 'string') {
    value1 = convertFormulaToHtml(
      data.value1 ? formatNumbers(data.value1) : '--',
    )
  } else {
    value1 = data?.value1
  }
  const isMatchingCategory =
    data?.category
      ?.toLowerCase()
      ?.includes(category?.toLowerCase()?.replace('_ods', '')) &&
    `${classes.box}`
  return (
    <div
      className={`d-flex justify-content-center h-100 bg_primary_bg position-relative px-1 hoverAction ${library_name} ${isMatchingCategory}`}
      data-static-id='Card1no.js_div_61dcab'
    >
      {isDa ? (
        <div
          className='da-span position-absolute'
          data-static-id='Card1no.js_div_45b0fc'
        >
          DA
        </div>
      ) : (
        ''
      )}
      <div
        className='h-100 flexCenterContainer flex-column '
        data-static-id='Card1no.js_div_a5e6d1'
      >
        <div
          className='flexCenterContainer flex-column'
          data-static-id='Card1no.js_div_dc14f3'
        >
          <div
            className='text-12-bold text-center text-break mb-1'
            data-static-id='Card1no.js_div_f9c2ec'
          >
            {convertFormulaToHtml(data?.displayName?.toUpperCase())}
          </div>
          <div className='text-12-light' data-static-id='Card1no.js_div_47cabe'>
            {convertFormulaToHtml(
              data.displayUom ? `(${data?.displayUom?.toUpperCase()})` : '(-)',
            )}
          </div>
        </div>
        <div
          className='d-flex text-center'
          data-static-id='Card1no.js_div_c6f4ef'
        >
          <span
            className={`text-14-bold mt-1 justify-content-center align-items-start ${data.state === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
            data-static-id='Card1no.js_span_c32c37'
          >
            {' '}
            {value1 ? value1 : '--'}
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
