import BreadCrumb from 'components/ui/breadcrumb/BreadCrumb'
import Footer from 'components/ui/footer/Footer'
import Header from 'components/ui/header/Header'
import Sidebar from 'components/ui/sidebar/Sidebar'
import { Outlet } from 'react-router-dom'
import classes from './RootLayout.module.scss'

export default function RootLayout() {
  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Header />
      </div>
      <div className={classes.headerDiv} />

      <div className={`${classes.content} d-flex`}>
        <div className={classes.sidebar}>
          <Sidebar />
        </div>
        <div className={classes.main}>
          <div
            className={`${classes.topContainer} d-flex justify-content-between align-items-center`}
          >
            <BreadCrumb />
          </div>
          <div className={classes.bottomContainer}>
            <Outlet />
          </div>
        </div>
      </div>

      <div className={classes.footerDiv} />
      <div className={`bg_primary_white ${classes.footer}`}>
        <Footer />
      </div>
    </div>
  )
}
