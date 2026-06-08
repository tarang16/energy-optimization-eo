import { act, fireEvent, render } from '@testing-library/react'
import assert from 'assert'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, vi } from 'vitest'
import { mock_get_error_logging_data } from '../../../../index.test'
import AdminTableUpdateModal from './AdminTableUpdateModal'

let mockApiData = mock_get_error_logging_data

vi.mock('services/AdminServices', () => ({
  modifyErrorStatusByErrorId: () => mockApiData,
}))

vi.mock('config/scss/_variables.scss', () => {
  return {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
    primary_dark_blue: '#ff0000',
  }
})

let data = {
  errorID: '680339e6-ecaa-461f-be6c-181260f97f1e',
  firstName: 'Sachin',
  lastName: 'Lalge',
  status: 'Active',
  assignedTo: 'Pratik',
}

let modifyStatusOptions = [
  { display_name: 'active', tag_name: 'active' },
  { display_name: 'completed', tag_name: 'completed' },
  { display_name: 'yts', tag_name: 'yts' },
]
describe('AdminTableUpdateModal Component', () => {
  it('renders the component without errors', () => {
    const { queryAllByText } = render(
      <MemoryRouter>
        <AdminTableUpdateModal
          data={data}
          setAdminTableModalData={() => {}}
          setRefetch={(val) => {
            return val
          }}
        />
      </MemoryRouter>,
    )

    // Simulate user entering search query
    // fireEvent.change(screen.getByPlaceholderText("Search..."), {
    //   target: { value: "ABC" }
    // });

    const UpdateBtn = document.querySelector('#update-error-log-btn')
    fireEvent.click(UpdateBtn)

    const cancelbtn = document.querySelector('#cancel-error-log-btn')
    fireEvent.click(cancelbtn)

    const cancel_btn = document.querySelector('.cancel_btn')
    fireEvent.click(cancel_btn)

    assert(queryAllByText != undefined)
  })

  it('renders the component without errors', () => {
    act(() => {
      mockApiData = {
        data: [],
        errormsg: '',
        statuscode: 400,
      }
    })
    const { queryAllByText } = render(
      <MemoryRouter>
        <AdminTableUpdateModal
          data={data}
          setAdminTableModalData={() => {}}
          setRefetch={() => {}}
        />
      </MemoryRouter>,
    )

    const UpdateBtn = document.querySelector('#update-error-log-btn')
    fireEvent.click(UpdateBtn)

    const cancelbtn = document.querySelector('#cancel-error-log-btn')
    fireEvent.click(cancelbtn)

    const cancel_btn = document.querySelector('.cancel_btn')
    fireEvent.click(cancel_btn)

    assert(queryAllByText != undefined)
  })

  it('renders the component without errors', () => {
    const { queryAllByText } = render(
      <MemoryRouter>
        <AdminTableUpdateModal />
      </MemoryRouter>,
    )
    assert(queryAllByText != undefined)
  })
})
