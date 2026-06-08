import { env } from 'config/env'
import { atom } from 'jotai'
export const TimeZoneAtom = atom(env?.EO_DEFAULT_TIMEZONE || 'Asia/Riyadh')
