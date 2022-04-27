import React from 'react';
import { FlexboxGrid } from 'rsuite';
import classNames from 'classnames';

import './info-panel.scss';

const InfoPanel = ({ children, colspan = 7, className }) => {
  return (
    <FlexboxGrid.Item colspan={colspan} className={classNames('ui-info-panel', className)}>
      <div className="inner">{children}</div>
    </FlexboxGrid.Item>
  );
}

export default InfoPanel;