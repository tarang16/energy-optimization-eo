import Loader from './Loader'
export function TableLoader(props) {
  return (
    <tr
      id={props?.id}
      data-testid={props?.id}
      className={'centerPositionLoader'}
      rowSpan={props?.rowsSpan}
      data-static-id='TableLoader.js_tr_ee4ffd'
    >
      <td
        colSpan={props?.colspan || 1}
        className='text-center'
        data-static-id='TableLoader.js_td_b60e86'
      >
        <span
          className={'text-14-regular text-center'}
          data-static-id='TableLoader.js_span_6a1f6a'
        >
          <Loader />
        </span>
      </td>
    </tr>
  )
}
