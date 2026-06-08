import { EDGE_COLORS } from '../utils'
const Marker = ({ type }) => {
  const { borderColor } = EDGE_COLORS[type]
  return (
    <svg
      className='react-flow__marker'
      fill={borderColor}
      stroke={`${borderColor}`}
      strokeWidth={2}
      data-static-id='index.js_svg_4aed9f'
    >
      <defs
        fill={borderColor}
        stroke={`${borderColor}`}
        strokeWidth={2}
        data-static-id='index.js_defs_74a5d5'
      >
        <marker
          className='react-flow__arrowhead'
          id={type}
          markerWidth='7'
          markerHeight='7'
          viewBox='-10 -10 20 20'
          markerUnits='strokeWidth'
          orient='auto-start-reverse'
          refX='0'
          refY='0'
          fill={borderColor}
          stroke={`${borderColor}`}
          strokeWidth={2}
          data-static-id='index.js_marker_314d50'
        >
          <polyline
            points='-5,-4 0,0 -5,4 -5,-4'
            fill={borderColor}
            stroke={`${borderColor}`}
            strokeWidth={2}
            style={{
              stroke: borderColor,
              fill: borderColor,
              strokeWidth: 1,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            data-static-id='index.js_polyline_0790aa'
          />
        </marker>
      </defs>
    </svg>
  )
}
export default Marker
