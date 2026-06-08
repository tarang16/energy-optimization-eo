import { atom } from 'jotai'
export const walkthroughAtom = atom({
  isTourOpen: false,
  isShowingMore: false,
  data: [],
})
export const walkthroughJsonAtom = atom({
  loading: true,
  data: [],
})
