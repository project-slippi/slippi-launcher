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

    games: PropTypes.array.isRequired,
    player: PropTypes.string.isRequired,

    // store data
    topNotifOffset: PropTypes.number.isRequired,
  };

  render() {
    const scrollerOffset = this.props.topNotifOffset;
    return (
      <PageWrapper history={this.props.history}>
        <div className="main-padding">
          <PageHeader icon="game" text={this.props.player} history={this.props.history} />
          <Scroller topOffset={scrollerOffset}>
            <Segment basic={true}>
              <GlobalTable
                games={this.props.games} 
                playerTag={this.props.player} 
              />
            </Segment>
            <Segment basic={true}>
              <div className={styles['three-column-main']}>
                <PlayerCharacterTable 
                  games={this.props.games} 
                  playerTag={this.props.player} 
                  opponent={ false }
                />
                <PlayerCharacterTable 
                  games={this.props.games} 
                  playerTag={this.props.player} 
                  opponent={ true }
                />
                <OpponentTable 
                  games={this.props.games} 
                  playerTag={this.props.player} 
                  opponent={ true }
                  setPlayerProfilePage={this.props.setPlayerProfilePage}
                />
              </div>
            </Segment>
            <ComboTable 
              games={this.props.games} 
              playerTag={this.props.player} 
            />
            <Segment basic={true}/>
          </Scroller>
        </div>
      </PageWrapper>
    );
  }
}
