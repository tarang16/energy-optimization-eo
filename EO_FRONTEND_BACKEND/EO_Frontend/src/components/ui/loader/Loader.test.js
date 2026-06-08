import React from 'react'
import { render, screen } from '@testing-library/react'
import Loader from './Loader'
import assert from 'assert'
import { it, test } from 'vitest'

test('renders component with specific class and id', () => {
  render(
    <>
      <Loader id='test-id' />
    </>,
  )

  // Use getByTestId to get an element by its test id
  const elementById = screen.getByTestId('test-id')

  assert(elementById)
})
