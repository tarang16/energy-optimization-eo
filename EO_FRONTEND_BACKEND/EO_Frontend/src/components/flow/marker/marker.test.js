import React from 'react'
import { render, screen } from '@testing-library/react'
import Marker from './index'
import { EDGE_COLORS } from '../utils'
import { describe, it, test, expect } from 'vitest'
import '@testing-library/jest-dom'

describe('Marker component', () => {
  it('renders SVG marker with correct type and colors', () => {
    const testType = 'flowingPipe' // must exist in EDGE_COLORS
    const { borderColor } = EDGE_COLORS[testType]
    render(<Marker type={testType} />)
    // Check marker id
    // const marker = screen.getByTestId('marker-svg');
    // expect(marker).toBeInTheDocument();
    // Query the marker element by ID
    const markerElement = document.querySelector(`marker[id="${testType}"]`)
    expect(markerElement).toBeInTheDocument()
    // Check the polyline style
    const polyline = markerElement.querySelector('polyline')
    expect(polyline).toHaveAttribute('points', '-5,-4 0,0 -5,4 -5,-4')
    expect(polyline).toHaveStyle(`stroke: ${borderColor}`)
    expect(polyline).toHaveStyle(`fill: ${borderColor}`)
  })
})
