import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Home from '../components/Home';

export default class HomePage extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  render() {
    return (
      <Home history={this.props.history} />
    );
  }
}
