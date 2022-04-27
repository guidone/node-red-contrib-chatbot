import React from 'react';
import PropTypes from 'prop-types';
import { Tag } from 'rsuite';
import classNames from 'classnames';

import './small-tag.scss';

const SmallTag = ({ color, capitalize = true, children }) => {
  return (
    <Tag style={{backgroundColor: color }} className={classNames('ui-small-tag', { capitalize })}>{children}</Tag>
  );
}
SmallTag.propTypes = {
  color: PropTypes.string,
  capitalize: PropTypes.bool
};

export default SmallTag;