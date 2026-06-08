import { atom } from 'jotai'
function atomWithToggle(initialValue) {
  const anAtom = atom(initialValue, (get, set, nextValue) => {
    const update = nextValue ?? !get(anAtom)
    set(anAtom, update)
  })
  return anAtom
}
export const showHandlesAtom = atomWithToggle(false)
export const nodeConfigAtom = atom(null)
export const updateConfigAtom = atomWithToggle(false)
export const selectedNodeIdAtom = atom(null)
export const selectedEdgeIdAtom = atom(null)
export const newNodeAtom = atom(null)
export const tagListAtom = atom([])
export const selectedPageAtom = atom(null)
export const networkLockedAtom = atom(false)
export const developerModeAtom = atom(false)
export const deleteAtom = atom(false)
export const allTagsAtom = atom([])
export const allTagsDataAtom = atom([])
export const dragNodeTypeAtom = atom(null)
export const plantListAtom = atom([])
export const fitViewAtom = atom(0)
export const networkDownloadingAtom = atom({
  type: 'png',
  isDownloading: false,
})
