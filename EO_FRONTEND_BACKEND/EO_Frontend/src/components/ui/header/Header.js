import emailIcon from 'assets/sabic_icons/common/emailIcon.svg'
import backarrowIcon from 'assets/sabic_icons/header/backarrowIcon.svg'
import energyOptimizationIcon from 'assets/sabic_icons/header/energy_optimization_logo.svg'
import logoutIcon from 'assets/sabic_icons/header/logout.svg'
import userIcon from 'assets/sabic_icons/header/super_admin_default.svg'
import userProfileIcon from 'assets/sabic_icons/header/userProfileIcon.svg'
import sabicIcon from 'assets/sabic_icons/sabic/sabic_logo.svg'
import helpIcon from 'assets/sabic_new_icons/helpActiveIcon.svg'
import { AppAtom } from 'atoms/AppAtom'
import { TokenAtom, userWorkflowCountAtom } from 'atoms/RootAtom'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import DataSourceToggle from 'components/ui/data_source_toggle/DataSourceToggle'
import SimpleTable from 'components/visuals/table/SimpleTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { ROLES } from 'config/Config'
import { env } from 'config/env'
import { useAtomValue } from 'jotai'
import Logger from 'logger/Logger'
import moment from 'moment'
import AffImageUrls from 'pages/affiliates/AffiliateUrls'
import { useEffect, useState } from 'react'
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { Tooltip } from 'react-tooltip'
import { getUserStatisticsOnlineUser } from 'services/AdminServices'
import { logout } from 'services/ConfigServices'
import { slugToText, toTitleCase } from 'utills/utilities'
import classes from './Header.module.scss'
export function generateUserName(obj) {
  if (obj?.lastName && obj?.firstName) {
    if (obj?.lastName?.toLowerCase() === obj?.firstName?.toLowerCase()) {
      return `${obj?.lastName}`
    } else {
      return `${obj?.lastName}, ${obj?.firstName}`
    }
  } else {
    return obj?.employeeName
  }
}
const Header = ({ withNav = true }) => {
  const navigate = useNavigate()
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  const token = useAtomValue(TokenAtom)
  const access = token?.access
  const [logo, setLogo] = useState(sabicIcon)
  const [userImg, setUserImg] = useState(userProfileIcon)
  const [userName, setUserName] = useState('')
  const userWorkflowCount = useAtomValue(userWorkflowCountAtom)
  const [userOnlineData, setUserOnlineData] = useState([])
  const [userOnlineModal, setUserOnlineModal] = useState(false)
  const caseData = appContext?.caseData || []
  const USER_ONLINE_TABLE_HEADER = [
    'User',
    'session start time',
    'Current Screen',
  ]
  if (!token?.isValid) {
    withNav = false
  }
  const location = useLocation()
  useEffect(() => {
    let headerIcon = sabicIcon
    if (params?.region && params?.affiliate) {
      const affiliate = slugToText(params.affiliate)
        ?.toLowerCase()
        .replace(/ /g, '')
        .replace(/_/g, '')
        .replace(/-/g, '')
      if (Object?.keys(AffImageUrls)?.includes(affiliate)) {
        headerIcon = AffImageUrls[affiliate]
      }
    }
    setLogo((p) => headerIcon)
  }, [params])
  useEffect(() => {
    if (token?.decodedToken?.uid && userName === '') {
      const resp = {
        email: token?.decodedToken?.email,
        firstName: token?.decodedToken?.firstName,
        lastName: token?.decodedToken?.lastName,
        time_zone: token?.decodedToken?.time_zone,
      }
      if (resp.email) {
        setUserImg(
          `https://mail.sabic.com/api/v2.0/Users('${resp.email}')/photo/$value`,
        )
      } else {
        setUserImg(userProfileIcon)
      }
      setUserName(`${generateUserName(resp)}` || '')
    }
  }, [token])
  useEffect(() => {
    const fetchAndSetData = async () => {
      if (!token?.isAdminUser) return
      if (!location.pathname.includes('activity-tracker/UserStatistics')) return
      try {
        const response = await getUserStatisticsOnlineUser()
        if (response.statuscode === 200 && response?.data?.length > 0) {
          const respArr = response.data.map((obj) => [
            <p
              key={obj?.employeeID}
              className='text-14-regular text-center'
              data-static-id='Header.js_p_2b530b'
            >{`${obj.employeeName} (${obj.employeeID})`}</p>,
            <p
              key={obj?.lastAccessedTimeEpoch}
              className='text-14-regular text-center d-block mb-0'
              data-static-id='Header.js_p_2b20cf'
            >{`${obj.lastAccessedTimeEpoch ? moment(obj.lastAccessedTimeEpoch).format('DD-MMM-YY hh:mm A') : '-'}`}</p>,
            <p
              key={obj?.screenName}
              className='text-14-regular text-center d-block mb-0'
              data-static-id='Header.js_p_17d898'
            >{`${obj.screenName}`}</p>,
          ])
          setUserOnlineData(respArr)
        } else {
          setUserOnlineData([])
        }
      } catch (error) {
        Logger.error('Error fetching users online data:', error)
        setUserOnlineData([])
      }
    }
    fetchAndSetData()
  }, [location?.pathname])
  function getDisplayRole(roleName) {
    if (roleName == ROLES.PARTIAL_CORPORATE) {
      return 'USER'
    } else if (roleName == ROLES.USER) {
      return 'AFFILIATE USER'
    } else {
      return access?.role?.replaceAll('_', ' ')
    }
  }
  const checkRole = (access) => {
    return (
      access?.role === ROLES.ADMIN ||
      access?.role === ROLES.CORPORATE ||
      access?.role === ROLES.PARTIAL_CORPORATE ||
      access?.role === ROLES.USER
    )
  }
  const checkAdminRole = (access) => {
    return access?.role === ROLES.ADMIN || access?.workflowRoleApi == '1'
  }
  function getAdminUrl(access) {
    if (access?.role == ROLES.ADMIN) {
      return '/admin/user-management-roles'
    } else if (access?.workflowRoleApi == '1') {
      return '/admin/features'
    }
  }
  return (
    <div
      className={`d-flex h-100 w-100 align-items-center justify-content-between position-relative bg_primary_white ${classes.headerContainer}`}
      data-static-id='Header.js_div_03c40b'
    >
      <div
        className={`${classes.PEHeading}`}
        data-static-id='Header.js_div_f4afa2'
      >
        <Link to={'/'} data-static-id='Header.js_Link_99785d'>
          <img
            alt='energyOptionIocn'
            src={energyOptimizationIcon}
            data-static-id='Header.js_img_33cbf0'
          />
        </Link>
      </div>
      <div
        className='d-flex align-items-center justify-content-center h-100'
        data-static-id='Header.js_div_6509e9'
      >
        <div
          className={`h-100 d-flex align-items-center ${classes.iconsContainer} justify-content-end`}
          data-static-id='Header.js_div_98be1f'
        >
          {withNav && checkRole(access) && (
            <div
              className={`${classes.imgContainer} d-flex align-items-center justify-content-end p-0 m-0 position-relative`}
              data-static-id='Header.js_div_1a249a'
            >
              {location?.pathname.includes('inbox_workflow') ? (
                <>
                  <img
                    className={`me-3 ${classes.backarrowIcon}`}
                    src={backarrowIcon}
                    alt='inbox_workflow Icon'
                    id='backArrow-Icon'
                    onClick={() => {
                      TRACKEVENTOBJ.header.backOnClick({
                        params,
                        caseData,
                        pathname: location.pathname,
                      })
                      navigate(-1)
                    }}
                    data-tooltip-id='back'
                    data-static-id='Header.js_img_caed42'
                  />
                </>
              ) : (
                <>
                  <NavLink
                    className={`me-3 ${classes.img} ${location?.pathname.includes('inbox_workflow-') ? 'active' : ''} position-relative overflow-visible`}
                    to={'inbox_workflow'}
                    data-tooltip-id='inbox_workflow'
                    data-static-id='Header.js_NavLink_fecdec'
                  >
                    <img
                      src={emailIcon}
                      alt='inbox_workflow Icon'
                      id='inbox_workflow-Icon'
                      onClick={() => {
                        TRACKEVENTOBJ.header.inboxWorkflowOnClick({
                          params,
                          caseData,
                          pathname: location.pathname,
                        })
                      }}
                      data-static-id='Header.js_img_bef25a'
                    />
                    {userWorkflowCount ? (
                      <span
                        className={`text-10-bold position-absolute end-0 text_primary_gray border_primary_gray_2 bg_primary_gray_4 ${classes.workflowCount}`}
                        data-static-id='Header.js_span_c1c543'
                      >
                        {userWorkflowCount}
                      </span>
                    ) : (
                      ''
                    )}
                  </NavLink>
                  <Tooltip
                    className={'tooltip_container lightTooltipBackground'}
                    id='inbox_workflow'
                    role='tooltip'
                    style={{
                      zIndex: 9999,
                    }}
                    place='top'
                    type='light'
                    // isOpen={true}
                    data-static-id='Header.js_Tooltip_dbb103'
                  >
                    <span
                      className='text-12-regular d-block text-center'
                      data-static-id='Header.js_span_e26043'
                    >
                      workflow
                    </span>
                  </Tooltip>
                </>
              )}
            </div>
          )}
          {withNav && checkRole(access) && (
            <div
              className='d-flex align-items-center justify-content-end p-0 me-3'
              data-static-id='Header.js_div_dataSourceToggle'
            >
              <DataSourceToggle />
            </div>
          )}
          <div
            className={`${classes.imgContainer} d-flex align-items-center justify-content-end p-0 m-0`}
            data-static-id='Header.js_div_d5176a'
          >
            <a
              className={`me-3 ${classes.img} ${classes.ecm_icon}`}
              href={
                env.EO_HELP_URL ||
                'https://talabi.sabic.com/dwp/rest/share/OJSXG33VOJRWKVDZOBST2Q2BKRAUYT2HL5BUCVCFI5HVEWJGORSW4YLOOREWIPJQGAYDAMBQGAYDAMBQGAYDAMJGOJSXG33VOJRWKSLEHUYTKNJQGETHG33VOJRWKVDZOBST2U2CIUTHA4TPOZUWIZLSKNXXK4TDMVHGC3LFHVJUERI='
              }
              target='_blank'
              rel='noreferrer'
              data-static-id='Header.js_a_7adcd2'
            >
              <img
                src={helpIcon}
                alt='Help Icon'
                id='Help-Icon'
                data-tooltip-id='help'
                onClick={() => {
                  TRACKEVENTOBJ.header.helpOnClick({
                    params,
                    caseData,
                    pathname: location.pathname,
                  })
                }}
                data-static-id='Header.js_img_d7d58e'
              />
            </a>
          </div>

          {withNav && checkRole(access) && (
            <>
              <div
                className={`${classes.imgContainer} d-flex align-items-center justify-content-end p-0 m-0`}
                data-static-id='Header.js_div_fb6cb3'
              >
                {checkAdminRole(access) && (
                  <>
                    {!location?.pathname.includes('admin') ? (
                      <>
                        <NavLink
                          className={`me-3 ${classes.img} ${location?.pathname.includes('user-management-') ? 'active' : ''}`}
                          to={getAdminUrl(access)}
                          data-tooltip-id='userManagement'
                          data-static-id='Header.js_NavLink_d250c2'
                        >
                          <img
                            src={userIcon}
                            alt='userManagement Icon'
                            id='userManagementIcon'
                            onClick={() => {
                              TRACKEVENTOBJ.header.adminOnClick({
                                params,
                                caseData,
                                pathname: location.pathname,
                              })
                            }}
                            data-static-id='Header.js_img_c2b013'
                          />
                        </NavLink>

                        <Tooltip
                          className={'tooltip_container lightTooltipBackground'}
                          id='userManagement'
                          role='tooltip'
                          style={{
                            zIndex: 9999,
                          }}
                          place='top'
                          type='light'
                          // isOpen={true}
                          data-static-id='Header.js_Tooltip_24b947'
                        >
                          <span
                            className='text-12-regular d-block text-center'
                            data-static-id='Header.js_span_6cd6f5'
                          >
                            Admin
                          </span>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <img
                          className={`me-3 ${classes.backarrowIcon}`}
                          src={backarrowIcon}
                          alt='userManagement Icon'
                          id='userManagementBackicon'
                          onClick={() => {
                            TRACKEVENTOBJ.header.adminBackOnClick({
                              params,
                              caseData,
                              pathname: location.pathname,
                            })
                            navigate(-1)
                          }}
                          data-tooltip-id='back'
                          data-static-id='Header.js_img_bb0ea3'
                        />
                      </>
                    )}
                  </>
                )}
                <button
                  className={`me-3 ${classes.bellIconBtn}`}
                  onClick={async () => {
                    TRACKEVENTOBJ.header.logoutOnClick({
                      params,
                      caseData,
                      pathname: location?.pathname,
                    })
                    const isConfirmed = window.confirm(
                      'Are you sure you want to logout?',
                    )
                    if (isConfirmed) {
                      logout()
                        .then(() => {
                          localStorage.clear()
                          navigate('/logout')
                        })
                        .finally(() => {
                          localStorage.clear()
                          navigate('/logout')
                        })
                    }
                  }}
                  data-tooltip-id='logout'
                  data-static-id='Header.js_button_9c194d'
                >
                  <img
                    className={`${classes.img}`}
                    src={logoutIcon}
                    alt='Logout'
                    data-static-id='Header.js_img_101c88'
                  />
                </button>
                <Tooltip
                  className={'tooltip_container lightTooltipBackground'}
                  id='logout'
                  role='tooltip'
                  style={{
                    zIndex: 9999,
                  }}
                  place='top'
                  type='light'
                  // isOpen={true}
                  data-static-id='Header.js_Tooltip_3cf10f'
                >
                  <span
                    className='text-12-regular d-block text-center'
                    data-static-id='Header.js_span_159090'
                  >
                    Logout
                  </span>
                </Tooltip>
              </div>

              <div
                className={`${classes.profileContainer} position-relative h-100 d-flex align-items-center justify-content-start me-5 `}
                data-static-id='Header.js_div_058334'
              >
                <div
                  className={`${classes.userIconContainer} d-flex flex-column align-items-end justify-content-center`}
                  data-static-id='Header.js_div_dc0fef'
                >
                  <img
                    src={userImg}
                    id='userImg'
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null
                      currentTarget.src = userProfileIcon
                    }}
                    data-static-id='Header.js_img_1be8ce'
                  />
                </div>

                <div className={'ps-2'} data-static-id='Header.js_div_c19971'>
                  <p
                    className={`p-0 text_primary_blue ${classes.welcomeText}`}
                    data-static-id='Header.js_p_da8d68'
                  >
                    Welcome
                  </p>
                  <p
                    className={`primary_gray_2 p-0 d-flex ${classes.nameText}`}
                    data-static-id='Header.js_p_128cb4'
                  >
                    {toTitleCase(userName || '')}
                  </p>
                  <p
                    className={`primary_gray_3 m-0 ${classes.roleText}`}
                    data-static-id='Header.js_p_cdd74a'
                  >
                    {toTitleCase(getDisplayRole(access?.role))}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        <div
          className={`h-100 d-flex align-items-center ${classes.sabicIcon} justify-content-end`}
          data-static-id='Header.js_div_f0d49e'
        >
          <img alt='logo' src={logo} data-static-id='Header.js_img_249b6a' />
        </div>
      </div>

      {token?.isAdminUser &&
      location.pathname.includes('activity-tracker/UserStatistics') ? (
        <div
          className={`d-flex  ${classes.userOnlineText}`}
          data-static-id='Header.js_div_1a3c30'
        >
          <span
            className={'primary_gray_3 ps-2 m-0 text-12-regular cursor-pointer'}
            onClick={() => setUserOnlineModal(true)}
            data-static-id='Header.js_span_841656'
          >
            <span
              className='text-uppercase'
              data-static-id='Header.js_span_d31150'
            >
              Users Online :
            </span>{' '}
            <span
              className='text-12-bold'
              data-static-id='Header.js_span_929f7f'
            >
              {userOnlineData.length}
            </span>
          </span>
          <CustomModal
            show={userOnlineModal}
            hideModal={() => setUserOnlineModal(false)}
            hideCameraIcon='false'
            title='users online (Current)'
            modalHeight='40vmin'
            bodyHeight='calc(100% - 5vmin)'
            addClassCustomResponsiveWidth='true'
            contentFitWidth={`${classes.userOnlineModal}`}
          >
            <div className='h-100 w-100' data-static-id='Header.js_div_b246df'>
              <SimpleTable
                data={userOnlineData}
                headers={USER_ONLINE_TABLE_HEADER}
                showLoader={false}
                customColumnWidths={[40, 20, 40]}
                leftAlignColumns={[0]}
              />
            </div>
          </CustomModal>
        </div>
      ) : (
        ''
      )}

      <Tooltip
        className={'tooltip_container lightTooltipBackground'}
        id='back'
        role='tooltip'
        style={{
          zIndex: 9999,
        }}
        place='top'
        type='light'
        data-static-id='Header.js_Tooltip_963578'
      >
        <span
          className='text-12-regular d-block text-center'
          data-static-id='Header.js_span_716810'
        >
          Back
        </span>
      </Tooltip>

      <Tooltip
        className={'tooltip_container lightTooltipBackground'}
        id='help'
        role='tooltip'
        style={{
          zIndex: 9999,
        }}
        place='top'
        type='light'
        data-static-id='Header.js_Tooltip_c0646b'
      >
        <span
          className='text-12-regular d-block text-center'
          data-static-id='Header.js_span_b4538f'
        >
          HELP
        </span>
      </Tooltip>
    </div>
  )
}
export default Header
