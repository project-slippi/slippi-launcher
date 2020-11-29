import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Copy from 'react-copy-to-clipboard';
import Tooltip from './Tooltip';

export default class CopyToClipboard extends Component {
  static propTypes = {
    children: PropTypes.any.isRequired,
    text: PropTypes.string.isRequired,
    timeoutMs: PropTypes.number,
  };

  static defaultProps = {
    timeoutMs: 2000,
  };

  state = {
    copied: false,
  };

  timeout = null;

  onCopy = () => {
    this.reset();
    this.setState({ copied: true });
    this.timeout = setTimeout(() => this.setState({ copied: false }), this.props.timeoutMs);
  };

  reset = () => {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.setState({ copied: false });
  }

  render() {
    return (
      <Tooltip
        title={this.state.copied ? 'Copied!' : 'Copy to clipboard'}
        onUnmount={this.reset}
      >
        <Copy text={this.props.text} onCopy={this.onCopy}>
          {this.props.children}
        </Copy>
      </Tooltip>
    );
  }
}
