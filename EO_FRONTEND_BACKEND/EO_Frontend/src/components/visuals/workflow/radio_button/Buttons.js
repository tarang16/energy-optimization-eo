import { useEffect, useState } from 'react'
import styles from '../workflow.module.scss'
export default function Buttons({
  buttonsObj,
  defaultActiveIndex = -1,
  stageId,
}) {
  const [checkedButton, setCheckedButton] = useState('')
  const buttonStyles = {
    Accept: {
      divStyle: styles.acceptButton,
      radioStyle: styles.radioAccept,
      spanStyle: styles.acceptSpan,
    },
    Reassign: {
      divStyle: styles.acceptButton,
      radioStyle: styles.radioAccept,
      spanStyle: styles.acceptSpan,
    },
    ['Target Date']: {
      divStyle: styles.targetButton,
      radioStyle: styles.radioAccept,
      spanStyle: styles.acceptSpan,
    },
    ['Change Target Date']: {
      divStyle: styles.targetButton,
      radioStyle: styles.radioAccept,
      spanStyle: styles.acceptSpan,
    },
    Assign: {
      divStyle: styles.acceptButton,
      radioStyle: styles.radioAccept,
      spanStyle: styles.acceptSpan,
    },
    Reject: {
      divStyle: styles.rejectButton,
      radioStyle: styles.radioReject,
      spanStyle: styles.rejectSpan,
    },
    ['Forward to another Operation/Process Engineer']: {
      divStyle: styles.forwardButton,
      radioStyle: styles.radioAccept,
      spanStyle: styles.acceptSpan,
    },
    ['Forward to another Operation Manager']: {
      divStyle: styles.forwardButton,
      radioStyle: styles.radioAccept,
      spanStyle: styles.acceptSpan,
    },
    ['Forward to another Operation Engineer']: {
      divStyle: styles.forwardButton,
      radioStyle: styles.radioAccept,
      spanStyle: styles.acceptSpan,
    },
  }
  useEffect(() => {
    if (defaultActiveIndex > -1 && defaultActiveIndex < buttonsObj.length) {
      const btnObj = buttonsObj[defaultActiveIndex]
      setCheckedButton(btnObj.name)
    }
  }, [defaultActiveIndex])
  const renderComponent = () => {
    return (
      <div
        className={`${styles.workflowContainer} d-flex h-100 gap-2`}
        data-static-id='Buttons.js_div_591172'
      >
        {buttonsObj.map(({ name, onButtonClick, stage }, i) => {
          return stage?.includes(stageId) || !stage ? (
            <div
              className={`${buttonStyles[name]?.divStyle} d-flex align-items-center`}
              key={name}
              onClick={() => {
                if (checkedButton === 'Accept') {
                  if (
                    window.confirm(
                      'Warning: Proceeding will discard any unsaved changes. Are you sure you want to continue?',
                    )
                  ) {
                    setCheckedButton(name)
                    onButtonClick(name)
                  }
                } else {
                  setCheckedButton(name)
                  onButtonClick(name)
                }
              }}
              data-static-id='Buttons.js_div_ad5ec8'
            >
              <input
                className={`${buttonStyles[name]?.radioStyle} mt-0 ms-0 form-check-input ms-0`}
                type='radio'
                value={name}
                checked={checkedButton === name}
                data-static-id='Buttons.js_input_e8dc12'
              />
              <span
                className={`${buttonStyles[name]?.spanStyle} ms-0 text-16-bold`}
                data-static-id='Buttons.js_span_20d1de'
              >
                {name}
              </span>
            </div>
          ) : (
            <></>
          )
        })}
      </div>
    )
  }
  return <>{renderComponent()}</>
}
