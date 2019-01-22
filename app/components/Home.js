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
        Your support allows me to spend more time on the project and pay for
        services to make it even better. Enjoy the beta features!&nbsp;
        <strong>
          <a href="https://www.patreon.com/fizzi36">Click here</a>
        </strong>
        &nbsp;to view Patreon page.
      </div>
    );

    return (
      <Message
        info={true}
        icon="patreon"
        header="Thank you!"
        content={contentMsg}
      />
    );
  }

  render() {
    const navigationElements = [];

    navigationElements.push(
      this.generateNav(
        'disk',
        'Replay Browser',
        'Play and view replay files on your computer',
        '/files',
        false
      )
    );

    navigationElements.push(
      this.generateNav(
        'microchip',
        'Stream From Console',
        'Get replays by connecting to a console over network',
        '/console',
        false
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
        </Container>
      </PageWrapper>
    );
  }
}
