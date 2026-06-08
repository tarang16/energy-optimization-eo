import { fireEvent, render, screen } from '@testing-library/react'
import { AppAtom } from 'atoms/AppAtom'
import {
  dragNodeTypeAtom,
  newNodeAtom,
  nodeConfigAtom,
  selectedEdgeIdAtom,
  selectedNodeIdAtom,
  selectedPageAtom,
} from 'atoms/NetworkAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue, useSetAtom } from 'jotai'
import { useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NodesList, { allNodes } from './NodesList'

vi.mock(import('jotai'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
    useSetAtom: vi.fn(),
  }
})
vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: vi.fn(),
  }
})

vi.mock('atoms/AppAtom', () => ({
  AppAtom: {},
}))
vi.mock('atoms/NetworkAtom', () => ({
  dragNodeTypeAtom: {},
  newNodeAtom: {},
  nodeConfigAtom: {},
  selectedEdgeIdAtom: {},
  selectedNodeIdAtom: {},
  selectedPageAtom: {},
}))
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    network: {
      NodesListBtnClick: vi.fn(),
    },
  },
}))
describe('NodesList component', () => {
  const setConfig = vi.fn()
  const setNewNode = vi.fn()
  const setSelectedNodeId = vi.fn()
  const setSelectedEdgeId = vi.fn()
  const setType = vi.fn()
  beforeEach(() => {
    vi.clearAllMocks()
    useParams.mockReturnValue({ plantId: '123' })
    useSetAtom.mockImplementation((atom) => {
      if (atom === nodeConfigAtom) return setConfig
      if (atom === newNodeAtom) return setNewNode
      if (atom === selectedNodeIdAtom) return setSelectedNodeId
      if (atom === selectedEdgeIdAtom) return setSelectedEdgeId
      if (atom === dragNodeTypeAtom) return setType
      return vi.fn()
    })
    useAtomValue.mockImplementation((atom) => {
      if (atom === AppAtom) return { caseData: { id: 'case1' } }
      if (atom === selectedPageAtom) return true
      return null
    })
  })
  it('renders heading', () => {
    render(<NodesList />)
    expect(screen.getByText(/Nodes List/i)).toBeInTheDocument()
  })
  it('renders fallback message when selectedPage is false', () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === selectedPageAtom) return false
      if (atom === AppAtom) return { caseData: {} }
      return null
    })
    render(<NodesList />)
    expect(
      screen.getByText(/Please select page to see nodes list/i),
    ).toBeInTheDocument()
  })
  it('renders all nodes when selectedPage is true', () => {
    render(<NodesList />)
  })
  it('clicking a node triggers tracking and state updates', () => {
    render(<NodesList />)
    const node = allNodes[0]
    const nodeElement = screen.getByTestId(`node-${node.name}`)
    fireEvent.click(nodeElement)
    expect(TRACKEVENTOBJ.network.NodesListBtnClick).toHaveBeenCalledWith(
      { params: { plantId: '123' }, caseData: { id: 'case1' } },
      node,
    )
    expect(setSelectedNodeId).toHaveBeenCalledWith(null)
    expect(setSelectedEdgeId).toHaveBeenCalledWith(null)
    expect(setConfig).toHaveBeenCalledWith(null)
    expect(setNewNode).toHaveBeenCalledWith(node)
  })
  it('dragging a node sets type and effectAllowed', () => {
    render(<NodesList />)
    const node = allNodes[0]
    const nodeElement = screen.getByTestId(`node-${node.name}`)
    const mockEvent = {
      dataTransfer: {},
    }
    fireEvent.dragStart(nodeElement, mockEvent)
    expect(setType).toHaveBeenCalledWith(node.type)
    expect(mockEvent.dataTransfer.effectAllowed).toBe('move')
  })
})
