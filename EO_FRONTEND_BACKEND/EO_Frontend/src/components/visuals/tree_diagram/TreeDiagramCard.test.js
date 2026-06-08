import React from 'react'
import { render } from '@testing-library/react'
import TreeDiagramCard from './TreeDiagramCard'
import assert from 'assert'
import { it, test } from 'vitest'

test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: 'left',
    displayUom: '%',
    actual: '10',
    optimum: '10',
    state: 0,
    gapActual: '1',
    gapState: 0,
  }

  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})

test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: 'right',
    displayUom: null,
    actual: '10',
    optimum: '10',
    state: 1,
    gapActual: 1,
    gapState: 1,
  }

  const levelData = [
    ['key', ['value']],
    ['key', ['value']],
  ]
  const { getByText } = render(
    <TreeDiagramCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})

test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: 'middle',
    displayUom: '%',
    actual: null,
    optimum: null,
    gapActual: null,
    gapState: null,
  }

  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})
