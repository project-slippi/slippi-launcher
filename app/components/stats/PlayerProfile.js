import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Segment,
} from 'semantic-ui-react';
import PageHeader from '../common/PageHeader';
import PageWrapper from '../PageWrapper';
import PlayerCharacterTable from './PlayerCharacterTable';
import styles from './GameProfile.scss';
import Scroller from '../common/Scroller';
import OpponentTable from './OpponentTable';
import ComboTable from './ComboTable';
import GlobalTable from './GlobalTable';

export default class PlayerProfile extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,

    // fileLoaderAction
    setPlayerProfilePage: PropTypes.func.isRequired,
    //
    // fileLoaderAction
    gamesFilterAdd: PropTypes.func.isRequired,
    gamesFilterRemove: PropTypes.func.isRequired,

    store: PropTypes.object.isRequired,

    // store data
    topNotifOffset: PropTypes.number.isRequired,
  };


  render() {
    const scrollerOffset = this.props.topNotifOffset;
    return (
      <PageWrapper history={this.props.history}>
        <div className="main-padding">
          <PageHeader icon="game" text={this.props.store.player} history={this.props.history} />
          <Scroller topOffset={scrollerOffset}>
            <Segment basic={true}>
              <GlobalTable
                store={this.props.store}
              />
            </Segment>
            <Segment basic={true}>
              <div className={styles['three-column-main']}>
                <PlayerCharacterTable 
                  store={this.props.store}
                  opponent={ false }
                  gamesFilterAdd={ this.props.gamesFilterAdd }
                  gamesFilterRemove={ this.props.gamesFilterRemove }
                />
                <PlayerCharacterTable 
                  store={this.props.store}
                  opponent={ true }
                  gamesFilterAdd={ this.props.gamesFilterAdd }
                  gamesFilterRemove={ this.props.gamesFilterRemove }
                />
                <OpponentTable 
                  store={this.props.store}
                  opponent={ true }
                  setPlayerProfilePage={this.props.setPlayerProfilePage}
                />
              </div>
            </Segment>
            <ComboTable 
              store={this.props.store}
            />
            <Segment basic={true}/>
          </Scroller>
        </div>
      </PageWrapper>
    );
  }
}
