import { atom } from 'jotai'
export const AppAtom = atom({
  actualTime: null,
  actualTimeStr: null,
  caseData: [],
  caseHierarchy: null,
  calenderData: null,
  quickLinks: [],
  timeActualByCaseIds: {},
})
