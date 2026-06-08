import { getViewportForBounds, useReactFlow } from '@xyflow/react'
import downloadIcon from 'assets/sabic_icons/sidebar/download_icon.svg'
import { networkDownloadingAtom } from 'atoms/NetworkAtom'
import { toPng } from 'html-to-image'
import { useAtom } from 'jotai'
import { useLocation } from 'react-router-dom'
import { getFileNameFromUrl, hideOverlay, showOverlay } from 'utills/utilities'
import styles from './Network.module.scss'
function downloadImage(dataUrl, fileName) {
  const a = document.createElement('a')
  a.setAttribute('download', fileName)
  a.setAttribute('href', dataUrl)
  a.click()
}
function DownloadButton({ selectedPlant = '' }) {
  const location = useLocation()
  const [networkDownloadData, setNetworkDownloadData] = useAtom(
    networkDownloadingAtom,
  )
  const { getNodes, getNodesBounds } = useReactFlow()
  const onClick = () => {
    let overlay, loadingMessage
    setNetworkDownloadData({
      type: 'png',
      isDownloading: true,
    })
    ;({ overlay, loadingMessage } = showOverlay(
      'Generating PNG, please wait...',
    ))
    const nodesBounds = getNodesBounds(getNodes())
    const padding = 20
    const imageWidth = nodesBounds.width + padding
    const imageHeight = nodesBounds.height + padding
    const viewport = getViewportForBounds(
      nodesBounds,
      imageWidth,
      imageHeight,
      0.5,
      2,
      0,
    )
    toPng(document.querySelector('.react-flow__viewport'), {
      backgroundColor: '#fff',
      width: imageWidth,
      height: imageHeight,
      pixelRatio: 2,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    })
      .then((data) => {
        const fileName = `${getFileNameFromUrl(location.pathname, 'png', selectedPlant?.pageName)}`
        downloadImage(data, fileName)
        setNetworkDownloadData({
          type: 'png',
          isDownloading: false,
        })
        hideOverlay(overlay, loadingMessage)
      })
      .catch((err) => {
        setNetworkDownloadData({
          type: 'png',
          isDownloading: false,
        })
        hideOverlay(overlay, loadingMessage)
      })
  }
  return (
    <div
      className={`${styles.downloadDropdownContainer}`}
      data-static-id='DownloadButton.js_div_084b4f'
    >
      <button
        className={`${styles.showMoreOptionImage}`}
        onClick={onClick}
        disabled={networkDownloadData.isDownloading}
        data-static-id='DownloadButton.js_button_023935'
      >
        <img
          src={downloadIcon}
          alt='Network download icon'
          data-static-id='DownloadButton.js_img_bf88de'
        />
      </button>
    </div>
  )
}
export default DownloadButton
