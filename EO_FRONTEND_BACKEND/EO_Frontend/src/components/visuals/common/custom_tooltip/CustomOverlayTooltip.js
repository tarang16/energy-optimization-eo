import { OverlayTrigger } from 'react-bootstrap'
import Tooltip from 'react-bootstrap/Tooltip'
const ToolTipComponent = (message, props) => (
  <Tooltip {...props} data-static-id='CustomOverlayTooltip.js_Tooltip_be2df2'>
    <div
      className={'d-flex'}
      data-static-id='CustomOverlayTooltip.js_div_09ab6d'
    >
      <span
        className='text-14-regular mt_03 text-white text-center text-uppercase'
        data-static-id='CustomOverlayTooltip.js_span_b4cc15'
      >
        {message}
      </span>
    </div>
  </Tooltip>
)
const CustomOverlayTooltip = ({ message, placement = 'top', children }) => {
  return (
    <OverlayTrigger
      placement={placement}
      overlay={(props) => ToolTipComponent(message, props)}
    >
      {children}
    </OverlayTrigger>
  )
}
export default CustomOverlayTooltip
