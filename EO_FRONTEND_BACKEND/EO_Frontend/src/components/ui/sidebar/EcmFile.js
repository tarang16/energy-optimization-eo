import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import Logger from 'logger/Logger'
import { useLocation, useParams } from 'react-router-dom'
import { downloadFromEcm, get_ecm_files } from 'services/EcmServices'
import { getIconByExtension } from 'utills/utilities'
import downloadIcon from '../../../assets/sabic_icons/sidebar/download_icon.svg'
import viewIcon from '../../../assets/sabic_icons/sidebar/view_eye_icon.svg'
import styles from './AffliateFolder.module.scss'
const EcmFile = ({
  file_name,
  file_type,
  setDownloadingFileIds,
  downloadingFileIds,
  id,
  file_size,
  setFiles = () => {},
  setDynamicFolderHierarchy,
  dynamicFolderHierarchy,
  setLoading,
  selectedSystem,
  caseData,
}) => {
  const location = useLocation()
  const params = useParams() || {}
  const handleDownload = async () => {
    try {
      TRACKEVENTOBJ.ecmFolderModal.fileDownloadClick({
        params,
        pathname: location.pathname,
        fileName: file_name,
        fileId: id,
        system: selectedSystem?.systemName ?? '',
        caseData,
      })
      setDownloadingFileIds([...downloadingFileIds, id])
      const response = await downloadFromEcm(
        id,
        '',
        selectedSystem?.caseID || '',
      )
      const byteCharacters = atob(response?.data?.fileStream)
      if (byteCharacters && byteCharacters?.length > 0) {
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], {
          type: 'application/octet-stream',
        })
        const downloadLink = document.createElement('a')
        downloadLink.href = window.URL.createObjectURL(blob)
        downloadLink.download = response.data.fileName
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        setDownloadingFileIds(downloadingFileIds.filter((x) => x !== id))
      } else {
        Logger.error('Error downloading file: Invalid filedata received')
      }
    } catch (error) {
      setDownloadingFileIds(downloadingFileIds.filter((x) => x !== id))
      Logger.error('Error downloading file:', error)
    }
  }
  const handleInternalFolders = async () => {
    if (id) {
      setLoading(true)
      const response = await get_ecm_files(id)
      setDynamicFolderHierarchy([
        ...dynamicFolderHierarchy,
        {
          label: file_name,
          id,
        },
      ])
      setFiles(response)
      setLoading(false)
      TRACKEVENTOBJ.ecmFolderModal.internalFolderClick({
        params,
        pathname: location.pathname,
        folderName: file_name,
      })
    }
  }
  const isFolder = file_size?.toLowerCase()?.includes('item') && file_type == ''
  const isDownloading = downloadingFileIds.includes(id)
  return (
    <tr data-static-id='EcmFile.js_tr_9a4462'>
      <td data-static-id='EcmFile.js_td_293072'>
        <div
          className='d-flex align-items-center justify-content-start gap-3'
          data-static-id='EcmFile.js_div_3d4dc1'
        >
          <img
            alt=''
            className={`${styles.fileTypeImgIcon}`}
            src={getIconByExtension(isFolder ? 'folder' : file_type, file_size)}
            data-static-id='EcmFile.js_img_5bd655'
          />
          <p
            className='text-12-regular mb-0 text-wrap'
            data-static-id='EcmFile.js_p_db1345'
          >
            {file_name}
          </p>
        </div>
      </td>
      <td align='center' data-static-id='EcmFile.js_td_429fce'>
        <p
          className='text-12-regular mb-0'
          data-static-id='EcmFile.js_p_bb5f29'
        >
          {file_size}
        </p>
      </td>
      <td align='center' data-static-id='EcmFile.js_td_590a5e'>
        {isFolder ? (
          <button
            className={`text-12-regular text-uppercase ${styles.downloadBtn}`}
            onClick={() => {
              handleInternalFolders()
            }}
            data-static-id='EcmFile.js_button_d476e4'
          >
            <img
              alt=''
              src={viewIcon}
              className={'me-2'}
              data-static-id='EcmFile.js_img_fdf411'
            />
            <span
              className={`text_primary_white d-inline-block mt_03 ${styles.downloadText}`}
              data-static-id='EcmFile.js_span_bd0095'
            >
              view folder
            </span>
          </button>
        ) : (
          <button
            disabled={isDownloading}
            className={`text-12-regular text-uppercase ${styles.downloadBtn}`}
            onClick={() => {
              handleDownload()
            }}
            data-static-id='EcmFile.js_button_320c5d'
          >
            <img
              alt=''
              src={downloadIcon}
              className={'me-2'}
              data-static-id='EcmFile.js_img_811f3c'
            />
            <span
              className={`text_primary_white d-inline-block mt_03 ${styles.downloadText}`}
              data-static-id='EcmFile.js_span_de5eef'
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </span>
          </button>
        )}
      </td>
    </tr>
  )
}
export default EcmFile
