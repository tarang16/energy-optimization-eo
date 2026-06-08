import CustomModal from 'components/visuals/common/modal/CustomModal'
import styles from './AutoDelegation.module.scss'
const Note = ({ delegateData }) => {
  return (
    <ul
      style={{
        padding: '0 2vmin',
      }}
      className='text_primary_gray_1'
      data-static-id='AutoDelegationSubmitModal.js_ul_8e2ad0'
    >
      {delegateData.map((x, i) => {
        const name = (
          x.assignedToEmployeeName ||
          x.assigneToName ||
          ''
        ).replace(',', ' ')
        let text
        if (!x.active) {
          text = <>new alerts auto delegation is turned off</>
        } else {
          text = (
            <>
              new alerts will be auto assigned to{' '}
              <span
                className={styles.highlightColor}
                data-static-id='AutoDelegationSubmitModal.js_span_d5faa7'
              >
                {name}
              </span>{' '}
              till{' '}
              <span
                className={styles.highlightColor}
                data-static-id='AutoDelegationSubmitModal.js_span_28331b'
              >
                {x.formattedDate}
              </span>{' '}
              , all the past assigned alerts will be transferred to{' '}
              <span
                className={styles.highlightColor}
                data-static-id='AutoDelegationSubmitModal.js_span_cb9799'
              >
                {name}
              </span>
            </>
          )
        }
        return (
          <li
            key={`${name}`}
            className='text-13-regular text-uppercase mt-2 text_primary_gray_2'
            data-static-id='AutoDelegationSubmitModal.js_li_9f9a0f'
          >
            {text}
          </li>
        )
      })}
    </ul>
  )
}
const AutoDelegationSubmitModal = ({
  showSubmitModal,
  isSubmitting,
  setShowSubmitModal,
  handleSubmit,
  delegateData,
}) => {
  return (
    <CustomModal
      hideModal={() => {
        if (!isSubmitting) {
          setShowSubmitModal(false)
        }
      }}
      title={'User Confirmation'}
      show={showSubmitModal}
      size={'md '}
      modalHeight={'auto'}
      contentFitWidth='customNestedBackgroundBlue'
    >
      <div
        className={`${styles.autoDelegationSubmitContainer}`}
        data-static-id='AutoDelegationSubmitModal.js_div_1b870c'
      >
        <div
          className='text_primary_gray_2'
          data-static-id='AutoDelegationSubmitModal.js_div_8a316f'
        >
          <p
            className='text-14-bold text-uppercase text_primary_black'
            data-static-id='AutoDelegationSubmitModal.js_p_1a89f3'
          >
            Please Note{' '}
            <span
              className=' text_primary_black'
              data-static-id='AutoDelegationSubmitModal.js_span_dfc065'
            >
              :
            </span>
          </p>
          <Note delegateData={delegateData} />
        </div>
        <div data-static-id='AutoDelegationSubmitModal.js_div_24028a'>
          <h2
            className='text-14-bold d-flex justify-content-center text-uppercase align-items-center'
            data-static-id='AutoDelegationSubmitModal.js_h2_06c6fc'
          >
            Are you sure you want to submit the request?
          </h2>
          <div
            className={`mb-0 d-flex justify-content-center align-items-center ${styles.btnContainer}`}
            data-static-id='AutoDelegationSubmitModal.js_div_15d6f3'
          >
            <button
              disabled={isSubmitting}
              onClick={() => setShowSubmitModal(false)}
              className={`pb-0 text-14-regular ${styles.cancelBtn}`}
              data-static-id='AutoDelegationSubmitModal.js_button_bbfaa5'
            >
              No
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleSubmit}
              className={`pb-0 text-14-regular ${styles.saveBtn}`}
              data-static-id='AutoDelegationSubmitModal.js_button_b73dea'
            >
              {isSubmitting ? 'Submitting...' : 'Yes'}
            </button>
          </div>
        </div>
      </div>
    </CustomModal>
  )
}
export default AutoDelegationSubmitModal
