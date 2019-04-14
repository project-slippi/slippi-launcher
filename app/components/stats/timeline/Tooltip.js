import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import { getMoveName } from '../../../utils/moves'
import { punishPropTypes, fontSize, textStyle } from './constants'

const getMoveText = (move, index) =>
  <text y={(index+1)*-fontSize} { ...textStyle}>
    { getMoveName(move.moveId) } { Math.trunc(move.damage) }
  </text>

const Tooltip = ({ punish }) => 
  <g> 
    { _(punish.moves).sortBy('frame').reverse().map(getMoveText).value() }
  </g>


Tooltip.propTypes = {
  punish: PropTypes.shape(punishPropTypes).isRequired,
}

export default Tooltip

