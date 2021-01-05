import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Header, Icon, Button, Input } from 'semantic-ui-react';
import SpacedGroup from './SpacedGroup';

import styles from './PageHeader.scss';

export default class PageHeader extends Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
    infoText: PropTypes.string,
    icon: PropTypes.string.isRequired,
    history: PropTypes.object.isRequired,
    setSearchText: PropTypes.func,
    showSearchBar: PropTypes.bool,
  };

  static defaultProps = {
    infoText: "",
    setSearchText: () => {},
    showSearchBar: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      inputText: "",
    };
  }

  componentWillUnmount() {
    this.delayedStateChange.cancel();
  }

  handleBack = () => {
    this.props.history.goBack();
  };

  delayedStateChange = _.debounce((searchString, setSearchState) => { setSearchState(searchString) }, 1000);

  debounceRequest(searchString) {
    this.delayedStateChange(searchString, this.props.setSearchText);
  };

  onChange = e => {
    this.debounceRequest(e.target.value);
    this.setState({ inputText: e.target.value });
  }

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
              {this.props.showSearchBar && (
              <>
                <div>
                  <Input placeholder='Search' className={styles['search-bar']} onChange={this.onChange} value={this.state.inputText} />
                </div>
                <div className={styles['search-icon']}>
                  <Icon name='search' />
                </div>
              </>)}
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
