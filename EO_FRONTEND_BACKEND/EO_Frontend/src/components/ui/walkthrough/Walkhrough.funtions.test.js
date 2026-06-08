import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest'
// walkthroughUtils.test.js
import { downloadFromEcm } from 'services/EcmServices'
import {
  convertFilestreamToAudio,
  getValsBaseOnCondition,
} from 'utills/utilities'
import {
  getAllRemainingAudioAndImageNodes,
  handleActionClick,
  handleAudioEnd,
  handleCloseTour,
  handleLoaded,
  handlePlayPause,
  replayAudio,
  startTour,
  validateAndPlayFirstAudio,
} from './Walkhrough.funtions'
// Mock external dependencies
vi.mock('services/EcmServices', () => ({
  downloadFromEcm: vi.fn(),
}))
vi.mock('utills/utilities', () => ({
  convertFilestreamToAudio: vi.fn(),
  getValsBaseOnCondition: vi.fn(),
}))
describe('Walkthrough Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('validateAndPlayFirstAudio', () => {
    it('should set audio file when fileStream exists', () => {
      const mockSetAllAudioFiles = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const mockConvertFilestreamToAudio = vi
        .fn()
        .mockReturnValue('converted-audio')
      convertFilestreamToAudio.mockImplementation(mockConvertFilestreamToAudio)
      const resp = {
        data: {
          fileStream: 'test-file-stream',
        },
      }
      validateAndPlayFirstAudio(
        resp,
        mockSetAllAudioFiles,
        mockSetExistingAudioFile,
      )
      expect(convertFilestreamToAudio).toHaveBeenCalledWith('test-file-stream')
      expect(mockSetAllAudioFiles).toHaveBeenCalledWith(expect.any(Function))
      // Test the function passed to setAllAudioFiles
      const setterFunction = mockSetAllAudioFiles.mock.calls[0][0]
      const result = setterFunction({ existing: 'data' })
      expect(result).toEqual({
        existing: 'data',
        step0: {
          loading: false,
          data: 'test-file-stream',
          error: false,
        },
      })
      expect(mockSetExistingAudioFile).toHaveBeenCalledWith('converted-audio')
    })
    it('should set error state when fileStream does not exist', () => {
      const mockSetAllAudioFiles = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const resp = {
        data: {
          // No fileStream
        },
      }
      validateAndPlayFirstAudio(
        resp,
        mockSetAllAudioFiles,
        mockSetExistingAudioFile,
      )
      expect(convertFilestreamToAudio).not.toHaveBeenCalled()
      expect(mockSetAllAudioFiles).toHaveBeenCalledWith(expect.any(Function))
      const setterFunction = mockSetAllAudioFiles.mock.calls[0][0]
      const result = setterFunction({ existing: 'data' })
      expect(result).toEqual({
        existing: 'data',
        step0: {
          loading: false,
          data: null,
          error: true,
        },
      })
      expect(mockSetExistingAudioFile).not.toHaveBeenCalled()
    })
    it('should handle null response', () => {
      const mockSetAllAudioFiles = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      validateAndPlayFirstAudio(
        null,
        mockSetAllAudioFiles,
        mockSetExistingAudioFile,
      )
      expect(mockSetAllAudioFiles).toHaveBeenCalledWith(expect.any(Function))
      const setterFunction = mockSetAllAudioFiles.mock.calls[0][0]
      const result = setterFunction({ existing: 'data' })
      expect(result).toEqual({
        existing: 'data',
        step0: {
          loading: false,
          data: null,
          error: true,
        },
      })
    })
  })
  describe('getAllRemainingAudioAndImageNodes', () => {
    it('should download all images and audio files successfully', async () => {
      const mockSetImagesData = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const allImageNodeIds = ['image1', 'null', 'image2', 'image3']
      const allNodesIds = ['audio1', 'audio2', 'audio3']
      // Mock successful downloads
      downloadFromEcm
        .mockResolvedValueOnce({ data: { fileStream: 'image2-stream' } })
        .mockResolvedValueOnce({ data: { fileStream: 'image3-stream' } })
        .mockResolvedValueOnce({ data: { fileStream: 'audio1-stream' } })
        .mockResolvedValueOnce({ data: { fileStream: 'audio2-stream' } })
        .mockResolvedValueOnce({ data: { fileStream: 'audio3-stream' } })
      getValsBaseOnCondition.mockImplementation((condition, trueVal) => trueVal)
      await getAllRemainingAudioAndImageNodes(
        allImageNodeIds,
        allNodesIds,
        mockSetImagesData,
        mockSetAllAudioFiles,
      )
      // Verify image downloads (slice(1) and filter out 'null')
      expect(downloadFromEcm).toHaveBeenCalledWith('image2')
      expect(downloadFromEcm).toHaveBeenCalledWith('image3')
      // Verify audio downloads
      expect(downloadFromEcm).toHaveBeenCalledWith('audio1')
      expect(downloadFromEcm).toHaveBeenCalledWith('audio2')
      expect(downloadFromEcm).toHaveBeenCalledWith('audio3')
      // Verify setImagesData calls
      expect(mockSetImagesData).toHaveBeenCalledTimes(2)
      expect(mockSetImagesData).toHaveBeenCalledWith(expect.any(Function))
      // Verify setAllAudioFiles calls
      expect(mockSetAllAudioFiles).toHaveBeenCalledTimes(3)
    })
    it('should handle image download errors', async () => {
      const mockSetImagesData = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const allImageNodeIds = ['image1', 'image2']
      const allNodesIds = ['audio1']
      downloadFromEcm
        .mockRejectedValueOnce(new Error('Image download failed'))
        .mockResolvedValueOnce({ data: { fileStream: 'audio1-stream' } })
      await getAllRemainingAudioAndImageNodes(
        allImageNodeIds,
        allNodesIds,
        mockSetImagesData,
        mockSetAllAudioFiles,
      )
      // Should call setImagesData with error for failed download
      expect(mockSetImagesData).toHaveBeenCalledWith(expect.any(Function))
    })
    it('should handle audio download errors', async () => {
      const mockSetImagesData = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const allImageNodeIds = ['image1']
      const allNodesIds = ['audio1', 'audio2']
      downloadFromEcm
        .mockResolvedValueOnce({ data: { fileStream: 'image1-stream' } })
        .mockResolvedValueOnce({ data: { fileStream: 'audio1-stream' } })
        .mockRejectedValueOnce(new Error('Audio download failed'))
      await getAllRemainingAudioAndImageNodes(
        allImageNodeIds,
        allNodesIds,
        mockSetImagesData,
        mockSetAllAudioFiles,
      )
      // Should call setAllAudioFiles with error for failed download
      expect(mockSetAllAudioFiles).toHaveBeenCalledTimes(2)
    })
    it('should handle empty image and audio arrays', async () => {
      const mockSetImagesData = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      await getAllRemainingAudioAndImageNodes(
        [], // empty image nodes
        [], // empty audio nodes
        mockSetImagesData,
        mockSetAllAudioFiles,
      )
      expect(downloadFromEcm).not.toHaveBeenCalled()
      expect(mockSetImagesData).not.toHaveBeenCalled()
      expect(mockSetAllAudioFiles).not.toHaveBeenCalled()
    })
    it('should handle null values in image node IDs', async () => {
      const mockSetImagesData = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const allImageNodeIds = [null, 'image1', undefined]
      const allNodesIds = ['audio1']
      downloadFromEcm.mockResolvedValue({ data: { fileStream: 'test-stream' } })
      await getAllRemainingAudioAndImageNodes(
        allImageNodeIds,
        allNodesIds,
        mockSetImagesData,
        mockSetAllAudioFiles,
      )
      // Should handle null/undefined values gracefully
      expect(downloadFromEcm).toHaveBeenCalledWith('image1')
    })
  })
  describe('startTour', () => {
    it('should successfully start tour with valid data', async () => {
      const mockSetIsInitializing = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const mockSetImagesData = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const mockSetWalkthroughState = vi.fn()
      const walkthroughJson = {
        data: [
          {
            audioNodeID: 'audio1',
            imageNodeID: 'image1',
          },
          {
            audioNodeID: 'audio2',
            imageNodeID: 'image2',
          },
        ],
      }
      downloadFromEcm
        .mockResolvedValueOnce({ data: { fileStream: 'audio1-stream' } }) // First audio
        .mockResolvedValueOnce({ data: { fileStream: 'image1-stream' } }) // First image
        .mockResolvedValueOnce({ data: { fileStream: 'image2-stream' } }) // Remaining images
        .mockResolvedValueOnce({ data: { fileStream: 'audio2-stream' } }) // Remaining audio
      convertFilestreamToAudio.mockReturnValue('converted-audio')
      getValsBaseOnCondition.mockImplementation((condition, trueVal) => trueVal)
      await startTour({
        walkthroughJson,
        setIsInitializing: mockSetIsInitializing,
        setAllAudioFiles: mockSetAllAudioFiles,
        setImagesData: mockSetImagesData,
        setExistingAudioFile: mockSetExistingAudioFile,
        setWalkthroughState: mockSetWalkthroughState,
      })
      expect(mockSetIsInitializing).toHaveBeenCalledWith(true)
      expect(mockSetAllAudioFiles).toHaveBeenCalledWith({
        step0: { loading: true, data: null, error: false },
        step1: { loading: true, data: null, error: false },
      })
      expect(mockSetWalkthroughState).toHaveBeenCalledWith({
        isTourOpen: true,
        isShowingMore: true,
        data: walkthroughJson.data,
      })
      expect(mockSetIsInitializing).toHaveBeenCalledWith(false)
    })
    it('should handle empty walkthrough data', async () => {
      const mockSetIsInitializing = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const mockSetImagesData = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const mockSetWalkthroughState = vi.fn()
      const walkthroughJson = {
        data: [],
      }
      await startTour({
        walkthroughJson,
        setIsInitializing: mockSetIsInitializing,
        setAllAudioFiles: mockSetAllAudioFiles,
        setImagesData: mockSetImagesData,
        setExistingAudioFile: mockSetExistingAudioFile,
        setWalkthroughState: mockSetWalkthroughState,
      })
      expect(mockSetIsInitializing).not.toHaveBeenCalled()
      expect(downloadFromEcm).not.toHaveBeenCalled()
    })
    it('should handle missing first image node ID', async () => {
      const mockSetIsInitializing = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const mockSetImagesData = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const mockSetWalkthroughState = vi.fn()
      const walkthroughJson = {
        data: [
          {
            audioNodeID: 'audio1',
            // No imageNodeID
          },
        ],
      }
      downloadFromEcm.mockResolvedValue({
        data: { fileStream: 'audio1-stream' },
      })
      convertFilestreamToAudio.mockReturnValue('converted-audio')
      await startTour({
        walkthroughJson,
        setIsInitializing: mockSetIsInitializing,
        setAllAudioFiles: mockSetAllAudioFiles,
        setImagesData: mockSetImagesData,
        setExistingAudioFile: mockSetExistingAudioFile,
        setWalkthroughState: mockSetWalkthroughState,
      })
    })
    it('should handle download errors for first audio', async () => {
      const mockSetIsInitializing = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const mockSetImagesData = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const mockSetWalkthroughState = vi.fn()
      const walkthroughJson = {
        data: [
          {
            audioNodeID: 'audio1',
            imageNodeID: 'image1',
          },
        ],
      }
      await startTour({
        walkthroughJson,
        setIsInitializing: mockSetIsInitializing,
        setAllAudioFiles: mockSetAllAudioFiles,
        setImagesData: mockSetImagesData,
        setExistingAudioFile: mockSetExistingAudioFile,
        setWalkthroughState: mockSetWalkthroughState,
      })
      expect(mockSetIsInitializing).toHaveBeenCalledWith(true)
      expect(mockSetAllAudioFiles).toHaveBeenCalled()
      expect(mockSetIsInitializing).toHaveBeenCalledWith(false)
    })
  })
  describe('handlePlayPause', () => {
    it('should play when audio is paused', () => {
      const mockAudioRef = {
        current: {
          paused: true,
          play: vi.fn(),
        },
      }
      const mockSetIsPaused = vi.fn()
      handlePlayPause(mockAudioRef, mockSetIsPaused)
      expect(mockAudioRef.current.play).toHaveBeenCalled()
      expect(mockSetIsPaused).toHaveBeenCalledWith(false)
    })
    it('should pause when audio is playing', () => {
      const mockAudioRef = {
        current: {
          paused: false,
          pause: vi.fn(),
        },
      }
      const mockSetIsPaused = vi.fn()
      handlePlayPause(mockAudioRef, mockSetIsPaused)
      expect(mockAudioRef.current.pause).toHaveBeenCalled()
      expect(mockSetIsPaused).toHaveBeenCalledWith(true)
    })
    it('should handle null audioRef', () => {
      const mockAudioRef = { current: null }
      const mockSetIsPaused = vi.fn()
      handlePlayPause(mockAudioRef, mockSetIsPaused)
      expect(mockSetIsPaused).not.toHaveBeenCalled()
    })
  })
  describe('replayAudio', () => {
    it('should replay audio successfully', () => {
      const mockAudioRef = {
        current: {
          currentTime: 10,
          duration: 30,
          play: vi.fn(),
        },
      }
      const mockSetIsPaused = vi.fn()
      const mockSetCount = vi.fn()
      replayAudio(mockAudioRef, mockSetIsPaused, mockSetCount)
      expect(mockAudioRef.current.currentTime).toBe(0)
      expect(mockAudioRef.current.play).toHaveBeenCalled()
      expect(mockSetIsPaused).toHaveBeenCalledWith(false)
      expect(mockSetCount).toHaveBeenCalledWith(35) // Math.ceil(30) + 5
    })
    it('should handle null audioRef', () => {
      const mockAudioRef = { current: null }
      const mockSetIsPaused = vi.fn()
      const mockSetCount = vi.fn()
      replayAudio(mockAudioRef, mockSetIsPaused, mockSetCount)
      expect(mockSetIsPaused).not.toHaveBeenCalled()
      expect(mockSetCount).not.toHaveBeenCalled()
    })
  })
  describe('handleActionClick', () => {
    it('should handle next action successfully', async () => {
      const mockAudioRef = {
        current: {
          pause: vi.fn(),
          time: 10,
        },
      }
      const mockSetCurrentStep = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const mockSetCount = vi.fn()
      const mockToggleSettingCount = vi.fn()
      const mockSetIsPaused = vi.fn()
      const walkthroughState = {
        data: [{}, {}, {}], // 3 items, step 1 is middle
      }
      const allAudioFiles = {
        step2: {
          loading: false,
          data: 'audio-data',
          error: false,
        },
      }
      convertFilestreamToAudio.mockReturnValue('converted-audio')
      await handleActionClick({
        type: 'next',
        step: 1,
        walkthroughState,
        setCurrentStep: mockSetCurrentStep,
        audioRef: mockAudioRef,
        allAudioFiles,
        setExistingAudioFile: mockSetExistingAudioFile,
        setCount: mockSetCount,
        toggleSettingCount: mockToggleSettingCount,
        setIsPaused: mockSetIsPaused,
      })
      expect(mockAudioRef.current.pause).toHaveBeenCalled()
      expect(mockSetCurrentStep).toHaveBeenCalledWith(expect.any(Function))
      expect(convertFilestreamToAudio).toHaveBeenCalledWith('audio-data')
      expect(mockSetExistingAudioFile).toHaveBeenCalledWith('converted-audio')
      expect(mockSetIsPaused).toHaveBeenCalledWith(false)
    })
    it('should handle previous action successfully', async () => {
      const mockAudioRef = {
        current: {
          pause: vi.fn(),
          time: 10,
        },
      }
      const mockSetCurrentStep = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const mockSetCount = vi.fn()
      const mockToggleSettingCount = vi.fn()
      const mockSetIsPaused = vi.fn()
      const walkthroughState = {
        data: [{}, {}, {}],
      }
      const allAudioFiles = {
        step0: {
          loading: false,
          data: 'audio-data',
          error: false,
        },
      }
      convertFilestreamToAudio.mockReturnValue('converted-audio')
      await handleActionClick({
        type: 'prev',
        step: 1,
        walkthroughState,
        setCurrentStep: mockSetCurrentStep,
        audioRef: mockAudioRef,
        allAudioFiles,
        setExistingAudioFile: mockSetExistingAudioFile,
        setCount: mockSetCount,
        toggleSettingCount: mockToggleSettingCount,
        setIsPaused: mockSetIsPaused,
      })
      expect(mockSetCurrentStep).toHaveBeenCalledWith(expect.any(Function))
      expect(mockSetExistingAudioFile).toHaveBeenCalledWith('converted-audio')
    })
    it('should handle audio loading state', async () => {
      const mockAudioRef = {
        current: {
          pause: vi.fn(),
          time: 10,
        },
      }
      const mockSetCurrentStep = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const mockSetCount = vi.fn()
      const mockToggleSettingCount = vi.fn()
      const mockSetIsPaused = vi.fn()
      const walkthroughState = {
        data: [{}, {}],
      }
      const allAudioFiles = {
        step1: {
          loading: true,
          data: null,
          error: false,
        },
      }
      await handleActionClick({
        type: 'next',
        step: 0,
        walkthroughState,
        setCurrentStep: mockSetCurrentStep,
        audioRef: mockAudioRef,
        allAudioFiles,
        setExistingAudioFile: mockSetExistingAudioFile,
        setCount: mockSetCount,
        toggleSettingCount: mockToggleSettingCount,
        setIsPaused: mockSetIsPaused,
      })
      expect(mockSetExistingAudioFile).toHaveBeenCalledWith(null)
      expect(mockSetCount).toHaveBeenCalledWith(-1)
      expect(mockToggleSettingCount).toHaveBeenCalledWith(false)
    })
    it('should handle audio error state', async () => {
      const mockAudioRef = {
        current: {
          pause: vi.fn(),
          time: 10,
        },
      }
      const mockSetCurrentStep = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const mockSetCount = vi.fn()
      const mockToggleSettingCount = vi.fn()
      const mockSetIsPaused = vi.fn()
      const walkthroughState = {
        data: [{}, {}],
      }
      const allAudioFiles = {
        step1: {
          loading: false,
          data: null,
          error: true,
        },
      }
      await handleActionClick({
        type: 'next',
        step: 0,
        walkthroughState,
        setCurrentStep: mockSetCurrentStep,
        audioRef: mockAudioRef,
        allAudioFiles,
        setExistingAudioFile: mockSetExistingAudioFile,
        setCount: mockSetCount,
        toggleSettingCount: mockToggleSettingCount,
        setIsPaused: mockSetIsPaused,
      })
      expect(mockSetExistingAudioFile).toHaveBeenCalledWith(null)
      expect(mockSetCount).toHaveBeenCalledWith(10)
      expect(mockToggleSettingCount).toHaveBeenCalledWith(false)
    })
    it('should not change step when at boundaries', async () => {
      const mockAudioRef = {
        current: {
          pause: vi.fn(),
          time: 10,
        },
      }
      const mockSetCurrentStep = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const mockSetCount = vi.fn()
      const mockToggleSettingCount = vi.fn()
      const mockSetIsPaused = vi.fn()
      const walkthroughState = {
        data: [{}], // Only one item
      }
      await handleActionClick({
        type: 'next',
        step: 0, // Last step
        walkthroughState,
        setCurrentStep: mockSetCurrentStep,
        audioRef: mockAudioRef,
        allAudioFiles: {},
        setExistingAudioFile: mockSetExistingAudioFile,
        setCount: mockSetCount,
        toggleSettingCount: mockToggleSettingCount,
        setIsPaused: mockSetIsPaused,
      })
      expect(mockSetCurrentStep).not.toHaveBeenCalled()
    })
  })
  describe('handleCloseTour', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })
    it('should close tour successfully', () => {
      const mockSetWalkthroughState = vi.fn()
      const mockAudioRef = {
        current: {
          pause: vi.fn(),
          time: 10,
        },
      }
      const mockSetCount = vi.fn()
      const mockSetCurrentStep = vi.fn()
      const mockSetExistingAudioFile = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const mockSetIsPaused = vi.fn()
      handleCloseTour({
        setWalkthroughState: mockSetWalkthroughState,
        audioRef: mockAudioRef,
        setCount: mockSetCount,
        setCurrentStep: mockSetCurrentStep,
        setExistingAudioFile: mockSetExistingAudioFile,
        setAllAudioFiles: mockSetAllAudioFiles,
        setIsPaused: mockSetIsPaused,
      })
      expect(mockSetWalkthroughState).toHaveBeenCalledWith({
        isTourOpen: false,
        isShowingMore: false,
        data: [],
      })
      expect(mockAudioRef.current.pause).toHaveBeenCalled()
      expect(mockSetCount).toHaveBeenCalledWith(null)
      expect(mockSetCurrentStep).toHaveBeenCalledWith(0)
      expect(mockSetExistingAudioFile).toHaveBeenCalledWith(null)
      expect(mockSetAllAudioFiles).toHaveBeenCalledWith({})
      expect(mockSetIsPaused).toHaveBeenCalledWith(false)
      // Advance timers to handle setTimeout
      vi.advanceTimersByTime(500)
      expect(mockAudioRef.current.time).toBe(0)
    })
  })
  describe('handleAudioEnd', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })
    it('should not close tour when not at last step', async () => {
      const mockAudioRef = {
        current: {
          pause: vi.fn(),
          time: 10,
        },
      }
      const mockSetExistingAudioFile = vi.fn()
      const mockSetCurrentStep = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const mockSetWalkthroughState = vi.fn()
      const walkthroughState = {
        data: [{}, {}, {}], // 3 items, step 1 is not last
      }
      await handleAudioEnd({
        audioRef: mockAudioRef,
        step: 1,
        walkthroughState,
        setExistingAudioFile: mockSetExistingAudioFile,
        setCurrentStep: mockSetCurrentStep,
        setAllAudioFiles: mockSetAllAudioFiles,
        setWalkthroughState: mockSetWalkthroughState,
      })
      expect(mockAudioRef.current.pause).toHaveBeenCalled()
      expect(mockSetExistingAudioFile).not.toHaveBeenCalled()
      expect(mockSetCurrentStep).not.toHaveBeenCalled()
    })
    it('should close tour when at last step after timeout', async () => {
      const mockAudioRef = {
        current: {
          pause: vi.fn(),
          time: 10,
          paused: true,
        },
      }
      const mockSetExistingAudioFile = vi.fn()
      const mockSetCurrentStep = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const mockSetWalkthroughState = vi.fn()
      const walkthroughState = {
        data: [{}, {}], // 2 items, step 1 is last
      }
      await handleAudioEnd({
        audioRef: mockAudioRef,
        step: 1,
        walkthroughState,
        setExistingAudioFile: mockSetExistingAudioFile,
        setCurrentStep: mockSetCurrentStep,
        setAllAudioFiles: mockSetAllAudioFiles,
        setWalkthroughState: mockSetWalkthroughState,
      })
      expect(mockAudioRef.current.pause).toHaveBeenCalled()
      // Advance timers to trigger setTimeout
      vi.advanceTimersByTime(5000)
      expect(mockSetExistingAudioFile).toHaveBeenCalledWith(null)
      expect(mockSetCurrentStep).toHaveBeenCalledWith(0)
      expect(mockSetAllAudioFiles).toHaveBeenCalledWith({})
      expect(mockSetWalkthroughState).toHaveBeenCalledWith({
        isTourOpen: false,
        isShowingMore: false,
        data: [],
      })
    })
    it('should not close tour if audio is not paused after timeout', async () => {
      const mockAudioRef = {
        current: {
          pause: vi.fn(),
          time: 10,
          paused: false, // Audio is still playing
        },
      }
      const mockSetExistingAudioFile = vi.fn()
      const mockSetCurrentStep = vi.fn()
      const mockSetAllAudioFiles = vi.fn()
      const mockSetWalkthroughState = vi.fn()
      const walkthroughState = {
        data: [{}, {}],
      }
      await handleAudioEnd({
        audioRef: mockAudioRef,
        step: 1,
        walkthroughState,
        setExistingAudioFile: mockSetExistingAudioFile,
        setCurrentStep: mockSetCurrentStep,
        setAllAudioFiles: mockSetAllAudioFiles,
        setWalkthroughState: mockSetWalkthroughState,
      })
      // Advance timers
      vi.advanceTimersByTime(5000)
      // Should not close tour since audio is not paused
      expect(mockSetExistingAudioFile).not.toHaveBeenCalled()
    })
  })
  describe('handleLoaded', () => {
    it('should set count and play audio', () => {
      const mockAudioRef = {
        current: {
          duration: 25.7, // Will be ceil to 26
          play: vi.fn(),
        },
      }
      const mockSetCount = vi.fn()
      const mockToggleSettingCount = vi.fn()
      handleLoaded(mockAudioRef, mockSetCount, mockToggleSettingCount)
      expect(mockSetCount).toHaveBeenCalledWith(31) // Math.ceil(25.7) = 26 + 5 = 31
      expect(mockAudioRef.current.play).toHaveBeenCalled()
      expect(mockToggleSettingCount).toHaveBeenCalledWith(false)
    })
    it('should handle undefined duration', () => {
      const mockAudioRef = {
        current: {
          duration: undefined,
          play: vi.fn(),
        },
      }
      const mockSetCount = vi.fn()
      const mockToggleSettingCount = vi.fn()
      handleLoaded(mockAudioRef, mockSetCount, mockToggleSettingCount)
    })
  })
})
