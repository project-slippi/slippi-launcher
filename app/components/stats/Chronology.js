import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import { convertFrameCountToDurationString } from '../../utils/time'
import { getMoveName } from '../../utils/moves'
import getLocalImage from '../../utils/image'

export default class Chronology extends Component {

    static propTypes = {
      game: PropTypes.object.isRequired,
    }

    svgWidth = 150

    fontSize = this.svgWidth / 75

    gameStats = this.props.game.getStats()

    punishes = _.get(this.gameStats, 'conversions') || []

    stocks = _.get(this.gameStats, 'stocks') || []

    get players() {
      const gameSettings = this.props.game.getSettings()
      const players = _.get(gameSettings, 'players') || []
      return _.keyBy(players, 'playerIndex')
    }

    textStyle = {
      fontSize: this.fontSize,
      dominantBaseline: 'middle',
      fill: "rgba(255, 255, 255, 0.7)",
    }

    get playerStyles() {
      const [firstPlayer, secondPlayer] = _.sortBy(_.keys(this.players))
      return {
        [firstPlayer]: {
          stock: {transform: `translate(${this.svgWidth*.45 - 4*this.fontSize}, ${this.fontSize / 2})`},
          percent: {transform: `translate(${this.svgWidth*.45}, 0)`, textAnchor: 'end'},
          text: {transform: `translate(${this.svgWidth*.1}, 0)`, textAnchor: 'start'},
          line: {x1: this.svgWidth*.375, x2: this.svgWidth*.45, stroke: 'rgba(255, 255, 255, 0.7)', strokeWidth: .1},
        },
        [secondPlayer]: {
          stock: {transform: `translate(${this.svgWidth*.55}, ${this.fontSize / 2})`},
          percent: {transform: `translate(${this.svgWidth*.55}, 0)`},
          text: {transform: `translate(${this.svgWidth*.9}, 0)`, textAnchor: 'end'},
          line: {x1: this.svgWidth*.625, x2: this.svgWidth*.55, stroke: 'rgba(255, 255, 255, 0.7)', strokeWidth: .1},
        },
      }
    }

    isSelfDestruct = stock => {
      const punishEndedThisStock = punish =>
        punish.opponentIndex === stock.playerIndex
          && punish.didKill
          && punish.endFrame === stock.endFrame

      return stock.endFrame && !this.punishes.find(punishEndedThisStock)
    }

    get uniqueTimestamps() {
      const punishTimestamps = this.punishes
        .map(punish => convertFrameCountToDurationString(punish.startFrame))

      const stockTimestamps = this.stocks
        .filter(this.isSelfDestruct)
        .map(stock => convertFrameCountToDurationString(stock.endFrame))

      const allTimestamps = [ ...punishTimestamps, ...stockTimestamps ]
      return _(allTimestamps)
        .sortBy()
        .sortedUniq()
        .value()
    }

    svgHeight = (this.uniqueTimestamps.length+1)*(this.fontSize*4)

    getYCoordinateFromFrame(frame) {
      const timestamp = convertFrameCountToDurationString(frame)
      const index = this.uniqueTimestamps.indexOf(timestamp)
      return (index+1) * (this.fontSize*4)
    }

    renderStock = (player, stocksRemaining) => (stockNumber, index) => {
      const imageName = `stock-icon-${player.characterId}-${player.characterColor}.png`
      return (
        <image
          opacity={stockNumber > stocksRemaining ? .5 : 1}
          xlinkHref={getLocalImage(imageName)}
          height={this.fontSize}
          width={this.fontSize}
          x={this.fontSize*(player.startStocks - (index+1))}
          y={-this.fontSize}
        />
      )
    }

    renderStockCount(playerIndex, stocksRemaining) {
      const player = this.players[playerIndex]
      const renderStock = this.renderStock(player, stocksRemaining)

      const stockIcons = _
        .range(1, player.startStocks+1)
        .map(renderStock)

      return <g>{stockIcons}</g>
    }

