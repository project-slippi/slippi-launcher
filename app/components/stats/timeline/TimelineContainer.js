import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import Timeline from './Timeline'
import MiniTimeline from './MiniTimeline'
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

    this.timelineRef = React.createRef()

    this.state = {
      hoveredPunish: null,
    }
  }

  componentDidMount() {
    this.heightRatio = this.timelineRef.current.scrollHeight / (this.uniqueTimestamps.length + 1)
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

  onPunishMouseOver = punish => {
    const timestamp = convertFrameCountToDurationString(punish.startFrame)
    const y = this.uniqueTimestamps.indexOf(timestamp) * this.heightRatio
    this.setState({hoveredPunish: punish})
    this.timelineRef.current.scrollTo({top: y, behavior: "smooth"})
  }

  onPunishMouseOut = () =>
    this.setState({hoveredPunish: null})
  
  render() {
    return (
      <div style={{display: "flex", height: "50rem"}}>
        <div
          ref={this.timelineRef}
          style={{flex: 10, overflow: 'scroll', overflowX: 'hidden'}}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${(this.uniqueTimestamps.length+1)*(fontSize*4)}`}
            style={{background: "#2D313A"}}
          >
            <Timeline
              punishes={this.punishes}
              stocks={this.stocks}
              players={this.players}
              uniqueTimestamps={this.uniqueTimestamps}
              hoveredPunish={this.state.hoveredPunish}
            />
          </svg>
        </div>
        <div style={{flex: 2}}>
          <MiniTimeline
            players={this.players}
            punishes={this.punishes}
            onPunishMouseOver={this.onPunishMouseOver}
            onPunishMouseOut={this.onPunishMouseOut}
          />
        </div>
      </div>
    )
  }

}