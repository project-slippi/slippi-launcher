import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Button,
  Message,
  Header,
  Icon,
  Confirm,
} from 'semantic-ui-react';
import { getDefaultDolphinPath } from '../utils/settings';
import PageHeader from './common/PageHeader';
import ActionInput from './common/ActionInput';
import LabelDescription from './common/LabelDescription';
import DismissibleMessage from './common/DismissibleMessage';

import styles from './Settings.scss';
import PageWrapper from './PageWrapper';
import SpacedGroup from './common/SpacedGroup';
import Scroller from './common/Scroller';

const { app } = require('electron').remote;

export default class Settings extends Component {
  static propTypes = {
    browseFolder: PropTypes.func.isRequired,
    selectFolder: PropTypes.func.isRequired,
    browseFile: PropTypes.func.isRequired,
    validateISO: PropTypes.func.isRequired,
    openDolphin: PropTypes.func.isRequired,
    resetDolphin: PropTypes.func.isRequired,
    setResetConfirm: PropTypes.func.isRequired,

    // error actions
    dismissError: PropTypes.func.isRequired,

    // store data
    history: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    topNotifOffset: PropTypes.number.isRequired,
  };

  componentDidMount() {
    this.props.validateISO();
  }

  setFolderManual = (field, value) => () => {
    this.props.selectFolder(field, value);
  };

  renderGlobalError() {
    const errors = this.props.errors || {};
    const errorKey = 'settings-global';

    const showGlobalError = errors.displayFlags[errorKey] || false;
    const globalErrorMessage = errors.messages[errorKey] || '';
    return (
      <DismissibleMessage
        className="bottom-spacer"
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
        Hello Linux friend! We now include a Dolphin build that will probably
        work on your distro. If it doesn&apos;t work, you will have to build your own. 
        Please find the <b>Playback Dolphin Path</b> &nbsp;option to configure. 
        <strong>
          <a href="https://discord.gg/pPfEaW5">Join the discord</a>&nbsp;
        </strong>
        if you have any questions.
      </div>
    );

    return (
      <Message
        info={true}
        icon="linux"
        header="Additional configuration possibly necessary"
        content={contentMsg}
      />
    );
  }

  renderConfigDolphin() {
    const store = this.props.store || {};

    return (
      <div>
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
          disabled={store.isResetting}
        />
      </div>
    );
  }

  renderResetDolphin() {
    const store = this.props.store || {};
    const confirmShow = _.get(store, 'confirmShow');

    const defaultValue = getDefaultDolphinPath();
    if (defaultValue !== store.settings.playbackDolphinPath) {
      return;
    }

    return (
      <div>
        <LabelDescription
          label="Reset Playback Dolphin"
          description="
            If replay playback fails to work, this button will reset the Playback
            Dolphin to its original state. If this doesn't fix your issue please head
            over to our Discord to receive further support
          "
        />
        <Button
          content="Reset Dolphin"
          color="green"
          size="medium"
          basic={true}
          inverted={true}
          onClick={this.showConfirmReset}
          loading={store.isResetting}
          disabled={store.isResetting}
        />
        <Confirm
          className={styles['confirm']}
          open={!!confirmShow}
          confirmButton="Yes"
          cancelButton="No"
          header="Reset Dolphin?"
          content="Are you sure you would like to reset Dolphin? This will return all the settings to the defaults"
          onConfirm={this.confirmResetDolphin}
          onCancel={this.hideConfirmReset}
        />
      </div>
    )
  }

  showConfirmReset = () => {
    this.props.setResetConfirm(true);
  }

  confirmResetDolphin = () => {
    this.hideConfirmReset();
    this.props.resetDolphin();
  }

  hideConfirmReset = () => {
    this.props.setResetConfirm(false);
  }

  renderISOVersionCheck() {
    const validationState = _.get(this.props.store, 'isoValidationState') || 'unknown';

    let icon, text, loading;
    switch (validationState) {
    case "success":
      icon = "check circle outline";
      text = "Valid";
      loading = false;
      break;
    case "fail":
      icon = "times circle outline";
      text = "Bad ISO";
      loading = false;
      break;
    case "unknown":
      icon = "warning sign"
      text = "Unknown ISO";
      loading = false;
      break;
    case "validating":
      icon = "spinner";
      text = "Verifying";
      loading = true;
      break;
    default:
      icon = "question circle outline";
      text = "";
      loading = false;
      break;
    }

    return (
      <div className={`${styles['iso-version-check']} ${styles[validationState]}`}>
        <span className={styles['iso-verify-text']}>{text}</span>
        <Icon name={icon} fitted={true} loading={loading} size="large" />
      </div>
    );
  }

