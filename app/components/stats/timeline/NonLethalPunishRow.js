import React from 'react'
import PropTypes from 'prop-types'

import PunishRow from './PunishRow'
import { fontSize, punishPropTypes  } from './constants'
import styles from '../GameProfile.scss'

const renderPunishPercent = punish => {
  const gb = Math.max(255-punish.endPercent, 100)
  const percentFill = `rgb(255, ${gb}, ${gb}, .85)`
  return (
    <text
      fontSize={fontSize*1.5}
      strokeWidth={fontSize/3}
      fill={percentFill}
      className={styles['percent']}
    >
      {Math.trunc(punish.endPercent)}%
    </text>
  )
}

const NonLethalPunishRow = ({ punish, playerStyles, yCoordinate }) => {
  const { percent: percentStyle } = playerStyles[punish.opponentIndex] 
  return (
    <PunishRow punish={punish} playerStyles={playerStyles} yCoordinate={yCoordinate}>
      <g { ...percentStyle }> { renderPunishPercent(punish) } </g>
    </PunishRow>
  )
}

NonLethalPunishRow.propTypes = {
  punish: PropTypes.shape(punishPropTypes).isRequired,
  playerStyles: PropTypes.object.isRequired,
  yCoordinate: PropTypes.number.isRequired,
}

export default NonLethalPunishRow