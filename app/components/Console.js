import _ from 'lodash';
import classNames from 'classnames';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import path from 'path';
import { Header, Modal, Form, Card, Button, Icon, Checkbox, Message, Tab, Grid } from 'semantic-ui-react';
import { ConnectionStatus } from '../domain/ConsoleConnection';
import PageHeader from './common/PageHeader';
import PageWrapper from './PageWrapper';
import DismissibleMessage from './common/DismissibleMessage';

import styles from './Console.scss';
import SpacedGroup from './common/SpacedGroup';
import ActionInput from './common/ActionInput';
import Scroller from './common/Scroller';

const { dialog } = require('electron').remote;

export default class Console extends Component {
  static propTypes = {
    editConnection: PropTypes.func.isRequired,
    cancelEditConnection: PropTypes.func.isRequired,
    saveConnection: PropTypes.func.isRequired,
    deleteConnection: PropTypes.func.isRequired,
    connectConnection: PropTypes.func.isRequired,
    disconnectConnection: PropTypes.func.isRequired,
    startMirroring: PropTypes.func.isRequired,

    // error actions
    dismissError: PropTypes.func.isRequired,

    // store data
    history: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    topNotifOffset: PropTypes.number.isRequired,
  };

  state = {
    formData: {},
  };

  componentDidMount() {
    this.props.store.scanner.startScanning();
  }

  componentWillUnmount() {
    this.props.store.scanner.stopScanning();
  }

  addConnectionClick = () => {
    this.props.editConnection('new');
  };

  editConnectionClick = (index, defaultSettings = {}) => () => {
    this.props.editConnection(index, defaultSettings);
  };

  onModalClose = () => {
    this.props.cancelEditConnection();

    // Clear formData state for next
    this.setState({
      formData: {},
    });
  };

  onFieldChange = (e, control) => {
    let valueField = "value";
    if (control.type === "radio" || control.type === "checkbox") {
      valueField = "checked";
    }

    const formData = this.state.formData || {};
    const validation = formData.validation || {};
    this.setState({
      formData: {
        ...formData,
        [control.name]: control[valueField],
        validation: {
          ...validation,
          [control.name]: null,
        },
      },
    });
  };

  onSubmitClick = () => {
    // I added this so that the folder browse button couldn't trigger a submit. I didn't know
    // a better solution than this :\
    const formData = this.state.formData || {};
    this.setState({
      formData: {
        ...formData,
        isReadyForSubmit: true,
      },
    })
  }

  onFormSubmit = settings => () => {
    const isReadyForSubmit = _.get(this.state, ['formData', 'isReadyForSubmit']);
    if (!isReadyForSubmit) {
      return;
    }

    // Validate that inputs are properly set

    // Validate that target folder has been set
    const targetFolder = _.get(this.state, ['formData', 'targetFolder']) || settings.targetFolder;
    if (!targetFolder) {
      // If no target folder is set, indicate the error
      const formData = this.state.formData || {};
      this.setState({
        formData: {
          ...formData,
          validation: {
            targetFolder: "empty",
          },
        },
      });
      return;
    }

    // Start with settings values and overwrite with modified
    // form data
    const formData = {
      ...settings,
      ...this.state.formData,
    };

    this.props.saveConnection(settings.id, formData);

    // Clear formData state for next
    this.setState({
      formData: {},
    });
  };

  connectTo = connection => () => {
    this.props.connectConnection(connection);
  };

  disconnect = connection => () => {
    this.props.disconnectConnection(connection);
  };

  mirror = connection => () => {
    this.props.startMirroring(connection);
  };

  deleteConnection = connection => () => {
    this.props.deleteConnection(connection);
  }

  onBrowseFolder = () => {
    dialog.showOpenDialog({
      properties: [
        'openDirectory',
        'treatPackageAsDirectory',
        'createDirectory',
      ],
    }, (folderPaths) => {
      const folderPath = _.get(folderPaths, 0);
      if (!folderPath) {
        return;
      }

      const formData = this.state.formData || {};
      const validation = formData.validation || {};
      this.setState({
        formData: {
          ...formData,
          targetFolder: folderPath,
          validation: {
            ...validation,
            targetFolder: null,
          },
        },
      });
    });
  }

