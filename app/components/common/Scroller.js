import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './Scroller.scss';

export default class Scroller extends Component {
  static propTypes = {
    children: PropTypes.any.isRequired,
  };

  render() {
    return <div className={styles['scroller']}>{this.props.children}</div>;
  }
}
