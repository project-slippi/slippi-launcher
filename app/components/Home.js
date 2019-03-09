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
import styles from './Home.scss';
import PageWrapper from './PageWrapper';

export default class Home extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  generateNav(iconName, header, subHeader, target, disabled) {
    let buttonDisplay = (
      <Button
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

    let earlyAccessNotif = null;
    if (!disabled) {
      buttonDisplay = (
        <Link key={target} to={target}>
          {buttonDisplay}
        </Link>
      );
    } else {
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

  // renderPatreonNotif() {
  //   const contentMsg = (
  //     <div>
  //       Your support allows me to spend more time on the project and pay for
  //       services to make it even better. Enjoy the beta features!&nbsp;
  //       <strong>
  //         <a href="https://www.patreon.com/fizzi36">Click here</a>
  //       </strong>
  //       &nbsp;to view Patreon page.
  //     </div>
  //   );

  //   return (
  //     <Message
  //       info={true}
  //       icon="patreon"
  //       header="Thank you!"
  //       content={contentMsg}
  //     />
  //   );
  // }

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
      <PageWrapper history={this.props.history}>
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
