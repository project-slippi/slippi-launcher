import React from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'

import { fontSize, textStyle, punishPropTypes } from './constants'
import { getMoveName } from '../../../utils/moves'

const renderPunishText = punish => {
  const { moves, startPercent, endPercent, openingType } = punish
  const damageDone = endPercent - startPercent

  const moveText = moves.length > 1
    ? `${moves.length} moves`
    : getMoveName(_.last(moves).moveId)

  let killText = ''
  if (punish.didKill) {
    killText += 'and takes a stock'
    if (moves.length > 1) {
    // if there's only one move in the combo, the move name is already mentioned in moveText
      killText += ` with ${getMoveName(_.last(moves).moveId)}`
    }
  }

  return (
    <g>
      <text { ...textStyle }>
        deals {Math.trunc(damageDone)}% with
        <tspan fill={getMoveTextFill(moves.length)}> {moveText} </tspan>
        from a {openingType.replace('-', ' ')}
      </text>
      { punish.didKill && <text y={fontSize} { ...textStyle }> {killText} </text> }
    </g>
  )
}

const getMoveTextFill = (amountOfMoves) => {

  // orangeish
  // const green = Math.max(255 - 50*(amountOfMoves-1), 125)
  // const blue = Math.max(150 - 50*(amountOfMoves-1), 0)

  // pinkish
  // const red = Math.max(255 - 8*(amountOfMoves-1), 225)
  // const green = Math.max(255 - 50*(amountOfMoves-1), 50)

  // blueish
  const red = Math.max(255 - 50*(amountOfMoves-1), 0)
  const green = Math.max(255 - 10*(amountOfMoves-1), 200)

  return `rgb(${red}, ${green}, 255, 1)`
}

const PunishRow = ({ punish, playerStyles, yCoordinate, children }) => {
  const text = renderPunishText(punish)
  const { text: playerTextStyle, line: playerLineStyle } = playerStyles[punish.playerIndex]

  return (
    <g transform={`translate(0, ${yCoordinate})`}>
      { punish.openingType !== 'trade' && <line { ...playerLineStyle } /> }
      <g { ...playerTextStyle }> {text} </g>
      { children }
    </g>
  )
}

PunishRow.propTypes = {
  punish: PropTypes.shape(punishPropTypes).isRequired,
  playerStyles: PropTypes.object.isRequired,
  yCoordinate: PropTypes.number.isRequired,
  children: PropTypes.element.isRequired,
}

export default PunishRow