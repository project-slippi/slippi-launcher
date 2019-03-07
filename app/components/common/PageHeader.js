import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Header, Icon, Button } from 'semantic-ui-react';
import SpacedGroup from './SpacedGroup';

import styles from './PageHeader.scss';

export default class PageHeader extends Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
    infoText: PropTypes.string,
    icon: PropTypes.string.isRequired,
    history: PropTypes.object.isRequired,
  };

  static defaultProps = {
    infoText: "",
  };

  handleBack = () => {
    this.props.history.goBack();
  };

  render() {
    let infoEl = null;
    if (this.props.infoText) {
      infoEl = <div className={styles['info-text']}>{this.props.infoText}</div>;
    }

    return (
      <Header as="h1" color="green" dividing={true}>
        <Icon name={this.props.icon} />
        <Header.Content className="full-width">
          <div className="flex-horizontal-split">
            {this.props.text}
            <SpacedGroup>
              {infoEl}
              <Button
                content="Back"
                color="green"
                basic={true}
                inverted={true}
                onClick={this.handleBack}
              />
            </SpacedGroup>
          </div>
        </Header.Content>
      </Header>
    );
  }
}
