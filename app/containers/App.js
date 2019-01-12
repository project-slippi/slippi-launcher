import * as React from 'react';
import PropTypes from 'prop-types';

export default class App extends React.Component {
  static propTypes = {
    children: PropTypes.any.isRequired,
  };

  render() {
    return (
      <React.Fragment>{this.props.children}</React.Fragment>
    );
  }
}
