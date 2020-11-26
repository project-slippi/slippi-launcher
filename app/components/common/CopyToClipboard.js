import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'semantic-ui-react';
import Copy from 'react-copy-to-clipboard';

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

  onCopy = () => {
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), this.props.timeoutMs);
  };

  render() {
    return (
      <Popup
        size="tiny"
        position="top center"
        content={this.state.copied ? 'Copied!' : 'Click to copy'}
        trigger={
          <Copy text={this.props.text} onCopy={() => this.onCopy()}>
            {this.props.children}
          </Copy>
        }
      />
    );
  }
}
