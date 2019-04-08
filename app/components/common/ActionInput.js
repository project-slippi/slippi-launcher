import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Input, Button } from 'semantic-ui-react';

import LabelDescription from './LabelDescription';

export default class ActionInput extends Component {
  static propTypes = {
    showLabelDescription: PropTypes.bool,
    label: PropTypes.string,
    description: PropTypes.node,
    error: PropTypes.bool,
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    onChange: PropTypes.func,
    handlerParams: PropTypes.arrayOf(PropTypes.any).isRequired,
  };

  static defaultProps = {
    label: "Label",
    error: false,
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

    let result = (
      <Input
        fluid={true}
        error={this.props.error}
        action={actionButton}
        input={innerInput}
        onChange={this.changeHandler}
      />
    );

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
