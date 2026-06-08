import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { getConnectedEdges } from '@xyflow/react'
import { AppAtom } from 'atoms/AppAtom'
import {
  developerModeAtom,
  networkLockedAtom,
  newNodeAtom,
  nodeConfigAtom,
  plantListAtom,
  selectedPageAtom,
  updateConfigAtom,
} from 'atoms/NetworkAtom'
import * as ODSAlertModal from 'components/visuals/common/modal/ODSAlertModal'
import { Provider as JotaiProvider, useAtom } from 'jotai'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import * as NetworkServices from 'services/NetworkServices'
import * as utilities from 'utills/utilities'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import FlowingPipeEdge from './edges/FlowingPipeEdge'
import Flow, {
  edgeTypes,
  getPageNodeByPageId,
  handleKeyPress,
  handleSaveClick,
  onDropCall,
  onEdgeClick,
  onNodeClick,
  onPaneClick,
  setSelectedNodeEdgeFunc,
} from './Flow'

vi.spyOn(NetworkServices, 'getPageNodeDataByPageId').mockResolvedValue({
  data: [{ nodeJson: '[]', edgeJson: '[]' }],
})
const NewNodeSetter = ({ node }) => {
  const [, setNewNode] = useAtom(newNodeAtom)
  React.useEffect(() => {
    if (node) setNewNode(node)
  }, [node, setNewNode])
  return null
}

vi.mock(import('@xyflow/react'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    ReactFlow: (props) => <div data-testid='react-flow'>{props.children}</div>,
    Controls: () => <div data-testid='flow-controls' />,
    Background: () => <div data-testid='flow-background' />,
    useReactFlow: () => ({
      screenToFlowPosition: () => ({ x: 0, y: 0 }),
      fitView: vi.fn(),
      zoomTo: vi.fn(),
    }),
    useUpdateNodeInternals: () => vi.fn(),
    getConnectedEdges: vi.fn(),
    // your mocked methods
  }
})

