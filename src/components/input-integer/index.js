import React from 'react';
import PropTypes from 'prop-types';
import { InputNumber } from 'rsuite';

const InputInteger = ({ onChange = () => {}, ...rest }) => (
  <InputNumber
    {...rest}
    onChange={value => {
      onChange(parseInt(value, 10));
    }}
  />
);
InputInteger.propTypes = {
  onChange: PropTypes.func
};

export default InputInteger;
