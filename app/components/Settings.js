import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Container,
  Segment,
  Button,
  Accordion,
  Icon,
  Message
} from 'semantic-ui-react';
import PageHeader from './common/PageHeader';
import ActionInput from './common/ActionInput';
import LabelDescription from './common/LabelDescription';
import DismissibleMessage from './common/DismissibleMessage';

import styles from './Settings.scss';

export default class Settings extends Component {
  props: {
    browseFolder: () => void,
    browseFile: () => void,
    saveSettings: () => void,
    clearChanges: () => void,
    openDolphin: () => void,

    // error actions
    dismissError: PropTypes.func,

    // store data
    history: Object,
    store: Object,
    errors: Object
  };

  state = {
    isAdvancedSectionOpen: false
  };

  componentWillUnmount() {
    this.props.clearChanges();
  }

  toggleAdvanced = () => {
    this.setState(prevState => ({
      isAdvancedSectionOpen: !prevState.isAdvancedSectionOpen
    }));
  };

  renderGlobalError() {
    const errors = this.props.errors || {};
    const errorKey = 'settings-global';

    const showGlobalError = errors.displayFlags[errorKey] || false;
    const globalErrorMessage = errors.messages[errorKey] || '';
    return (
      <DismissibleMessage
        error={true}
        visible={showGlobalError}
        icon="warning circle"
        header="An error has occurred"
        content={globalErrorMessage}
        onDismiss={this.props.dismissError}
        dismissParams={[errorKey]}
      />
    );
  }

  renderLinuxNotif() {
    const platform = process.platform;
    if (platform !== 'linux') {
      return null;
    }

    const contentMsg = (
      <div>
        Hello Linux friend! We cannot include a Dolphin build that is guaranteed
        to work on your distro. You will need to build Dolphin and configure the{' '}
        <b>Playback Dolphin Path</b> in the Advanced Settings dropdown.&nbsp;
        <a href="https://discord.gg/KkhZQfR">Join the discord</a> &nbsp;if you
        have any questions.
      </div>
    );

    return (
      <Message
        info={true}
        icon="linux"
        header="Additional configuration necessary"
        content={contentMsg}
      />
    );
  }

  renderSave() {
    const store = this.props.store || {};

    const extraProps = {};
    if (_.isEqual(store.currentSettings, store.storedSettings)) {
      // This will disable the button if there's nothing to save
      extraProps.disabled = true;
    }

    return (
      <Segment basic={true}>
        <Button
          {...extraProps}
          content="Save"
          color="blue"
          size="big"
          onClick={this.props.saveSettings}
        />
      </Segment>
    );
  }

  renderConfigDolphin() {
    return (
      <Segment basic={true}>
        <LabelDescription
          label="Configure Playback Dolphin"
          description="
            The Dolphin used to play replay files is stored somewhere in the
            depths of your file system. This button will open that Dolphin for
            you so that you can change settings.
          "
        />
        <Button
          content="Configure Dolphin"
          color="green"
          size="medium"
          basic={true}
          inverted={true}
          onClick={this.props.openDolphin}
        />
      </Segment>
    );
  }

  renderAdvanced() {
    const store = this.props.store || {};

    const playbackDolphinDescription =
      'The path to the playback instance. ' +
      'If changed this will no longer used the instance of Dolphin packaged with ' +
      'this app. Changing this can cause issues with playback. ' +
      'Linux users *must* do the following: (1) use the installer script to compile ' +
      'Dolphin, then; (2) set this path to the directory containing the playback instance.';

    return (
      <Accordion>
        <Accordion.Title
          className={styles['expand-toggle']}
          active={this.state.isAdvancedSectionOpen}
          onClick={this.toggleAdvanced}
        >
          <Icon name="dropdown" />
          Advanced Settings
        </Accordion.Title>
        <Accordion.Content active={this.state.isAdvancedSectionOpen}>
          <ActionInput
            label="Playback Dolphin Path"
            description={playbackDolphinDescription}
            value={store.currentSettings.playbackDolphinPath}
            onClick={this.props.browseFolder}
            handlerParams={['playbackDolphinPath']}
          />
        </Accordion.Content>
      </Accordion>
    );
  }

  renderContent() {
    const store = this.props.store || {};

    // TODO: Add options for file type filtering and folder only
    return (
      <Container text={true}>
        {this.renderGlobalError()}
        {this.renderLinuxNotif()}
        <ActionInput
          label="Melee ISO File"
          description="The path to a NTSC Melee 1.02 ISO. Used for playing replay files"
          value={store.currentSettings.isoPath}
          onClick={this.props.browseFile}
          handlerParams={['isoPath']}
        />
        <ActionInput
          label="Replay Root Directory"
          description={
            'The folder where your slp files are stored. Will usually be the ' +
            'Slippi folder located with Dolphin'
          }
          value={store.currentSettings.rootSlpPath}
          onClick={this.props.browseFolder}
          handlerParams={['rootSlpPath']}
        />
        {this.renderAdvanced()}
        {this.renderSave()}
        {this.renderConfigDolphin()}
      </Container>
    );
  }

  render() {
    return (
      <div className="main-padding">
        <PageHeader
          icon="setting"
          text="Settings"
          history={this.props.history}
        />
        {this.renderContent()}
      </div>
    );
  }
}
