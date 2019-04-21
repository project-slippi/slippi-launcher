import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import { getMoveName } from '../../../utils/moves'
import { punishPropTypes, fontSize, tooltipWidth, tooltipOffsetX } from './constants'

const lineSpacing = 1.5
const lineHeight = lineSpacing * fontSize

const getMoveText = (move, index, tooltipStyle) => {
  const yTranslation = -(index+.5) * lineHeight
  return (
    <g transform={`translate(0, ${yTranslation})`}>
      <text fontSize={fontSize} { ...tooltipStyle.text } textAnchor="start">
        { getMoveName(move.moveId) }
      </text>
      <text fontSize={fontSize} { ...tooltipStyle.percent } textAnchor="end">
        { Math.trunc(move.damage) }%
      </text>
    </g>
  )
}

const Tooltip = ({ punish, tooltipStyle }) => {
  const rectHeight = (punish.moves.length+.5)*(lineHeight)
  const polygonHeight = lineHeight / 2
  const shadow = fontSize / 8

  const movesList = _(punish.moves)
    .sortBy('frame')
    .reverse()
    .map((move, index) => getMoveText(move, index, tooltipStyle))
    .value()
  
  return (
    <g transform={`translate(0, ${-lineHeight})`}>
      <defs>
        <clipPath id="shape">
          <rect
            { ...tooltipStyle.rect }
            y={-rectHeight}
            width={tooltipWidth}
            height={rectHeight}
          />
          <polygon
            points={`${-tooltipOffsetX/2},0 0,${polygonHeight}, ${tooltipOffsetX/2},0`}
          />
        </clipPath>
        <filter id="shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation={shadow}/>
          <feOffset dx={shadow} dy={shadow}/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <rect
          { ...tooltipStyle.rect }
          y={-rectHeight}
          width={tooltipWidth}
          height={rectHeight + polygonHeight}
          fill="rgb(200, 200, 200)"
          clipPath="url(#shape)"
        />
      </g>
      { movesList }
    </g>
  )
}

Tooltip.propTypes = {
  punish: PropTypes.shape(punishPropTypes).isRequired,
  tooltipStyle: PropTypes.object.isRequired,
}

export default Tooltip

