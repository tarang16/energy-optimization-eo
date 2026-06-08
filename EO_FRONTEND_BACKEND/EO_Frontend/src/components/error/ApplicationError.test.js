import { render } from '@testing-library/react'

import assert from 'assert'
import { describe, it } from 'vitest'
import ApplicationError from './ApplicationError'

describe('ApplicationError component', () => {
  it('renders without crashing', () => {
    render(<ApplicationError />)
  })

  it('render Please Try Again Later for no props provided.', () => {
    const { getByText } = render(<ApplicationError />)
    const defaultMessage = 'Please Try Again Later'

    assert(getByText('SOMETHING WENT WRONG'))
    assert(getByText(defaultMessage))
  })

  it('renders Error Message', () => {
    const message = 'Error Message'
    const { getByText } = render(<ApplicationError message={message} />)

    assert(getByText(message))
  })
})
