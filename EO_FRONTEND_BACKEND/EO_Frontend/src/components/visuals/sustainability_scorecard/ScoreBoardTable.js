import DOMPurify from 'dompurify'
import moment from 'moment'
import { formatNumbers, uuid4 } from 'utills/utilities'
import classes from './ScoreBoardTable.module.scss'
const tableStyle = {
  border: '1px solid black',
  borderCollapse: 'collapse',
  width: '100px',
  height: '100px',
}
const tdStyle = {
  border: '1px solid black',
}
function getValue(val, decimalNum) {
  if (val == null || val == undefined) {
    return '--'
  } else if (val === -1234321) {
    return 'NA'
  } else if (val == '*') {
    return '*'
  } else {
    return formatNumbers(parseFloat(val).toFixed(decimalNum))
  }
}
export default function ScoreBoardTable({
  columns,
  data,
  decimalNum = 1,
  isPlan,
}) {
  const timeRow =
    data?.length > 0
      ? data[0]
      : {
          timeStampEpoch: null,
        }
  return (
    <>
      {data?.length ? (
        <div
          className={`w-100 h-100 ${classes.scoreboard_container} `}
          data-static-id='ScoreBoardTable.js_div_5e6d54'
        >
          <div
            className={`d-flex gap-2 ${classes.scoreboard_container__header} `}
            data-static-id='ScoreBoardTable.js_div_b344f1'
          >
            {columns.map((name, i) => (
              <div
                key={uuid4()}
                className={'d-flex flex-column justify-content-center h-100'}
                data-static-id='ScoreBoardTable.js_div_2cd0b0'
              >
                <h5
                  className={'text-13-bold mb-0'}
                  data-static-id='ScoreBoardTable.js_h5_a1bd97'
                >
                  {name}
                </h5>
                {i == 0 && timeRow?.timeStampEpoch && (
                  <span
                    className='text-10-light p-0 m-0'
                    data-static-id='ScoreBoardTable.js_span_69b647'
                  >
                    ({' '}
                    {moment(timeRow?.timeStampEpoch).format(
                      'DD-MMM-YY hh:mm A',
                    )}{' '}
                    )
                  </span>
                )}
              </div>
            ))}
          </div>
          <div
            className={`${classes.scoreboard_container__body}`}
            data-static-id='ScoreBoardTable.js_div_22bd88'
          >
            {data.map((rowData, index) => (
              <div
                key={rowData.title}
                className={`d-flex align-items-center gap-2 ${classes.card_body_section}`}
                // style={{
                // 	height: !isPlan ? `calc((100% / ${data.length})` : "25%",
                // }}
                data-static-id='ScoreBoardTable.js_div_c99727'
              >
                <div
                  className={`${classes.body_left_content}`}
                  data-static-id='ScoreBoardTable.js_div_79bf62'
                >
                  <p
                    className={`text-12-regular ${classes.titleText}`}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(rowData.title),
                    }}
                    data-static-id='ScoreBoardTable.js_p_fdf83c'
                  ></p>
                  <p
                    className='text-12-regular text_primary_gray_2 mb-0'
                    data-static-id='ScoreBoardTable.js_p_e3b0fa'
                  >
                    {rowData.uom ? `(${rowData.uom})` : ''}
                  </p>
                </div>
                <p
                  className={`text-12-regular d-block mb-0 ${classes.body_left_content}`}
                  data-static-id='ScoreBoardTable.js_p_37bd9a'
                >
                  {getValue(rowData.actual, rowData.valueDecimal)}
                </p>
                {Object.keys(rowData).includes('optimum') ? (
                  <p
                    className={`text-12-regular d-block mb-0 ${classes.body_left_content}`}
                    data-static-id='ScoreBoardTable.js_p_59ae17'
                  >
                    {getValue(rowData.optimum, rowData.valueDecimal)}
                  </p>
                ) : (
                  ''
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        ''
      )}
    </>
  )
}
