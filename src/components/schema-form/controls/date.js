import React, { useState } from 'react';
import _ from 'lodash';
import { FormGroup, Input, DatePicker } from 'rsuite';
import classNames from 'classnames';

import isValidDate from '../../../../src/helpers/is-valid-date';

import useControl from '../helpers/use-control';
import ControlLabel from '../views/control-label';
import HelpBlock from '../views/help-block';
import ErrorBlock from '../views/error-block';


const DateControl = props => {
  const { jsonSchema, required = false, onChange, value } = props;
  const { error, disabled, className, filteredProps } = useControl(props);

  const { format } = jsonSchema || {};
  let controlFormat;
  if (format === 'date-time') {
    controlFormat = 'DD/MM/YYYY HH:mm:ss';
  } else if (format === 'date') {
    controlFormat = 'DD/MM/YYYY';
  } else if (format === 'time') {
    controlFormat = 'HH:mm:ss';
  }

  const current = new Date(value);
  return (
    <FormGroup>
      {!_.isEmpty(jsonSchema.title) && <ControlLabel required={required}>{jsonSchema.title}</ControlLabel>}
      <DatePicker
        {...filteredProps}
        value={isValidDate(current) ? current : null}
        className={className}
        disabled={disabled}
        onClean={() => onChange(null)}
        format={controlFormat}
        onChange={value => onChange(value.toISOString())}
        oneTap
        block
      />
      <HelpBlock jsonSchema={jsonSchema}/>
      <ErrorBlock error={error}/>
    </FormGroup>
  );
};

export default DateControl;