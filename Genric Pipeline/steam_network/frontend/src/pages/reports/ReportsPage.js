import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  reportExcelUrl,
  reportStatus,
  reportWordUrl,
  solveNetwork,
} from 'services/api'
import classes from './ReportsPage.module.scss'

export default function ReportsPage() {
  const [status, setStatus] = useState({ excel: null, word: null })
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setStatus(await reportStatus())
    } catch (e) {
      toast.error(`Status fetch failed: ${e?.message}`)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleSolveAndRegenerate = async () => {
    setBusy(true)
    try {
      toast.loading('Solving and regenerating reports…', { id: 'solve' })
      await solveNetwork()
      toast.success('Reports regenerated', { id: 'solve' })
      await refresh()
    } catch (e) {
      toast.error(`Solve failed: ${e?.response?.data?.detail ?? e?.message}`, {
        id: 'solve',
      })
    } finally {
      setBusy(false)
    }
  }

  const ReportCard = ({ title, info, downloadUrl }) => (
    <div className={classes.card}>
      <div className={classes.cardHead}>
        <p className='text-16-bold'>{title}</p>
        <span
          className={`${classes.badge} ${
            info ? classes.badgeReady : classes.badgeMissing
          }`}
        >
          {info ? 'Ready' : 'Not generated'}
        </span>
      </div>
      {info ? (
        <div className={classes.meta}>
          <div>
            <span className={classes.metaLabel}>Size</span>
            <span>{info.size_kb} KB</span>
          </div>
          <div>
            <span className={classes.metaLabel}>Modified</span>
            <span>{new Date(info.modified).toLocaleString()}</span>
          </div>
          <div className={classes.path}>{info.path}</div>
        </div>
      ) : (
        <p className='text-13-regular text_primary_gray_2'>
          Run Solve to generate this report.
        </p>
      )}
      <a
        href={downloadUrl}
        className={`${classes.downloadBtn} ${
          info ? '' : classes.downloadDisabled
        }`}
        onClick={(e) => {
          if (!info) e.preventDefault()
        }}
      >
        Download
      </a>
    </div>
  )

  return (
    <div className={classes.wrapper}>
      <div className={classes.toolbar}>
        <button
          className={classes.primaryBtn}
          onClick={handleSolveAndRegenerate}
          disabled={busy}
        >
          {busy ? 'Working…' : 'Solve & Regenerate Reports'}
        </button>
        <button className={classes.ghostBtn} onClick={refresh}>
          Refresh Status
        </button>
      </div>

      <div className={classes.grid}>
        <ReportCard
          title='Excel Report'
          info={status.excel}
          downloadUrl={reportExcelUrl()}
        />
        <ReportCard
          title='Word Report'
          info={status.word}
          downloadUrl={reportWordUrl()}
        />
      </div>
    </div>
  )
}
