import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

import Language from '../../../components/language';

const ContentIcon = ({ language, disabled = false, title, onClick = () => {} }) => {
  return (
    <a
      style={{ display: 'inline-block', marginLeft: '3px', opacity: disabled ? '0.2' : '1' }}
      href="#"
      onClick={e => {
        e.preventDefault();
        if (!disabled) {
          onClick();
        }
      }}
    >
      <Language tooltip={title}>{!_.isEmpty(language) ? language : '?'}</Language>
    </a>
  );
};
ContentIcon.propTypes = {
  language: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  title: PropTypes.string.isRequired,
  onClick: PropTypes.func
};

export default ContentIcon;