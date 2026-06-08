import { uuid4 } from 'utills/utilities'
import styles from './Switch.module.scss'
export default function Switch({
  id,
  checked,
  defaultChecked,
  onChange,
  testId,
  disabled,
  customToggleStyle,
}) {
  const uid = uuid4()
  return (
    <div
      className={`${styles.switchContainer} ${customToggleStyle}`}
      data-static-id='Switch.js_div_d2784f'
    >
      <div
        className={`${styles.subSwitchContainer}`}
        data-static-id='Switch.js_div_ecb425'
      >
        <input
          type='checkbox'
          id={id || uid}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          data-testid={testId}
          disabled={disabled}
          data-static-id='Switch.js_input_3d1c01'
        />
        <label
          htmlFor={id || uid}
          className={
            disabled ? `disbaledSwitchStyle` : 'cursor-pointer extraClassLabel'
          }
          data-static-id='Switch.js_label_980102'
        >
          Toggle
        </label>
      </div>
    </div>
  )
}
