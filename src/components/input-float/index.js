import React from 'react';
import { InputNumber } from 'rsuite';

export default ({ onChange = () => {}, ...rest }) => (
  <InputNumber
    {...rest}
    onChange={value => {
      onChange(parseFloat(value));
    }}
  />
);