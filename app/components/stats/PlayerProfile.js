import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageHeader from '../common/PageHeader';
import PageWrapper from '../PageWrapper';

export default class PlayerProfile extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,

    player: PropTypes.string.isRequired,

  };

  render() {
    return (
      <PageWrapper history={this.props.history}>
        <div className="main-padding">
          <PageHeader icon="game" text={this.props.player} history={this.props.history} />
        </div>
      </PageWrapper>
    );
  }
}
