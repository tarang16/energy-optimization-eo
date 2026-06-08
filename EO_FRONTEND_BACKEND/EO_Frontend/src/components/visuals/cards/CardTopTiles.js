import blueWarningIcon from 'assets/sabic_icons/common/blue_warning.svg'
import whiteWarningIcon from 'assets/sabic_icons/common/white_warning.svg'
import { AppAtom } from 'atoms/AppAtom'
import variables from 'config/scss/variables'
import DOMPurify from 'dompurify'
import { useAtomValue } from 'jotai'
import AlertStatisticsModal from 'pages/dashboard/pages/overview/alert_status/AlertStatisticsModal'
import { useEffect, useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import {
  convertFormulaToHtml,
  digitDecimal,
  digitDecimalEfficiency,
  toTitleCase,
} from 'utills/utilities'
import LineChartMultiple from '../charts/line_chart/linechart_multiple/LineChartMultiple'
import CustomModal from '../common/modal/CustomModal'
import OptimizedSeuTable from '../table/OptimizedSeuTable/OptimizedSeuTable'
import TreeDiagram from '../tree_diagram/TreeDiagram'
import CardActions from './CardActions'
import styles from './CardTopTiles.module.scss'
const ModifiedOpportunityTooltip = (props) => (
  <Tooltip {...props} data-static-id='CardTopTiles.js_Tooltip_ba81e5'>
    <p
      className='text-14-regular mb-0 text_primary_white text-uppercase px-2 py-1'
      data-static-id='CardTopTiles.js_p_a536eb'
    >
      Modified Opportunity
    </p>
  </Tooltip>
)
export default function CardTopTiles({ data, category, caseId, actualTime }) {
  const ctxData = useAtomValue(AppAtom)
  const [showModal, setShowModal] = useState(false)
  const [showSeuTableModal, setShowSeuTableModal] = useState(false)
  const [showAlertStatisticsModal, setShowAlertStatisticsModal] =
    useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [treeDiagramModal, setTreeDiagramModal] = useState()
  const [tileHover, setTileHover] = useState(false)
  useEffect(() => {
    setTreeDiagramModal()
  }, [ctxData?.actualTime])

  /* istanbul ignore next */
  const createTagsList = (data) => {
    const createTag = (tagName, displayName, color) => ({
      tagName,
      isOnlyOneTrend: true,
      isOptimumEnabled: false,
      isAutoYAxis: true,
      show: true,
      serisColor: color,
      serisColorOpt: color,
      displayName: displayName || tagName,
    })
    return [
      createTag(data.tag_1, data.display_name_1, variables.primary_blue),
      createTag(data.tag_2, data.display_name_2, variables.primary_gray_2),
    ]
  }
  const getOnlineStatus = (data) => {
    return data == 1 ? 'ONLINE' : 'OFFLINE'
  }
  const isDeviation = data?.category === 'deviation'
  const isSeec = data?.category === 'seec'
  const handleClick = () => {
    if (isSeec) {
      setShowSeuTableModal(true)
    } else if (isDeviation) {
      setShowAlertStatisticsModal(true)
    }
  }
  const handleMouseEnter = () => setTileHover(true)
  const handleMouseLeave = () => setTileHover(false)
  const containerClassName = `
  box_hover h-100 position-relative hoverAction px-1 cursor-pointer 
  ${styles.box}  
   ${isDeviation ? styles.lastTopTilesCard : ''} 
  ${isSeec ? styles.seecCardActionContainer : ''}
`
  const showState = data[`state${toTitleCase(data?.category)}`]
  const isCurrentCategory = category === data?.category
  const warningIconSrc = isCurrentCategory ? whiteWarningIcon : blueWarningIcon
  return (
    <>
      <div
        className={containerClassName}
        id='handle-select-data'
        data-testid='handle-select-data'
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-static-id='CardTopTiles.js_div_0b1502'
      >
        <div
          className={`${styles.positionImg} d-flex align-items-center me-1 `}
          data-static-id='CardTopTiles.js_div_180d3b'
        >
          {data.image && (
            <img
              alt=''
              src={data.image}
              className={`${styles.topImg} d-block img-fluid`}
              data-static-id='CardTopTiles.js_img_62c590'
            />
          )}
        </div>

        <div
          className={`${styles.middleFlexContainer}`}
          data-static-id='CardTopTiles.js_div_21a6dd'
        >
          <div
            className={`${styles.leftContent} h-100 text-end`}
            data-static-id='CardTopTiles.js_div_0e1424'
          >
            <div
              className={`${styles.topLeftContent} ${styles.h_45}`}
              data-static-id='CardTopTiles.js_div_1cfcea'
            >
              <span
                className={`text-18-regular ${styles.white_text_hover}`}
                data-static-id='CardTopTiles.js_span_4d754c'
              >
                {Number.isNaN(data.kpi1_value)
                  ? '-'
                  : digitDecimalEfficiency(data.kpi1_value)}
                &nbsp;
              </span>
              <span
                className={`text-11-regular mb_03 ${styles.white_text_hover}`}
                data-static-id='CardTopTiles.js_span_963ed5'
              >
                {data.kpi1_unit}
              </span>
            </div>
            <div
              className={`${styles.bottomLeftContent} ${styles.h_55}`}
              data-static-id='CardTopTiles.js_div_06f035'
            >
              {data.key == 'plant_status' ? (
                <span
                  className='text-12-regular  white_text_hover'
                  data-static-id='CardTopTiles.js_span_7479ee'
                >
                  {getOnlineStatus(data.kpi1_value)}
                </span>
              ) : (
                <>
                  <span
                    className={`text-12-regular  ${styles.white_text_hover}`}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(data.kpi1_line1),
                    }}
                    style={{
                      lineHeight: '1.5vmin !important',
                    }}
                    data-static-id='CardTopTiles.js_span_96b63f'
                  ></span>
                  <span
                    className={`text-12-regular mt-1 text_primary_gray ${styles.white_text_hover}`}
                    data-static-id='CardTopTiles.js_span_76dccb'
                  >
                    {data.kpi1_line2 ? data.kpi1_line2 : ''}
                  </span>
                </>
              )}
            </div>
          </div>

          <div
            className={`${styles.rightContent} d-flex flex-column align-items-start col-7`}
            data-static-id='CardTopTiles.js_div_868286'
          >
            <div
              className={`${styles.topRightContent} h-50 `}
              data-static-id='CardTopTiles.js_div_94a876'
            >
              {data.key == 'plant_status' ? (
                <span
                  className='text-12-regular text_primary_gray white_text_hover'
                  data-static-id='CardTopTiles.js_span_5eda0c'
                >
                  {getOnlineStatus(data.kpi2_value)}
                </span>
              ) : (
                <>
                  <span
                    className={`text-12-regular text_primary_gray ${styles.white_text_hover}`}
                    style={{
                      lineHeight: '1.5vmin',
                    }}
                    data-static-id='CardTopTiles.js_span_e6683c'
                  >
                    {' '}
                    {convertFormulaToHtml(data.kpi2_line1)}
                  </span>
                  <span
                    className={`text-12-regular mt-1 text_primary_gray ${styles.white_text_hover}`}
                    data-static-id='CardTopTiles.js_span_66d6a4'
                  >
                    {data.kpi2_line2 ? data.kpi2_line2 : ''}
                  </span>
                </>
              )}
            </div>

            <div
              className={'h-50 '}
              data-static-id='CardTopTiles.js_div_ebdfd8'
            >
              <div
                className={`${styles.bottomRightContent}`}
                data-static-id='CardTopTiles.js_div_1e2de4'
              >
                <span
                  className={`text-18-regular text_primary_gray ${styles.white_text_hover}`}
                  data-static-id='CardTopTiles.js_span_432d45'
                >
                  {Number.isNaN(data.kpi2_value)
                    ? '-'
                    : digitDecimal(data.kpi2_value)}
                  &nbsp;
                </span>
                <span
                  className={`text-11-regular text_primary_gray ${styles.white_text_hover}`}
                  data-static-id='CardTopTiles.js_span_4ec314'
                >
                  {data.kpi2_unit}
                </span>
              </div>
              {data[`constrain${toTitleCase(data?.category)}`] ? (
                <div data-static-id='CardTopTiles.js_div_f872b3'>
                  <p
                    className={`text-11-regular text_primary_gray ${styles.white_text_hover}`}
                    data-static-id='CardTopTiles.js_p_eca9d1'
                  >
                    (Constrained)
                  </p>
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>

        {tileHover ? (
          <CardActions
            data={data}
            handleShowModal={setShowModal}
            handleDetailsModal={setShowDetailsModal}
            category={data.category}
            calledBy={'CardTopTiles'}
            trendId='oppo-index-trend-icon'
            infoId='oppo-index-details-icon'
            topTileAction
          />
        ) : (
          <div
            className={`position-absolue ${styles.positionWarningIcon}`}
            data-static-id='CardTopTiles.js_div_d01a70'
          >
            {showState && (
              <OverlayTrigger
                placement='top'
                overlay={<ModifiedOpportunityTooltip />}
              >
                <img
                  alt=''
                  src={warningIconSrc}
                  className='blinking'
                  data-static-id='CardTopTiles.js_img_88ddcc'
                />
              </OverlayTrigger>
            )}
          </div>
        )}
      </div>

      <CustomModal
        hideModal={() => setShowAlertStatisticsModal(false)}
        title={`Alert Statistics`}
        unit={''}
        show={showAlertStatisticsModal}
        modalHeight='80vmin'
        bodyHeight='calc(100% - 4vmin)'
        id='alert-statistics-table-modal'
        contentFitWidth={`${styles.showAlertStatisticsCustomModal}`}
      >
        <AlertStatisticsModal />
      </CustomModal>

      {showModal && (
        <CustomModal
          hideModal={() => setShowModal(false)}
          title={'TRENDS'}
          unit={''}
          show={showModal}
          id='oppo-index-trend'
        >
          <LineChartMultiple
            data={{
              caseId: caseId,
              tagsList: createTagsList(data),
              endTime: actualTime,
              isLegendVisible: true,
            }}
            actualTime={actualTime}
            exportTitle={'TREND'}
            exportedFileTitle={`${data.category} Trend`}
          />
        </CustomModal>
      )}

      <CustomModal
        hideModal={() => setShowDetailsModal(false)}
        title={`${data?.kpi2_line1 ?? ''}`}
        unit={''}
        show={showDetailsModal}
        bodyHeight='auto'
        modalHeight='auto'
        contentFitWidth={styles.contentFitWidth}
        id='oppo-index-details'
      >
        <TreeDiagram
          category={data.category}
          treeDiagramModal={treeDiagramModal}
          setTreeDiagramModal={setTreeDiagramModal}
        />
      </CustomModal>
      {/* SEU TABLE */}

      {showSeuTableModal && (
        <CustomModal
          modalHeight='80vh'
          show={showSeuTableModal}
          hideModal={() => setShowSeuTableModal(false)}
          titleUpperCase={false}
          title='SEUs, SEEC'
        >
          <OptimizedSeuTable actualTime={ctxData?.actualTime} caseId={caseId} />
        </CustomModal>
      )}
    </>
  )
}
