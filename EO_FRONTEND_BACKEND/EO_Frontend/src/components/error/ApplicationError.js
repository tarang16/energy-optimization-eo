export default function ApplicationError({ message }) {
  return (
    <div
      className='border h-100 w-100 d-flex flex-column justify-content-center align-items-center'
      data-static-id='ApplicationError.js_div_f9cbe1'
    >
      <h1
        className=' text-18 text-center primary_gray'
        data-static-id='ApplicationError.js_h1_dad32c'
      >
        SOMETHING WENT WRONG
      </h1>
      <p
        className=' text-18 primary_gray_2 text-center'
        data-static-id='ApplicationError.js_p_857a9f'
      >
        {message ? message : 'Please Try Again Later'}
      </p>
    </div>
  )
}
