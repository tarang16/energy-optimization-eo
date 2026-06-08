import { convertFormulaToHtml } from 'utills/utilities'
import styles from './TreeDiagram.module.scss'
export default function TreeDiagramGapCard({ data, levelData, nlevels }) {
  return (
    <div
      className={`mt-2 ${data.alignment?.toLowerCase() == 'left' ? styles.left_gapcard : ''} ${data.alignment?.toLowerCase() == 'right' ? styles.right_gapcard : ''} ${data.alignment?.toLowerCase() == 'middle' ? styles.middle_gapcard : ''}`}
      style={{
        width: `calc((100% / ${levelData[nlevels][1].length}))`,
        minWidth: '17vmin',
      }}
      data-static-id='TreeDiagramGapCard.js_div_717664'
    >
      <div
        className={
          'h-100 d-flex flex-column justify-content-between align-items-center'
        }
        data-static-id='TreeDiagramGapCard.js_div_fb8d8d'
      >
        <div
          className='flexCenterContainer flex-column'
          data-static-id='TreeDiagramGapCard.js_div_da2768'
        >
          <p
            className='text-12-bold text-center mb-1'
            style={{
              lineHeight: '1.5vmin',
            }}
            data-static-id='TreeDiagramGapCard.js_p_baba85'
          >
            {convertFormulaToHtml(data?.displayName?.toUpperCase())}
          </p>
          <p
            className='text-12-light text-center mb-0'
            style={{
              lineHeight: '1vmin',
            }}
            data-static-id='TreeDiagramGapCard.js_p_1f6920'
          >
            {convertFormulaToHtml(
              data.displayUom ? `(${data?.displayUom?.toUpperCase()})` : '',
            )}
          </p>
        </div>
        <div
          className={
            'd-flex flex-column justify-content-center align-items-center mt-1'
          }
          data-static-id='TreeDiagramGapCard.js_div_21671f'
        >
          <div data-static-id='TreeDiagramGapCard.js_div_5936bd'>
            {data.actual != null ? (
              <span
                className={`text-14-bold justify-content-center align-items-center ${data.state === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
                data-static-id='TreeDiagramGapCard.js_span_b85978'
              >
                {data.actual}
              </span>
            ) : (
              <span
                style={{
                  display: 'none',
                }}
                data-static-id='TreeDiagramGapCard.js_span_fe1497'
              ></span>
            )}
            {data.optimum != null ? (
              <span
                className='text-12-light mx-2 text-12-regular'
                data-static-id='TreeDiagramGapCard.js_span_41caea'
              >
                |
              </span>
            ) : (
              <span
                style={{
                  display: 'none',
                }}
                data-static-id='TreeDiagramGapCard.js_span_a50f02'
              ></span>
            )}
            {data.optimum != null ? (
              <span
                className='text_primary_gray_2 text-14-bold'
                data-static-id='TreeDiagramGapCard.js_span_54898a'
              >
                {data.optimum}
              </span>
            ) : (
              <span
                style={{
                  display: 'none',
                }}
                data-static-id='TreeDiagramGapCard.js_span_94ce20'
              ></span>
            )}
          </div>
          {data.gapActual != null ? (
            <span
              className={`text-14-bold mt-2 justify-content-center align-items-center ${data.gapState === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
              data-static-id='TreeDiagramGapCard.js_span_ba8d6d'
            >
              {data.gapActual}
            </span>
          ) : (
            <span
              style={{
                display: 'none',
              }}
              data-static-id='TreeDiagramGapCard.js_span_a09753'
            ></span>
          )}
        </div>
      </div>
    </div>
  )
}
