import React from 'react';
import PropTypes from 'prop-types';
import { Button, Whisper, Tooltip } from 'rsuite';
import _ from 'lodash';
import classNames from 'classnames';

import './style.scss';

const CustomButton = ({
  children,
  disabled = false,
  onClick = () => {},
  ...props
}) => {

  const isDisabled = disabled !== false;
  const inner = (
    <Button
      {...props}
      className={classNames('ui-custom-button', { disabled: isDisabled })}
      onClick={(e) => {
        if (!isDisabled) {
          onClick(e);
        }
      }}
    >{children}</Button>
  );

  if (_.isString(disabled)) {
    return (
      <Whisper trigger="hover" placement="top" speaker={<Tooltip>{disabled}</Tooltip>}>
        {inner}
      </Whisper>
    );
  } else {
    return inner;
  }
};
CustomButton.propTypes = {
  disabled: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  children: PropTypes.element,
  onClick: PropTypes.func
};

export default CustomButton;