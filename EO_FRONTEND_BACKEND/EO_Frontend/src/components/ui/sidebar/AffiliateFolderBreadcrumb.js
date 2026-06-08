import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { env } from 'config/env'
import { useLocation, useParams } from 'react-router-dom'
import breadcrumSeparator from '../../../assets/sabic_new_icons/arrow_right_angel_bracket_blue.svg'
import styles from './AffliateFolder.module.scss'
const AffiliateFolderBreadcrumb = ({
  affiliateFolderData,
  setAffiliateFolderData,
  dynamicFolderHierarchy,
  setFiles,
  setDynamicFolderHierarchy,
  getFilesByCaseId,
  handleDynamicFolderClick,
  caseData,
}) => {
  const location = useLocation()
  const params = useParams() || {}
  const handleItemClick = (level) => {
    let folderName = ''
    if (level === 4 && dynamicFolderHierarchy?.length) {
      folderName = affiliateFolderData?.selectedSystem?.systemName
      getFilesByCaseId(affiliateFolderData?.selectedSystem)
    } else if (level === 5) {
      folderName = 'Training Material'
      setAffiliateFolderData({
        ...affiliateFolderData,
        level: 5,
        type: 'tm',
        selectedRegion: env.EO_TM_NODE_ID,
        selectedAffiliate: env.EO_TM_NODE_ID,
      })
      handleDynamicFolderClick(env.EO_TM_NODE_ID, 'Training Material', true)
      setDynamicFolderHierarchy([])
    } else if (level === 3) {
      folderName = affiliateFolderData?.selectedPlant?.plantName
      setAffiliateFolderData({
        ...affiliateFolderData,
        level: 3,
        type: 'system',
        selectedSystem: '',
      })
    } else if (level === 2) {
      folderName = affiliateFolderData?.selectedAffiliate?.affiliateName ?? ''
      setAffiliateFolderData({
        ...affiliateFolderData,
        level: 2,
        type: 'plant',
        selectedPlant: '',
        selectedSystem: '',
      })
      getFilesByCaseId(affiliateFolderData?.selectedAffiliate)
    } else {
      folderName = 'Home'
      setAffiliateFolderData({
        ...affiliateFolderData,
        level: 1,
        type: 'affiliate',
        selectedRegion: '',
        selectedAffiliate: '',
        selectedPlant: '',
        selectedSystem: '',
      })
    }
    TRACKEVENTOBJ.ecmFolderModal.breadcrumbClick({
      params,
      pathname: location.pathname,
      folderName,
      caseData,
    })
    setFiles([])
    setDynamicFolderHierarchy([])
  }
  return (
    <div
      className={`${styles.breadcrumContainer}`}
      data-static-id='AffiliateFolderBreadcrumb.js_div_ad6399'
    >
      <span
        className='text-14-regular cursor-pointer text-uppercase text_primary_blue'
        onClick={() => handleItemClick(1)}
        data-static-id='AffiliateFolderBreadcrumb.js_span_54229c'
      >
        Home
      </span>
      <span data-static-id='AffiliateFolderBreadcrumb.js_span_d7c396'>
        {affiliateFolderData?.level == 5 ? (
          <>
            <span data-static-id='AffiliateFolderBreadcrumb.js_span_112375'>
              <img
                className={`${styles.separatorImg} mx-2`}
                src={breadcrumSeparator}
                alt='breadcrumSeparator'
                data-static-id='AffiliateFolderBreadcrumb.js_img_b0fbfd'
              />
            </span>
            <span
              className='text-14-regular cursor-pointer text-uppercase text_primary_blue'
              onClick={() => handleItemClick(5)}
              data-static-id='AffiliateFolderBreadcrumb.js_span_462966'
            >
              Training Material
            </span>
          </>
        ) : (
          ''
        )}
      </span>
      <span data-static-id='AffiliateFolderBreadcrumb.js_span_274178'>
        {affiliateFolderData?.level >= 2 && affiliateFolderData?.level != 5 ? (
          <>
            <span data-static-id='AffiliateFolderBreadcrumb.js_span_f5bfd7'>
              <img
                className={`${styles.separatorImg} mx-2`}
                src={breadcrumSeparator}
                alt='breadcrumSeparator'
                data-static-id='AffiliateFolderBreadcrumb.js_img_5510f1'
              />
            </span>
            <span
              className='text-14-regular cursor-pointer text-uppercase text_primary_blue'
              onClick={() => handleItemClick(2)}
              data-static-id='AffiliateFolderBreadcrumb.js_span_a4aa82'
            >
              {affiliateFolderData?.selectedAffiliate?.affiliateName}
            </span>
          </>
        ) : (
          ''
        )}
      </span>
      <span data-static-id='AffiliateFolderBreadcrumb.js_span_861c1e'>
        {affiliateFolderData?.level >= 3 && affiliateFolderData?.level != 5 ? (
          <>
            <span data-static-id='AffiliateFolderBreadcrumb.js_span_68c505'>
              <img
                className={`${styles.separatorImg} mx-2`}
                src={breadcrumSeparator}
                alt='breadcrumSeparator'
                data-static-id='AffiliateFolderBreadcrumb.js_img_8859c5'
              />
            </span>
            <span
              className='text-14-regular cursor-pointer text-uppercase text_primary_blue'
              onClick={() => handleItemClick(3)}
              data-static-id='AffiliateFolderBreadcrumb.js_span_02df27'
            >
              {affiliateFolderData?.selectedPlant?.plantName}
            </span>
          </>
        ) : (
          ''
        )}
      </span>
      <span data-static-id='AffiliateFolderBreadcrumb.js_span_f78dd8'>
        {affiliateFolderData?.level >= 4 && affiliateFolderData?.level != 5 ? (
          <>
            <span data-static-id='AffiliateFolderBreadcrumb.js_span_c989be'>
              <img
                className={`${styles.separatorImg} mx-2`}
                src={breadcrumSeparator}
                alt='breadcrumSeparator'
                data-static-id='AffiliateFolderBreadcrumb.js_img_aacfe3'
              />
            </span>
            <span
              className='text-14-regular cursor-pointer text-uppercase text_primary_blue'
              onClick={() => handleItemClick(4)}
              data-static-id='AffiliateFolderBreadcrumb.js_span_1a1b2a'
            >
              {affiliateFolderData?.selectedSystem?.systemName}
            </span>
          </>
        ) : (
          ''
        )}
      </span>
      {dynamicFolderHierarchy?.length ? (
        dynamicFolderHierarchy.map((x) => (
          <>
            <span data-static-id='AffiliateFolderBreadcrumb.js_span_71fb1a'>
              <img
                className={`${styles.separatorImg} mx-2`}
                src={breadcrumSeparator}
                alt='breadcrumSeparator'
                data-static-id='AffiliateFolderBreadcrumb.js_img_0cb951'
              />
            </span>
            <span
              key={x.id}
              data-testid={`dynamic-${x.id}`}
              className='text-14-regular text-uppercase text_primary_blue cursor-pointer'
              onClick={() => handleDynamicFolderClick(x.id, x.label)}
              data-static-id='AffiliateFolderBreadcrumb.js_span_e4ce8c'
            >
              {x.label.toUpperCase()}
            </span>
          </>
        ))
      ) : (
        <></>
      )}
    </div>
  )
}
export default AffiliateFolderBreadcrumb
