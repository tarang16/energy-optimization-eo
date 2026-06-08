import warningIcon from 'assets/sabic_icons/common/white_warning.svg'
import { AppAtom } from 'atoms/AppAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import { useParams } from 'react-router-dom'
import { convertFormulaToHtml, toTitleCase, uuid4 } from 'utills/utilities'
import IconOne from '../../../assets/sabic_icons/common/timeInfo.svg'
import IconTwo from '../../../assets/sabic_new_icons/predicted_action2.svg'
import IconTwoGray from '../../../assets/sabic_new_icons/predicted_action2_gray.svg'
import CustomModal from '../common/modal/CustomModal'
import classes from './Cards.module.scss'
export default function CardActions({
  showTrend = true,
  data,
  handleShowModal,
  handleDetailsModal = null,
  calledBy = 'Parameters Cards',
  trendId = 'trends-icon',
  infoId = 'details-icon',
}) {
  const [tooltipModal, setTooltipModal] = useState(false)
  const uid = uuid4()
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const innerTooltipModifiedOpportunity = (props) => (
    <Tooltip {...props} data-static-id='CardActions.js_Tooltip_41f5a5'>
      <p
        className='text-14-regular mb-0 text_primary_white text-uppercase px-2 py-1'
        data-static-id='CardActions.js_p_8b713a'
      >
        Modified Opportunity
      </p>
    </Tooltip>
  )
  return (
    <>
      <div
        className={'fadeInElement h-100 w-auto position-absolute'}
        data-static-id='CardActions.js_div_b5a537'
      >
        {data.category !== 'deviation' ? (
          <OverlayTrigger
            placement='top'
            overlay={
              <Tooltip
                id={`tooltip-details-${uid}`}
                className={`react-tooltips ${classes.tooltipStyle}`}
                style={{
                  zIndex: 9999,
                }}
                data-static-id='CardActions.js_Tooltip_0fd504'
              >
                <p
                  className='text-14-regular  text-white text-center'
                  data-static-id='CardActions.js_p_5893ba'
                >
                  DETAILS
                </p>
              </Tooltip>
            }
          >
            <img
              src={IconOne}
              alt=''
              id={`${infoId}`}
              data-testid='handle-detail-modal'
              onClick={(e) => {
                e.stopPropagation()
                TRACKEVENTOBJ.cardAction.detailsModalOnClick(data, {
                  params,
                  caseData,
                  calledBy,
                })
                handleDetailsModal
                  ? handleDetailsModal(true)
                  : setTooltipModal(true)
              }}
              className={`${classes.topImg} blueFilter removeTopIcon d-block img-fluid`}
              data-tooltip-id={`tooltip-details-${uid}`}
              data-static-id='CardActions.js_img_7c1bd5'
            />
          </OverlayTrigger>
        ) : (
          ''
        )}
        {data[`state${toTitleCase(data.category)}`] ? (
          <OverlayTrigger
            placement='top'
            overlay={innerTooltipModifiedOpportunity}
          >
            <img
              alt=''
              src={warningIcon}
              data-testid={'warning-icon'}
              className={'blinking filter-unset-img '}
              data-static-id='CardActions.js_img_924a63'
            />
          </OverlayTrigger>
        ) : (
          <></>
        )}

        {showTrend ? (
          <>
            {data?.trendLibrary !== null && data?.trendLibrary !== '' ? (
              <OverlayTrigger
                overlay={
                  <Tooltip
                    id={`tooltip-trends-${uid}`}
                    className={classes.tooltipStyle}
                    style={{
                      zIndex: 9999,
                    }}
                    data-static-id='CardActions.js_Tooltip_ab1185'
                  >
                    <div
                      className='text-center react-tooltips'
                      data-static-id='CardActions.js_div_015c47'
                    >
                      <p
                        className='text-14-regular  text-white text-center'
                        data-static-id='CardActions.js_p_5e9649'
                      >
                        TRENDS
                      </p>
                    </div>
                  </Tooltip>
                }
              >
                <img
                  alt=''
                  src={IconTwo}
                  id={`${trendId} trend-modal-click`}
                  className={`${classes.topImg} d-block img-fluid cursor-pointer`}
                  data-tooltip-id={`tooltip-trends-${uid}`}
                  data-testid={`tooltip-trends-${uid}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    TRACKEVENTOBJ.cardAction.trendModalOnClick(data, {
                      params,
                      caseData,
                      calledBy,
                    })
                    handleShowModal(true)
                  }}
                  data-static-id='CardActions.js_img_456cc8'
                />
              </OverlayTrigger>
            ) : (
              <img
                alt=''
                id='trend-modal-click'
                src={IconTwoGray}
                className={`remove_action_btn ${classes.topImg} d-block img-fluid`}
                style={{
                  cursor: 'default',
                }}
                data-static-id='CardActions.js_img_60cb7f'
              />
            )}
          </>
        ) : (
          ''
        )}
      </div>

      <CustomModal
        hideModal={() => setTooltipModal(false)}
        title={data.displayName}
        subTitle={data?.kpiDescription}
        show={tooltipModal}
        size={'lg'}
        bodyHeight='auto'
        modalHeight='auto'
        y={-50}
        x={-90}
        customSpacingClass={classes.customSpacingClass}
        id='kpis-details'
      >
        <div data-static-id='CardActions.js_div_34c2f9'>
          <table className='mt-.5' data-static-id='CardActions.js_table_2747a6'>
            <tbody data-static-id='CardActions.js_tbody_7b96a6'>
              {data?.piName && (
                <tr data-static-id='CardActions.js_tr_51fa99'>
                  <td
                    className='py-1'
                    style={{
                      verticalAlign: 'baseline',
                    }}
                    data-static-id='CardActions.js_td_aedb83'
                  >
                    <div
                      className={`text-12-bold d-flex justify-content-between text-uppercase ${classes.equalWidthLabel}`}
                      data-static-id='CardActions.js_div_d2e017'
                    >
                      <span data-static-id='CardActions.js_span_f79e95'>
                        PI NAME
                      </span>
                      <span data-static-id='CardActions.js_span_094afd'>:</span>
                    </div>
                  </td>
                  <td data-static-id='CardActions.js_td_ee68eb'>
                    <div
                      className='text-12-regular px-2 overflow-wrap'
                      style={{
                        lineHeight: '1.9vmin',
                      }}
                      data-static-id='CardActions.js_div_f5b37b'
                    >
                      {convertFormulaToHtml(data?.piName)}
                    </div>
                  </td>
                </tr>
              )}
              {data?.displayUom && (
                <tr data-static-id='CardActions.js_tr_2225df'>
                  <td
                    className='py-1'
                    style={{
                      verticalAlign: 'baseline',
                    }}
                    data-static-id='CardActions.js_td_746943'
                  >
                    <div
                      className={`text-12-bold d-flex justify-content-between text-uppercase ${classes.equalWidthLabel}`}
                      data-static-id='CardActions.js_div_d2bf55'
                    >
                      <span data-static-id='CardActions.js_span_184b07'>
                        UOM
                      </span>
                      <span data-static-id='CardActions.js_span_f1fab5'>:</span>
                    </div>
                  </td>
                  <td data-static-id='CardActions.js_td_d0ff5f'>
                    <div
                      className='text-12-regular px-2'
                      data-static-id='CardActions.js_div_341045'
                    >
                      {' '}
                      {convertFormulaToHtml(data?.displayUom) || 'N/A'}
                    </div>
                  </td>
                </tr>
              )}
              {data?.displayFormula && (
                <tr data-static-id='CardActions.js_tr_9517ae'>
                  <td
                    className='py-1'
                    style={{
                      verticalAlign: 'baseline',
                    }}
                    data-static-id='CardActions.js_td_410f08'
                  >
                    <div
                      className={`text-12-bold d-flex justify-content-between text-uppercase ${classes.equalWidthLabel}`}
                      data-static-id='CardActions.js_div_c09c3d'
                    >
                      <span data-static-id='CardActions.js_span_5fb672'>
                        Formula
                      </span>
                      <span data-static-id='CardActions.js_span_3317bb'>:</span>
                    </div>
                  </td>
                  <td data-static-id='CardActions.js_td_762aed'>
                    <div
                      className='text-12-regular px-2 overflow-wrap'
                      style={{
                        lineHeight: '1.9vmin',
                      }}
                      data-static-id='CardActions.js_div_86435a'
                    >
                      {convertFormulaToHtml(data?.displayFormula)}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CustomModal>
    </>
  )
}
