import React from 'react';
import { InputNumber } from 'rsuite';
import PropTypes from 'prop-types';

const NumberField = ({ value, onChange = () => {} }) => {
  return (
    <div style={{ width: '100%' }}>
      <InputNumber value={value} onChange={onChange}/>
    </div>
  );
};
NumberField.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string
};

export default NumberField;