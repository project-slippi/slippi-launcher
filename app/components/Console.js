import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Container, Modal, Form, Card, Button } from 'semantic-ui-react';
import PageHeader from './common/PageHeader';

export default class Console extends Component {
  static propTypes = {
    editConnection: PropTypes.func.isRequired,
    cancelEditConnection: PropTypes.func.isRequired,
    saveConnection: PropTypes.func.isRequired,
    // deleteConnection: PropTypes.func.isRequired,
    connectConnection: PropTypes.func.isRequired,
    startMirroring: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired
  };

  state = {
    formData: {}
  };

  addConnectionClick = () => {
    this.props.editConnection('new');
  };

  editConnectionClick = index => {
    this.props.editConnection(index);
  };

  onModalClose = () => {
    this.props.cancelEditConnection();
  };

  onFieldChange = (e, { name, value }) => {
    const formData = this.state.formData || {};
    this.setState({
      formData: {
        ...formData,
        [name]: value
      }
    });
  };

  onFormSubmit = id => {
    const formData = this.state.formData || {};
    this.props.saveConnection(id, formData);
  };

  connectTo = connection => {
    this.props.connectConnection(connection);
  };

  mirror = connection => {
    this.props.startMirroring(connection);
  };

  renderContent() {
    const store = this.props.store || {};
    const connectionsById = store.connections || [];

    return (
      <Container text={true}>
        <Button color="blue" onClick={this.addConnectionClick}>
          Add Connection
        </Button>
        {connectionsById.map(this.renderConnection)}
      </Container>
    );
  }

  renderConnection = (connection, index) => (
    <Card key={`${connection.ipAddress}-connection`}>
      <Card.Content>
        <p>{connection.ipAddress}</p>
        <p>{connection.targetFolder}</p>
        <Button onClick={_.partial(this.editConnectionClick, index)}>
          Edit
        </Button>
        {this.renderConnectButton(connection)}
        {this.renderMirrorButton(connection)}
      </Card.Content>
    </Card>
  );

  renderConnectButton = connection => (
    <Button onClick={_.partial(this.connectTo, connection)}>Connect</Button>
  );

  renderMirrorButton = connection => (
    <Button onClick={_.partial(this.mirror, connection)}>Mirror</Button>
  );

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
      <Form onSubmit={_.partial(this.onFormSubmit, connectionSettings.id)}>
        <Form.Input
          name="ipAddress"
          label="IP Address"
          value={connectionSettings.ipAddress}
          onChange={this.onFieldChange}
        />
        <Form.Input
          name="targetFolder"
          label="Target Folder"
          value={connectionSettings.targetFolder}
          onChange={this.onFieldChange}
        />
        <Form.Button content="Submit" />
      </Form>
    );
  }

  render() {
    return (
      <div className="main-padding">
        <PageHeader
          icon="microchip"
          text="Console"
          history={this.props.history}
        />
        {this.renderContent()}
        {this.renderEditModal()}
      </div>
    );
  }
}
