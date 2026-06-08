import walkThroughOpenBookGrey from 'assets/sabic_icons/sidebar/walkthrough_open_book_gray.svg'
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'
import variables from 'config/scss/variables'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import Tour from 'reactour'
import {
  convertFilestreamToAudio,
  getValsBaseOnCondition,
} from 'utills/utilities'
import Loader from '../loader/Loader'
import classes from '../sidebar/Sidebar.module.scss'
import { walkthroughAtom, walkthroughJsonAtom } from './store'
import {
  handleActionClick,
  handleAudioEnd,
  handleCloseTour,
  handleLoaded,
  handlePlayPause,
  replayAudio,
  startTour,
} from './Walkhrough.funtions'
import styles from './Walkhrough.module.scss'
const accentColor = variables.primary_blue
const InfoText = ({ currentStepData }) => {
  if (currentStepData?.loading) {
    return (
      <div
        className='d-flex align-items-center mb-2 gap-1'
        data-static-id='Walkhrough.js_div_79f9f3'
      >
        {' '}
        <div
          className={`${styles.yellowRoundIcon}`}
          data-static-id='Walkhrough.js_div_6710a0'
        ></div>{' '}
        <p
          className='text-14-bold mt_03 text-white text-uppercase'
          data-static-id='Walkhrough.js_p_fecb76'
        >
          Loading audio...
        </p>
      </div>
    )
  }
  if (currentStepData?.error) {
    return (
      <div
        className='d-flex align-items-center mb-2 gap-1'
        data-static-id='Walkhrough.js_div_6ebc2b'
      >
        {' '}
        <div
          className={`${styles.orangeRoundIcon}`}
          data-static-id='Walkhrough.js_div_16c183'
        ></div>{' '}
        <p
          className='text-14-bold mt_03 text-white text-uppercase'
          data-static-id='Walkhrough.js_p_56f655'
        >
          Failed to load audio...
        </p>
      </div>
    )
  }
  return <></>
}
const Walkthrough = () => {
  const isSpeechSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window
  const utterance = isSpeechSupported
    ? new window.SpeechSynthesisUtterance()
    : null
  if (utterance) utterance.lang = 'ar-SA'
  const [step, setCurrentStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [count, setCount] = useState(null)
  const [walkthroughState, setWalkthroughState] = useAtom(walkthroughAtom)
  const [existingAudioFile, setExistingAudioFile] = useState(null)
  const [allAudioFiles, setAllAudioFiles] = useState({})
  const [isInitializing, setIsInitializing] = useState(false)
  const [settingCount, toggleSettingCount] = useState(false)
  const walkthroughJson = useAtomValue(walkthroughJsonAtom)
  const [imagesData, setImagesData] = useState([])
  const audioRef = useRef(null)
  useEffect(() => {
    if (walkthroughState?.isTourOpen) {
      const interval = setInterval(() => {
        if (!isPaused && count > 0) {
          setCount((prevCount) => prevCount - 1)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isPaused, walkthroughState, count])
  useEffect(() => {
    if (
      count === 0 &&
      step < walkthroughState.data.length - 1 &&
      !settingCount
    ) {
      setCount(null)
      toggleSettingCount(true)
      const newStep = step + 1
      setCurrentStep(newStep)
      if (
        allAudioFiles?.[`step${newStep}`]?.data &&
        !allAudioFiles[`step${newStep}`]?.loading
      ) {
        setExistingAudioFile(
          convertFilestreamToAudio(allAudioFiles[`step${newStep}`]?.data),
        )
      }
    }
  }, [count, walkthroughState, step, settingCount, allAudioFiles])
  useEffect(() => {
    if (
      allAudioFiles?.[`step${step}`]?.error &&
      (count === null || count < 0)
    ) {
      setCount(10)
      toggleSettingCount(false)
    }
  }, [allAudioFiles, step, count])
  useEffect(() => {
    const rightArrowBtn = document.querySelector(
      '[data-tour-elem="right-arrow"]',
    )
    if (rightArrowBtn instanceof HTMLButtonElement) {
      rightArrowBtn.removeAttribute('disabled')
    }
  }, [step])
  useEffect(() => {
    if (
      allAudioFiles?.[`step${step}`]?.data &&
      !allAudioFiles?.[`step${step}`]?.loading &&
      !existingAudioFile
    ) {
      setExistingAudioFile(
        convertFilestreamToAudio(allAudioFiles[`step${step}`]?.data),
      )
    }
  }, [allAudioFiles, step])
  const disableBody = (target) => disableBodyScroll(target)
  const enableBody = (target) => enableBodyScroll(target)
  if (isInitializing) {
    return (
      <div
        className={`${styles.initializingWalkthroughOverlay}`}
        data-static-id='Walkhrough.js_div_ce1091'
      >
        <p
          className='text-24-bold text-uppercase text_primary_white'
          data-static-id='Walkhrough.js_p_ad533b'
        >
          Initializing walkthrough...
        </p>
      </div>
    )
  }
  const currentStepData = allAudioFiles[`step${step}`]
  return (
    <div
      className={`favorite_tooltip ${styles.walkthroughLoaderContainer}`}
      data-tooltip-id='walkthrough'
      data-static-id='Walkhrough.js_div_cdf3d1'
    >
      <audio
        ref={audioRef}
        src={existingAudioFile}
        onEnded={() =>
          handleAudioEnd({
            audioRef,
            step,
            walkthroughState,
            setExistingAudioFile,
            setCurrentStep,
            setAllAudioFiles,
            setWalkthroughState,
          })
        }
        onLoadedMetadata={() =>
          handleLoaded(audioRef, setCount, toggleSettingCount)
        }
        data-static-id='Walkhrough.js_audio_2f3bfd'
      />

      {walkthroughJson?.loading ? (
        <Loader />
      ) : (
        <a
          data-tooltip-id='walkthrough'
          className={`${classes.bottomIcon}`}
          onClick={(e) => {
            e.preventDefault()
            startTour({
              walkthroughJson,
              setIsInitializing,
              setAllAudioFiles,
              setImagesData,
              setExistingAudioFile,
              setWalkthroughState,
            })
          }}
          data-static-id='Walkhrough.js_a_d7f547'
        >
          <img
            src={walkThroughOpenBookGrey}
            data-static-id='Walkhrough.js_img_ffbb60'
          />
        </a>
      )}

      <Tooltip
        className='tooltip_container lightTooltipBackground'
        id='walkthrough'
        border={true}
        style={{
          zIndex: 9999,
        }}
        place='top'
        type='light'
        data-static-id='Walkhrough.js_Tooltip_540d3f'
      >
        <p
          className='text-start mb-0 ms-2 custom_tooltip text-12-regular  text-center'
          data-static-id='Walkhrough.js_p_f00422'
        >
          Walkthrough
        </p>
      </Tooltip>
      <Tour
        onRequestClose={() =>
          handleCloseTour({
            setWalkthroughState,
            audioRef,
            setCount,
            setCurrentStep,
            setExistingAudioFile,
            setAllAudioFiles,
            setIsPaused,
          })
        }
        steps={tourConfig({
          // handleCloseTour,
          data: walkthroughState.data,
          images: imagesData,
        })}
        isOpen={walkthroughState.isTourOpen}
        maskClassName='custom-mask-class'
        className='helper'
        rounded={5}
        accentColor={accentColor}
        onAfterOpen={disableBody}
        onBeforeClose={enableBody}
        children={<InfoText currentStepData={currentStepData} />}
        disableKeyboardNavigation
        prevButton={
          <div
            onClick={() =>
              handleActionClick({
                type: 'back',
                step,
                walkthroughState,
                setCurrentStep,
                audioRef,
                allAudioFiles,
                setExistingAudioFile,
                setCount,
                toggleSettingCount,
                setIsPaused,
              })
            }
            className='text-14-regular text-uppercase text_primary_white'
            data-static-id='Walkhrough.js_div_3ee8c2'
          >
            Back
          </div>
        }
        nextButton={
          <div
            className={`d-flex  h-100 walkThroughCustomBtnContainer`}
            data-static-id='Walkhrough.js_div_6e94d3'
          >
            <div
              onClick={(e) => {
                e.stopPropagation()
                if (
                  !count ||
                  count < 6 ||
                  currentStepData?.loading ||
                  currentStepData?.error
                )
                  return
                handlePlayPause(audioRef, setIsPaused)
              }}
              className={`text-16-regular text-uppercase text_primary_blue walkThroughCustomWhiteBtn walkThroughIconBtn  ${getValsBaseOnCondition(!count || count < 6 || currentStepData?.loading || currentStepData?.error, 'disablesPlayPauseButton', '')}`}
              data-static-id='Walkhrough.js_div_0f6d66'
            >
              {audioRef?.current?.paused ? (
                <i
                  className='fa fa-play text_primary_blue'
                  aria-hidden='true'
                  data-static-id='Walkhrough.js_i_9aeaf4'
                ></i>
              ) : (
                <i
                  className='fa fa-pause text_primary_blue'
                  aria-hidden='true'
                  data-static-id='Walkhrough.js_i_8e9b50'
                ></i>
              )}
            </div>
            <div
              className={`text-16-regular text-uppercase text_primary_blue walkThroughCustomWhiteBtn walkThroughIconBtn ${getValsBaseOnCondition(!count || count < 0 || currentStepData?.loading || currentStepData?.error, 'disablesPlayPauseButton', '')}`}
              onClick={(e) => {
                e.stopPropagation()
                if (
                  !count ||
                  count < 0 ||
                  currentStepData?.loading ||
                  currentStepData?.error
                )
                  return
                replayAudio(audioRef, setIsPaused, setCount)
              }}
              data-static-id='Walkhrough.js_div_eb99f3'
            >
              <i
                className='fa fa-repeat text_primary_blue'
                aria-hidden='true'
                data-static-id='Walkhrough.js_i_747481'
              ></i>
            </div>
            <div
              onClick={() => {
                if (step === walkthroughState?.data?.length - 1) return
                handleActionClick({
                  type: 'next',
                  step,
                  walkthroughState,
                  setCurrentStep,
                  audioRef,
                  allAudioFiles,
                  setExistingAudioFile,
                  setCount,
                  toggleSettingCount,
                  setIsPaused,
                })
              }}
              className={`text-16-regular text-uppercase text_primary_blue walkThroughCustomWhiteBtn ${getValsBaseOnCondition(step === walkthroughState?.data?.length - 1, 'disablesPlayPauseButton', '')}`}
              data-static-id='Walkhrough.js_div_6c35d4'
            >
              <span
                className='mt_03 text_primary_blue'
                data-static-id='Walkhrough.js_span_dc0598'
              >
                Next{' '}
                {getValsBaseOnCondition(count && count > -1, `(${count})`, '')}
              </span>
            </div>
          </div>
        }
        showNavigation={false}
        goToStep={step}
        closeWithMask={false}
      />
    </div>
  )
}
export default Walkthrough
export const tourConfig = ({ data, images }) => {
  return data?.map((x) => ({
    selector: `[data-tut="${x.tutID}"]`,
    content: () => {
      const image = getValsBaseOnCondition(
        x?.imageNodeID && images[x?.imageNodeID]?.data,
        images[x?.imageNodeID]?.data,
        null,
      )
      return (
        <div data-static-id='Walkhrough.js_div_c73e95'>
          <h4
            className='text-16-bold text-uppercase text-white'
            data-static-id='Walkhrough.js_h4_91f598'
          >
            {x.title}
          </h4>
          <p
            className={`text-14-regular text-uppercase text-white`}
            data-static-id='Walkhrough.js_p_dd35a3'
          >
            {x.subText}
          </p>
          {image && (
            <img
              src={image}
              style={{
                width: '100%',
              }}
              data-static-id='Walkhrough.js_img_579767'
            />
          )}
        </div>
      )
    },
  }))
}
