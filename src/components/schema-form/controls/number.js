import React, { useState } from 'react';
import _ from 'lodash';
import { FormGroup, Input } from 'rsuite';

import useControl from '../helpers/use-control';
import pickNumber from '../helpers/pick-number';
import ControlLabel from '../views/control-label';
import HelpBlock from '../views/help-block';
import ErrorBlock from '../views/error-block';

const ALLOWED_CHARS = '01234567890.-+';
const NaN = 0/0;

const NumberController = props => {
  const { jsonSchema, required = false, onChange, value } = props;
  const [current, setCurrent] = useState(_.isNumber(value) ? String(value) : '');
  const { error, filteredProps, className, disabled } = useControl(props);
  const { minimum , exclusiveMinimum, maximum, exclusiveMaximum } = jsonSchema || {};

  return (
    <FormGroup>
      {!_.isEmpty(jsonSchema.title) && <ControlLabel required={required}>{jsonSchema.title}</ControlLabel>}
      <Input
        {...filteredProps}
        value={current}
        className={className}
        disabled={disabled}
        max={pickNumber(maximum, exclusiveMaximum)}
        min={pickNumber(minimum, exclusiveMinimum)}
        onKeyPress={e => {
          if (!ALLOWED_CHARS.includes(e.key)) {
            e.preventDefault();
          }
        }}
        onChange={value => {
          setCurrent(value);
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
};

export default NumberController;