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
import { getGlobalStats } from '../../utils/game'

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
    const stats = getGlobalStats(this.props.store.games, this.props.store.player)
    console.log(stats.punishes[0])
    return (
      <PageWrapper history={this.props.history}>
        <div className="main-padding">
          <PageHeader icon="game" text={this.props.store.player} history={this.props.history} />
          <Scroller topOffset={scrollerOffset}>
            <Segment basic={true}>
              <div className={styles['three-column-main']}>
                <PlayerCharacterTable 
                  characterStats={stats.charIds}
                  player={this.props.store.player}
                  opponent={false}
                  gamesFilterAdd={ this.props.gamesFilterAdd }
                  gamesFilterRemove={ this.props.gamesFilterRemove }
                />
                <PlayerCharacterTable 
                  characterStats={stats.opponentChars}
                  player={this.props.store.player}
                  opponent={true}
                  gamesFilterAdd={ this.props.gamesFilterAdd }
                  gamesFilterRemove={ this.props.gamesFilterRemove }
                />
                <OpponentTable 
                  opponentStats={stats.opponents}
                  player={this.props.store.player}
                  gamesFilterAdd={ this.props.gamesFilterAdd }
                  gamesFilterRemove={ this.props.gamesFilterRemove }
                  setPlayerProfilePage={this.props.setPlayerProfilePage}
                />
              </div>
            </Segment>
            <Segment basic={true}>
              <GlobalTable stats={stats} player={this.props.store.player} />
            </Segment>
            <Segment basic={true}>
              <ComboTable punishes={stats.punishes} player={this.props.store.player} />
            </Segment>
          </Scroller>
        </div>
      </PageWrapper>
    );
  }
}
