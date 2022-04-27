import React from 'react';
import classNames from 'classnames';

import '../styles/tag.scss';

const Tag = ({ children, size = 'small' }) => (
  <div className={classNames('question-tag', { [size]: true })}>{children}</div>
);

export default Tag;
