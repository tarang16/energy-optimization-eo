import networkIcon from 'assets/sabic_icons/sidebar/network.svg'
import optimizationIcon from 'assets/sabic_icons/sidebar/optimization.svg'
import overviewIcon from 'assets/sabic_icons/sidebar/overview.svg'
import healthIcon from 'assets/sabic_icons/sidebar/health_check_report.svg'
import { NavLink } from 'react-router-dom'
import classes from './Sidebar.module.scss'

const NAV = [
  { path: '/', label: 'Network', icon: networkIcon, end: true },
  { path: '/components', label: 'Components', icon: optimizationIcon },
  { path: '/reports', label: 'Reports', icon: healthIcon },
]

export default function Sidebar() {
  return (
    <nav className={classes.sidebar}>
      <div className={classes.brand}>
        <img src={overviewIcon} alt='' className={classes.brandIcon} />
        <span className={classes.brandText}>Steam Network</span>
      </div>
      <ul className={classes.navList}>
        {NAV.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `${classes.navLink} ${isActive ? 'active' : 'inactive'}`
              }
            >
              <span className={classes.navIconWrap}>
                <img src={item.icon} alt='' />
              </span>
              <span className={classes.navLabel}>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
