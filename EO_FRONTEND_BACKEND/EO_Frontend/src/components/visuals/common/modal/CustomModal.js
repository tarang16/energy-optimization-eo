import closecircleIcon from 'assets/sabic_icons/common/closecircleIcon.svg'
import camera_icon from 'assets/sabic_icons/sidebar/camera_icon.svg'
import { TimeZoneAtom } from 'atoms/TimeZoneAtom'
import { useAtom } from 'jotai'
import { forwardRef, memo } from 'react'
import { Modal } from 'react-bootstrap'
import { Rnd } from 'react-rnd'
import {
  capturePDF,
  convertFormulaToHtml,
  getFileNameFromUrl,
  getUserInfoAndTime,
} from 'utills/utilities'
import classes from './CustomModal.module.scss'
const CustomModal = forwardRef(
  (
    {
      subTitle = '',
      title,
      titleUpperCase = true,
      url,
      unit,
      hideModal = () => {},
      show,
      children,
      modalHeight = '60vmin',
      bodyHeight = 'calc(100% - 5vmin)',
      customSpacingClass = '',
      size = 'xl',
      customWidth = '',
      contentFitWidth = '',
      addClassCustomResponsiveWidth = true,
      hideCameraIcon = false,
      id = 'opening-modal',
      showLegend = false,
    },
    ref,
  ) => {
    const [timezone] = useAtom(TimeZoneAtom)
    return (
      <div
        className={`${classes.modalContainer}`}
        data-static-id='CustomModal.js_div_f2b7fb'
      >
        <Modal
          container={ref || null}
          show={show}
          backdrop='static'
          keyboard={false}
          size={size}
          centered
          className={`h-100 ${addClassCustomResponsiveWidth ? 'customResponsiveWidth' : ''} ${contentFitWidth}`}
          modalheight={modalHeight}
          style={{
            width: customWidth,
          }}
          dialogClassName='modal-dialog-custom'
        >
          <Rnd
            className='bg-white overflow-hidden'
            default={{
              x: 0,
              y: 0,
              width: 'auto',
              height: modalHeight,
            }}
            style={{
              width: '100%',
              cursor: 'inherit',
            }}
            dragHandleClassName='drag-handle'
            id={id}
          >
            <div
              className={
                'drag-handle d-flex justify-content-between modal_header'
              }
              style={{
                cursor: 'all-scroll',
              }}
              data-static-id='CustomModal.js_div_5279e9'
            >
              <div
                className='d-flex flex-column justify-content-between w-100'
                data-static-id='CustomModal.js_div_2852b7'
              >
                <div
                  className='d-flex align-items-center w-100'
                  data-static-id='CustomModal.js_div_35c735'
                >
                  <div
                    className={`gap_btn_header align-items-center mb-0 py-2 px-2 ${titleUpperCase ? 'text-uppercase' : ''} bg_primary_blue_bg text_primary_gray w-100 d-flex justify-content-between ${classes.mainHeader}`}
                    data-static-id='CustomModal.js_div_5cfe9d'
                  >
                    <span
                      className='text-14-bold mt-1'
                      data-static-id='CustomModal.js_span_24bbbe'
                    >
                      {convertFormulaToHtml(title) || ''}
                      {unit && (
                        <span
                          className='text-14-regular ms-1'
                          data-static-id='CustomModal.js_span_1efca1'
                        >
                          ({convertFormulaToHtml(unit) || ''})
                        </span>
                      )}
                    </span>
                    <div
                      className='d-flex gap-3'
                      data-static-id='CustomModal.js_div_fa3d83'
                    >
                      {showLegend && (
                        <div
                          className='d-flex align-items-center gap-2 bg_primary_white ps-2 pe-2'
                          data-static-id='CustomModal.js_div_7f9200'
                        >
                          <div
                            className='text-12-regular text-uppercase primary_gray d-inline-block mt_03'
                            data-static-id='CustomModal.js_div_d28456'
                          >
                            LEGENDS:
                          </div>
                          <div
                            className='h-100 d-flex  align-items-center justify-content-evenly text-start gap-3'
                            data-static-id='CustomModal.js_div_97355f'
                          >
                            <div
                              className='p-0 m-0 d-flex flex-col align-items-center justify-content-between'
                              data-static-id='CustomModal.js_div_4c6f8f'
                            >
                              <div
                                className='d-inline-block bg_primary_blue me-1 d-inline-block mb_03'
                                style={{
                                  height: '1.3vmin',
                                  width: '1.3vmin',
                                  borderRadius: '0.2vmin',
                                }}
                                data-static-id='CustomModal.js_div_4673af'
                              ></div>
                              <span
                                className='text-12-regular text-uppercase primary_gray d-inline-block mt_03'
                                data-static-id='CustomModal.js_span_f5df5f'
                              >
                                ACTUAL
                              </span>
                            </div>
                            <div
                              className='p-0 m-0 d-flex flex-col align-items-center justify-content-between'
                              data-static-id='CustomModal.js_div_ca4534'
                            >
                              <div
                                className='d-inline-block bg_primary_gray_2 me-1 d-inline-block mb_03'
                                style={{
                                  height: '1.3vmin',
                                  width: '1.3vmin',
                                  borderRadius: '0.2vmin',
                                }}
                                data-static-id='CustomModal.js_div_32ce79'
                              ></div>
                              <span
                                className='text-12-regular text-uppercase primary_gray d-inline-block mt_03'
                                data-static-id='CustomModal.js_span_5c6151'
                              >
                                OPTIMUM / PREDICTED
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {!hideCameraIcon && (
                        <div
                          className={classes.cancelBtnContainer}
                          data-static-id='CustomModal.js_div_843506'
                        >
                          <button
                            onClick={() => {
                              const credits = getUserInfoAndTime(timezone)
                              const filename = getFileNameFromUrl(title, 'pdf')
                              capturePDF(`#${id}`, filename, credits, title)
                            }}
                            className='cancel_btn d-flex text-20-regular border-0 p-0 m-0'
                            style={{
                              backgroundColor: 'transparent',
                            }}
                            data-testid='capture-icon-custom-modal'
                            data-static-id='CustomModal.js_button_ce31d1'
                          >
                            <img
                              className={classes.img}
                              src={camera_icon}
                              alt='Capture Modal'
                              data-static-id='CustomModal.js_img_a6768f'
                            />
                          </button>
                        </div>
                      )}

                      <div
                        className={classes.cancelBtnContainer}
                        data-static-id='CustomModal.js_div_dd8e6a'
                      >
                        <button
                          onClick={hideModal}
                          className='cancel_btn d-flex text-20-regular border-0 p-0 m-0'
                          style={{
                            backgroundColor: 'transparent',
                          }}
                          data-testid='close-icon-custom-modal'
                          data-static-id='CustomModal.js_button_e0b3c4'
                        >
                          <img
                            className={classes.img}
                            src={closecircleIcon}
                            alt='Close Modal'
                            data-static-id='CustomModal.js_img_cb0dcd'
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`modal_body ${classes.modalBody} ${customSpacingClass}`}
              style={{
                height: bodyHeight,
              }}
              data-static-id='CustomModal.js_div_01f6cb'
            >
              {subTitle && (
                <div
                  className={classes.subTitleHeader}
                  data-static-id='CustomModal.js_div_edb655'
                >
                  <p
                    className='text-12-regular text-uppercase mb-0'
                    data-static-id='CustomModal.js_p_cbac06'
                  >
                    {convertFormulaToHtml(subTitle) || ''}
                  </p>
                </div>
              )}
              {children}
            </div>
          </Rnd>
        </Modal>
      </div>
    )
  },
)
export default memo(CustomModal)
