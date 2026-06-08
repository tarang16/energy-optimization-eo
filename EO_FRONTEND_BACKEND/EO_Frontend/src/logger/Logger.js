/* eslint-disable no-console */
import { env } from 'config/env'
const Logger = {
  log: (...args) => {
    if (env.EO_ENV === 'development' || env.EO_ENV === 'local') {
      console.log(...args)
    }
  },
  warn: console.warn,
  error: console.error,
}
export default Logger
