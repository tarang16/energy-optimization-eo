import downDirecrionIcon from 'assets/sabic_icons/tree_diagram/downDirecrionIcon.svg'
import { convertFormulaToHtml } from 'utills/utilities'
import styles from './TreeDiagram.module.scss'
export default function TreeDiagramCard({
  data,
  nlevelline,
  levelData,
  nlevels,
}) {
  const nextlevel = levelData[nlevels + 1]
  let additionalClassName
  if (!nlevelline) {
    if (nextlevel && levelData[nlevels][1].length !== nextlevel[1]?.length) {
      additionalClassName = styles.bothSideBorder
    }
  }
  const getAlignment = (data) => {
    if (data.alignment?.toLowerCase() == 'left') {
      return styles.left_card
    } else if (data.alignment?.toLowerCase() == 'right') {
      return styles.right_card
    } else if (data.alignment?.toLowerCase() == 'middle') {
      return styles.middle_card
    }
  }
  return (
    <div
      className={`${getAlignment(data)}`}
      style={{
        width: `calc((100% / ${levelData[nlevels][1].length}))`,
      }}
      data-static-id='TreeDiagramCard.js_div_e99bc7'
    >
      <div
        className={
          'h-100 d-flex flex-column justify-content-between align-items-center'
        }
        data-static-id='TreeDiagramCard.js_div_c5406e'
      >
        <img
          alt=''
          className={`mt-3 mb-4 justify-content-center align-items-center img-fluid ${styles.downDirecrionIcon}`}
          src={downDirecrionIcon}
          data-static-id='TreeDiagramCard.js_img_c2b707'
        />
        <div
          className='flexCenterContainer flex-column'
          data-static-id='TreeDiagramCard.js_div_1360ed'
        >
          <p
            className='text-12-bold text-center mb-1'
            style={{
              lineHeight: '1.5vmin',
            }}
            data-static-id='TreeDiagramCard.js_p_37e88a'
          >
            {convertFormulaToHtml(data?.displayName?.toUpperCase())}
          </p>
          <p
            className='text-12-light text-center mb-0'
            style={{
              lineHeight: '1vmin',
            }}
            data-static-id='TreeDiagramCard.js_p_a3f703'
          >
            {convertFormulaToHtml(
              data.displayUom ? `(${data?.displayUom?.toUpperCase()})` : '',
            )}
          </p>
        </div>
        <div
          className={`flexCenterContainer mt-1 ${additionalClassName}`}
          data-static-id='TreeDiagramCard.js_div_861ebc'
        >
          <div data-static-id='TreeDiagramCard.js_div_e1cee7'>
            {data.actual != null ? (
              <span
                className={`text-14-bold justify-content-center align-items-center ${data.state === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
                data-static-id='TreeDiagramCard.js_span_85cd7e'
              >
                {data.actual}
              </span>
            ) : (
              <span
                style={{
                  display: 'none',
                }}
                data-static-id='TreeDiagramCard.js_span_5899cf'
              ></span>
            )}
            {data.optimum != null ? (
              <span
                className='text-12-light mx-2 text-12-regular'
                data-static-id='TreeDiagramCard.js_span_592d4b'
              >
                |
              </span>
            ) : (
              <span
                style={{
                  display: 'none',
                }}
                data-static-id='TreeDiagramCard.js_span_4c1a3b'
              ></span>
            )}
            {data.optimum != null ? (
              <span
                className='text_primary_gray_2 text-14-bold'
                data-static-id='TreeDiagramCard.js_span_f31cb7'
              >
                {data.optimum}
              </span>
            ) : (
              <span
                style={{
                  display: 'none',
                }}
                data-static-id='TreeDiagramCard.js_span_546928'
              ></span>
            )}
          </div>
          {data.gapActual != null ? (
            <span
              className={`text-14-bold mt-2 justify-content-center align-items-center ${data.gapState === 1 ? 'text_primary_orange' : 'text_primary_blue'}`}
              data-static-id='TreeDiagramCard.js_span_18e03c'
            >
              {data.gapActual}
            </span>
          ) : (
            <span
              style={{
                display: 'none',
              }}
              data-static-id='TreeDiagramCard.js_span_6c5796'
            ></span>
          )}
        </div>
      </div>
    </div>
  )
}
