import React from 'react';
import { Toggle } from 'rsuite';
import PropTypes from 'prop-types';

const BooleanField = ({ value, onChange = () => {} }) => {
  return (
    <div style={{ paddingTop: '6px' }}>
      <Toggle checked={value} onChange={onChange}/>
    </div>
  );
};
BooleanField.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.bool
};

export default BooleanField;