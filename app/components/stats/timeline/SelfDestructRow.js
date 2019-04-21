import React from 'react'
import PropTypes from 'prop-types'
import { renderStockCount, textStyle, playerPropTypes } from './constants'

const SelfDestructRow = ({ stock, player, playerStyles, yCoordinate }) => {
  const text = <text { ...textStyle } fill='#FF695E'> self destructs </text>
  const stockCount = renderStockCount(player, stock.count-1)

  const { text: playerTextStyle, stock: playerStockStyle } = playerStyles[player.playerIndex]
  return (
    <g transform={`translate(0, ${yCoordinate})`}>
      <g { ...playerTextStyle }> {text} </g>
      <g { ...playerStockStyle }> {stockCount} </g>
    </g>
  )
}

SelfDestructRow.propTypes = {
  stock: PropTypes.shape({ count: PropTypes.number }).isRequired,
  player: playerPropTypes.isRequired,
  playerStyles: PropTypes.object.isRequired,
  yCoordinate: PropTypes.number.isRequired,
}

export default SelfDestructRow
