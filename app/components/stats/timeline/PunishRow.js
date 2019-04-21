import React, { Component } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'

import { fontSize, textStyle, punishPropTypes } from './constants'
import { getMoveName } from '../../../utils/moves'
import Tooltip from './Tooltip'

const renderPunishText = punish => {
  const { moves, openingType } = punish
  const damageDone = _.sumBy(moves, 'damage')

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

  // greenish
  // const rb = Math.max(255 - 50*(amountOfMoves-1), 0)
  return `rgb(${red}, ${green}, 255, 1)`
}

export default class PunishRow extends Component {

  static propTypes = {
    punish: punishPropTypes.isRequired,
    playerStyles: PropTypes.object.isRequired,
    yCoordinate: PropTypes.number.isRequired,
    children: PropTypes.element.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      hover: false,
    }
  }

  render() {
    const { punish, playerStyles, yCoordinate, children } = this.props
    const text = renderPunishText(punish)
    const { text: playerTextStyle, line: playerLineStyle, tooltip: tooltipStyle } = playerStyles[punish.playerIndex]
  
    return (
      <g transform={`translate(0, ${yCoordinate})`}>
        { punish.openingType !== 'trade' &&
          <line
            { ...playerLineStyle }
            stroke='rgba(255, 255, 255, 0.7)'
            strokeWidth={.1}
          />
        }
        <g
          onMouseOver={() => this.setState({hover: true})}
          onMouseOut={() => this.setState({hover: false})}
          onFocus={() => this.setState({hover: true})}
          onBlur={() => this.setState({hover: false})}
          { ...playerTextStyle }
        > 
          {this.state.hover && punish.moves.length > 1 && <Tooltip punish={punish} tooltipStyle={tooltipStyle}/>}
          {text} 
        </g>
        { children }
      </g>
    )
  }
}