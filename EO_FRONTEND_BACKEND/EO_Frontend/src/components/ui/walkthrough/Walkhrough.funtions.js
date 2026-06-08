import { downloadFromEcm } from 'services/EcmServices'
import {
  convertFilestreamToAudio,
  getValsBaseOnCondition,
} from 'utills/utilities'
export const validateAndPlayFirstAudio = (
  resp,
  setAllAudioFiles,
  setExistingAudioFile,
) => {
  if (resp?.data?.fileStream) {
    const audioFile = convertFilestreamToAudio(resp.data.fileStream)
    setAllAudioFiles((prev) => ({
      ...prev,
      step0: {
        loading: false,
        data: resp.data.fileStream,
        error: false,
      },
    }))
    setExistingAudioFile(audioFile)
  } else {
    setAllAudioFiles((prev) => ({
      ...prev,
      step0: {
        loading: false,
        data: null,
        error: true,
      },
    }))
  }
}
export const getAllRemainingAudioAndImageNodes = async (
  allImageNodeIds,
  allNodesIds,
  setImagesData,
  setAllAudioFiles,
) => {
  const imagePromises = allImageNodeIds
    .slice(1)
    .filter((x) => x != 'null')
    .map(async (x) => {
      try {
        const res = await downloadFromEcm((x ?? '')?.toString())
        setImagesData((prev) => ({
          ...prev,
          [x]: {
            loading: false,
            data: getValsBaseOnCondition(
              res?.data?.fileStream,
              `data:image/png;base64,${res?.data?.fileStream}`,
              null,
            ),
            error: !res?.data?.fileStream,
          },
        }))
      } catch (error) {
        setImagesData((prev) => ({
          ...prev,
          [x]: {
            loading: false,
            data: null,
            error: true,
          },
        }))
      }
    })
  const audioPromises = allNodesIds.map(async (x, index) => {
    try {
      const res = await downloadFromEcm((x ?? '')?.toString())
      setAllAudioFiles((prev) => ({
        ...prev,
        [`step${index + 1}`]: {
          loading: false,
          data: res?.data?.fileStream ?? null,
          error: !res?.data?.fileStream,
        },
      }))
    } catch (err) {
      setAllAudioFiles((prev) => ({
        ...prev,
        [`step${index + 1}`]: {
          loading: false,
          data: null,
          error: true,
        },
      }))
    }
  })

  // Run both image and audio downloads in parallel
  await Promise.all([...imagePromises, ...audioPromises])
}
export const startTour = async ({
  walkthroughJson,
  setIsInitializing,
  setAllAudioFiles,
  setImagesData,
  setExistingAudioFile,
  setWalkthroughState,
}) => {
  if (walkthroughJson?.data?.length) {
    setIsInitializing(true)
    // Getting 1st node id
    const fisrtItemNodeId = walkthroughJson.data[0].audioNodeID ?? ''
    let allAudioFilesInitial = {}
    let allImageFilesInitial = {}

    // setting base structure for audio files
    const allNodesIds = walkthroughJson.data
      .map((x, index) => {
        allAudioFilesInitial = {
          ...allAudioFilesInitial,
          [`step${index}`]: {
            loading: true,
            data: null,
            error: false,
          },
        }
        allImageFilesInitial = {
          ...allImageFilesInitial,
          [x.imageNodeID]: {
            loading: true,
            data: null,
            error: false,
          },
        }
        return x.audioNodeID ?? ''
      })
      .slice(1)

    // Getting all image node ids
    const allImageNodeIds = Object.keys(allImageFilesInitial)

    // Fetching audio for 1st node id
    const resp = await downloadFromEcm(`${fisrtItemNodeId}`)
    const fisrtImageNodeId = allImageNodeIds[0] ?? ''
    let imageResp = null
    if (fisrtImageNodeId) {
      imageResp = await downloadFromEcm(`${fisrtImageNodeId}`)
    }
    setAllAudioFiles(allAudioFilesInitial)
    if (imageResp?.data?.fileStream) {
      const imageFile = `data:image/png;base64,${imageResp.data.fileStream}`
      setImagesData((prev) => ({
        ...prev,
        [fisrtImageNodeId]: {
          loading: false,
          data: imageFile,
          error: false,
        },
      }))
    }
    validateAndPlayFirstAudio(resp, setAllAudioFiles, setExistingAudioFile)

    // Initiating walkthrough
    setWalkthroughState({
      isTourOpen: true,
      isShowingMore: true,
      data: walkthroughJson.data,
    })
    getAllRemainingAudioAndImageNodes(
      allImageNodeIds,
      allNodesIds,
      setImagesData,
      setAllAudioFiles,
    )
    // Always make loader false
    setIsInitializing(false)
  }
}
export const handlePlayPause = (audioRef, setIsPaused) => {
  if (!audioRef.current) return
  if (audioRef.current.paused) {
    audioRef.current.play()
    setIsPaused(false)
  } else {
    audioRef.current.pause()
    setIsPaused(true)
  }
}
export const replayAudio = (audioRef, setIsPaused, setCount) => {
  if (audioRef.current) {
    audioRef.current.currentTime = 0
    audioRef.current.play()
    setIsPaused(false)
    setCount(Math.ceil(audioRef.current.duration) + 5)
  }
}
export const handleActionClick = async ({
  type,
  step,
  walkthroughState,
  setCurrentStep,
  audioRef,
  allAudioFiles,
  setExistingAudioFile,
  setCount,
  toggleSettingCount,
  setIsPaused,
}) => {
  const newStep = type === 'next' ? step + 1 : step - 1
  const stepName = `step${newStep}`
  if (type === 'next') {
    if (step < walkthroughState.data.length - 1) {
      setCurrentStep((oldStep) => oldStep + 1)
      await audioRef.current.pause()
      audioRef.current.time = 0
    }
  } else {
    if (step > 0) {
      setCurrentStep((oldStep) => oldStep - 1)
      await audioRef.current.pause()
      audioRef.current.time = 0
    }
  }

  // setting audio if it exists
  if (!allAudioFiles[stepName]?.loading && allAudioFiles[stepName]?.data) {
    setExistingAudioFile(
      convertFilestreamToAudio(allAudioFiles[stepName]?.data),
    )
  } else if (allAudioFiles[stepName]?.error) {
    setExistingAudioFile(null)
    setCount(10)
    toggleSettingCount(false)
  } else {
    setExistingAudioFile(null)
    setCount(-1)
    toggleSettingCount(false)
  }
  setIsPaused(false)
}
export const handleCloseTour = ({
  setWalkthroughState,
  audioRef,
  setCount,
  setCurrentStep,
  setExistingAudioFile,
  setAllAudioFiles,
  setIsPaused,
}) => {
  setWalkthroughState({
    isTourOpen: false,
    isShowingMore: false,
    data: [],
  })
  audioRef.current.pause()
  setTimeout(() => {
    audioRef.current.time = 0
  }, 500)
  setCount(null)
  setCurrentStep(0)
  setExistingAudioFile(null)
  setAllAudioFiles({})
  setIsPaused(false)
}
export const handleAudioEnd = async ({
  audioRef,
  step,
  walkthroughState,
  setExistingAudioFile,
  setCurrentStep,
  setAllAudioFiles,
  setWalkthroughState,
}) => {
  await audioRef.current.pause()
  audioRef.current.time = 0
  if (step < walkthroughState.data.length - 1) {
    return
  } else {
    setTimeout(() => {
      if (audioRef?.current?.paused) {
        setExistingAudioFile(null)
        setCurrentStep(0)
        setAllAudioFiles({})
        setWalkthroughState({
          isTourOpen: false,
          isShowingMore: false,
          data: [],
        })
      }
    }, 5000)
  }
}
export const handleLoaded = (audioRef, setCount, toggleSettingCount) => {
  setCount(Math.ceil(audioRef.current.duration) + 5)
  audioRef.current.play()
  toggleSettingCount(false)
}
