import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './SpacedGroup.scss';

export default class SpacedGroup extends Component {
  static propTypes = {
    children: PropTypes.any.isRequired,
    className: PropTypes.string,
    size: PropTypes.string,
    direction: PropTypes.string
  };

  static defaultProps = {
    className: '',
    size: 'sm',
    direction: 'horizontal'
  };

  render() {
    const classes = classNames(
      {
        [styles['container']]: true,
        [styles[this.props.size]]: true,
        [styles[this.props.direction]]: true
      },
      this.props.className
    );

    return <div className={classes}>{this.props.children}</div>;
  }
}
