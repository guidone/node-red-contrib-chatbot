import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Tag, Whisper, Tooltip } from 'rsuite';

import './language.scss';

const Language = ({ children, tooltip }) => {
  const inner = <Tag color="cyan" className="ui-language-label">{children}</Tag>;
  return !_.isEmpty(tooltip) ?
    <Whisper placement="top" speaker={<Tooltip>{tooltip}</Tooltip>}>{inner}</Whisper> : inner;
};


export default Language;