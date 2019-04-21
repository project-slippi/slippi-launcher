import React from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'

import getLocalImage from '../../../utils/image'
import { convertFrameCountToDurationString } from '../../../utils/time'

export const svgWidth = 150
export const fontSize = svgWidth / 75
export const rowHeight = fontSize * 4
export const stockSize = fontSize * 1.5
export const tooltipWidth = fontSize * 10
export const tooltipTextX = fontSize * 8.5
export const tooltipOffsetX = (tooltipWidth - tooltipTextX) / 2

export const textStyle = {
  fontSize: fontSize,
  dominantBaseline: 'middle',
  fill: "rgba(255, 255, 255, .8)",
}

export const isSelfDestruct = punishes => stock => {
  const punishEndedThisStock = punish =>
    punish.opponentIndex === stock.playerIndex
      && punish.didKill
      && punish.endFrame === stock.endFrame

  return stock.endFrame && !punishes.find(punishEndedThisStock)
}

const renderStock = (player, stocksRemaining) => (stockNumber, index) => {
  const imageName = `stock-icon-${player.characterId}-${player.characterColor}.png`
  return (
    <image
      key={`${imageName} ${stocksRemaining} ${index}`}
      opacity={stockNumber > stocksRemaining ? .5 : 1}
      xlinkHref={getLocalImage(imageName)}
      height={stockSize}
      width={stockSize}
      x={stockSize*(player.startStocks - (index+1))}
      y={-stockSize}
    />
  )
}

export const renderStockCount = (player, stocksRemaining) => {
  const renderPlayerStock = renderStock(player, stocksRemaining)

  const stockIcons = _
    .range(1, player.startStocks+1)
    .map(renderPlayerStock)

  return <g>{stockIcons}</g>
}

export const getYCoordinateFromFrame = (frame, uniqueTimestamps) => {
  const timestamp = convertFrameCountToDurationString(frame)
  const index = uniqueTimestamps.indexOf(timestamp)
  return (index+1) * (fontSize*4)
}

export const playerPropTypes = PropTypes.shape({
  playerIndex: PropTypes.number.isRequired,
  characterId: PropTypes.number.isRequired,
  characterColor: PropTypes.number.isRequired,
})

export const punishPropTypes = PropTypes.shape({
  playerIndex: PropTypes.number.isRequired,
  openingType: PropTypes.string.isRequired,
  moves: PropTypes.array.isRequired,
  startPercent: PropTypes.number.isRequired,
  endPercent: PropTypes.number.isRequired,
})