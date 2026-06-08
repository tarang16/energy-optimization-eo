// utils/trackingService.js

import Logger from 'logger/Logger'
let globalTrackEvent = null

// Function to set the tracking dispatcher
export function setGlobalTrackEvent(trackEvent) {
  globalTrackEvent = trackEvent
}

// Function to get the tracking dispatcher
export function getGlobalTrackEvent() {
  if (!globalTrackEvent) {
    Logger.warn('Tracking dispatcher has not been initialized.')
  }
  return globalTrackEvent
}

// Utility function to trigger custom tracking events
export function trackCustomEvent(eventData) {
  const isValidObj = Object.entries(eventData || {}).length > 0
  const trackEvent = getGlobalTrackEvent()
  if (trackEvent && isValidObj) {
    trackEvent({
      ...eventData,
    })
  }
}
