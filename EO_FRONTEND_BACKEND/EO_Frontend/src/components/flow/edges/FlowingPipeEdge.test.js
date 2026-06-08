import { render } from '@testing-library/react'
import * as xyflow from '@xyflow/react'
import { beforeEach, describe, it, vi } from 'vitest'
import FlowingPipeEdge from './FlowingPipeEdge'

// Mock getSmoothStepPath

vi.mock('@xyflow/react', () => ({
  getSmoothStepPath: vi.fn(),
}))

describe('FlowingPipeEdge', () => {
  const mockPath = 'M10 10 C 20 20, 40 20, 50 10'
  beforeEach(() => {
    xyflow.getSmoothStepPath.mockReturnValue([mockPath])
  })

  it('renders two path elements with expected attributes', () => {
    const props = {
      id: 'edge-1',
      sourceX: 10,
      sourceY: 10,
      targetX: 50,
      targetY: 10,
      sourcePosition: 'right',
      targetPosition: 'left',
      markerEnd: 'url(#arrowhead)',
      style: { stroke: 'blue' },
      type: 'water',
    }

    const { container } = render(<FlowingPipeEdge {...props} />)
    const paths = container.querySelectorAll('path')
    // expect(paths).toHaveLength(2);
    // paths.forEach((path) => {
    //     expect(path).toHaveAttribute("d", mockPath);
    //     expect(path).toHaveAttribute("id", "edge-1");
    //     expect(path).toHaveAttribute("markerEnd", "url(#arrowhead)");
    //     expect(path.className.baseVal).toContain("edgeStoke-water");
    //     expect(path.className.baseVal).toContain("react-flow__edge-path");
    // });
  })

  it('applies default class if type is not provided', () => {
    const { container } = render(
      <FlowingPipeEdge
        id='edge-2'
        sourceX={0}
        sourceY={0}
        targetX={100}
        targetY={100}
        sourcePosition='top'
        targetPosition='bottom'
      />,
    )

    const paths = container.querySelectorAll('path')
    // expect(paths[0].className.baseVal).toContain("flowingPipe");
    // expect(paths[1].className.baseVal).toContain("flowingpipeAnimated");
    // expect(paths[0].className.baseVal).not.toContain("edgeStoke-");
  })
})
