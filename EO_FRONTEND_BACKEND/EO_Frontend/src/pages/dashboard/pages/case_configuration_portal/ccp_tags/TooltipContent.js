import { isBoolean } from 'mathjs'
const TooltipContent = ({ tooltipData }) => {
  return (
    <div
      className={`d-flex flex-column gap-1 p-1 text-start w-100`}
      data-testid='tooltip-content'
      data-static-id='TooltipContent.js_div_8e3f30'
    >
      <div data-static-id='TooltipContent.js_div_d39fd3'>
        <span
          className='text-12-bold text_primary_white me-1'
          data-static-id='TooltipContent.js_span_ac703c'
        >
          SQL Column Name :{' '}
        </span>
        <span
          className='text-12-bold text-break text_primary_white'
          data-static-id='TooltipContent.js_span_ece4ff'
        >
          {tooltipData?.columnName ?? '-'}
        </span>
      </div>
      <div data-static-id='TooltipContent.js_div_769b0f'>
        <span
          className='text-12-bold text_primary_white me-1'
          data-static-id='TooltipContent.js_span_e8fbf1'
        >
          Description :
        </span>
        <span
          className='text-12-bold text-break text_primary_white'
          data-static-id='TooltipContent.js_span_10ccee'
        >
          {tooltipData?.description ?? '-'}
        </span>
      </div>
      <div data-static-id='TooltipContent.js_div_0437f8'>
        <span
          className='text-12-bold text_primary_white me-1'
          data-static-id='TooltipContent.js_span_0e9b13'
        >
          Output Format Example :
        </span>
        <span
          className='text-12-bold  text-break text_primary_white'
          data-static-id='TooltipContent.js_span_56638f'
        >
          {tooltipData?.expectedOutputFormatExample ?? '-'}
        </span>
      </div>
      <div data-static-id='TooltipContent.js_div_9a2ccc'>
        <span
          className='text-12-bold text_primary_white me-1'
          data-static-id='TooltipContent.js_span_27ce5c'
        >
          Data Type :
        </span>
        <span
          className='text-12-bold text_primary_white'
          data-static-id='TooltipContent.js_span_447175'
        >
          {tooltipData?.dataTypeName ?? '-'}
        </span>
      </div>
      <div data-static-id='TooltipContent.js_div_a8a816'>
        <span
          className='text-12-bold text_primary_white me-1'
          data-static-id='TooltipContent.js_span_580d9b'
        >
          Max Length :
        </span>
        <span
          className='text-12-bold text_primary_white'
          data-static-id='TooltipContent.js_span_e369d7'
        >
          {tooltipData?.maxLength ?? '-'}
        </span>
      </div>
      <div data-static-id='TooltipContent.js_div_9a6858'>
        <span
          className='text-12-bold text_primary_white me-1'
          data-static-id='TooltipContent.js_span_5514af'
        >
          Is Nullable:
        </span>
        <span
          className='text-12-bold text_primary_white'
          data-static-id='TooltipContent.js_span_258d3f'
        >
          {isBoolean(tooltipData?.isNullable)
            ? tooltipData?.isNullable.toString()
            : '-'}
        </span>
      </div>
    </div>
  )
}
export default TooltipContent
