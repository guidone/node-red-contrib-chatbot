import React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { Icon, Tooltip, Whisper } from 'rsuite';

import './panel.scss';

const Panel = ({ children, title, className, draggable = true, scrollable = false, menu, hint, nopadding = false }) => {
  return (
    <div className={classNames('ui-grid-panel', className, { draggable, 'not-scrollable': !scrollable, scrollable, nopadding } )}>
      {!_.isEmpty(title) && (
        <div className="ui-panel-title">
          {title}
          {hint != null && (
            <Whisper placement="top" speaker={<Tooltip>{hint}</Tooltip>}>
              <Icon className="hint-icon" icon="question-circle2"/>
            </Whisper>
          )}
          <div className="menu">{menu}</div>
        </div>
      )}
      <div className="ui-grid-panel-content">
        {children}
      </div>
    </div>
  );
}

Panel.Empty = ({ children }) => <div className="ui-grid-panel-empty">{children}</div>

export default Panel;