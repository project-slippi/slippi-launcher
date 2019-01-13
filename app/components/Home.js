import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Header,
  Icon,
  Container,
  Segment,
  Message,
} from 'semantic-ui-react';
import styles from './Home.scss';
import PageWrapper from './PageWrapper';

export default class Home extends Component {
  generateNav(iconName, header, subHeader, target, disabled) {
    let buttonDisplay = (
      <Button
        key={target}
        fluid={true}
        inverted={true}
        color="green"
        disabled={disabled}
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

    if (!disabled) {
      buttonDisplay = (
        <Link key={target} to={target}>
          {buttonDisplay}
        </Link>
      );
    }

    return buttonDisplay;
  }

  renderPatreonNotif() {
    const contentMsg = (
      <div>
        If you are enjoying using Project Slippi, consider becoming a patron to
        support continued development.&nbsp;
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
        header="Support continued development"
        content={contentMsg}
      />
    );
  }

  render() {
    const navigationElements = [];
    const upcomingElements = [];

    navigationElements.push(
      this.generateNav(
        'disk',
        'Replay Browser',
        'Play and view replay files on your computer',
        '/files',
        false
      )
    );

    upcomingElements.push(
      this.generateNav(
        'microchip',
        'Stream From Console',
        'Get replays by connecting to a console over network',
        '/console',
        true
      )
    );

    navigationElements.push(
      this.generateNav(
        'setting',
        'Configure Settings',
        'Configure iso location and replay root',
        '/settings',
        false
      )
    );

    return (
      <PageWrapper>
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
          <Segment basic={true} className="grid-list">
            <div className="grid-item-center">
              <Header as="h2" color="green">
                Upcoming Features
              </Header>
            </div>
            {upcomingElements}
          </Segment>
        </Container>
      </PageWrapper>
    );
  }
}
