import { AppAtom } from 'atoms/AppAtom'
import { developerModeAtom, showHandlesAtom } from 'atoms/NetworkAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtom, useAtomValue } from 'jotai'
import { useParams } from 'react-router-dom'
import Flow from './Flow'
import NodeConfigurator from './NodeConfigurator'
import NodesList from './NodesList'
import styles from './flow.module.scss'
const App = ({ selectedPlant }) => {
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const [show, toggle] = useAtom(showHandlesAtom)
  const isDeveloperMode = useAtomValue(developerModeAtom)
  return (
    <div
      className={`${styles.flowMainContainer}`}
      data-static-id='index.js_div_bfc76d'
    >
      <div
        className={`${styles.flowContainer}`}
        style={style.container}
        data-static-id='index.js_div_f925c0'
      >
        {/* Left section - 20% */}
        {isDeveloperMode && (
          <div
            className={`${styles.flowContainer__left}`}
            style={style.leftSection}
            data-static-id='index.js_div_5197c4'
          >
            <div
              id='node-list'
              data-testid='node-list'
              className={`${styles.leftTopSection}`}
              style={style.topLeft}
              data-static-id='index.js_div_76f4e1'
            >
              <div
                className={`${styles.leftTopSection__scrollContainer}`}
                data-static-id='index.js_div_f9ff4b'
              >
                <NodesList />
              </div>
            </div>
            <div
              className={`${styles.leftBottomSection}`}
              style={style.bottomLeft}
              id='node-configuration'
              data-testid='node-configuration'
              data-static-id='index.js_div_8ea7ed'
            >
              <div
                className={`${styles.scrollContainer}`}
                data-static-id='index.js_div_4f1228'
              >
                <NodeConfigurator />
              </div>
            </div>
          </div>
        )}

        {/* Right section - 80% */}
        <div
          className={`${styles.flowContainer__right}`}
          style={style.rightSection}
          id='network-flow'
          data-testid='network-flow'
          data-static-id='index.js_div_f554ed'
        >
          {selectedPlant && isDeveloperMode && (
            <button
              className={`${styles.primaryBlueButton} ${styles.hideHandleBtn}  text-14-regular text-uppercase`}
              id='handles-button'
              data-testid='handles-button'
              onClick={() => {
                if (show) {
                  TRACKEVENTOBJ.network.HideHandlesClick({
                    params,
                    caseData: appContext.caseData,
                  })
                } else {
                  TRACKEVENTOBJ.network.ShowHandlesClick({
                    params,
                    caseData: appContext.caseData,
                  })
                }
                toggle(!show)
              }}
              data-static-id='index.js_button_381057'
            >
              {show ? 'Hide Handles' : 'Show Handles'}
            </button>
          )}
          <Flow />
        </div>
      </div>
    </div>
  )
}
const style = {
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  topLeft: {
    backgroundColor: '#e3e3e3',
    boxSizing: 'border-box',
  },
  bottomLeft: {
    backgroundColor: '#dcdcdc',
    boxSizing: 'border-box',
  },
  rightSection: {
    backgroundColor: '#f0f0f0',
    boxSizing: 'border-box',
    position: 'relative',
  },
}
export default App