    renderPunishText(punish) {
      const { moves, startPercent, endPercent, openingType } = punish
      const damageDone = endPercent - startPercent

      const moveText = moves.length > 1
        ? `${moves.length} moves`
        : `${getMoveName(_.last(moves).moveId)}`

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
          <text { ...this.textStyle }>
            {`deals ${Math.trunc(damageDone)}% with ${moveText} from a ${openingType.replace('-', ' ')} `}
          </text>
          { punish.didKill && <text y={this.fontSize} { ...this.textStyle }> {killText} </text> }
        </g>
      )
    }

    renderPunishStockCount(punish) {
      const currentStock = _.chain(this.stocks)
        .filter(stock => stock.playerIndex === punish.opponentIndex && stock.startFrame < punish.startFrame)
        .sortBy('startFrame')
        .last()
        .value()
        
      return this.renderStockCount(punish.opponentIndex, currentStock.count-1)
    }

    generatePunishRow = punish => {
      const text = this.renderPunishText(punish)
      const yCoordinate = this.getYCoordinateFromFrame(punish.startFrame)

      const { playerIndex, opponentIndex } = punish
      const { text: textStyle, line: lineStyle } = this.playerStyles[playerIndex]
      const { stock: stockStyle, percent: percentStyle } = this.playerStyles[opponentIndex]

      return (
        <g transform={`translate(0, ${yCoordinate})`}>
          { punish.openingType !== 'trade' && <line { ...lineStyle } /> }
          <g { ...textStyle }> {text} </g>
          { punish.didKill
            // if punished killed, render opponent's stockCount
            ? <g { ...stockStyle }> {this.renderPunishStockCount(punish)} </g>
            // otherwise render opponent's percent
            : <g { ...percentStyle }>
              <text fontSize={this.fontSize*1.5} dominantBaseline="middle"> {Math.trunc(punish.endPercent)}% </text>
            </g>
          }
        </g>
      )
    }

    generateSelfDestructRow = stock => {
      const { playerIndex, count, endFrame } = stock
      const text = <text { ...this.textStyle }> {`self destructs`} </text>
      const stockCount = this.renderStockCount(playerIndex, count-1)
      const yCoordinate = this.getYCoordinateFromFrame(endFrame)

      const { text: textStyle, stock: stockStyle } = this.playerStyles[playerIndex]
      // may be worth it to abstract this
      return (
        <g transform={`translate(0, ${yCoordinate})`}>
          <g { ...textStyle } > {text} </g>
          <g { ...stockStyle } > {stockCount} </g>
        </g>
      )
    }

    generateTimestampBox = (timestamp, index) => 
      <g
        transform={`translate(${this.svgWidth / 2}, ${(index+1) * (this.fontSize*4)})`}
        textAnchor='middle'
      >
        <rect
          width={this.fontSize*4} height={this.fontSize*2}
          x={-this.fontSize*2} y={-this.fontSize}
          stroke="rgba(255, 255, 255, 0.7)" strokeWidth=".1"
          fill="#282B33" rx={this.fontSize / 2}
        />
        <text { ...this.textStyle } > {timestamp} </text>
      </g>

    render() {
      const punishRows = this.punishes.map(this.generatePunishRow)
      const selfDestructRows = this.stocks
        .filter(this.isSelfDestruct)
        .map(this.generateSelfDestructRow)
      const timestampBoxes = this.uniqueTimestamps.map(this.generateTimestampBox)

      return (
        <svg viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`} style={{background: "#2D313A"}}>
          { punishRows }
          { selfDestructRows }

          {/* divider */}
          <line
            x1={this.svgWidth / 2} x2={this.svgWidth / 2}
            y1="0" y2={this.svgHeight}
            stroke='rgba(255, 255, 255, 0.7)' strokeWidth='.1'
          />

          { timestampBoxes }
        </svg>
      )
    }
}