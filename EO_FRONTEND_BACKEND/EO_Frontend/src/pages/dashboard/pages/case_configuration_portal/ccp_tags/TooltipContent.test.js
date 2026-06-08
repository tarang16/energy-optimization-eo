import { render } from '@testing-library/react'
import TooltipContent from './TooltipContent'
import { describe, it, test, expect } from 'vitest'

describe('TooltipContent', () => {
  test('renders tooltip data correctly when provided', () => {
    const tooltipData = {
      columnName: 'user_id',
      description: 'The unique identifier for a user',
      expectedOutputFormatExample: '12345',
      dataTypeName: 'integer',
      maxLength: '10',
      isNullable: true,
    }
    render(<TooltipContent tooltipData={tooltipData} />)
  })

  test('renders tooltip data with null', () => {
    const tooltipData = {
      columnName: null,
      description: null,
      expectedOutputFormatExample: null,
      dataTypeName: null,
      maxLength: null,
      isNullable: null,
    }
    render(<TooltipContent tooltipData={tooltipData} />)
  })
})
