import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import Timeline from './Timeline'
import { isSelfDestruct, svgWidth, fontSize } from './constants' 
import { convertFrameCountToDurationString } from '../../../utils/time'

export default class TimelineContainer extends Component {

  static propTypes = {
    game: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)

    const gameStats = this.props.game.getStats()
    this.punishes = _.get(gameStats, 'conversions') || []
    this.stocks = _.get(gameStats, 'stocks') || []

    this.state = {
      viewportStart: 0,
    }
  }

  get players() {
    const gameSettings = this.props.game.getSettings()
    const players = _.get(gameSettings, 'players') || []
    return _.keyBy(players, 'playerIndex')
  }

  get uniqueTimestamps() {
    const punishTimestamps = this.punishes
      .map(punish => convertFrameCountToDurationString(punish.startFrame))

    const stockTimestamps = this.stocks
      .filter(isSelfDestruct(this.punishes))
      .map(stock => convertFrameCountToDurationString(stock.endFrame))
    
    const allTimestamps = [ ...punishTimestamps, ...stockTimestamps ]
    return _(allTimestamps)
      .sortBy()
      .sortedUniq()
      .value()
  }
  
  render() {
    return (
      <svg
        viewBox={`0 ${this.state.viewportStart} ${svgWidth} ${(this.uniqueTimestamps.length+1)*(fontSize*4)}`}
        style={{background: "#2D313A"}}
      >
        <Timeline
          punishes={this.punishes}
          stocks={this.stocks}
          players={this.players}
          uniqueTimestamps={this.uniqueTimestamps}
        />
      </svg>
    )
  }

}