import OptimizationOutput from 'pages/dashboard/pages/optimization/OptimizationOutput'
import { forwardRef, memo } from 'react'
import classes from './Parameter.module.scss'
const ParameterModal = forwardRef((props, ref) => {
  return (
    <div
      className={`${classes.parameterModalContainer} h-100`}
      ref={ref}
      data-static-id='ParameterModal.js_div_d7d2d9'
    >
      <div
        className={`${classes.parameterBody}`}
        style={{
          height: '100%',
        }}
        data-static-id='ParameterModal.js_div_f48e97'
      >
        <OptimizationOutput />
      </div>
    </div>
  )
})
export default memo(ParameterModal)