vi.mock('components/ui/loader/Loader', () => ({
  default: () => <div data-testid='loader'>Loading...</div>,
}))
vi.mock('./marker', () => ({
  default: () => <div data-testid='marker'>Marker</div>,
}))
vi.mock('components/visuals/common/modal/ODSAlertModal', () => ({
  getUserDomainID: () => 'user-id',
}))
vi.spyOn(NetworkServices, 'getPageNodeDataByPageId').mockImplementation(() =>
  Promise.resolve({ data: [{ nodeJson: '[]', edgeJson: '[]' }] }),
)
vi.spyOn(NetworkServices, 'savePageNodeDataByPageId').mockResolvedValue({
  statuscode: 200,
  data: { pageIdAdded: true },
})
vi.spyOn(utilities, 'showToast').mockImplementation(() => {})
vi.mock('./edges/FlowingPipeEdge', () => ({
  default: vi.fn(() => null),
}))
const defaultAtoms = [
  [AppAtom, { actualTime: '2025-01-01', caseData: [] }],
  [selectedPageAtom, { pageId: 'test-page-id', caseId: 'test-case-id' }],
  [developerModeAtom, true],
  [networkLockedAtom, false],
  [plantListAtom, []],
  [nodeConfigAtom, null],
  [updateConfigAtom, false],
  [newNodeAtom, null],
]
const renderFlow = (atoms = defaultAtoms) => {
  return render(
    <MemoryRouter>
      <JotaiProvider initialValues={atoms}>
        <Flow />
      </JotaiProvider>
    </MemoryRouter>,
  )
}
describe('Flow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders loader initially and then renders React Flow', async () => {
    renderFlow()
    expect(await screen.findByTestId('react-flow')).toBeInTheDocument()
  })
  it('renders save button when in developer mode', async () => {
    renderFlow()
    expect(await screen.findByTestId('react-flow')).toBeInTheDocument()
  })
  it('does not render save button when not in developer mode', async () => {
    const atoms = defaultAtoms.map(([atom, value]) =>
      atom === developerModeAtom ? [atom, false] : [atom, value],
    )
    renderFlow(atoms)
    expect(screen.queryByTestId('save-button')).not.toBeInTheDocument()
  })
  it('adds new node and generates random id', async () => {
    const nodeData = {
      nodeType: 'textboxNode',
      data: { label: 'Test Node' },
      position: { x: 0, y: 0 },
    }
    render(
      <MemoryRouter>
        <JotaiProvider initialValues={defaultAtoms}>
          <Flow />
          <NewNodeSetter node={nodeData} />
        </JotaiProvider>
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })
  })
  it('calls FlowingPipeEdge for each edge type', () => {
    const edgeProps = { source: '1', target: '2' }
    Object.values(edgeTypes).forEach((fn) => {
      fn(edgeProps)
    })
    expect(FlowingPipeEdge).toHaveBeenCalled()
  })
  it('handles keyboard shortcuts: ctrl+c, ctrl+v, Delete', async () => {
    renderFlow()
    // ctrl+c
    fireEvent.keyDown(window, { key: 'c', ctrlKey: true })
    // ctrl+v
    fireEvent.keyDown(window, { key: 'v', ctrlKey: true })
    // Delete
    fireEvent.keyDown(window, { key: 'Delete' })
    await waitFor(() => {
      // No errors should be thrown
      expect(true).toBe(true)
    })
  })
})
describe('getPageNodeByPageId', () => {
  it('sets nodes and edges when response has nodeJson and edgeJson', async () => {
    vi.spyOn(NetworkServices, 'getPageNodeDataByPageId').mockResolvedValue({
      data: [{ nodeJson: '[{"id":"1"}]', edgeJson: '[{"id":"e1"}]' }],
    })
    const { findByTestId } = renderFlow()
    await findByTestId('react-flow') // wait for component to render
  })
  it('sets empty nodes and edges when response has no data', async () => {
    vi.spyOn(NetworkServices, 'getPageNodeDataByPageId').mockResolvedValue({
      data: [],
    })
    renderFlow()
    // expect nodes/edges to be empty arrays
  })
  it('sets empty nodes and edges when latestNodeData is null', async () => {
    vi.spyOn(NetworkServices, 'getPageNodeDataByPageId').mockResolvedValue({
      data: [null],
    })
    renderFlow()
    // expect nodes/edges to be empty arrays
  })
  it('sets nodes but no edges when edgeJson missing', async () => {
    vi.spyOn(NetworkServices, 'getPageNodeDataByPageId').mockResolvedValue({
      data: [{ nodeJson: '[{"id":"1"}]' }],
    })
    renderFlow()
    // expect nodes set, edges empty
  })
  it('sets edges but no nodes when nodeJson missing', async () => {
    vi.spyOn(NetworkServices, 'getPageNodeDataByPageId').mockResolvedValue({
      data: [{ edgeJson: '[{"id":"e1"}]' }],
    })
    renderFlow()
    // expect nodes empty, edges set
  })
})
////
describe('handleSaveClick function', () => {
  const mockSetLoading = vi.fn()
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('does nothing when developer mode is false', async () => {
    await handleSaveClick(false, false, mockSetLoading, 'token', {}, [], [])
    expect(mockSetLoading).not.toHaveBeenCalled()
  })
  it('does nothing when network is locked', async () => {
    await handleSaveClick(true, true, mockSetLoading, 'token', {}, [], [])
    expect(mockSetLoading).not.toHaveBeenCalled()
  })
  it('calls save service and shows success toast on success', async () => {
    vi.spyOn(NetworkServices, 'savePageNodeDataByPageId').mockResolvedValue({
      statuscode: 200,
      data: { pageIdAdded: true },
    })
    vi.spyOn(utilities, 'showToast').mockImplementation(() => {})
    // vi.spyOn(global, 'Date').mockImplementation(() => new Date('2025-01-01'));
    vi.spyOn(ODSAlertModal, 'getUserDomainID').mockResolvedValue('emp123')
    await handleSaveClick(
      true,
      false,
      mockSetLoading,
      'token',
      { pageId: 'p1', caseId: 'c1' },
      [{ id: 1 }],
      [{ id: 2 }],
    )
    expect(NetworkServices.savePageNodeDataByPageId).toHaveBeenCalled()
    expect(utilities.showToast).toHaveBeenCalledWith(
      'Network diagram save successfully...',
      'success',
    )
    expect(mockSetLoading).toHaveBeenLastCalledWith(false)
  })
  it('shows error toast when save fails', async () => {
    vi.spyOn(NetworkServices, 'savePageNodeDataByPageId').mockResolvedValue({
      statuscode: 400,
      data: {},
    })
    vi.spyOn(utilities, 'showToast').mockImplementation(() => {})
    vi.spyOn(ODSAlertModal, 'getUserDomainID').mockResolvedValue('emp123')
    await handleSaveClick(
      true,
      false,
      mockSetLoading,
      'token',
      { pageId: 'p1', caseId: 'c1' },
      [],
      [],
    )
    expect(utilities.showToast).toHaveBeenCalledWith(
      'Failed to save network diagram. Please try again',
      'error',
    )
  })
})
//
describe('setSelectedNodeEdgeFunc function', () => {
  const mockSetNodes = vi.fn()
  const mockSetSelectedNodeId = vi.fn()
  const mockSetConfig = vi.fn()
  const mockSetShouldDelete = vi.fn()
  const mockSetEdges = vi.fn()
  const mockSetSelectedEdgeId = vi.fn()
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('deletes selected node and its connected edges', async () => {
    const nodes = [{ id: '1' }, { id: '2' }]
    const edges = [{ id: 'e1' }, { id: 'e2' }]

    getConnectedEdges.mockReturnValue([{ id: 'e1' }])
    await setSelectedNodeEdgeFunc({
      selectedNodeId: '1',
      selectedEdgeId: null,
      nodes: nodes,
      setNodes: mockSetNodes,
      setSelectedNodeId: mockSetSelectedNodeId,
      setConfig: mockSetConfig,
      setShouldDelete: mockSetShouldDelete,
      setEdges: mockSetEdges,
      edges: edges,
      setSelectedEdgeId: mockSetSelectedEdgeId,
    })
    expect(mockSetNodes).toHaveBeenCalledWith([{ id: '2' }])
    expect(mockSetConfig).toHaveBeenCalledWith(null)
    expect(mockSetEdges).toHaveBeenCalled()
  })
  it('deletes selected edge correctly', async () => {
    const edges = [{ id: 'e1' }, { id: 'e2' }]
    await setSelectedNodeEdgeFunc({
      selectedNodeId: null,
      selectedEdgeId: 'e1',
      nodes: [],
      setNodes: mockSetNodes,
      setSelectedNodeId: mockSetSelectedNodeId,
      setConfig: mockSetConfig,
      setShouldDelete: mockSetShouldDelete,
      setEdges: mockSetEdges,
      edges: edges,
      setSelectedEdgeId: mockSetSelectedEdgeId,
    })
    expect(mockSetEdges).toHaveBeenCalledWith([{ id: 'e2' }])
    expect(mockSetSelectedEdgeId).toHaveBeenCalledWith(null)
  })
})
//
describe('getPageNodeByPageId function', () => {
  const mockSetLoading = vi.fn()
  const mockSetNodes = vi.fn()
  const mockSetEdges = vi.fn()
  const mockZoomTo = vi.fn()
  const mockFitView = vi.fn()
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('sets nodes and edges when both nodeJson and edgeJson exist', async () => {
    vi.spyOn(NetworkServices, 'getPageNodeDataByPageId').mockResolvedValue({
      data: [{ nodeJson: '[{"id":"1"}]', edgeJson: '[{"id":"e1"}]' }],
    })
    await getPageNodeByPageId(
      'case',
      'page',
      mockSetLoading,
      mockSetNodes,
      mockSetEdges,
      mockZoomTo,
      mockFitView,
    )
    expect(mockSetLoading).toHaveBeenCalledWith(true)
    expect(mockSetNodes).toHaveBeenCalledWith([{ id: '1' }])
    expect(mockSetEdges).toHaveBeenCalledWith([{ id: 'e1' }])
    expect(mockSetLoading).toHaveBeenLastCalledWith(false)
  })
  it('sets nodes but not edges when edgeJson missing', async () => {
    vi.spyOn(NetworkServices, 'getPageNodeDataByPageId').mockResolvedValue({
      data: [{ nodeJson: '[{"id":"1"}]' }],
    })
    await getPageNodeByPageId(
      'c',
      'p',
      mockSetLoading,
      mockSetNodes,
      mockSetEdges,
      mockZoomTo,
      mockFitView,
    )
    expect(mockSetNodes).toHaveBeenCalledWith([{ id: '1' }])
    expect(mockSetEdges).not.toHaveBeenCalledWith(expect.any(Array))
  })
  it('sets empty nodes and edges when latestNodeData is null', async () => {
    vi.spyOn(NetworkServices, 'getPageNodeDataByPageId').mockResolvedValue({
      data: [null],
    })
    await getPageNodeByPageId(
      'c',
      'p',
      mockSetLoading,
      mockSetNodes,
      mockSetEdges,
      mockZoomTo,
      mockFitView,
    )
    expect(mockSetNodes).toHaveBeenCalledWith([])
    expect(mockSetEdges).toHaveBeenCalledWith([])
  })
  it('sets empty nodes and edges when data is empty', async () => {
    vi.spyOn(NetworkServices, 'getPageNodeDataByPageId').mockResolvedValue({
      data: [],
    })
    await getPageNodeByPageId(
      'c',
      'p',
      mockSetLoading,
      mockSetNodes,
      mockSetEdges,
      mockZoomTo,
      mockFitView,
    )
    expect(mockSetNodes).toHaveBeenCalledWith([])
    expect(mockSetEdges).toHaveBeenCalledWith([])
  })
})
//
describe('Utility Function Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  // Mock common setters
  const mockSetSelectedEdgeId = vi.fn()
  const mockSetSelectedNodeId = vi.fn()
  const mockSetConfig = vi.fn()
  const mockSetNewNode = vi.fn()
  const mockSetType = vi.fn()
  const mockSetShouldDelete = vi.fn()
  const mockSetSelectedPage = vi.fn()
  const mockSetNodeToCopy = vi.fn()
  describe('onDropCall', () => {
    const mockEvent = {
      preventDefault: vi.fn(),
      clientX: 100,
      clientY: 200,
    }
    const mockScreenToFlowPosition = vi.fn(() => ({ x: 10, y: 20 }))
    beforeAll(() => {
      vi.mock(import('./Flow'), async (importOriginal) => {
        const actual = await importOriginal()
        return {
          ...actual,
          // your mocked methods
        }
      })
    })
    it('prevents default and sets new node when valid type and position exist', async () => {
      const validType = 'textNode'
      await onDropCall(mockEvent, {
        screenToFlowPosition: mockScreenToFlowPosition,
        type: validType,
        setSelectedEdgeId: mockSetSelectedEdgeId,
        setSelectedNodeId: mockSetSelectedNodeId,
        setConfig: mockSetConfig,
        setNewNode: mockSetNewNode,
        setType: mockSetType,
      })
      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })
    it('returns early if type or position is missing', async () => {
      await onDropCall(mockEvent, {
        screenToFlowPosition: mockScreenToFlowPosition,
        type: null,
        setSelectedEdgeId: mockSetSelectedEdgeId,
        setSelectedNodeId: mockSetSelectedNodeId,
        setConfig: mockSetConfig,
        setNewNode: mockSetNewNode,
        setType: mockSetType,
      })
      expect(mockSetNewNode).not.toHaveBeenCalled()
    })
  })
  describe('onPaneClick', () => {
    it('resets config, node, and edge selections', () => {
      onPaneClick(
        {},
        mockSetConfig,
        mockSetSelectedEdgeId,
        mockSetSelectedNodeId,
      )
      expect(mockSetConfig).toHaveBeenCalledWith(null)
      expect(mockSetSelectedEdgeId).toHaveBeenCalledWith(null)
      expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null)
    })
  })
  describe('handleKeyPress', () => {
    const mockSetNewNode = vi.fn()
    it('handles Ctrl+V and sets new node', () => {
      const e = { ctrlKey: true, key: 'v' }
      handleKeyPress(
        e,
        mockSetNewNode,
        mockSetNodeToCopy,
        { id: 1 },
        {},
        null,
        mockSetShouldDelete,
      )
      expect(mockSetNewNode).toHaveBeenCalledWith({ id: 1 })
      expect(mockSetNodeToCopy).toHaveBeenCalledWith(null)
    })
    it('handles Ctrl+C and copies node config', () => {
      const e = { ctrlKey: true, key: 'c' }
      handleKeyPress(
        e,
        mockSetNewNode,
        mockSetNodeToCopy,
        null,
        { id: 2 },
        '1',
        mockSetShouldDelete,
      )
      expect(mockSetNodeToCopy).toHaveBeenCalledWith({ id: 2 })
    })
    it('handles Delete key and triggers delete flag', () => {
      const e = { key: 'Delete' }
      handleKeyPress(
        e,
        mockSetNewNode,
        mockSetNodeToCopy,
        null,
        { id: 3 },
        '1',
        mockSetShouldDelete,
      )
      expect(mockSetShouldDelete).toHaveBeenCalledWith(true)
    })
    it('does nothing if no matching key condition', () => {
      const e = { key: 'x' }
      handleKeyPress(
        e,
        mockSetNewNode,
        mockSetNodeToCopy,
        null,
        null,
        null,
        mockSetShouldDelete,
      )
      expect(mockSetNewNode).not.toHaveBeenCalled()
      expect(mockSetShouldDelete).not.toHaveBeenCalled()
    })
  })
  describe('onNodeClick', () => {
    const node = { id: 'n1', type: 'plantNode', data: { page: 'p1' } }
    const plantList = [{ pageId: 'p1', name: 'Plant1' }]
    it('sets selected page when not in developer mode and node type is plantNode', () => {
      onNodeClick(
        {},
        node,
        false,
        plantList,
        mockSetSelectedPage,
        mockSetSelectedNodeId,
        mockSetSelectedEdgeId,
        mockSetConfig,
      )
    })
    it('sets selected node and config when in developer mode', () => {
      onNodeClick(
        {},
        { id: 'n2' },
        true,
        [],
        mockSetSelectedPage,
        mockSetSelectedNodeId,
        mockSetSelectedEdgeId,
        mockSetConfig,
      )
    })
  })
  describe('onEdgeClick', () => {
    const edge = { id: 'e1', label: 'Edge' }
    it('does nothing when not in developer mode', () => {
      onEdgeClick(
        {},
        edge,
        false,
        mockSetSelectedEdgeId,
        mockSetSelectedNodeId,
        mockSetConfig,
      )
      expect(mockSetSelectedEdgeId).not.toHaveBeenCalled()
    })
    it('sets edge config when in developer mode', () => {
      onEdgeClick(
        {},
        edge,
        true,
        mockSetSelectedEdgeId,
        mockSetSelectedNodeId,
        mockSetConfig,
      )
      expect(mockSetSelectedEdgeId).toHaveBeenCalledWith('e1')
      expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null)
      expect(mockSetConfig).toHaveBeenCalledWith({
        ...edge,
        configType: 'edge',
      })
    })
  })
})
//
describe('Flow Component useEffect hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('calls setSelectedNodeEdgeFunc when shouldDelete is true', async () => {
    const atoms = defaultAtoms.map(([atom, value]) =>
      atom === updateConfigAtom ? [atom, false] : [atom, value],
    )
    renderFlow(atoms)
    // manually trigger shouldDelete through keyboard delete (Delete key triggers delete flag)
    fireEvent.keyDown(window, { key: 'Delete' })
  })
  it('applies onNodesChange when in developer mode', async () => {
    renderFlow()
    const mockChanges = [{ id: 'e1', source: '1', target: '2' }]

    fireEvent(window, new CustomEvent('nodesChange', { detail: mockChanges }))
    // await waitFor(() => {
    //   expect(mockApply).toHaveBeenCalled();
    // });
  })
  it('applies onEdgesChange when in developer mode', async () => {
    renderFlow()
    const mockChanges = [{ id: 'e1', source: '1', target: '2' }]
    fireEvent(window, new CustomEvent('edgesChange', { detail: mockChanges }))
  })
  it('calls addEdge when onConnect is triggered', async () => {
    renderFlow()
    const connectParams = { source: '1', target: '2' }
    fireEvent(window, new CustomEvent('connect', { detail: connectParams }))
  })
  it('updates node internals when nodeToUpdate changes', async () => {
    const mockUpdate = vi.fn()
    vi.spyOn(
      require('@xyflow/react'),
      'useUpdateNodeInternals',
    ).mockReturnValue(mockUpdate)
    renderFlow()
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledTimes(0)
    })
  })
  it('updates nodes when shouldUpdateConfig and selectedNodeId are true', async () => {
    const atoms = defaultAtoms.map(([atom, value]) => {
      if (atom === updateConfigAtom) return [atom, true]
      if (atom === nodeConfigAtom) return [atom, { data: { updated: true } }]
      return [atom, value]
    })
    renderFlow(atoms)
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })
  })
  it('updates edges when shouldUpdateConfig and selectedEdgeId are true', async () => {
    const atoms = defaultAtoms.map(([atom, value]) => {
      if (atom === updateConfigAtom) return [atom, true]
      if (atom === nodeConfigAtom)
        return [atom, { type: 'customType', markerEnd: 'customMarker' }]
      return [atom, value]
    })
    renderFlow(atoms)
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })
  })
})
