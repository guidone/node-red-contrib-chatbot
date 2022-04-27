import React from 'react';
import { Icon, IconStack } from 'rsuite';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

const TX = {
  ban: 'ban',
  circle: 'circle',
  check: 'check',
  'close': 'close',
  question: 'question2',
  refresh: 'refresh2',
  notch: 'circle-o-notch',
  exclamation: 'exclamation',
  square: 'square-o',
  sun: 'sun-o',
  times: 'times-circle-o'
};

const WarningBox = ({
  title,
  icon = 'exclamation-circle',
  children,
  hover,
  className
}) => {

  // ban, circle, check, close, question2, refresh2, circle-o-notch, exclamation, square-o, sun-o, times-circle-o
  return (
    <div className={classNames('ui-warning-box', className)}>
      <div className="icon">
        <IconStack size="2x">
          <Icon icon={icon} stack="1x" />
          {hover != null && <Icon icon={TX[hover]} stack="2x" style={{ color: '#f44336' }} />}
        </IconStack>
      </div>
      <div className="text">
        <b>{title}</b>
        <div className="description">
          {children}
        </div>
      </div>
    </div>
  );
};
WarningBox.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  hover: PropTypes.oneOf(['ban', 'circle', 'check', 'close', 'question', 'refresh', 'notch', 'exclamation', 'square', 'sun', 'times'])
};

export default WarningBox;