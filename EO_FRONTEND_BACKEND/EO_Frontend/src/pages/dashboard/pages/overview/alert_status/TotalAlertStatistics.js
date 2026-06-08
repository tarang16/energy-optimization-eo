import { useState } from 'react'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import { donloadOdsAlertStats } from 'services/ODSServices'
import { downloadExcelFile, showToast, slugToText } from 'utills/utilities'
import { total_alert_statistics_template } from './AlertStatistics.functions'
import styles from './TotalAlertStatistics.module.scss'
import downloadIcon from '../../../../../assets/sabic_icons/sidebar/download_icon.svg'
export default function TotalAlertStatistics({
  APIResponse,
  caseIdList,
  caseData,
  params,
  startDate,
}) {
  const [isDisabled, setDisabled] = useState(false)
  const renderTooltip = (props) => (
    <Tooltip {...props} data-static-id='TotalAlertStatistics.js_Tooltip_45cd96'>
      <div
        className='text-14-regular text-uppercase text-white p-1'
        data-static-id='TotalAlertStatistics.js_div_75e10b'
      >
        Download
      </div>
    </Tooltip>
  )
  function getCount(key, response) {
    if (response && Object.keys(response).includes(key)) {
      return response[key]
    } else {
      return '--'
    }
  }
  const handleDownloadClick = async () => {
    setDisabled(true)
    try {
      const downloadData = await donloadOdsAlertStats(caseIdList, startDate)
      if (downloadData?.statuscode !== 200 || !downloadData?.data?.fileStream) {
        if (!downloadData?.data?.fileStream) {
          showToast(downloadData?.data?.message)
        } else {
          showToast(
            'Facing some issue while Downloading Data. Please try after some time..',
          )
        }
        setDisabled(false)
        return
      }
      const base64FileStream = downloadData?.data?.fileStream
      const fileName = `${slugToText(params?.plant).replaceAll('-', '_')}_alert_statistics.xlsx`
      downloadExcelFile(base64FileStream, fileName, undefined, setDisabled)
    } catch (error) {
      console.error('Error downloading data:', error)
    }
  }
  return (
    <div
      className={`${styles.totalStatisticsContainer} alertStatus p-0 d-flex flex-column w-100 h-100`}
      data-static-id='TotalAlertStatistics.js_div_cad669'
    >
      <div
        className={`${styles.totalStatisticsContainer__topBlock} w-100 h-100`}
        data-static-id='TotalAlertStatistics.js_div_dfb076'
      >
        {total_alert_statistics_template?.top?.map((topBlock) => (
          <div
            key={topBlock.key}
            className={`${styles.totalStatisticsContainer__topBlock__item} d-flex  align-items-center`}
            data-static-id='TotalAlertStatistics.js_div_75a365'
          >
            <img
              className={styles.imgIcon}
              src={topBlock.icon}
              alt={topBlock.title}
              data-static-id='TotalAlertStatistics.js_img_8b29d4'
            />
            <div
              className='mt_03'
              data-static-id='TotalAlertStatistics.js_div_eb9fd4'
            >
              <div
                className='text_primary_blue mt_03 text-28-bold'
                data-static-id='TotalAlertStatistics.js_div_512fa4'
              >
                {getCount(topBlock.key, APIResponse)}
              </div>
              <div
                className='text-14-bold letter_spacing09 text_primary_gray mt_03 text-uppercase'
                data-static-id='TotalAlertStatistics.js_div_2e9d30'
              >
                {topBlock.title}
              </div>
            </div>
          </div>
        ))}
        <div data-static-id='TotalAlertStatistics.js_div_f2f593'>
          <OverlayTrigger placement='top' overlay={renderTooltip}>
            <button
              className={`${styles.btnContainer} ${isDisabled ? styles.disabled : styles.enabled}`}
              data-testid='downloadIcon'
              disabled={isDisabled}
              onClick={() => {
                handleDownloadClick()
              }}
              data-static-id='TotalAlertStatistics.js_button_705091'
            >
              <img
                src={downloadIcon}
                data-static-id='TotalAlertStatistics.js_img_5285c6'
              />
            </button>
          </OverlayTrigger>
        </div>
      </div>
    </div>
  )
}
