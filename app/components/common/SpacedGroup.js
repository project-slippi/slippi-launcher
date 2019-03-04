import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './SpacedGroup.scss';

export default class SpacedGroup extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    size: PropTypes.string,
    direction: PropTypes.string,
    customColumns: PropTypes.string,
  };

  static defaultProps = {
    className: '',
    size: 'sm',
    direction: 'horizontal',
    customColumns: null,
  };

  render() {
    const classes = classNames(
      {
        [styles['container']]: true,
        [styles[this.props.size]]: true,
        [styles[this.props.direction]]: true,
      },
      this.props.className
    );

    const customStyles = {};
    if (this.props.customColumns) {
      // Think of a better way to do this
      customStyles['gridTemplateColumns'] = this.props.customColumns;
    }

    return <div style={customStyles} className={classes}>{this.props.children}</div>;
  }
}
