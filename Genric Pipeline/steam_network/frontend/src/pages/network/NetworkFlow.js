import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Loader from 'components/ui/loader/Loader'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  getTopology,
  loadDemoRefinery,
  resetNetwork,
  solveNetwork,
} from 'services/api'
import classes from './NetworkFlow.module.scss'

const TYPE_COLOR = {
  header: '#009fdf',
  source: '#07844e',
  consumer: '#e35205',
  prds: '#bc8cff',
  turbine: '#ffcd00',
  condenser: '#56d4dd',
  valve: '#f778ba',
  condensate_return: '#9ac2f6',
  deaerator: '#58a6ff',
  flash_drum: '#f0883e',
  vent: '#939598',
  makeup_water: '#42c5f5',
  pump: '#3fb950',
  attemperator: '#d2691e',
}

function buildGraph(topology) {
  const apiNodes = topology?.nodes ?? []
  const apiEdges = topology?.edges ?? []
  const cols = Math.max(1, Math.ceil(Math.sqrt(apiNodes.length || 1)))

  const nodes = apiNodes.map((n, i) => ({
    id: n.id,
    position: { x: (i % cols) * 240, y: Math.floor(i / cols) * 140 },
    data: { label: `${n.name}\n(${n.type})` },
    style: {
      padding: '10px 14px',
      borderRadius: 10,
      border: `2px solid ${TYPE_COLOR[n.type] || '#4a5a80'}`,
      background: '#ffffff',
      fontSize: 12,
      whiteSpace: 'pre-line',
      minWidth: 140,
      textAlign: 'center',
    },
  }))

  const edges = apiEdges.map((e, i) => ({
    id: `${e.from}-${e.to}-${i}`,
    source: e.from,
    target: e.to,
    label: e.from_port && e.to_port ? `${e.from_port}→${e.to_port}` : undefined,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#4a5a80', strokeWidth: 2 },
  }))

  return { nodes, edges }
}

export default function NetworkFlow() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const topo = await getTopology()
      setGraph(buildGraph(topo))
    } catch (e) {
      toast.error(`Failed to load topology: ${e?.message ?? e}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleLoadDemo = async () => {
    try {
      await loadDemoRefinery()
      toast.success('Loaded refinery demo')
      await refresh()
    } catch (e) {
      toast.error(`Demo load failed: ${e?.message ?? e}`)
    }
  }
  const handleReset = async () => {
    if (!confirm('Reset the in-memory network?')) return
    await resetNetwork()
    toast.success('Network reset')
    await refresh()
  }
  const handleSolve = async () => {
    try {
      toast.loading('Solving…', { id: 'solve' })
      const res = await solveNetwork()
      toast.success(
        `Solved (${res?.status ?? 'ok'})`,
        { id: 'solve' },
      )
    } catch (e) {
      toast.error(`Solve failed: ${e?.response?.data?.detail ?? e?.message}`, {
        id: 'solve',
      })
    }
  }

  const legend = useMemo(
    () => Object.entries(TYPE_COLOR),
    [],
  )

  return (
    <div className={classes.wrapper}>
      <div className={classes.toolbar}>
        <button className={classes.btnPrimary} onClick={handleSolve}>
          Solve
        </button>
        <button className={classes.btnGhost} onClick={handleLoadDemo}>
          Load Demo Refinery
        </button>
        <button className={classes.btnGhost} onClick={refresh}>
          Refresh
        </button>
        <button className={classes.btnDanger} onClick={handleReset}>
          Reset
        </button>
        <div className={classes.legend}>
          {legend.map(([t, c]) => (
            <span key={t} className={classes.legendItem}>
              <span className={classes.swatch} style={{ background: c }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className={classes.canvas}>
        {loading ? (
          <Loader />
        ) : graph.nodes.length === 0 ? (
          <div className={classes.empty}>
            <p className='text-16-bold'>Network is empty</p>
            <p className='text-13-regular text_primary_gray_2 mt-2'>
              Click <strong>Load Demo Refinery</strong> to populate the network,
              or add components from the Components page.
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={graph.nodes}
            edges={graph.edges}
            fitView
            nodesDraggable
            nodesConnectable={false}
          >
            <Background gap={20} />
            <Controls />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}
