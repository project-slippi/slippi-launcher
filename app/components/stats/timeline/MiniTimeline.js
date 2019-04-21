import React, { Component } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'

import { punishPropTypes } from './constants'

const getCumulativeComboDamage = punish => 
  punish.moves.reduce((cumulativeDamage, move) =>
    [ ...cumulativeDamage, (_.last(cumulativeDamage) || 0) + move.damage ], []
  )

class Punish extends Component {

  static propTypes = {
    punish: punishPropTypes.isRequired,
    // player: playerPropTypes.isRequired,
    xPosition: PropTypes.oneOf(['left', 'right']).isRequired,
    origin: PropTypes.number.isRequired,
    onPunishMouseOver: PropTypes.func.isRequired,
    onPunishMouseOut: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      hover: false,
    }
  }

  onMouseOver = () => {
    const { punish, onPunishMouseOver } = this.props
    this.setState({hover: true})
    onPunishMouseOver(punish)
  }

  onMouseOut = () => {
    this.setState({hover: false})
    this.props.onPunishMouseOut()
  }

  render() {
    const { punish, xPosition, origin } = this.props
    const cumulativeComboDamage = getCumulativeComboDamage(punish)
    const moves = punish.moves.map((move, index) => (
      <line
        key={xPosition + move.frame}
        y1={move.frame}
        y2={move.frame}
        x1={origin}
        x2={origin + (cumulativeComboDamage[index] * (xPosition === "left" ? -1 : 1))}
        stroke='white'
        strokeWidth={10}
      />
    ))
      
    return (
      <g
      >
        { punish.didKill &&
          <rect
            x={xPosition === "left" ? origin : 0}
            y={punish.startFrame}
            width={origin}
            height={punish.endFrame - punish.startFrame}
            fill='#FF695E'
            opacity={.5}
          />
        }
        { moves }
        <rect
          onMouseOver={this.onMouseOver}
          onMouseOut={this.onMouseOut}
          onFocus={this.onMouseOver}
          onBlur={this.onMouseOut}
          x={xPosition === "left" ? 0 : origin}
          y={punish.startFrame}
          width={origin}
          height={punish.endFrame - punish.startFrame}
          opacity={this.state.hover ? .5 : 0}
          fill="#E9EAEA"
        />
      </g>
    )
  }
}

const MiniTimeline = ({ punishes, players, onPunishMouseOver, onPunishMouseOut }) => {
  
  const height = _.maxBy(punishes, 'endFrame').endFrame

  const width = _(punishes)
    .map(getCumulativeComboDamage)
    .map(_.last)
    .max()
    * 2
  
  const playerIndices = _.keys(players).map(key => parseInt(key, 10))
  const xPositions = _.mapValues(players, player =>
    playerIndices.indexOf(player.playerIndex) === 0 ? "left" : "right"
  )

  const punishesToRender = punishes.map((punish, index) =>
    <Punish
      key={xPositions[punish.playerIndex] + index}
      punish={punish}
      player={players[punish.playerIndex]}
      xPosition={xPositions[punish.playerIndex]}
      origin={width / 2}
      onPunishMouseOver={onPunishMouseOver}
      onPunishMouseOut={onPunishMouseOut}
    />
  )

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      { punishesToRender }
    </svg>   
  )
}

MiniTimeline.propTypes = {
  punishes: PropTypes.arrayOf(punishPropTypes).isRequired,
  players: PropTypes.object.isRequired,
  onPunishMouseOver: PropTypes.func.isRequired,
  onPunishMouseOut: PropTypes.func.isRequired,
}

export default MiniTimeline