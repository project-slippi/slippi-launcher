import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Input, Button, Segment } from 'semantic-ui-react';

import LabelDescription from './LabelDescription';

export default class ActionInput extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    onChange: PropTypes.func,
    handlerParams: PropTypes.arrayOf(PropTypes.any).isRequired,
  };

  static defaultProps = {
    onChange: () => {},
  };

  clickHandler = () => {
    // This will take the handlerParams params and pass them to the onClick function
    const handlerParams = this.props.handlerParams || [];
    this.props.onClick(...handlerParams);
  };

  changeHandler = () => {
    this.props.onChange();
  };

  render() {
    const actionButton = (
      <Button icon="upload" color="blue" onClick={this.clickHandler} />
    );

    const innerInput = (
      <input type="text" value={this.props.value} readOnly={true} />
    );

    return (
      <Segment basic={true}>
        <LabelDescription
          label={this.props.label}
          description={this.props.description}
        />
        <Input fluid={true} action={actionButton} input={innerInput} />
      </Segment>
    );
  }
}
