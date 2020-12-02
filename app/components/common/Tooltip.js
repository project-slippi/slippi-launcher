import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { Popup } from 'semantic-ui-react';

export default class Tooltip extends Component {
  static propTypes = {
    children: PropTypes.any.isRequired,
    title: PropTypes.string.isRequired,
  };

  render() {
    const { title, children, ...rest } = this.props;
    return (
      <Popup
        size="mini"
        position="top center"
        content={title}
        inverted={true}
        trigger={children}
        {...rest}
      />
    );
  }
}
