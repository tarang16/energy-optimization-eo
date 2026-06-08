import caseUnderProcessIcon from 'assets/sabic_icons/common/workprogress.svg'
import styles from './CaseUnderProgress.module.scss'
export default function CaseUnderProgress() {
  return (
    <div
      className='w-100 h-100 d-flex flex-column align-items-center justify-content-center'
      data-static-id='CaseUnderProgress.js_div_0ba973'
    >
      <img
        alt=''
        src={caseUnderProcessIcon}
        className={`mb-1 ${styles.caseProgressIcon}`}
        data-static-id='CaseUnderProgress.js_img_f58e64'
      />
      <p
        className='text-14-regular mb-0'
        data-static-id='CaseUnderProgress.js_p_f53f30'
      >
        Case under Progress
      </p>
    </div>
  )
}
