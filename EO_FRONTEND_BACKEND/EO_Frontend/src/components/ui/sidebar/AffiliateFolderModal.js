import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { env } from 'config/env'
import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { get_ecm_files, getFilesFromEcmByCaseId } from 'services/EcmServices'
import backImg from '../../../assets/sabic_new_icons/arrow_down_blue.svg'
import Loader from '../loader/Loader'
import AffiliateFolderBreadcrumb from './AffiliateFolderBreadcrumb'
import styles from './AffliateFolder.module.scss'
import EcmClickableBox from './EcmClickableBox'
import EcmFile from './EcmFile'
const AffiliateFolderModal = ({
  affiliateFolderData,
  setAffiliateFolderData,
  affiliateDataState,
  caseData,
}) => {
  const location = useLocation()
  const params = useParams() || {}
  const [files, setFiles] = useState([])
  const [isLoading, setLoading] = useState(false)
  const [dynamicFolderHierarchy, setDynamicFolderHierarchy] = useState([])
  const [downloadingFileIds, setDownloadingFileIds] = useState([])
  const constructDataForFolder = () => {
    return []
  }
  const getFilesByCaseId = async (systemDetails) => {
    const { caseID } = systemDetails
    setLoading(true)
    const response = await getFilesFromEcmByCaseId(caseID)
    setFiles(response)
    setLoading(false)
  }
  const removeAfterId = (data, id) => {
    const index = data.findIndex((item) => item.id === id)
    if (index === -1) return data
    return data.slice(0, index + 1)
  }
  const handleDynamicFolderClick = async (nodeId, label, isFive = false) => {
    if (nodeId) {
      setLoading(true)
      const response = await get_ecm_files(nodeId)
      if (!isFive) {
        setDynamicFolderHierarchy(removeAfterId(dynamicFolderHierarchy, nodeId))
      }
      setFiles(response)
      setLoading(false)
      if (label) {
        TRACKEVENTOBJ?.ecmFolderModal?.breadcrumbClick({
          params,
          pathname: location.pathname,
          folderName: label,
          caseData,
        })
      }
    }
  }
  const handleFolderClick = async (selectedData, parentData) => {
    let folderName = ''
    if (affiliateFolderData?.level === 1) {
      if (selectedData?.type == 'tm') {
        folderName = 'Training Material'
        setAffiliateFolderData({
          ...affiliateFolderData,
          level: 5,
          type: 'tm',
          selectedRegion: selectedData?.id,
          selectedAffiliate: selectedData?.id,
        })
        await handleDynamicFolderClick(env.EO_TM_NODE_ID, 'Training Material')
      } else {
        folderName = selectedData?.affiliateName ?? ''
        setAffiliateFolderData({
          ...affiliateFolderData,
          level: 2,
          type: 'files',
          selectedRegion: parentData,
          selectedAffiliate: selectedData,
        })
        getFilesByCaseId(selectedData)
      }
    }
    TRACKEVENTOBJ?.ecmFolderModal?.folderClick({
      params,
      pathname: location.pathname,
      folderName,
      caseData,
    })
  }
  const handleBackClick = async () => {
    setFiles([])
    if (dynamicFolderHierarchy?.length) {
      const newList = dynamicFolderHierarchy.slice(0, -1)
      if (newList?.length) {
        const lastNode = newList[newList?.length - 1]
        handleDynamicFolderClick(lastNode?.id)
      } else {
        if (affiliateFolderData?.level == 5) {
          setAffiliateFolderData({
            ...affiliateFolderData,
            level: 5,
            type: 'tm',
            selectedRegion: env.EO_TM_NODE_ID,
            selectedAffiliate: env.EO_TM_NODE_ID,
          })
          await handleDynamicFolderClick(env.EO_TM_NODE_ID, 'Training Material')
        } else {
          setAffiliateFolderData({
            ...affiliateFolderData,
            level: 2,
            type: 'files',
          })
          getFilesByCaseId(affiliateFolderData?.selectedAffiliate)
        }
      }
      setDynamicFolderHierarchy(newList)
      return
    }
    if (affiliateFolderData?.level === 2 || affiliateFolderData?.level === 5) {
      setAffiliateFolderData({
        ...affiliateFolderData,
        level: 1,
        type: 'affiliate',
        selectedRegion: '',
        selectedAffiliate: '',
      })
      return
    }
    if (affiliateFolderData?.level === 3) {
      setAffiliateFolderData({
        ...affiliateFolderData,
        level: 2,
        type: 'files',
        selectedPlant: '',
      })
      return
    }
    if (affiliateFolderData?.level === 3) {
      setAffiliateFolderData({
        ...affiliateFolderData,
        level: 1,
        type: 'region',
        selectedRegion: '',
        selectedAffiliate: '',
      })
    }
  }
  const data = constructDataForFolder()
  if (affiliateFolderData?.level === 1) {
    return (
      <>
        <div
          className={`${styles.affiliateFloderLevelContainer} h-100`}
          data-static-id='AffiliateFolderModal.js_div_6bdf99'
        >
          <div
            className={`${styles.affliateFolderContainer}`}
            key={'training-material'}
            data-static-id='AffiliateFolderModal.js_div_a77312'
          >
            <p
              className={`text-14-bold ${styles.regionName} text-uppercase`}
              data-static-id='AffiliateFolderModal.js_p_0a2c65'
            >
              Training Material
            </p>
            <div
              className={`${styles.clickableBoxContainer}`}
              data-static-id='AffiliateFolderModal.js_div_53e858'
            >
              {
                <EcmClickableBox
                  key={'Training Material Box'}
                  handleFolderClick={handleFolderClick}
                  data={{
                    data: {
                      type: 'tm',
                      id: env.EO_TM_NODE_ID,
                    },
                    label: 'Training Material',
                    key: 'tm',
                  }}
                  parentData={{
                    regionName: 'Training Material',
                    regionShortName: 'TM',
                    affiliates: [],
                  }}
                />
              }
            </div>
          </div>
          {affiliateDataState.map((x) => {
            return (
              <div
                className={`${styles.affliateFolderContainer}`}
                key={x.regionName}
                data-static-id='AffiliateFolderModal.js_div_df9c89'
              >
                <p
                  className={`text-14-bold ${styles.regionName}`}
                  data-static-id='AffiliateFolderModal.js_p_0ec877'
                >
                  {x.regionName}
                </p>
                <div
                  className={`${styles.clickableBoxContainer}`}
                  data-static-id='AffiliateFolderModal.js_div_cc8be0'
                >
                  {x.affiliates.map((a) => {
                    return (
                      <EcmClickableBox
                        key={data.key}
                        handleFolderClick={handleFolderClick}
                        data={{
                          data: a,
                          label: a.affiliateName,
                          key: a.affiliateName,
                        }}
                        parentData={x}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }
  function renderFiles(filesArr) {
    if (isLoading) {
      return (
        <div
          className={`${styles.loaderContainer}`}
          data-static-id='AffiliateFolderModal.js_div_51ff46'
        >
          <Loader />
        </div>
      )
    }
    if (filesArr?.length > 0) {
      return (
        <div
          className={`${styles.fileListTable} h-100 w-100 overflow-y-auto`}
          data-static-id='AffiliateFolderModal.js_div_5a769d'
        >
          <table data-static-id='AffiliateFolderModal.js_table_7c1d09'>
            <thead data-static-id='AffiliateFolderModal.js_thead_7fc67d'>
              <tr data-static-id='AffiliateFolderModal.js_tr_7fcc8e'>
                <th
                  style={{
                    width: 'calc(100% - 50vmin)',
                  }}
                  data-static-id='AffiliateFolderModal.js_th_6fb9dd'
                >
                  File Name
                </th>
                <th
                  style={{
                    width: '20vmin',
                  }}
                  data-static-id='AffiliateFolderModal.js_th_8e0446'
                >
                  File Size
                </th>
                <th
                  style={{
                    width: '30vmin',
                  }}
                  data-static-id='AffiliateFolderModal.js_th_74e205'
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody data-static-id='AffiliateFolderModal.js_tbody_f44247'>
              {filesArr.map((x) => {
                return (
                  <EcmFile
                    {...x}
                    downloadingFileIds={downloadingFileIds}
                    setDownloadingFileIds={setDownloadingFileIds}
                    setFiles={setFiles}
                    setDynamicFolderHierarchy={setDynamicFolderHierarchy}
                    dynamicFolderHierarchy={dynamicFolderHierarchy}
                    setLoading={setLoading}
                    selectedSystem={affiliateFolderData?.selectedSystem}
                    caseData={caseData}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }
    return (
      <div
        className={`h-100 w-100 d-flex align-items-center justify-content-center ${styles.noFileFoundText}`}
        data-static-id='AffiliateFolderModal.js_div_b94ef1'
      >
        <p
          className='text-14-bold text-uppercase'
          data-static-id='AffiliateFolderModal.js_p_dbae51'
        >
          No files found for the case.
        </p>
      </div>
    )
  }
  return (
    <div
      className={`${styles.affiliateFloderWrapperContainer} h-100`}
      data-static-id='AffiliateFolderModal.js_div_857c19'
    >
      <div
        className={`${styles.breadcrumMainContainer}`}
        data-testid='breadcrumb'
        data-static-id='AffiliateFolderModal.js_div_5e031d'
      >
        {affiliateFolderData?.level >= 2 && (
          <div
            className={`${styles.backBtnContainer}`}
            data-static-id='AffiliateFolderModal.js_div_3ef55b'
          >
            <button
              onClick={handleBackClick}
              data-static-id='AffiliateFolderModal.js_button_7c4f19'
            >
              <img
                alt=''
                src={backImg}
                className='mt_03'
                data-static-id='AffiliateFolderModal.js_img_34561c'
              />
            </button>
          </div>
        )}
        <AffiliateFolderBreadcrumb
          affiliateFolderData={affiliateFolderData}
          setAffiliateFolderData={setAffiliateFolderData}
          dynamicFolderHierarchy={dynamicFolderHierarchy}
          setFiles={setFiles}
          setDynamicFolderHierarchy={setDynamicFolderHierarchy}
          getFilesByCaseId={getFilesByCaseId}
          handleDynamicFolderClick={handleDynamicFolderClick}
          caseData={caseData}
        />
      </div>
      {affiliateFolderData?.level > 1 ? (
        <div
          className={`${styles.clickbleBoxScrollContainer} overflow-hidden`}
          data-static-id='AffiliateFolderModal.js_div_9304a8'
        >
          <div
            className={`${styles.clickableBoxContainer} h-100 w-100`}
            data-static-id='AffiliateFolderModal.js_div_34d819'
          >
            {' '}
            {renderFiles(files)}
          </div>
        </div>
      ) : (
        <div
          className={`${styles.clickbleBoxScrollContainer}`}
          data-static-id='AffiliateFolderModal.js_div_1c3d7c'
        >
          <div
            className={`${styles.clickableBoxContainer} w-100`}
            data-static-id='AffiliateFolderModal.js_div_4bf95d'
          >
            {data.map((x) => {
              return (
                <EcmClickableBox
                  key={x.key}
                  handleFolderClick={handleFolderClick}
                  data={{
                    data: x.data,
                    label: x.label,
                    key: x.key,
                  }}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
export default AffiliateFolderModal
