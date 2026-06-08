import { AppAtom } from 'atoms/AppAtom'
import Loader from 'components/ui/loader/Loader'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import DOMPurify from 'dompurify'
import { useAtomValue } from 'jotai'
import { useNavigate, useParams } from 'react-router-dom'
import { digitDecimal } from 'utills/utilities'
import styles from './LandingPagesTopKpi.module.scss'
export default function LandingPagesTopKpi({
  data,
  className = '',
  handleSelect = () => {},
  category = '',
  activeBoxes = [],
  source = 'affiliate',
}) {
  const navigate = useNavigate()
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const renderContent = (obj) => {
    if (obj.key === 'plant_status') {
      return (
        <span
          className='text-12-regular primary_gray white_text_hover'
          data-static-id='LandingPagesTopKpi.js_span_0202f2'
        >
          {obj.value === 1 ? 'ONLINE' : 'OFFLINE'}
        </span>
      )
    } else {
      return (
        <>
          <span
            className={`text-12-regular primary_gray ${styles.white_text_hover}`}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(obj.line1),
            }}
            data-static-id='LandingPagesTopKpi.js_span_0b9e0a'
          ></span>
          <span
            className={`text-12-regular primary_gray ${styles.white_text_hover}`}
            style={{
              marginTop: '1px',
            }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(obj.line2),
            }}
            data-static-id='LandingPagesTopKpi.js_span_b0f1cd'
          ></span>
        </>
      )
    }
  }
  const renderBox = (obj, index) => (
    <div
      id={obj.id}
      data-testid='kpi-box'
      key={index}
      className={`box_hover d-flex flex-column justify-content-center ${styles.box} ${category === obj.category && styles.active} ${obj.category ? 'cursor-pointer' : ''} ${activeBoxes.includes(index) ? styles.hoverable : ''}`}
      style={{
        width: `calc((100% / ${data.length})`,
        maxWidth: `calc((100% / ${data.length})`,
      }}
      onClick={() => {
        if (obj.category) {
          handleSelect(obj.category)
        }
        if (obj.url && obj.url !== '#') {
          TRACKEVENTOBJ.landingPagesTopKpi.enrolledAffiliateClick({
            params,
            caseData,
          })
          navigate(obj.url)
        }
      }}
      data-static-id='LandingPagesTopKpi.js_div_9185df'
    >
      <div
        className={`d-flex align-items-center justify-content-center h-100 ${styles.box_top_content}`}
        data-static-id='LandingPagesTopKpi.js_div_40920b'
      >
        <div
          className={`${styles.imgDiv} me-2 h-100 d-flex align-items-center justify-content-center`}
          data-static-id='LandingPagesTopKpi.js_div_a4592b'
        >
          {obj.image && (
            <img
              alt=''
              src={obj.image}
              className={`${styles.topImg} d-block img-fluid`}
              data-static-id='LandingPagesTopKpi.js_img_71f8c4'
            />
          )}
        </div>
        <div
          className={`${styles.contentDiv}  h-100`}
          data-static-id='LandingPagesTopKpi.js_div_0e390e'
        >
          <div
            className='h-50 d-flex align-items-end'
            data-static-id='LandingPagesTopKpi.js_div_9df08f'
          >
            <span
              className={`text-20-regular primary_gray me-1 ${styles.white_text_hover}`}
              data-static-id='LandingPagesTopKpi.js_span_780db7'
            >
              {digitDecimal(obj.value)}
            </span>
            <span
              className={`text-11-regular primary_gray ${styles.unittext} ${styles.white_text_hover}`}
              data-static-id='LandingPagesTopKpi.js_span_36f44a'
            >
              {obj.unit}
            </span>
          </div>
          <div
            className={`${styles.textDiv} h-50 d-flex align-items-start flex-column mt-1`}
            data-static-id='LandingPagesTopKpi.js_div_8a3d3a'
          >
            {renderContent(obj)}
          </div>
        </div>
      </div>
    </div>
  )
  const isLoading = !(data && Array.isArray(data))
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div
          id={
            source == 'affiliate'
              ? 'landing-affiliate-top-tiles'
              : 'landing-sabic-top-tiles'
          }
          className={`d-flex w-100 h-100 m-0 justify-content-between ${styles.container} ${className}`}
          data-static-id='LandingPagesTopKpi.js_div_6a1b81'
        >
          {data.map((obj, index) => renderBox(obj, index))}
        </div>
      )}
    </>
  )
}
