import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Button } from 'semantic-ui-react';

import LabelDescription from './LabelDescription';

export default class ActionInput extends Component {
  static propTypes = {
    showLabelDescription: PropTypes.bool,
    name: PropTypes.string,
    label: PropTypes.string,
    description: PropTypes.node,
    error: PropTypes.bool,
    value: PropTypes.string.isRequired,
    defaultValue: PropTypes.string,
    useFormInput: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    onChange: PropTypes.func,
    handlerParams: PropTypes.arrayOf(PropTypes.any).isRequired,
  };

  static defaultProps = {
    name: undefined,
    label: null,
    error: false,
    useFormInput: false,
    defaultValue: undefined,
    description: "Description",
    showLabelDescription: true,
    onChange: () => {},
  };

  clickHandler = () => {
    // This will take the handlerParams params and pass them to the onClick function
    const handlerParams = this.props.handlerParams || [];
    this.props.onClick(...handlerParams);
  };

  changeHandler = (event, data) => {
    this.props.onChange(event, data);
  };

  render() {
    const actionButton = (
      <Button icon="upload" color="blue" onClick={this.clickHandler} />
    );

    const innerInput = (
      <input type="text" value={this.props.value} readOnly={true} />
    );

    const inputProps = {
      name: this.props.name,
      label: this.props.showLabelDescription ? undefined : this.props.label,
      fluid: true,
      error: this.props.error,
      action: actionButton,
      input: innerInput,
      defaultValue: this.props.defaultValue,
      onChange: this.changeHandler,
    };

    let result = this.props.useFormInput ? <Form.Input {...inputProps} /> : <Input {...inputProps} />;

    if (this.props.showLabelDescription) {
      result = (
        <div>
          <LabelDescription
            label={this.props.label}
            description={this.props.description}
          />
          {result}
        </div>
      );
    }

    return result;
  }
}
