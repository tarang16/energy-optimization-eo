import SingleTitleCardWithButton from 'components/visuals/common/single_title_card/SingleTitleCardWithButton'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useState } from 'react'
import { Form } from 'react-bootstrap'
import SearchBar from '../search_bar/SearchBar'
import styles from './AddUser.module.scss'
export default function AddUser({
  handler = () => {},
  role = 'corporate',
  pageKey,
  title,
}) {
  const [searchData, setSearchData] = useState([])
  const handleSearch = (data) => {
    const userExist = searchData.find(
      ({ employeeId }) => employeeId === data.employeeId,
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
  function onAddClick() {
    const selectedUsers = searchData.filter((user) => user.selected)
    const selectedUsersNames = selectedUsers.reduce((acc, tag) => {
      return acc + tag?.employeeName + '->'
    }, '')
    TRACKEVENTOBJ.addUser.onAddClick(pageKey, title, selectedUsersNames)
    let employeeId = ''
    for (let i = 0; i < selectedUsers.length; i++) {
      const item = selectedUsers[i]
      if (item.employeeId) {
        employeeId += `${i === 0 ? '' : ','}${item.employeeId}`
      }
    }
    handler(employeeId)
    setSearchData([])
  }
  const handleCheckUser = (e, user) => {
    const tempData = searchData.map((item) => {
      if (item.employeeId === user.employeeId) {
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
  let message = 'Add User'
  if (role?.toLowerCase() == 'admin' || role?.toLowerCase() == 'corporate') {
    message = `ADD ${role?.toUpperCase()} USER`
  } else if (role?.toLowerCase() == 'ccp') {
    message = 'GRANT CCP ACCESS TO USER'
  }
  return (
    <SingleTitleCardWithButton
      title={`${message}`}
      handleButtonClick={onAddClick}
      extraClasses='m-0 h-100'
    >
      <div
        className={`${styles.searchBarHeight}`}
        data-static-id='AddUser.js_div_58d176'
      >
        <SearchBar onSearch={handleSearch} pageKey={pageKey} title={title} />
      </div>
      <div
        className={`${styles.detailsMainContainer}`}
        data-static-id='AddUser.js_div_2dfae2'
      >
        {searchData.map((user, i) => (
          <div
            key={`search-data-user-${user?.email + user.employeeId}`}
            className={`${styles.detailsContainer}`}
            data-static-id='AddUser.js_div_0e04f2'
          >
            <Form.Check
              // reverse
              label={
                <div
                  className='text-14-regular text_primary_gray row gx-0 align-items-center'
                  data-static-id='AddUser.js_div_e7fa05'
                >
                  <div
                    className='col-8 text-start'
                    data-static-id='AddUser.js_div_d7d8fd'
                  >
                    <p
                      className={`text-14-bold mb-0 ${styles.labelName}`}
                      data-static-id='AddUser.js_p_9a33df'
                    >
                      {user.employeeName}
                    </p>
                    <p
                      className={`text-13-regular mb-0 ${styles.labelEmail}`}
                      data-static-id='AddUser.js_p_8c7167'
                    >
                      {user.email}
                    </p>
                  </div>
                  <div
                    className='col-4 text-end'
                    data-static-id='AddUser.js_div_29be81'
                  >
                    <p
                      className='text-13-regular mb-0'
                      data-static-id='AddUser.js_p_a5d9f7'
                    >
                      {user.employeeId}
                    </p>
                    <p
                      className='text-13-regular mb-0'
                      data-static-id='AddUser.js_p_0b1304'
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
              data-testid={`checkbox-${user.employeeId}`}
            />
          </div>
        ))}
      </div>
    </SingleTitleCardWithButton>
  )
}
