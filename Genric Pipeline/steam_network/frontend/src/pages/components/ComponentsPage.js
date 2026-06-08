import Loader from 'components/ui/loader/Loader'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  bulkUploadCsv,
  deleteComponent,
  getTopology,
  updateComponent,
} from 'services/api'
import classes from './ComponentsPage.module.scss'

export default function ComponentsPage() {
  const [topology, setTopology] = useState({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [draftSpec, setDraftSpec] = useState({})
  const fileRef = useRef(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const topo = await getTopology()
      setTopology(topo)
    } catch (e) {
      toast.error(`Load failed: ${e?.message ?? e}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const selected = useMemo(
    () => topology.nodes.find((n) => n.id === selectedId) ?? null,
    [topology, selectedId],
  )

  useEffect(() => {
    setDraftSpec(selected?.metadata?.spec ?? {})
  }, [selectedId])

  const handleFieldChange = (key, value) => {
    setDraftSpec((p) => ({ ...p, [key]: value }))
  }

  const handleSave = async () => {
    if (!selected) return
    try {
      await updateComponent(selected.id, {
        type: selected.type,
        spec: draftSpec,
      })
      toast.success(`Updated ${selected.name}`)
      await refresh()
    } catch (e) {
      toast.error(`Update failed: ${e?.response?.data?.detail ?? e?.message}`)
    }
  }

  const handleDelete = async () => {
    if (!selected || !confirm(`Delete ${selected.name}?`)) return
    try {
      await deleteComponent(selected.id)
      toast.success('Deleted')
      setSelectedId(null)
      await refresh()
    } catch (e) {
      toast.error(`Delete failed: ${e?.response?.data?.detail ?? e?.message}`)
    }
  }

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await bulkUploadCsv(file)
      toast.success(`Updated ${res.updated_parameters} parameters`)
      if (res.errors?.length) {
        console.warn('Bulk upload errors:', res.errors)
      }
      await refresh()
    } catch (err) {
      toast.error(`Upload failed: ${err?.message}`)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.list}>
        <div className={classes.listHeader}>
          <span className='text-14-bold'>Components ({topology.nodes.length})</span>
          <div className='d-flex gap-1'>
            <button
              className={classes.smallBtn}
              onClick={() => fileRef.current?.click()}
            >
              Upload CSV
            </button>
            <input
              ref={fileRef}
              type='file'
              accept='.csv'
              className='d-none'
              onChange={handleCsvUpload}
            />
            <button className={classes.smallBtn} onClick={refresh}>
              Refresh
            </button>
          </div>
        </div>
        {loading ? (
          <Loader />
        ) : (
          <ul className={classes.itemList}>
            {topology.nodes.map((n) => (
              <li
                key={n.id}
                className={`${classes.item} ${
                  n.id === selectedId ? classes.itemActive : ''
                }`}
                onClick={() => setSelectedId(n.id)}
              >
                <span className={classes.itemName}>{n.name}</span>
                <span className={classes.itemType}>{n.type}</span>
              </li>
            ))}
            {topology.nodes.length === 0 && (
              <li className={classes.empty}>
                No components — load the demo or import a topology.
              </li>
            )}
          </ul>
        )}
      </div>

      <div className={classes.detail}>
        {!selected ? (
          <div className={classes.placeholder}>
            <p className='text-15-regular'>Select a component to edit its spec.</p>
          </div>
        ) : (
          <>
            <div className={classes.detailHeader}>
              <div>
                <p className='text-16-bold'>{selected.name}</p>
                <p className='text-12-regular text_primary_gray_2'>
                  {selected.type} &middot; {selected.id}
                </p>
              </div>
              <div className='d-flex gap-2'>
                <button className={classes.savePrimary} onClick={handleSave}>
                  Save
                </button>
                <button className={classes.dangerBtn} onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
            <div className={classes.fields}>
              {Object.keys(draftSpec).length === 0 && (
                <p className='text-13-regular text_primary_gray_2'>
                  This component has no editable spec exposed.
                </p>
              )}
              {Object.entries(draftSpec).map(([k, v]) => (
                <label key={k} className={classes.field}>
                  <span className={classes.fieldLabel}>{k}</span>
                  <input
                    className={classes.fieldInput}
                    value={v ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      const num = Number(raw)
                      handleFieldChange(
                        k,
                        raw !== '' && !Number.isNaN(num) && typeof v === 'number'
                          ? num
                          : raw,
                      )
                    }}
                  />
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
