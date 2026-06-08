import styles from './NumberedCircle.module.scss'
export default function NumberedCircle({
  id,
  elKey,
  handleClick,
  data,
  isRegionClicked,
  pageApiData,
  dataTooltipIid,
}) {
  return (
    <button
      id={id}
      key={elKey}
      data-tooltip-id={dataTooltipIid}
      onClick={() => {
        handleClick(data.region_short_name, data.count_affiliate)
      }}
      className={`d-flex align-items-center justify-content-center 
				${isRegionClicked && pageApiData.regionName === data.regionName ? styles.activeRegion : ''} 
				${Object.keys(data).includes('class') ? styles.subRegionLinks : styles.regionLinks} 
				${Object.keys(data).includes('class') ? data.class : 'text-24-bold pt-1'} text_primary_blue bg_primary_white ${data.value < 10 ? 'pt-1' : ''}`}
      style={{
        top: data.top,
        left: data.left,
        height: data.height,
        width: data.width,
      }}
      data-static-id='NumberedCircle.js_button_269b1f'
    >
      {data.count_affiliate || data.value}
    </button>
  )
}
