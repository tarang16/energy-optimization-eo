import Loader from 'components/ui/loader/Loader'
import ServerSideTable from 'components/visuals/table/server_side_table/ServerSideTable'
import { useEffect, useState } from 'react'
import { getUserActivityDataBySessionID } from 'services/AdminServices'
import CustomModal from './CustomModal'
import styles from './SessionInfoModal.module.scss'
export const sessionTableHeaders = [
  {
    title: 'Client IP Address',
    data: 'clientIpAdress',
  },
  {
    title: 'Screen Name',
    data: 'screenName',
  },
  {
    title: 'Functionality',
    data: 'functionality',
  },
  {
    title: 'User Action',
    data: 'actionName',
    isHtml: true,
  },
  {
    title: 'Affiliate',
    data: 'affiliate',
  },
  {
    title: 'Created On',
    data: 'createdOnEpoch',
    date: true,
  },
  {
    title: 'updated by',
    data: 'updatedBy',
  },
  {
    title: 'Updated On',
    data: 'updatedOnEpoch',
    date: true,
  },
]
export default function SessionInfoModal({ sessionID = '' }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  useEffect(() => {
    ;(async () => {
      const sessId = sessionID.substring(0, sessionID.indexOf('+'))
      if (sessId) {
        setShowModal(true)
        setIsLoading(true)
        const obj = await getUserActivityDataBySessionID(sessId)
        setSessionData(obj)
        setIsLoading(false)
      }
    })()
  }, [sessionID])
  return (
    <CustomModal
      hideModal={() => setShowModal(false)}
      title={'User Activity'}
      unit={''}
      show={showModal}
      modalHeight={'75vmin'}
    >
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {sessionData?.statuscode != 200 ? (
            <p
              className={`text-14-regular text-center text-uppercase ${styles.noDataText}`}
              data-static-id='SessionInfoModal.js_p_e889e9'
            >
              No Data Found for the session
            </p>
          ) : (
            <div
              className='h-100 w-100'
              data-static-id='SessionInfoModal.js_div_d0242b'
            >
              <div
                className={`text-left ${styles.topHeader}`}
                data-static-id='SessionInfoModal.js_div_4b36e4'
              >
                <span
                  className={`text-13-bold ${styles.labelText}`}
                  data-static-id='SessionInfoModal.js_span_e60db9'
                >
                  <span
                    className='text-uppercase'
                    data-static-id='SessionInfoModal.js_span_0dfac2'
                  >
                    Session ID
                  </span>
                  <span data-static-id='SessionInfoModal.js_span_8e592b'>
                    :
                  </span>
                </span>
                <span
                  className='text-13-regular'
                  data-static-id='SessionInfoModal.js_span_f03091'
                >
                  {sessionID.substring(0, sessionID.indexOf('+'))}
                </span>
              </div>
              <div
                className='row gx-1 gy-0'
                style={{
                  height: '14vmin',
                }}
                data-static-id='SessionInfoModal.js_div_ca5503'
              >
                <div
                  className={`col-4 h-100 ${styles.topItemColumn}`}
                  data-static-id='SessionInfoModal.js_div_6099b1'
                >
                  <div
                    className={`${styles.itemContent}`}
                    data-static-id='SessionInfoModal.js_div_3d8e2e'
                  >
                    <span
                      className={`text-13-bold ${styles.labelText}`}
                      data-static-id='SessionInfoModal.js_span_ec346b'
                    >
                      <span
                        className='text-uppercase'
                        data-static-id='SessionInfoModal.js_span_a4ea07'
                      >
                        First Name
                      </span>
                      <span data-static-id='SessionInfoModal.js_span_46ed0d'>
                        :
                      </span>
                    </span>
                    <span
                      className={`text-13-regular ${styles.valueText}`}
                      data-static-id='SessionInfoModal.js_span_982bd0'
                    >
                      {sessionData?.data?.firstName || '-'}
                    </span>
                  </div>
                  <div
                    className={`${styles.itemContent}`}
                    data-static-id='SessionInfoModal.js_div_0e855f'
                  >
                    <span
                      className={`text-13-bold ${styles.labelText}`}
                      data-static-id='SessionInfoModal.js_span_63b7c5'
                    >
                      <span
                        className='text-uppercase'
                        data-static-id='SessionInfoModal.js_span_c1a8b4'
                      >
                        Last Name
                      </span>
                      <span data-static-id='SessionInfoModal.js_span_d34e05'>
                        :
                      </span>
                    </span>
                    <span
                      className={`text-13-regular ${styles.valueText}`}
                      data-static-id='SessionInfoModal.js_span_5fc554'
                    >
                      {sessionData?.data?.lastName || '-'}
                    </span>
                  </div>
                  <div
                    className={`${styles.itemContent}`}
                    data-static-id='SessionInfoModal.js_div_eed337'
                  >
                    <span
                      className={`text-13-bold text-uppercase ${styles.labelText}`}
                      data-static-id='SessionInfoModal.js_span_743f1f'
                    >
                      <span data-static-id='SessionInfoModal.js_span_cf1471'>
                        Role
                      </span>
                      <span data-static-id='SessionInfoModal.js_span_3658a6'>
                        :
                      </span>
                    </span>
                    <span
                      className={`text-13-regular ${styles.valueText}`}
                      data-static-id='SessionInfoModal.js_span_3881bd'
                    >
                      {sessionData?.data?.role || '-'}
                    </span>
                  </div>
                  <div
                    className={`${styles.itemContent}`}
                    data-static-id='SessionInfoModal.js_div_a321c6'
                  >
                    <span
                      className={`text-13-bold text-uppercase ${styles.labelText}`}
                      data-static-id='SessionInfoModal.js_span_0a13fe'
                    >
                      <span data-static-id='SessionInfoModal.js_span_b3da88'>
                        User Agent
                      </span>
                      <span data-static-id='SessionInfoModal.js_span_f7734a'>
                        :
                      </span>
                    </span>
                    <span
                      className={`text-13-regular ${styles.valueText}`}
                      data-static-id='SessionInfoModal.js_span_80cf25'
                    >
                      {sessionData?.data?.userAgent || '-'}
                    </span>
                  </div>
                </div>
                <div
                  className={`col-4 h-100 ${styles.topItemColumn}`}
                  data-static-id='SessionInfoModal.js_div_3a5065'
                >
                  <div
                    className={`${styles.itemContent}`}
                    data-static-id='SessionInfoModal.js_div_dabdb6'
                  >
                    <span
                      className={`text-13-bold text-uppercase ${styles.labelText}`}
                      data-static-id='SessionInfoModal.js_span_f2ea63'
                    >
                      <span data-static-id='SessionInfoModal.js_span_0f4d2f'>
                        Browser
                      </span>
                      <span data-static-id='SessionInfoModal.js_span_ffdde6'>
                        :
                      </span>
                    </span>
                    <span
                      className={`text-13-regular ${styles.valueText}`}
                      data-static-id='SessionInfoModal.js_span_8b0e4f'
                    >
                      {sessionData?.data?.browser || '-'}
                    </span>
                  </div>
                  <div
                    className={`${styles.itemContent}`}
                    data-static-id='SessionInfoModal.js_div_770a9a'
                  >
                    <span
                      className={`text-13-bold text-uppercase ${styles.labelText}`}
                      data-static-id='SessionInfoModal.js_span_f86057'
                    >
                      <span data-static-id='SessionInfoModal.js_span_10e240'>
                        Browser Version
                      </span>
                      <span data-static-id='SessionInfoModal.js_span_772931'>
                        :
                      </span>
                    </span>
                    <span
                      className={`text-13-regular ${styles.valueText}`}
                      data-static-id='SessionInfoModal.js_span_29c000'
                    >
                      {sessionData?.data?.browserVersion || '-'}
                    </span>
                  </div>
                  <div
                    className={`${styles.itemContent}`}
                    data-static-id='SessionInfoModal.js_div_c7689f'
                  >
                    <span
                      className={`text-13-bold text-uppercase ${styles.labelText}`}
                      data-static-id='SessionInfoModal.js_span_784378'
                    >
                      <span data-static-id='SessionInfoModal.js_span_c2ea89'>
                        Browser Language
                      </span>
                      <span data-static-id='SessionInfoModal.js_span_4a3d7a'>
                        :
                      </span>
                    </span>
                    <span
                      className={`text-13-regular ${styles.valueText}`}
                      data-static-id='SessionInfoModal.js_span_d5b14c'
                    >
                      {sessionData?.data?.browserLanguage || '-'}
                    </span>
                  </div>
                  <div
                    className={`${styles.itemContent}`}
                    data-static-id='SessionInfoModal.js_div_d5657b'
                  >
                    <span
                      className={`text-13-bold text-uppercase ${styles.labelText}`}
                      data-static-id='SessionInfoModal.js_span_5a9b75'
                    >
                      <span data-static-id='SessionInfoModal.js_span_bf6aaf'>
                        Session Start Timestamp
                      </span>
                      <span data-static-id='SessionInfoModal.js_span_465b4a'>
                        :
                      </span>
                    </span>
                    <span
                      className={`text-13-regular ${styles.valueText}`}
                      data-static-id='SessionInfoModal.js_span_95c5c4'
                    >
                      {sessionData?.data?.sessionStartTimeStamp || '-'}
                    </span>
                  </div>
                </div>
                <div
                  className={`col-4 h-100 ${styles.topItemColumn}`}
                  data-static-id='SessionInfoModal.js_div_b4afc5'
                >
                  <div
                    className={`${styles.itemContent}`}
                    data-static-id='SessionInfoModal.js_div_3aa441'
                  >
                    <span
                      className={`text-13-bold text-uppercase ${styles.labelText}`}
                      data-static-id='SessionInfoModal.js_span_5eab28'
                    >
                      <span data-static-id='SessionInfoModal.js_span_457bb1'>
                        Session End Timestamp
                      </span>
                      <span data-static-id='SessionInfoModal.js_span_c525df'>
                        :
                      </span>
                    </span>
                    <span
                      className={`text-13-regular ${styles.valueText}`}
                      data-static-id='SessionInfoModal.js_span_cb201d'
                    >
                      {sessionData?.data?.sessionEndTimeStamp || '-'}
                    </span>
                  </div>
                  <div
                    className={`${styles.itemContent}`}
                    data-static-id='SessionInfoModal.js_div_a68cc6'
                  >
                    <span
                      className={`text-13-bold text-uppercase ${styles.labelText}`}
                      data-static-id='SessionInfoModal.js_span_1d663e'
                    >
                      <span data-static-id='SessionInfoModal.js_span_020e7f'>
                        IP Address
                      </span>
                      <span data-static-id='SessionInfoModal.js_span_9153ad'>
                        :
                      </span>
                    </span>
                    <span
                      className={`text-13-regular ${styles.valueText}`}
                      data-static-id='SessionInfoModal.js_span_be2f2a'
                    >
                      {sessionData?.data?.ipAddress || '-'}
                    </span>
                  </div>
                  <div
                    className={`${styles.itemContent}`}
                    data-static-id='SessionInfoModal.js_div_467e42'
                  >
                    <span
                      className={`text-13-bold text-uppercase ${styles.labelText}`}
                      data-static-id='SessionInfoModal.js_span_1cbae8'
                    >
                      <span data-static-id='SessionInfoModal.js_span_acb88e'>
                        Application Name
                      </span>
                      <span data-static-id='SessionInfoModal.js_span_a60d5b'>
                        :
                      </span>
                    </span>
                    <span
                      className={`text-13-regular ${styles.valueText}`}
                      data-static-id='SessionInfoModal.js_span_ecc514'
                    >
                      {sessionData?.data?.applicationName || '-'}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={`w-100 ${styles.sessionInfoModalTable}`}
                style={{
                  height: 'calc(100% - 14vmin - 4.5vmin)',
                }}
                data-static-id='SessionInfoModal.js_div_506a55'
              >
                <ServerSideTable
                  headers={sessionTableHeaders}
                  dataFn={getUserActivityDataBySessionID}
                  sessionId={sessionID.substring(0, sessionID.indexOf('+'))}
                  allSearchFalse={true}
                />
              </div>
            </div>
          )}
        </>
      )}
    </CustomModal>
  )
}
