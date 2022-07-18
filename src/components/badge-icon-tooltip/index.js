import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Whisper, Tooltip } from 'rsuite';
import classNames from 'classnames';

import './style.scss';

const BadgeIconTooltip = ({ icon, text, tooltip, color }) => {
  const dom = (
    <div className={classNames('ui-badge-icon-tooltip', { [color]: true })}>
      <Icon icon={icon} />
      {text != null && <span className="text">{text}</span>}
    </div>
  );

  if (tooltip != null) {
    return (
      <Whisper trigger="hover" placement="top" speaker={<Tooltip>{tooltip}</Tooltip>}>
        {dom}
      </Whisper>
    );
  } else {
    return dom;
  }
};
BadgeIconTooltip.propTypes = {
  color: PropTypes.oneOf(['red', 'orange']),
  // text next to the icon
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.string,
  tooltip: PropTypes.string
};

export default BadgeIconTooltip;