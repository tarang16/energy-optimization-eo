import React from 'react'
import { render } from '@testing-library/react'
import TreeDiagramGapCard from './TreeDiagramGapCard'
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
  }

  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramGapCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})
test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: 'right',
    displayUom: '%',
    actual: '10',
    optimum: '10',
  }

  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramGapCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})

test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: 'right',
    displayUom: '%',
    actual: '10',
    optimum: '10',
  }

  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramGapCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})

test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: 'middle',
    displayUom: '%',
    actual: '10',
    optimum: '10',
  }

  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramGapCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})
test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: '%',
    displayUom: '',
    actual: '10',
    optimum: '10',
  }

  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramGapCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})
test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: '%',
    displayUom: '',
    actual: '10',
    optimum: '10',
  }
  data.actual = 'test'
  data.state = 1
  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramGapCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})
test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: '%',
    displayUom: '',
    actual: '10',
    optimum: '10',
  }
  data.actual = null
  data.state = 0
  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramGapCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})
test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: '%',
    displayUom: '',
    actual: '10',
    optimum: null,
  }

  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramGapCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})

test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: '%',
    displayUom: '',
    actual: '10',
    optimum: '%',
  }
  data.gapActual = 'test'
  data.gapState = 1
  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramGapCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})
test('renders component with valid return method', () => {
  // Test with condition as true

  const data = {
    displayName: 'Test displayName',
    alignment: '%',
    displayUom: '',
    actual: '10',
    optimum: '%',
  }
  data.gapActual = 'test'
  data.gapState = 0
  const levelData = [['key', ['value']]]
  const { getByText } = render(
    <TreeDiagramGapCard data={data} levelData={levelData} nlevels={0} />,
  )
  assert(getByText('TEST DISPLAYNAME'))
})
