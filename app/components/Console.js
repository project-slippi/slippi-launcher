import _ from 'lodash';
import classNames from 'classnames';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import path from 'path';
import { Container, Modal, Form, Card, Button, Icon, Checkbox } from 'semantic-ui-react';
import { ConnectionStatus } from '../domain/ConsoleConnection';
import PageHeader from './common/PageHeader';
import PageWrapper from './PageWrapper';

import styles from './Console.scss';
import SpacedGroup from './common/SpacedGroup';

export default class Console extends Component {
  static propTypes = {
    editConnection: PropTypes.func.isRequired,
    cancelEditConnection: PropTypes.func.isRequired,
    saveConnection: PropTypes.func.isRequired,
    deleteConnection: PropTypes.func.isRequired,
    connectConnection: PropTypes.func.isRequired,
    startMirroring: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
  };

  state = {
    formData: {},
  };

  addConnectionClick = () => {
    this.props.editConnection('new');
  };

  editConnectionClick = index => () => {
    this.props.editConnection(index);
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
    this.setState({
      formData: {
        ...formData,
        [control.name]: control[valueField],
      },
    });
  };

  onFormSubmit = id => () => {
    const formData = this.state.formData || {};
    this.props.saveConnection(id, formData);
  };

  connectTo = connection => () => {
    this.props.connectConnection(connection);
  };

  mirror = connection => () => {
    this.props.startMirroring(connection);
  };

  deleteConnection = connection => () => {
    this.props.deleteConnection(connection);
  }

  renderContent() {
    const store = this.props.store || {};
    const connectionsById = store.connections || [];

    return (
      <Container text={true}>
        <Button color="blue" onClick={this.addConnectionClick}>
          <Icon name="plus" />
          Add Connection
        </Button>
        {connectionsById.map(this.renderConnection)}
      </Container>
    );
  }

  renderConnection = (connection) => (
    <Card
      key={`${connection.id}-${connection.ipAddress}-connection`}
      fluid={true}
      className={styles['card']}
    >
      <Card.Content className={styles['content']}>
        <div className={styles['conn-content-grid']}>
          {this.renderLabelValue("IP Address", connection.ipAddress)}
          {this.renderLabelValue("Target Folder", connection.targetFolder)}
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
  );

  renderConnectButton = connection => {
    const status = connection.connectionStatus;
    const isDisconnected = status === ConnectionStatus.DISCONNECTED;

    const isEnabled = isDisconnected;

    return (
      <Button
        color="blue"
        disabled={!isEnabled}
        onClick={this.connectTo(connection)}
      >
        <Icon name="linkify" />
        Connect
      </Button>
    );
  }

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

    let statusMsg = "Disconnected";
    let statusColor = "gray";
    if (status === ConnectionStatus.CONNECTED && currentFilePath) {
      statusMsg = `Writing file ${path.basename(currentFilePath)}`;
      statusColor = "green";
    } else if (status === ConnectionStatus.CONNECTED) {
      statusMsg = "Connected";
      statusColor = "green";
    } else if (status === ConnectionStatus.CONNECTING) {
      statusMsg = "Connecting..."
      statusColor = "yellow";
    }

    const valueClasses = classNames({
      [styles['conn-status-value']]: true,
      [styles['green']]: statusColor === "green",
      [styles['gray']]: statusColor === "gray",
      [styles['yellow']]: statusColor === "yellow",
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

    return (
      <Form onSubmit={this.onFormSubmit(connectionSettings.id)}>
        <Form.Input
          name="ipAddress"
          label="IP Address"
          defaultValue={connectionSettings.ipAddress}
          onChange={this.onFieldChange}
        />
        <Form.Input
          name="targetFolder"
          label="Target Folder"
          defaultValue={connectionSettings.targetFolder}
          onChange={this.onFieldChange}
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
            defaultChecked={connectionSettings.isRealTimeMode}
            onChange={this.onFieldChange}
          />
        </Form.Field>
        <Form.Button content="Submit" />
      </Form>
    );
  }

  render() {
    return (
      <PageWrapper>
        <div className="main-padding">
          <PageHeader
            icon="microchip"
            text="Console"
            history={this.props.history}
          />
          {this.renderContent()}
          {this.renderEditModal()}
        </div>
      </PageWrapper>
    );
  }
}