  renderBasicSettings() {
    const store = this.props.store || {};

    const isoValidationState = _.get(store, 'isoValidationState') || 'unknown';

    const inputs = [
      <div key="meleeISOInput" className={styles['iso-selection-container']}>
        <ActionInput
          label="Melee ISO File"
          description="The path to a NTSC Melee 1.02 ISO. Used for playing replay files"
          value={store.settings.isoPath}
          error={isoValidationState === "fail"}
          onClick={this.props.browseFile}
          handlerParams={['isoPath']}
          disabled={store.isResetting}
        />
        {this.renderISOVersionCheck()}
      </div>,
      <ActionInput
        key="replayRootInput"
        label="Replay Root Directory"
        description={
          'The folder where your slp files are stored. Will usually be the ' +
          'Slippi folder located with Dolphin'
        }
        value={store.settings.rootSlpPath}
        onClick={this.props.browseFolder}
        handlerParams={['rootSlpPath']}
      />,
    ];

    return (
      <div className={styles['section']}>
        <Header inverted={true}>Basic Settings</Header>
        <SpacedGroup direction="vertical" size="lg">
          {inputs}
        </SpacedGroup>
      </div>
    );
  }

  renderAdvancedSettings() {
    const inputs = [];
    
    inputs.push([
      this.renderPlaybackInstanceInput(),
    ]);

    if (_.isEmpty(inputs)) {
      // Don't show advanced toggle if there are no
      // advanced inputs
      return null;
    }

    return (
      <div className={styles['section']}>
        <Header inverted={true}>Advanced Settings</Header>
        <SpacedGroup direction="vertical" size="lg">
          {inputs}
        </SpacedGroup>
      </div>
    );
  }

  renderPlaybackInstanceInput() {
    const store = this.props.store || {};

    const fieldName = 'playbackDolphinPath';
    let resetButton = null;

    const playbackDolphinDescription = (
      <div>
        An instance of Dolphin for playing replays comes bundled
        with this app. This setting allows you to configure a different instance.
      </div>
    );

    const defaultValue = getDefaultDolphinPath();
    if (defaultValue !== store.settings.playbackDolphinPath) {
      resetButton = (
        <Button onClick={this.setFolderManual(fieldName, defaultValue)}>
          Reset
        </Button>
      );
    }

    return (
      <div key="playbackInstanceInput">
        <LabelDescription
          label="Playback Dolphin Path"
          description={playbackDolphinDescription}
        />
        <Message className={styles['dolphin-warning']} color="yellow" warning={true}>
          <Icon name="warning sign" />
          <strong>The default should be used by almost everyone. Only modify if you know what you are doing</strong>
        </Message>
        <SpacedGroup customColumns="1fr auto">
          <ActionInput
            showLabelDescription={false}
            value={store.settings.playbackDolphinPath}
            onClick={this.props.browseFolder}
            handlerParams={[fieldName]}
            disabled={store.isResetting}
          />
          {resetButton}
        </SpacedGroup>
      </div>
    );
  }

  renderActions() {
    return (
      <div className={styles['section']}>
        <Header inverted={true}>Actions</Header>
        <SpacedGroup direction="vertical" size="lg">
          {this.renderConfigDolphin()}
          {this.renderResetDolphin()}
        </SpacedGroup>
      </div>
    )
  }

  renderContent() {
    // TODO: Add options for file type filtering and folder only
    return (
      <div className={styles['container']}>
        {this.renderGlobalError()}
        {this.renderLinuxNotif()}
        {this.renderBasicSettings()}
        {this.renderAdvancedSettings()}
        {this.renderActions()}
      </div>
    );
  }

  render() {
    const currentVersion = app.getVersion();

    return (
      <PageWrapper history={this.props.history}>
        <div className="main-padding">
          <PageHeader
            icon="setting"
            text="Settings"
            infoText={`App v${currentVersion}`}
            history={this.props.history}
          />
          <Scroller topOffset={this.props.topNotifOffset}>
            {this.renderContent()}
          </Scroller>
        </div>
      </PageWrapper>
    );
  }
}