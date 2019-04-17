import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './Scroller.scss';

const path = require('path');

export default class Scroller extends Component {
  render() {
    return <div className={styles['scroller']}>{this.props.children}</div>;
  }
}
