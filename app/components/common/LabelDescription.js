import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './LabelDescription.scss';

export default class LabelDescription extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.node.isRequired,
  };

  render() {
    return (
      <div>
        <div className={styles['label']}>{this.props.label}</div>
        <div className={styles['description']}>{this.props.description}</div>
      </div>
    );
  }
}
