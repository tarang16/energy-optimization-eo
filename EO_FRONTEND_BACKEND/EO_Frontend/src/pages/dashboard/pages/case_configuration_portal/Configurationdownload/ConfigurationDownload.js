import downloadIcon from 'assets/sabic_icons/sidebar/download_icon.svg'
import moment from 'moment'
import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
import styles from './ConfigurationDownload.module.scss'
export default function ConfigurationDownload({
  extraStyle = {},
  headers = [],
  headersForXls = [],
  data,
  title = '',
}) {
  const handleDownloadData = () => {
    const csvContent = [
      headers
        .filter(
          (header) =>
            !(
              header.toLowerCase() === 'edit' ||
              header.toLowerCase() === 'action' ||
              header === ''
            ),
        )
        .join(','),
      ...data.map((obj) =>
        headersForXls
          .map((header) => {
            const value = obj[header] ?? ''
            const safeValue = value.toString().split('"').join('""')
            return `"${safeValue}"`
          })
          .join(','),
      ),
    ].join('\n')
    const blob = new Blob([csvContent], {
      type: 'text/csv',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${title} -  ${moment().format('DD/MM/YYYY_HH:mm')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const getTooltip = (props) => {
    return (
      <Tooltip
        {...props}
        data-static-id='ConfigurationDownload.js_Tooltip_2b1c19'
      >
        <div
          className='p-1 text-14-regular text_primary_white text-uppercase'
          data-static-id='ConfigurationDownload.js_div_e38427'
        >
          Download Data
        </div>
      </Tooltip>
    )
  }
  return (
    <OverlayTrigger placement='top' overlay={(props) => getTooltip(props)}>
      <div
        onClick={() => {
          handleDownloadData()
        }}
        data-testid='csv-download'
        data-tooltip-id='csv_download'
        className={`cursor-pointer ${styles.trendPopupIcon} trendPopupIcon`}
        style={extraStyle}
        data-static-id='ConfigurationDownload.js_div_ea64d8'
      >
        <img
          alt=''
          src={downloadIcon}
          className={'w-100 h-100'}
          data-static-id='ConfigurationDownload.js_img_bff7f9'
        />
      </div>
    </OverlayTrigger>
  )
}
