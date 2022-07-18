import React from 'react';
import _ from 'lodash';
import { FormGroup, InputNumber } from 'rsuite';

import useControl from '../helpers/use-control';
import pickNumber from '../helpers/pick-number';
import ControlLabel from '../views/control-label';
import HelpBlock from '../views/help-block';
import ErrorBlock from '../views/error-block';

const NaN = 0/0;

const IntegerControl = props => {
  const { jsonSchema, required = false, onChange } = props;
  const { error, filteredProps, className, disabled } = useControl(props);
  const { minimum , exclusiveMinimum, maximum, exclusiveMaximum } = jsonSchema || {};

  return (
    <FormGroup>
      {!_.isEmpty(jsonSchema.title) && <ControlLabel required={required}>{jsonSchema.title}</ControlLabel>}
      <InputNumber
        {...filteredProps}
        className={className}
        disabled={disabled}
        max={pickNumber(maximum, exclusiveMaximum)}
        min={pickNumber(minimum, exclusiveMinimum)}
        onChange={value => {
          if (!isNaN(parseFloat(value))) {
            onChange(parseFloat(value));
          } else if (!isNaN(parseInt(value, 10))) {
            onChange(parseInt(value, 10));
          } else {
            onChange(NaN);
          }
        }}
      />
      <HelpBlock jsonSchema={jsonSchema}/>
      <ErrorBlock error={error}/>
    </FormGroup>
  );
}

export default IntegerControl;