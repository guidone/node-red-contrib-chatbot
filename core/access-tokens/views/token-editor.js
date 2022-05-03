import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, DatePicker } from 'rsuite';

import { CopyAndPasteButton } from '../../../src/components';

const TokenEditor = ({ formValue, onChange }) => {

  return (
    <div className="content-token-payload">
      <FormGroup>
        <ControlLabel>Access Token</ControlLabel>
        <div className="token">
          {formValue.token}
          &nbsp;
          <CopyAndPasteButton
            notification="Token copied to clipboard!"
            style="icon"
            text={formValue.token}
          />
        </div>
      </FormGroup>
      <FormGroup>
        <ControlLabel>Expire at</ControlLabel>
        <div className="expire-at">
          <DatePicker
            block
            cleanable={false}
            format="DD/MM/YYYY"
            value={formValue.expire_at}
            onChange={value => {
              onChange({ ...formValue, expire_at: value.toISOString() })
            }}
          />
        </div>
      </FormGroup>
    </div>
  );
};
TokenEditor.propTypes = {
  formValue: PropTypes.shape({
    token: PropTypes.string,
    expire_at: PropTypes.object
  }),
  onChange: PropTypes.func
};

export default TokenEditor;