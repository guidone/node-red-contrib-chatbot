import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, FormControl } from 'rsuite';

const OtpEditor = ({ formValue, onChange }) => {

  return (
    <div className="content-token-payload">
      <FormGroup>
        <ControlLabel>One Time Password</ControlLabel>
        <div className="token">
          <FormControl
            name="otp"
            value={formValue.otp}
            onChange={otp => onChange({ ...formValue, otp })}
          />
        </div>
      </FormGroup>
    </div>
  );
};
OtpEditor.propTypes = {
  formValue: PropTypes.shape({
    otp: PropTypes.string
  }),
  onChange: PropTypes.func
};

export default OtpEditor;