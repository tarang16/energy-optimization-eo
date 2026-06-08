import { atom } from 'jotai'

export const topologyAtom = atom({ nodes: [], edges: [], metadata: {} })
export const selectedComponentIdAtom = atom(null)
export const solveResultAtom = atom(null)
export const networkLoadingAtom = atom(false)
