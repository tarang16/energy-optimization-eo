import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, test, vi } from 'vitest'
import ParameterModal from './ParameterModal'

vi.mock('pages/dashboard/pages/optimization/OptimizationOutput', () => ({
  default: () => <div data-testid='optimization-output' />,
}))

vi.mock('../Parameter.module.scss', () => ({
  parameterModalContainer: 'parameterModalContainer',
  parameterBody: 'parameterBody',
}))

describe('ParameterModal Component', () => {
  test('forwards ref correctly to the container div', () => {
    const ref = createRef()
    render(<ParameterModal ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current.tagName).toBe('DIV')
  })
})
