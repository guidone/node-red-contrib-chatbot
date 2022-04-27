import React from 'react';
import classNames from 'classnames';

import './page-container.scss';

const PageContainer = ({ children, className }) => {

  return (
    <div className={classNames('ui-page-container', className)}>{children}</div>
  );
}

export default PageContainer;