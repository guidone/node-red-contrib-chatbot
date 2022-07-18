import React from 'react';
import { DatePicker } from 'rsuite';
import PropTypes from 'prop-types';

import isValidDate from '../../../helpers/is-valid-date';

const DateField = ({ value, onChange = () => {} }) => {
  const date = new Date(value);
  console.log('value', value, date, isValidDate(date)     )
  return (
    <div>
      <DatePicker 
        style={{ width: '100%' }}
        value={isValidDate(date) ? date : undefined}
        onChange={date => onChange(date.toJSON())}
      />
    </div>
  );
};
DateField.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string
};

export default DateField;