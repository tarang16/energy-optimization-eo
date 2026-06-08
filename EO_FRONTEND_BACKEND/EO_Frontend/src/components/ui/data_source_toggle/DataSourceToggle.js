import { DATA_SOURCE, DataSourceAtom } from 'atoms/DataSourceAtom'
import { useAtom } from 'jotai'
import classes from './DataSourceToggle.module.scss'

/**
 * Two-state toggle that switches the EO data view between:
 *   - DB     (production pipeline rows, [source]='db')
 *   - PYTHON (rows written by the local Python pipeline, [source]='python')
 *
 * Persists via DataSourceAtom (localStorage). The _post axios wrapper reads
 * the same key on every request and appends ?source=<value> to the URL, so
 * callers don't need to thread the value through every service file.
 */
export default function DataSourceToggle() {
  const [source, setSource] = useAtom(DataSourceAtom)
  const isPython = source === DATA_SOURCE.PYTHON

  const handleToggle = () => {
    const next = isPython ? DATA_SOURCE.DB : DATA_SOURCE.PYTHON
    setSource(next)
    // Hard reload so any in-flight queries / cached page state pick up the new source.
    // Most EO pages fetch on mount, so this guarantees a clean swap.
    window.location.reload()
  }

  return (
    <div
      className={classes.container}
      title={`Data source: ${isPython ? 'Python (local pipeline)' : 'DB (production)'}`}
      data-testid='data-source-toggle'
    >
      <span
        className={`${classes.label} ${!isPython ? classes.labelActive : ''}`}
      >
        DB
      </span>
      <button
        type='button'
        role='switch'
        aria-checked={isPython}
        aria-label='Toggle data source between DB and Python'
        className={`${classes.track} ${isPython ? classes.trackOn : ''}`}
        onClick={handleToggle}
      >
        <span className={`${classes.thumb} ${isPython ? classes.thumbOn : ''}`} />
      </button>
      <span
        className={`${classes.label} ${isPython ? classes.labelActiveOrange : ''}`}
      >
        PYTHON
      </span>
    </div>
  )
}