  renderGlobalError() {
    const errors = this.props.errors || {};
    const errorKey = 'console-global';

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

  renderContent() {
    return (
      <div className={styles['container']}>
        {this.renderGlobalError()}
        <div className={styles['global-action-section']}>
          <Button color="blue" onClick={this.addConnectionClick}>
            <Icon name="plus" />
            Add Connection
          </Button>
        </div>
        {this.renderConnectionsSection()}
        {this.renderAvailableSection()}
      </div>
    );
  }

  renderConnectionsSection() {
    const store = this.props.store || {};
    const connections = store.connections || [];

    let content = null;
    if (_.isEmpty(connections)) {
      content = this.renderNoConnectionsState();
    } else {
      content = (
        <SpacedGroup size="lg" direction="vertical">
          {connections.map(this.renderConnection)}
        </SpacedGroup>
      );
    }

    return (
      <div className={styles['section']}>
        <Header inverted={true}>Connections</Header>
        {content}
      </div>
    );
  }

  renderNoConnectionsState() {
    return (
      <Card
        fluid={true}
        className={styles['card']}
      >
        <Card.Content className={styles['content']}>
          <Header
            as="h2"
            className={styles['empty-state-header']}
            inverted={true}
          >
            <Icon name="search" fitted={true} />
            <Header.Content>
              No Connections
              <Header.Subheader>
                Add a new connection in order to connect to a console
              </Header.Subheader>
            </Header.Content>
          </Header>
        </Card.Content>
      </Card>
    );
  }

  renderConnection = (connection) => {
    let relayLabelValue = null;
    if (connection.isRelaying) {
      relayLabelValue = this.renderLabelValue("Relay Port", 666 + connection.id);
    }
    return (<Card
      key={`${connection.id}-${connection.ipAddress}-connection`}
      fluid={true}
      className={styles['card']}
    >
      <Card.Content className={styles['content']}>
        <div className={styles['conn-content-grid']}>
          {this.renderLabelValue("IP Address", connection.ipAddress)}
          {this.renderLabelValue("Target Folder", connection.targetFolder)}
          {relayLabelValue}
          {this.renderStatusLabelValue(connection)}
        </div>
      </Card.Content>
      <Card.Content className={styles['content']}>
        <div className={styles['conn-button-grid']}>
          {this.renderConnectButton(connection)}
          {this.renderMirrorButton(connection)}
          <div key="empty-col" />
          {this.renderEditButton(connection)}
          {this.renderDeleteButton(connection)}
        </div>
      </Card.Content>
    </Card>
    )
  };

  renderConnectButton = connection => {
    const status = connection.connectionStatus;
    const isDisconnected = status === ConnectionStatus.DISCONNECTED;

    if (!isDisconnected) {
      return this.renderDisconnectButton(connection);
    }

    return (
      <Button
        className={styles['connect-btn']}
        color="blue"
        onClick={this.connectTo(connection)}
      >
        <Icon name="linkify" />
        Connect
      </Button>
    );
  }

  renderDisconnectButton = connection => (
    <Button
      className={styles['connect-btn']}
      color="grey"
      onClick={this.disconnect(connection)}
    >
      <Icon name="unlink" />
      Disconnect
    </Button>
  )

  renderMirrorButton = connection => {
    const status = connection.connectionStatus;
    const isConnected = status === ConnectionStatus.CONNECTED;
    const isMirroring = connection.isMirroring;

    const isEnabled = isConnected && !isMirroring;
    return (
      <Button
        color="blue"
        disabled={!isEnabled}
        onClick={this.mirror(connection)}
      >
        <Icon name="film" />
        Mirror
      </Button>
    );
  }

  renderEditButton = connection => {
    const status = connection.connectionStatus;
    const isConnected = status === ConnectionStatus.CONNECTED;

    const isEnabled = !isConnected;

    return (
      <Button
        color="grey"
        disabled={!isEnabled}
        onClick={this.editConnectionClick(connection.id)}
      >
        <Icon name="edit" />
        Edit
      </Button>
    );
  }

  renderDeleteButton = connection => {
    const status = connection.connectionStatus;
    const isConnected = status === ConnectionStatus.CONNECTED;

    const isEnabled = !isConnected;

    return (
      <Button
        color="red"
        disabled={!isEnabled}
        onClick={this.deleteConnection(connection)}
      >
        <Icon name="trash" />
        Delete
      </Button>
    );
  }

  renderLabelValue(label, value) {
    return (
      <React.Fragment>
        <div key="label" className={styles['label']}>{label}</div>
        <div key="value" className={styles['value']}>{value}</div>
      </React.Fragment>
    );
  }

  renderStatusLabelValue(connection) {
    const status = connection.connectionStatus;
    const currentFilePath = _.get(connection, ['slpFileWriter', 'currentFile', 'path']);

    const scanner = _.get(this.props.store, 'scanner');
    const available = scanner ? scanner.getAvailable() : {};
    const isConnectionAvailable = available[connection.ipAddress];

    let statusMsg = "Disconnected";
    let statusColor = "gray";
    if (status === ConnectionStatus.CONNECTED && currentFilePath) {
      statusMsg = `Writing file ${path.basename(currentFilePath)}`;
      statusColor = "green";
    } else if (status === ConnectionStatus.CONNECTED) {
      statusMsg = "Connected";
      statusColor = "green";
    } else if (status === ConnectionStatus.CONNECTING) {
      statusMsg = "Connecting...";
      statusColor = "yellow";
    } else if (status === ConnectionStatus.DISCONNECTED && isConnectionAvailable) {
      statusMsg = "Available";
      statusColor = "white";
    }

    const valueClasses = classNames({
      [styles['conn-status-value']]: true,
      [styles['green']]: statusColor === "green",
      [styles['gray']]: statusColor === "gray",
      [styles['yellow']]: statusColor === "yellow",
      [styles['white']]: statusColor === "white",
    });

    return (
      <React.Fragment>
        <div key="label" className={styles['label']}>Status</div>
        <SpacedGroup className={valueClasses} size="none">
          <Icon size="tiny" name="circle" />
          {statusMsg}
        </SpacedGroup>
      </React.Fragment>
    );
  }

  renderAvailableSection() {
    const store = this.props.store || {};
    const connections = store.connections || [];
    const connectionsByIp = _.keyBy(connections, 'ipAddress');

    const scanner = _.get(store, 'scanner');
    const available = scanner ? scanner.getAvailable() : {};
    const availableNew = _.filter(available, (info) => (
      !connectionsByIp[info.ip]
    ));
    const sortedAvailableNew = _.orderBy(availableNew, ['firstFound'], ['desc']);

    let content = null;
    if (_.isEmpty(sortedAvailableNew)) {
      // Render searching display
      content = this.renderSearchingState();
    } else {
      content = (
        <SpacedGroup size="lg" direction="vertical">
          {sortedAvailableNew.map(this.renderAvailable)}
        </SpacedGroup>
      );
    }

    return (
      <div className={styles['section']}>
        <Header inverted={true}>New Connections</Header>
        {content}
      </div>
    );
  }

  renderSearchingState() {
    // Fuck it doing this in css wasn't working. CSS is the worst
    const iconAnimationStyle = {
      animation: "fa-spin 6s infinite linear",
    };

    const isScanning = this.props.store.scanner.getIsScanning();

    let icon, header, subText;
    if (isScanning) {
      icon = <Icon style={iconAnimationStyle} name="spinner" fitted={true} />;
      header = "Scanning";
      subText = "Looking for available consoles to connect to";
    } else {
      icon = <Icon name="warning sign" fitted={true} />;
      header = "Scanning Error";
      subText = "An error occured while scanning";
    }
    return (
      <Card
        fluid={true}
        className={styles['card']}
      >
        <Card.Content className={styles['content']}>
          <Header
            as="h2"
            className={styles['empty-state-header']}
            inverted={true}
          >
            {icon}
            <Header.Content>
              {header}
              <Header.Subheader>
                {subText}
              </Header.Subheader>
            </Header.Content>
          </Header>
        </Card.Content>
      </Card>
    );
  }

  renderAvailable = (info) => {
    const defaultSettings = {
      'ipAddress': info.ip,
    };

    return (
      <SpacedGroup key={`${info.ip}-available-connection`} customColumns="auto 1fr">
        <Button
          circular={true}
          color="blue"
          icon="plus"
          onClick={this.editConnectionClick("new", defaultSettings)}
        />
        <Card
          fluid={true}
          className={styles['card']}
        >
          <Card.Content className={styles['content']}>
            <div className={styles['conn-content-grid']}>
              {this.renderLabelValue("IP Address", info.ip)}
              {this.renderLabelValue("Name", info.name)}
            </div>
          </Card.Content>
        </Card>
      </SpacedGroup>
    );
  }

  renderEditModal() {
    const store = this.props.store || {};
    const connectionToEdit = store.connectionSettingsToEdit;

    const connectionIndex = _.get(connectionToEdit, 'id');
    const actionText = connectionIndex === 'new' ? 'Add' : 'Edit';

    return (
      <Modal open={!!connectionToEdit} onClose={this.onModalClose}>
        <Modal.Header>{`${actionText} Connection`}</Modal.Header>
        <Modal.Content>{this.renderEditForm(connectionToEdit)}</Modal.Content>
      </Modal>
    );
  }

  renderEditForm(connectionSettings) {
    if (!connectionSettings) {
      return null;
    }

    const formData = _.get(this.state, 'formData') || {};
    const validation = _.get(this.state, ['formData', 'validation']) || {};

    const panes = [
      {
        menuItem: "Basic", pane: (<Tab.Pane key="mirroringTab">
          <Form.Input
            name="ipAddress"
            label="IP Address"
            defaultValue={formData.ipAddress || connectionSettings.ipAddress}
            onChange={this.onFieldChange}
          />
          <ActionInput
            name="targetFolder"
            label="Target Folder"
            error={!!validation['targetFolder']}
            value={formData.targetFolder || connectionSettings.targetFolder || ""}
            onClick={this.onBrowseFolder}
            handlerParams={[]}
            showLabelDescription={false}
            useFormInput={true}
          />
          <Form.Field>
            <label htmlFor="isRealTimeMode">Real-Time Mode</label>
            <div className={styles['description']}>
              <strong>Not recommended unless on wired LAN connection.</strong>&nbsp;
              Real-time mode will attempt to prevent delay from accumulating when mirroring. Using it
              when on a connection with inconsistent latency will cause extremely choppy playback.
            </div>
            <Checkbox
              id="isRealTimeMode"
              name="isRealTimeMode"
              toggle={true}
              defaultChecked={_.defaultTo(formData.isRealTimeMode, connectionSettings.isRealTimeMode)}
              onChange={this.onFieldChange}
            />
          </Form.Field> </Tab.Pane>),
      },
      {
        menuItem: "Advanced", pane: (<Tab.Pane key="obsTab">
          <Grid divided='vertically'>
            <Grid.Row columns={3} className={styles['spacer']}>
              <div className={`${styles['description']} ${styles['spacer']}`}>
                <strong>Only modify if you know what you doing.</strong>&nbsp;
                These settings let you select an OBS source (e.g. your dolphin capture)
                to be shown if the game is active and hidden if the game is inactive.
                You must install the &nbsp;
                <a href="https://github.com/Palakis/obs-websocket">OBS Websocket Plugin</a>&nbsp;
                    for this feature to work.
              </div>
              <Grid.Column>
                <Form.Input
                  name="obsIP"
                  label="OBS Websocket IP:Port"
                  defaultValue={formData.obsIP || connectionSettings.obsIP || ""}
                  placeholder="localhost:4444"
                  onChange={this.onFieldChange}
                />
              </Grid.Column>
              <Grid.Column>
                <Form.Input
                  name="obsPassword"
                  label="OBS Websocket Password"
                  defaultValue={formData.obsPassword || connectionSettings.obsPassword || ""}
                  onChange={this.onFieldChange}
                />
              </Grid.Column>
              <Grid.Column>
                <Form.Input
                  name="obsSourceName"
                  label="OBS Source Name"
                  defaultValue={formData.obsSourceName || connectionSettings.obsSourceName || ""}
                  onChange={this.onFieldChange}
                />
              </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={1}>
              <Grid.Column>
                <Form.Field>
                  <label htmlFor="isRelaying">Wii Relay</label>
                  <div className={styles['description']}>
                    The relay allows external programs (e.g. stream layouts) to tap into the raw Slippi data stream without affecting mirroring.
                    This connection&apos;s relay port will be shown on the console card after you have saved and is activated once you select connect.
                  </div>
                  <Checkbox
                    id="isRelaying"
                    name="isRelaying"
                    toggle={true}
                    defaultChecked={_.defaultTo(formData.isRelaying, connectionSettings.isRelaying)}
                    onChange={this.onFieldChange}
                  />
                </Form.Field>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={1}>
              <Grid.Column>
                <Form.Field>
                  <label htmlFor="port">Connection Port</label>
                  <div className={styles['description']}>
                    The connection port should only be changed if you are connecting to a relay, 666 is the port all Wiis use to send data.
                  </div>
                  <Form.Input
                    name="port"
                    defaultValue={formData.port || connectionSettings.port || "666"}
                    onChange={this.onFieldChange}
                  />
                </Form.Field>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Tab.Pane>),
      },
    ];

    let errorMessage = null;
    if (validation.targetFolder === "empty") {
      errorMessage = "Target folder cannot be empty. This is where your replays will go to be " +
        "read by dolphin.";
    }

    return (
      <Form error={!!errorMessage} onSubmit={this.onFormSubmit(connectionSettings)} >
        <Tab renderActiveOnly={false} panes={panes} className={styles['spacer']} />
        <Message error={true} content={errorMessage} />
        <Form.Button content="Submit" onClick={this.onSubmitClick} />
      </Form>
    );
  }

  render() {
    return (
      <PageWrapper history={this.props.history}>
        <div className="main-padding">
          <PageHeader
            icon="microchip"
            text="Console"
            history={this.props.history}
          />
          <Scroller topOffset={this.props.topNotifOffset}>
            {this.renderContent()}
            {this.renderEditModal()}
          </Scroller>
        </div>
      </PageWrapper>
    );
  }
}
