import SearchBar from 'components/ui/search_bar/SearchBar'
import { useState } from 'react'
import { addWorkflowUser } from 'services/WorkflowServices'
import { updateAccessToken } from 'utills/utilities'
import loader1 from '../../../../../assets/sabic_icons/common/elips_loader.svg'
import delete_blue_icon from '../../../../../assets/sabic_icons/header/delete_blue_icon.svg'
import ecm_icon_blue from '../../../../../assets/sabic_icons/header/ecm_icon_blue.svg'
import styles from '../WorkflowSustainability.module.scss'
const WorkflowSustainability = ({
  hideModal = () => {},
  pageKey,
  title,
  selectedAffiliateId,
  roleName,
  setSelectedRole,
  updatedUsersTable,
  handleDelete,
}) => {
  const [isUserAdded, setUserAddedd] = useState(false)
  const [userData, setUserData] = useState()
  const [isBtnTrue, setBtnTrue] = useState(false)
  const [managerData, setManagerData] = useState()
  const [isManagerAdded, setManagerAdded] = useState(false)
  const [loading, setLoading] = useState(false)
  const handleUserSearch = (data) => {
    setUserAddedd(true)
    setUserData(data)
  }
  const handleManagerSearch = (data) => {
    setManagerAdded(true)
    setManagerData(data)
  }
  const handlSubmit = async () => {
    setLoading(true)
    const userIDList = userData?.employeeId
    const managerId = managerData?.employeeId
    const resp = await addWorkflowUser(
      userIDList.toString(),
      roleName,
      selectedAffiliateId,
      managerId.toString(),
    )
    if (resp && resp?.statuscode >= 200 && resp?.statuscode < 400) {
      await updateAccessToken(resp)
      setSelectedRole('')
      updatedUsersTable(selectedAffiliateId)
    } else {
      alert(resp?.errormsg || 'Failed to add user')
    }
    setLoading(false)
    hideModal()
  }
  return (
    <div
      className=' d-flex flex-column justify-content-between h-100'
      data-static-id='WorkflowSustainability.js_div_66c24f'
    >
      <div data-static-id='WorkflowSustainability.js_div_780fb1'>
        <div
          className={`${styles.addUserSection}`}
          data-static-id='WorkflowSustainability.js_div_c2da2a'
        >
          <label
            className='text-15-bold'
            data-static-id='WorkflowSustainability.js_label_f155c3'
          >
            SEARCH USER
          </label>
          <div
            className={`${styles.searchBarHeight} searchBarEditWrapper`}
            data-static-id='WorkflowSustainability.js_div_30602b'
          >
            <SearchBar
              onSearch={handleUserSearch}
              pageKey={pageKey}
              title={title}
            />
          </div>
          {isUserAdded && (
            <>
              <section data-static-id='WorkflowSustainability.js_section_64a21e'>
                <div
                  className={`${styles.User}  d-flex justify-content-between align-items-center text-12-regular`}
                  data-static-id='WorkflowSustainability.js_div_6ead53'
                >
                  <span data-static-id='WorkflowSustainability.js_span_67ee50'>
                    {userData?.employeeName}
                  </span>
                  <span data-static-id='WorkflowSustainability.js_span_96c578'>
                    {userData?.employeeId}
                  </span>
                  <span data-static-id='WorkflowSustainability.js_span_8ee7c8'>
                    {userData?.email}
                  </span>
                  <button
                    type='button'
                    className={`${styles.tableDeleteBtn}`}
                    data-static-id='WorkflowSustainability.js_button_dd7a62'
                  >
                    <img
                      src={delete_blue_icon}
                      data-static-id='WorkflowSustainability.js_img_3f5a96'
                    />
                  </button>
                </div>
                <div
                  className={`${styles.addManager} d-flex justify-content-between align-items-center`}
                  data-static-id='WorkflowSustainability.js_div_6649d8'
                >
                  <span
                    className='text-12-regular'
                    data-static-id='WorkflowSustainability.js_span_bdc6ad'
                  >
                    <img
                      src={ecm_icon_blue}
                      data-static-id='WorkflowSustainability.js_img_cfa2f4'
                    />{' '}
                    IT IS MANDATORY TO TAG THE USER'S MANAGER
                  </span>
                  <button
                    onClick={() => setBtnTrue(true)}
                    className={
                      'text-12-regular text-uppercase bg_primary_blue text_primary_white'
                    }
                    data-static-id='WorkflowSustainability.js_button_497cd6'
                  >
                    Add manager
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
        {isBtnTrue && (
          <div
            className={`${styles.addUserSection}`}
            data-static-id='WorkflowSustainability.js_div_9b4c8b'
          >
            <label
              className='text-15-bold'
              data-static-id='WorkflowSustainability.js_label_2ed7e7'
            >
              ADD MANAGER
            </label>
            <div
              className={`${styles.searchBarHeight}`}
              data-static-id='WorkflowSustainability.js_div_5ff766'
            >
              <SearchBar onSearch={handleManagerSearch} />
            </div>
            {isManagerAdded && (
              <>
                <section data-static-id='WorkflowSustainability.js_section_acd1b3'>
                  <div
                    className={`${styles.User} d-flex justify-content-between align-items-center text-12-regular`}
                    data-static-id='WorkflowSustainability.js_div_36644b'
                  >
                    <span data-static-id='WorkflowSustainability.js_span_6e6635'>
                      {managerData?.employeeName}
                    </span>
                    <span data-static-id='WorkflowSustainability.js_span_fdc249'>
                      {managerData?.employeeId}
                    </span>
                    <span data-static-id='WorkflowSustainability.js_span_c9aa8b'>
                      {managerData?.email}
                    </span>
                    <button
                      type='button'
                      className={`${styles.tableDeleteBtn}`}
                      data-static-id='WorkflowSustainability.js_button_96e8fa'
                    >
                      <img
                        src={delete_blue_icon}
                        data-static-id='WorkflowSustainability.js_img_ed05e7'
                      />
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </div>
      <div
        className={`${styles.addUserBtnContainer}`}
        data-static-id='WorkflowSustainability.js_div_1f1550'
      >
        <button
          onClick={() => {
            hideModal()
            setSelectedRole(null)
          }}
          className={`${styles.adduserCancelBtn} me-2 text-14-regular text-uppercase`}
          data-static-id='WorkflowSustainability.js_button_64495d'
        >
          Cancel
        </button>
        <button
          className={`${styles.adduserSubmitBtn}  ${styles.blinkingImg} text-14-regular text-uppercase`}
          id='on-add-click'
          onClick={handlSubmit}
          disabled={!userData || !managerData || loading}
          data-static-id='WorkflowSustainability.js_button_199f29'
        >
          {loading ? (
            <img
              className='blinking'
              src={loader1}
              data-static-id='WorkflowSustainability.js_img_e61093'
            />
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </div>
  )
}
export default WorkflowSustainability
