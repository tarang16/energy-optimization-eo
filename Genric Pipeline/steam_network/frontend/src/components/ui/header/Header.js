import energyOptimizationIcon from 'assets/sabic_icons/header/energy_optimization_logo.svg'
import logoutIcon from 'assets/sabic_icons/header/logout.svg'
import notificationIcon from 'assets/sabic_icons/header/notification_icon.svg'
import sabicIcon from 'assets/sabic_icons/sabic/sabic_logo.svg'
import userProfileIcon from 'assets/sabic_icons/header/userProfileIcon.svg'
import { Link } from 'react-router-dom'
import classes from './Header.module.scss'

export default function Header() {
  return (
    <div
      className={`d-flex h-100 w-100 align-items-center justify-content-between bg_primary_white ${classes.headerContainer}`}
    >
      <div className={classes.PEHeading}>
        <Link to={'/'}>
          <img alt='Energy Optimization' src={energyOptimizationIcon} />
        </Link>
      </div>

      <div className='d-flex align-items-center h-100'>
        <div
          className={`h-100 d-flex align-items-center ${classes.iconsContainer} justify-content-end`}
        >
          <div className={`${classes.imgContainer} d-flex align-items-center`}>
            <span className={classes.img}>
              <img src={notificationIcon} alt='Notifications' />
            </span>
          </div>
          <div className={`${classes.imgContainer} d-flex align-items-center`}>
            <button className={classes.bellIconBtn} title='Logout'>
              <img src={logoutIcon} alt='Logout' />
            </button>
          </div>

          <div
            className={`${classes.profileContainer} position-relative h-100 d-flex align-items-center me-5`}
          >
            <div className={classes.userIconContainer}>
              <img src={userProfileIcon} alt='User' />
            </div>
            <div className='ps-2'>
              <p className={`text_primary_blue ${classes.welcomeText}`}>Welcome</p>
              <p className={`text_primary_gray ${classes.nameText}`}>Engineer</p>
              <p className={`text_primary_gray_2 ${classes.roleText}`}>
                Steam Network
              </p>
            </div>
          </div>
        </div>

        <div
          className={`h-100 d-flex align-items-center justify-content-end ${classes.sabicIcon}`}
        >
          <img src={sabicIcon} alt='SABIC' />
        </div>
      </div>
    </div>
  )
}
