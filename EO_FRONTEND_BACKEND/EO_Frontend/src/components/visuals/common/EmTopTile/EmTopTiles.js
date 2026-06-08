import { AppAtom } from 'atoms/AppAtom'
import Loader from 'components/ui/loader/Loader'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import DOMPurify from 'dompurify'
import { useAtomValue } from 'jotai'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import { NavLink, useParams } from 'react-router-dom'
import { formatWithUnit } from 'utills/utilities'
import infoIcon from '../../../../assets/sabic_icons/common/timeInfo.svg'
import styles from './EmTopTiles.module.scss'
import TopTileTooltip from './TopTileTooltip'
export default function EmTopTiles({ data, className = '' }) {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const innerTooltip = (obj, props) => (
    <Tooltip
      {...props}
      className={`${styles.ToolTipContainer}`}
      data-static-id='EmTopTiles.js_Tooltip_ca687f'
    >
      <TopTileTooltip data={obj} apiData={obj?.tooltipdatakey} />
    </Tooltip>
  )
  const renderContent = (obj) => {
    if (obj.key === 'plant_status') {
      return (
        <span
          className='text-12-regular primary_gray white_text_hover'
          data-static-id='EmTopTiles.js_span_bd2c15'
        >
          {obj.value === 1 ? 'ONLINE' : 'OFFLINE'}
        </span>
      )
    } else {
      return (
        <>
          <span
            className={`text-14-regular primary_gray ${styles.white_text_hover}`}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(obj.title),
            }}
            data-static-id='EmTopTiles.js_span_a4562e'
          ></span>
        </>
      )
    }
  }
  const getValueColorClass = (obj) => {
    if (!obj?.targetVal) {
      return styles.color_primary_gray
    } else if (obj?.value > obj?.targetVal) {
      return styles.color_primary_orange
    } else {
      return styles.color_primary_blue
    }
  }
  const renderBox = (obj, index) => {
    let valueColorClass = getValueColorClass(obj)
    return (
      <NavLink
        to={obj?.urlKey || '#'}
        id={obj.id}
        data-testid='em-kpi-box'
        key={index}
        className={`h-100 w-100 box_hover d-flex flex-column justify-content-center ${styles.box} ${params?.key === obj.urlKey && styles.active} ${obj.urlKey ? 'cursor-pointer' : ''} ${styles.hoverable} `}
        style={{
          width: `calc(100% / ${data.length})`,
          maxWidth: `calc(100% / ${data.length})`,
        }}
        onClick={() => {
          TRACKEVENTOBJ.EmTopTiles.onTileClick(
            {
              params,
              caseData: appContext.caseData,
            },
            obj,
          )
        }}
        data-static-id='EmTopTiles.js_NavLink_3cdda9'
      >
        <div
          className={`flexCenterContainer h-100 ${styles.box_top_content}`}
          data-static-id='EmTopTiles.js_div_0a946b'
        >
          <div
            className={`${styles.imgDiv} me-2 h-100 flexCenterContainer`}
            data-static-id='EmTopTiles.js_div_650962'
          >
            {obj.icon && (
              <img
                alt=''
                src={obj.icon}
                className={`${styles.topImg} d-block img-fluid`}
                data-static-id='EmTopTiles.js_img_3da48a'
              />
            )}
          </div>
          <div
            className={`${styles.contentDiv} h-100`}
            data-static-id='EmTopTiles.js_div_621419'
          >
            <div
              className='h-50 d-flex align-items-end'
              data-static-id='EmTopTiles.js_div_fcaa6d'
            >
              <span
                className={`text-18-regular me-1 ${styles.white_text_hover} ${valueColorClass}`}
                data-static-id='EmTopTiles.js_span_8d4627'
              >
                {obj?.value ? formatWithUnit(obj.value) : '-'}
              </span>

              <span
                className={`text-12-regular primary_gray ${styles.unittext} ${styles.white_text_hover}`}
                data-static-id='EmTopTiles.js_span_30b295'
              >
                {obj?.targetVal ? `(${formatWithUnit(obj.targetVal)})` : ''}
              </span>
            </div>
            <div
              className={`${styles.textDiv} h-50 d-flex flex-column align-items-start flex-column mt_03`}
              data-static-id='EmTopTiles.js_div_163678'
            >
              <span
                className={`text-11-regular primary_gray  me-1`}
                data-static-id='EmTopTiles.js_span_c0f1aa'
              >
                {renderContent(obj)} &nbsp;
                <span
                  className={`text-12-regular primary_gray_3 ${styles.unittext} ${styles.white_text_hover}`}
                  data-static-id='EmTopTiles.js_span_e0bf80'
                >{`(${obj.uom})`}</span>
              </span>
            </div>
          </div>
          {obj?.showTooltip ? (
            <div
              className={`${styles.topTileImgDiv} h-100 flexCenterContainer`}
              data-static-id='EmTopTiles.js_div_d065ac'
            >
              <OverlayTrigger
                placement='bottom-end'
                // show={true}
                style={{
                  zIndex: 99999,
                }}
                overlay={innerTooltip(obj)}
              >
                <img
                  alt=''
                  src={infoIcon}
                  className={`${styles.topImg} blueFilter removeTopIcon d-block img-fluid`}
                  data-static-id='EmTopTiles.js_img_d3cfec'
                />
              </OverlayTrigger>
            </div>
          ) : (
            ''
          )}
        </div>

        {obj?.reconciled && (
          <div
            className={`d-flex ${styles.reconciled_text}`}
            data-static-id='EmTopTiles.js_div_3f686c'
          >
            <span
              className='text-11-regular primary_gray'
              data-static-id='EmTopTiles.js_span_6efbab'
            >
              {'RECONCILED :'}
            </span>
            <span
              style={{
                marginLeft: '2px',
              }}
              className={`text-11-regular primary_gray me-1`}
              data-static-id='EmTopTiles.js_span_abdece'
            >
              {obj?.reconciledVal
                ? formatWithUnit(parseFloat(obj?.reconciledVal).toFixed(2))
                : '-'}
            </span>
          </div>
        )}
      </NavLink>
    )
  }
  const isLoading = !(data && Array.isArray(data))
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div
          className={`d-flex w-100 h-100 m-0 justify-content-between ${styles.container} ${className}`}
          data-static-id='EmTopTiles.js_div_8ba82f'
        >
          {data.map((obj, index) => renderBox(obj, index))}
        </div>
      )}
    </>
  )
}
