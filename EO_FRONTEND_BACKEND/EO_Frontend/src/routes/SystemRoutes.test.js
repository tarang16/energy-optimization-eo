import assert from 'assert'
import SystemRoutes from './SystemRoutes'
import { it, test, vi } from 'vitest'

test('exports variable is not null', () => {
  assert(SystemRoutes != null)
})

vi.mock('config/scss/_variables.scss', () => {
  return {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
    primary_dark_blue: '#ff0000',
  }
})
