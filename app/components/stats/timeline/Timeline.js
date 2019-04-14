import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import styles from '../GameProfile.scss'

import NonLethalPunishRow from './NonLethalPunishRow'
import LethalPunishRow from './LethalPunishRow'
import SelfDestructRow from './SelfDestructRow'
import TimestampBox from './TimestampBox'
import { getYCoordinateFromFrame, fontSize, svgWidth, stockSize, isSelfDestruct, punishPropTypes } from './constants'

const Timeline = ({ punishes, stocks, players, uniqueTimestamps, hoveredPunish }) => {

  const [firstPlayer, secondPlayer] = _.sortBy(_.keys(players))

  const playerStyles = {
    [firstPlayer]: {
      stock: {transform: `translate(${svgWidth*.45 - 4*stockSize}, ${stockSize / 2})`},
      percent: {transform: `translate(${svgWidth*.45}, 0)`, textAnchor: 'end'},
      text: {transform: `translate(${svgWidth*.1}, 0)`, textAnchor: 'start'},
      line: {x1: svgWidth*.375, x2: svgWidth*.45, stroke: 'rgba(255, 255, 255, 0.7)', strokeWidth: .1},
    },
    [secondPlayer]: {
      stock: {transform: `translate(${svgWidth*.55}, ${fontSize / 2})`},
      percent: {transform: `translate(${svgWidth*.55}, 0)`},
      text: {transform: `translate(${svgWidth*.9}, 0)`, textAnchor: 'end'},
      line: {x1: svgWidth*.625, x2: svgWidth*.55, stroke: 'rgba(255, 255, 255, 0.7)', strokeWidth: .1},
    },
  }

  const nonLethalPunishRows = punishes
    .filter(punish => !punish.didKill)
    .map(punish =>
      <NonLethalPunishRow
        key={`${punish.playerIndex} ${punish.startFrame}`}
        punish={punish}
        playerStyles={playerStyles}
        yCoordinate={getYCoordinateFromFrame(punish.startFrame, uniqueTimestamps)}
      />
    )

  const getCurrentStockCount = punish =>
    _(stocks)
      .filter(stock => stock.playerIndex === punish.opponentIndex && stock.startFrame < punish.startFrame)
      .sortBy('startFrame')
      .last()
      .count
      
  const lethalPunishRows = punishes
    .filter(punish => !!punish.didKill)
    .map(punish => 
      <LethalPunishRow 
        key={`${punish.playerIndex} ${punish.startFrame}`}
        punish={punish}
        opponent={players[punish.opponentIndex]}
        playerStyles={playerStyles}
        yCoordinate={getYCoordinateFromFrame(punish.startFrame, uniqueTimestamps)}
        stockCount={getCurrentStockCount(punish) - 1}
      />
    )

  const selfDestructRows = stocks
    .filter(isSelfDestruct(punishes))
    .map(stock =>
      <SelfDestructRow
        key={`${stock.playerIndex} ${stock.endFrame}`}
        stock={stock}
        player={players[stock.playerIndex]}
        playerStyles={playerStyles}
        yCoordinate={getYCoordinateFromFrame(stock.endFrame, uniqueTimestamps)}
      />
    )

  const timestampBoxes = uniqueTimestamps
    .map((timestamp, index) =>
      <TimestampBox
        key={timestamp}
        timestamp={timestamp}
        yCoordinate={(index+1) * (fontSize*4)}
      />
    )

  return (
    <g>
      { hoveredPunish &&
        <rect
          x={0}
          y={getYCoordinateFromFrame(hoveredPunish.startFrame, uniqueTimestamps) - fontSize*2}
          width={svgWidth}
          height={fontSize*4}
          className={styles['punish-hover']}
        />
      }
      { nonLethalPunishRows }
      { lethalPunishRows }
      { selfDestructRows }

      {/* divider */}
      <line
        x1={svgWidth / 2}
        x2={svgWidth / 2}
        y1="0"
        y2={(uniqueTimestamps.length+1)*(fontSize*4)}
        stroke='rgba(255, 255, 255, 0.75)'
        strokeWidth='.1'
      />

      { timestampBoxes }
    </g>
  )
}

Timeline.propTypes = {
  punishes: PropTypes.arrayOf(punishPropTypes).isRequired,
  stocks: PropTypes.arrayOf(PropTypes.object).isRequired,
  players: PropTypes.object.isRequired,
  uniqueTimestamps: PropTypes.arrayOf(PropTypes.string).isRequired,
  hoveredPunish: punishPropTypes,
}

Timeline.defaultProps = {
  hoveredPunish: null,
}

export default React.memo(Timeline)