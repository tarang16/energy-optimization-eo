import SingleTitleCardWithButton from 'components/visuals/common/single_title_card/SingleTitleCardWithButton'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useState } from 'react'
import { Form } from 'react-bootstrap'
import loader1 from '../../../assets/sabic_icons/common/elips_loader.svg'
import SearchBar from '../search_bar/SearchBar'
import styles from './AddUser.module.scss'
export default function AddUserWorkflow({
  setSelectedRoleForUser,
  handleUserAdd,
  selectedRoleForUser,
  pageKey,
}) {
  const [searchData, setSearchData] = useState([])
  const [loading, setLoading] = useState(false)
  const handleSearch = (data) => {
    if (selectedRoleForUser === 'Process Manager') {
      setSearchData([
        {
          ...data,
          selected: true,
        },
      ])
    } else {
      const userExist = searchData.find(
        ({ employeeId }) => employeeId === data?.employeeId,
      )
      if (!userExist)
        setSearchData((prevVal) => [
          ...prevVal,
          {
            ...data,
            selected: true,
          },
        ])
    }
  }
  const onAddClick = async () => {
    setLoading(true)
    const selectedUsers = searchData.filter((user) => user.selected)
    const selectedUsersNames = selectedUsers.reduce((acc, tag) => {
      return acc + tag?.employeeName + '->'
    }, '')
    TRACKEVENTOBJ.addUserWorkflow.onAddClick(
      selectedRoleForUser,
      selectedUsersNames,
      pageKey,
    )
    let employeeId = ''
    for (let i = 0; i < selectedUsers.length; i++) {
      const item = selectedUsers[i]
      employeeId += `${i === 0 ? '' : ','}${item?.employeeId}`
    }
    await handleUserAdd(employeeId)
    setLoading(false)
    setSearchData([])
  }
  const handleCheckUser = (e, user) => {
    const tempData = searchData.map((item) => {
      if (item?.employeeId === user?.employeeId) {
        return {
          ...item,
          selected: !item.selected,
        }
      } else {
        return item
      }
    })
    setSearchData(tempData)
  }
  return (
    <SingleTitleCardWithButton title={'Search User'} extraClasses='m-0 h-100'>
      <div
        className={`${styles.searchBarHeight}`}
        data-static-id='AddUser.js_div_64eecc'
      >
        <SearchBar onSearch={handleSearch} />
      </div>
      <div
        className={`${styles.adduserDetailsConatiner}`}
        data-static-id='AddUser.js_div_16283e'
      >
        <div
          className={`${styles.detailsMainContainer}`}
          data-static-id='AddUser.js_div_f54ea7'
        >
          {searchData.map((user, i) => (
            <div
              key={`search-data-user-${user?.email + user?.employeeId}`}
              className={`${styles.detailsContainer}`}
              data-static-id='AddUser.js_div_9a35ee'
            >
              <Form.Check
                reverse
                label={
                  <div
                    className='text-14-regular text_primary_gray row gx-0'
                    data-static-id='AddUser.js_div_94b3db'
                  >
                    <div
                      className='col-8 text-start'
                      data-static-id='AddUser.js_div_7df89d'
                    >
                      <p
                        className={`text-12-regular mb-0 ${styles.labelName}`}
                        data-static-id='AddUser.js_p_47b0c2'
                      >
                        {user.employeeName}
                      </p>
                      <p
                        className={`text-12-regular mb-0 ${styles.labelEmail}`}
                        data-static-id='AddUser.js_p_872374'
                      >
                        {user.email}
                      </p>
                    </div>
                    <div
                      className='col-4'
                      data-static-id='AddUser.js_div_0d7607'
                    >
                      <p
                        className='text-12-regular mb-0'
                        data-static-id='AddUser.js_p_35a347'
                      >
                        {user?.employeeId}
                      </p>
                      <p
                        className='text-12-regular mb-0'
                        data-static-id='AddUser.js_p_289bb6'
                      >
                        {user.afiliateName}
                      </p>
                    </div>
                  </div>
                }
                name='group1'
                type={'checkbox'}
                checked={user.selected}
                onChange={(e) => handleCheckUser(e, user)}
                id={`inline-${'checkbox'}-${i}`}
                data-testid={`checkbox-${user?.employeeId}`}
              />
            </div>
          ))}
        </div>
        <div
          className={`${styles.addUserBtnContainer}`}
          data-static-id='AddUser.js_div_f780e4'
        >
          <button
            className={`${styles.adduserCancelBtn} me-2 text-14-regular text-uppercase`}
            disabled={loading}
            onClick={() => {
              setSelectedRoleForUser(null)
            }}
            data-static-id='AddUser.js_button_986444'
          >
            Cancel
          </button>
          <button
            className={`${styles.adduserSubmitBtn} ${styles.blinkingImg} text-14-regular text-uppercase`}
            id='on-add-click'
            disabled={
              searchData.filter((user) => user.selected).length == 0 || loading
            }
            onClick={() => {
              onAddClick()
            }}
            data-static-id='AddUser.js_button_8ef3cc'
          >
            {loading ? (
              <img
                className='blinking'
                src={loader1}
                data-static-id='AddUser.js_img_1baea3'
              />
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </div>
    </SingleTitleCardWithButton>
  )
}
