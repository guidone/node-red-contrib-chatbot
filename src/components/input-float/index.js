import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { InputNumber } from 'rsuite';

const InputFloat = ({
  onChange = () => {},
  ...rest
}) => {
  const [current, setCurrent] = useState(rest.value);
  return (
    <InputNumber
      {...rest}
      value={current}
      onChange={value => {
        setCurrent(value);
        onChange(parseFloat(value));
      }}
    />
  );
};
InputFloat.propTypes = {
  onChange: PropTypes.func
};

export default InputFloat;