import { useLocation } from 'react-router-dom'

const TITLES = {
  '': 'Network',
  components: 'Components',
  reports: 'Reports',
}

export default function BreadCrumb() {
  const location = useLocation()
  const seg = location.pathname.replace(/^\//, '').split('/')[0] || ''
  const title = TITLES[seg] ?? seg

  return (
    <div className='d-flex align-items-center'>
      <span
        className='text-14-bold sabic_bold'
        style={{
          textTransform: 'uppercase',
          letterSpacing: '0.05vmin',
          color: '#041e41',
        }}
      >
        {title}
      </span>
    </div>
  )
}
