import React, { useState, Fragment } from 'react';
import { Input, InputGroup, Icon } from 'rsuite';
import PropTypes from 'prop-types';

const PasswordInput = ({ value, onChange = () => {}, placeholder }) => {
  const [changed, setChanged] = useState(false)
  const [visible, setVisible] = useState(false);

  return (
    <div className="ui-password">
      <InputGroup>
        <Input
          type={visible ? 'text' : 'password'}
          value={changed ? value : placeholder }
          onChange={value => {
            if (!changed) {
              onChange(!_.isEmpty(value) ? value[value.length - 1] : '');
            } else {
              onChange(value);
            }
            setChanged(true);
          }}
        />
        {changed &&(
          <Fragment>
            <InputGroup.Button
              onMouseDown={() => setVisible(true)}
              onMouseUp={() => setVisible(false)}
            >
              <Icon icon="eye" />
            </InputGroup.Button>
          <InputGroup.Button
            onClick={() => {
              setChanged(false);
              onChange(undefined);
            }}
          >
            <Icon icon="times-circle" />
          </InputGroup.Button>
          </Fragment>
        )}
      </InputGroup>
    </div>
  );
};
PasswordInput.propTypes = {
  value: PropTypes.string,
  // password is never show, placeholder just show some **** in the box
  placeholder: PropTypes.string,
  onChange: PropTypes.func
};


export default PasswordInput;