import { AppAtom } from 'atoms/AppAtom'
import SearchBar from 'components/ui/search_bar/SearchBar'
import SingleSelect from 'components/visuals/dropdown/single_select/SingleSelect'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import { useLocation, useParams } from 'react-router-dom'
import { modifyErrorStatusByErrorId } from 'services/AdminServices'
import styles from './AdminTableUpdateModal.module.scss'
import CustomModal from './CustomModal'
const modifyStatusOptions = [
  {
    display_name: 'active',
    tag_name: 'active',
  },
  {
    display_name: 'completed',
    tag_name: 'completed',
  },
  {
    display_name: 'yts',
    tag_name: 'yts',
  },
]
export default function AdminTableUpdateModal({
  data,
  setAdminTableModalData,
  setRefetch,
  section,
}) {
  const [showModal, setShowModal] = useState(false)
  const location = useLocation()
  const [selectedStatus, setSelectedStatus] = useState(data?.status)
  const [searchData, setSearchData] = useState([])
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const handleSearch = (data) => {
    setSearchData((prevVal) => [
      {
        ...data,
        selected: true,
      },
    ])
  }
  const activeIndex = modifyStatusOptions.findIndex(
    (item) => item?.display_name?.toLowerCase() === data?.status?.toLowerCase(),
  )
  useEffect(() => {
    if (data) {
      setShowModal(true)
    } else {
      setShowModal(false)
    }
  }, [JSON.stringify(data)])
  const handleResponse = (resp) => {
    if (resp?.statuscode === 200) {
      setAdminTableModalData()
      setRefetch((prevVal) => !prevVal)
    } else {
      alert(resp.message || 'Error occured in update error log')
    }
  }
  const handleUpdate = async () => {
    if (data?.errorID) {
      const resp = await modifyErrorStatusByErrorId(
        data.errorID,
        selectedStatus || data?.status,
        searchData[0]?.label || data?.assignedTo,
      )
      handleResponse(resp)
    }
  }
  const onSelectChange = async (val) => {
    setSelectedStatus(val.display_name)
  }
  return (
    <div
      className={`${styles.AdminTblUpdateModalContainer}`}
      data-static-id='AdminTableUpdateModal.js_div_a6414b'
    >
      <CustomModal
        hideModal={() => {
          setAdminTableModalData()
        }}
        title={'Admin Table Update'}
        unit={''}
        show={showModal}
        modalHeight={'44vmin'}
        size={'md'}
      >
        <div
          className='d-flex flex-column justify-content-between h-100'
          data-static-id='AdminTableUpdateModal.js_div_f72310'
        >
          <div
            className={`${styles.topContent}`}
            data-static-id='AdminTableUpdateModal.js_div_f06f24'
          >
            <div
              className={`${styles.topContent__item}`}
              data-static-id='AdminTableUpdateModal.js_div_81a4ac'
            >
              <span
                className={`${styles.topContent__item__left}`}
                data-static-id='AdminTableUpdateModal.js_span_65f8c8'
              >
                <span
                  className={`${styles.labelText}`}
                  data-static-id='AdminTableUpdateModal.js_span_c78361'
                >
                  Error Id
                </span>
                <span data-static-id='AdminTableUpdateModal.js_span_12c060'>
                  :
                </span>
              </span>
              <span
                className={`${styles.topContent__item__right}`}
                data-static-id='AdminTableUpdateModal.js_span_8dd094'
              >
                <span
                  className={`d-flex ${styles.valueText}`}
                  data-static-id='AdminTableUpdateModal.js_span_5da56d'
                >
                  {data?.errorID || 'N/A'}
                </span>
              </span>
            </div>

            <div
              className={`${styles.topContent__item}`}
              data-static-id='AdminTableUpdateModal.js_div_de8c84'
            >
              <span
                className={`${styles.topContent__item__left}`}
                data-static-id='AdminTableUpdateModal.js_span_9e1bd3'
              >
                <span
                  className={`${styles.labelText}`}
                  data-static-id='AdminTableUpdateModal.js_span_317cd9'
                >
                  Current Assignee
                </span>
                <span data-static-id='AdminTableUpdateModal.js_span_2dd09a'>
                  :
                </span>
              </span>
              <span
                className={`${styles.topContent__item__right}`}
                data-static-id='AdminTableUpdateModal.js_span_288f02'
              >
                <span
                  className={`d-flex ${styles.valueText}`}
                  data-static-id='AdminTableUpdateModal.js_span_b85502'
                >
                  {data?.firstName || ''} {data?.lastName || ''}
                </span>
              </span>
            </div>

            <div
              className={`${styles.topContent__item}`}
              data-static-id='AdminTableUpdateModal.js_div_8850b2'
            >
              <span
                className={`${styles.topContent__item__left}`}
                data-static-id='AdminTableUpdateModal.js_span_ddc9a9'
              >
                <span data-static-id='AdminTableUpdateModal.js_span_08c8a0'>
                  Current Status
                </span>
                <span data-static-id='AdminTableUpdateModal.js_span_e69ee3'>
                  :
                </span>
              </span>
              <span
                className={`${styles.topContent__item__right}`}
                data-static-id='AdminTableUpdateModal.js_span_4de99a'
              >
                <span
                  className={`d-flex ${styles.valueText}`}
                  data-static-id='AdminTableUpdateModal.js_span_4b1dc8'
                >
                  {data?.status || ''}
                </span>
              </span>
            </div>

            <div
              className={`${styles.topContent__item}`}
              data-static-id='AdminTableUpdateModal.js_div_449db4'
            >
              <span
                className={`${styles.topContent__item__left}`}
                data-static-id='AdminTableUpdateModal.js_span_610ee2'
              >
                <span data-static-id='AdminTableUpdateModal.js_span_daed17'>
                  Modify Status
                </span>
                <span data-static-id='AdminTableUpdateModal.js_span_5a0164'>
                  :
                </span>
              </span>
              <span
                className={`${styles.topContent__item__right}`}
                data-static-id='AdminTableUpdateModal.js_span_d8b409'
              >
                <span
                  className={`${styles.singleSelectContainer}`}
                  data-static-id='AdminTableUpdateModal.js_span_6fdfdf'
                >
                  <SingleSelect
                    activeI={activeIndex}
                    data={modifyStatusOptions}
                    onSelectChange={onSelectChange}
                  />
                </span>
              </span>
            </div>

            <div
              className={`${styles.topContent__item}`}
              data-static-id='AdminTableUpdateModal.js_div_ee07cc'
            >
              <span
                className={`${styles.topContent__item__left}`}
                data-static-id='AdminTableUpdateModal.js_span_58e2d9'
              >
                <span data-static-id='AdminTableUpdateModal.js_span_4250ca'>
                  Assign To
                </span>
                <span data-static-id='AdminTableUpdateModal.js_span_c02942'>
                  :
                </span>
              </span>
              <span
                className={`${styles.topContent__item__right}`}
                data-static-id='AdminTableUpdateModal.js_span_2d6feb'
              >
                <span
                  className={`${styles.searchBarContainer}`}
                  data-static-id='AdminTableUpdateModal.js_span_2d721d'
                >
                  <SearchBar
                    onSearch={handleSearch}
                    hideValue={false}
                    defaultValue='test'
                  />
                </span>
              </span>
            </div>
          </div>

          <div
            className={`text-center ${styles.btnContainer}`}
            data-static-id='AdminTableUpdateModal.js_div_32a6b0'
          >
            <Button
              onClick={() => {
                TRACKEVENTOBJ.adminTableUpdateModal.adminTableUpdatedOnClick({
                  params,
                  caseData,
                  location,
                  section: 'App Monitoring',
                })
                handleUpdate()
              }}
              id='update-error-log-btn'
              className={`me-2 ${styles.UpdateBtn}`}
              data-static-id='AdminTableUpdateModal.js_Button_3090cc'
            >
              Update
            </Button>
            <Button
              onClick={() => {
                setAdminTableModalData()
              }}
              id='cancel-error-log-btn'
              className={`me-2 ${styles.cancelBtn}`}
              data-static-id='AdminTableUpdateModal.js_Button_452905'
            >
              Cancel
            </Button>
          </div>
        </div>
      </CustomModal>
    </div>
  )
}
