import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Button,
  Header,
  Icon,
  Container,
  Segment,
  Message,
} from 'semantic-ui-react';
import DismissibleMessage from './common/DismissibleMessage';
import styles from './Home.scss';
import PageWrapper from './PageWrapper';
import Scroller from './common/Scroller';
import DolphinManager from '../domain/DolphinManager'

export default class Home extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,

    topNotifOffset: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props)
    this.state = {
      dolphinManager: new DolphinManager('home'),
      error: null,
    }
  }

  renderGlobalError() {
    return (
      <DismissibleMessage
        error={true}
        visible={this.state.error !== null}
        icon="warning circle"
        header="An error has occurred"
        content={this.state.error ? this.state.error.toString() : ""}
        onDismiss={() => this.setState({error: null})}
      />
    );
  }

  generateNav(iconName, header, subHeader, target, disabled, isAction) {
    let buttonDisplay = (
      <Button
        fluid={true}
        inverted={true}
        color="green"
        disabled={disabled}
        onClick={isAction ? target : null}
      >
        <div className="grid-list center-items">
          <Header as="h2" inverted={true} textAlign="center">
            <Icon name={iconName} />
            <Header.Content>
              {header}
              <Header.Subheader>{subHeader}</Header.Subheader>
            </Header.Content>
          </Header>
        </div>
      </Button>
    );

    let earlyAccessNotif = null;
    if (!disabled && !isAction) {
      buttonDisplay = (
        <Link key={target} to={target}>
          {buttonDisplay}
        </Link>
      );
    } else if (disabled) {
      earlyAccessNotif = (
        <div className={styles["patreon-only-feature"]}>
          <Icon name="patreon" /> Early-Access Available
        </div>
      );
    }

    return (
      <div key={target} className={styles["nav-button-root"]}>
        {buttonDisplay}
        {earlyAccessNotif}
      </div>
    );
  }

  renderPatreonNotif() {
    const contentMsg = (
      <div>
        If you are enjoying using Project Slippi, consider becoming a patron to
        support continued development and unlock early-access features.&nbsp;
        <strong>
          <a href="https://www.patreon.com/fizzi36">Click here</a>
        </strong>
        &nbsp;to support!
      </div>
    );

    return (
      <Message
        info={true}
        icon="patreon"
        header="Unspeakable amount of hours have gone into this"
        content={contentMsg}
      />
    );
  }

  render() {
    const navigationElements = [];

    navigationElements.push(
      this.generateNav(
        'disk',
        'Play Game',
        'Super Smash Bros Melee for the Nintendo Gamecube',
        () => this.state.dolphinManager.runDolphinNetplay(true).catch(e => this.setState({error: e})),
        false,
        true,
      )
    );

    navigationElements.push(
      this.generateNav(
        'disk',
        'Show Me Your Moves!',
        'Play and view replay files on your computer',
        '/files',
        false,
        false,
      )
    );

    navigationElements.push(
      this.generateNav(
        'microchip',
        'Stream From Console',
        'Get replays by connecting to a console over network',
        '/console',
        false,
        false,
      )
    );

    navigationElements.push(
      this.generateNav(
        'podcast',
        'Gameplay Broadcasts',
        'Share your gameplay or watch others',
        '/broadcast',
        false,
        false,
      )
    );

    navigationElements.push(
      this.generateNav(
        'setting',
        'Configure Settings',
        'Configure iso location and replay root',
        '/settings',
        false,
        false,
      )
    );

    return (
      <PageWrapper history={this.props.history}>
        <Scroller topOffset={this.props.topNotifOffset - 85}>
          {this.renderGlobalError()}
          <Container text={true} className={styles['vertical-space']}>
            {this.renderPatreonNotif()}
            <Segment basic={true} className="grid-list">
              <div className="grid-item-center">
                <Header as="h2" color="green">
                  Navigation
                </Header>
              </div>
              {navigationElements}
            </Segment>
          </Container>
        </Scroller>
      </PageWrapper>
    );
  }
}
