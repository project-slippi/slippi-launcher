import React from 'react'
import PropTypes from 'prop-types'

import PunishRow from './PunishRow'
import { punishPropTypes, playerPropTypes, renderStockCount } from './constants'

const LethalPunishRow = ({ punish, playerStyles, opponent, yCoordinate, stockCount }) => {
  const { stock: stockStyle } = playerStyles[opponent.playerIndex]
  return (
    <PunishRow punish={punish} playerStyles={playerStyles} yCoordinate={yCoordinate}>
      <g { ...stockStyle }> { renderStockCount(opponent, stockCount) } </g>
    </PunishRow>
  )
}

LethalPunishRow.propTypes = {
  punish: punishPropTypes.isRequired,
  opponent: playerPropTypes.isRequired,
  playerStyles: PropTypes.object.isRequired,
  yCoordinate: PropTypes.number.isRequired,
  stockCount: PropTypes.number.isRequired,
}

export default LethalPunishRow