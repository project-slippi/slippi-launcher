import React from 'react'
import PropTypes from 'prop-types'
import { svgWidth, fontSize, textStyle } from './constants'

const TimestampBox = ({ timestamp, yCoordinate }) => 
  <g
    transform={`translate(${svgWidth / 2}, ${yCoordinate})`}
    textAnchor='middle'
  >
    <rect
      width={fontSize*4} height={fontSize*2}
      x={-fontSize*2} y={-fontSize*1.05}
      stroke="rgba(255, 255, 255, 0.75)" strokeWidth=".1"
      fill="#282B33" rx={fontSize / 2}
    />
    <text { ...textStyle } > {timestamp} </text>
  </g>

TimestampBox.propTypes = {
  timestamp: PropTypes.string.isRequired,
  yCoordinate: PropTypes.number.isRequired,
}

export default TimestampBox
