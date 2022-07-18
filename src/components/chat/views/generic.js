import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import _ from 'lodash';
import moment from 'moment';
import momentPropTypes from 'react-moment-proptypes';
import { Icon } from 'rsuite';


const Message = ({ children, inbound = true, className }) => {
  return (
    <li className={classNames('ui-chat-message', className, { clearfix: inbound, inbound, outbound: !inbound })}>
      {children}
    </li>
  );
};
Message.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  inbound: PropTypes.bool,
  className: PropTypes.string
};






/**
 * PhotoContent
 * Generic frame for a photo url
 */
const PhotoContent = ({
  url,
  beak = false,
  position
}) => {
  return (
    <div className={classNames('ui-chat-photo-content', { beak, [position]: true })}>
      <img src={url} style={{ width: '100%' }}/>
    </div>
  );
};
PhotoContent.propTypes = {
  url: PropTypes.string,
  beak: PropTypes.bool,
  position: PropTypes.oneOf(['first', 'middle', 'last'])
};

const Metadata = ({ children }) => {
  return (
    <div className="ui-chat-metadata">
      {children}
    </div>
  );
};
Metadata.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};

const MessageDate = ({ children, date }) => {
  return (
    <span className="ui-chat-message-date">
      {moment.isMoment(date) && date.format('HH:mm')}
      {_.isString(date) && moment(date).isValid() && moment(date).format('HH:mm')}
      {children}
    </span>
  );
}
MessageDate.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  date: PropTypes.oneOfType([momentPropTypes.momentObj, PropTypes.func])
};

const MessageUser = ({ children }) => {
  return (
    <div className="ui-chat-message-user">{children}</div>
  );
};
MessageUser.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
}

const UserStatus = ({ online = true }) => {
  return (
    <Icon icon="circle" className={classNames('ui-chat-status', { online, offline: !online })} />
  )
};
UserStatus.propTypes = {
  online: PropTypes.bool
};

const Buttons = ({ children, layout = 'quick-replies' }) => {
  return (
    <div className={classNames(
      'ui-chat-buttons',
      {
        'quick-replies': layout === 'quick-replies',
        'inline': layout === 'inline',
        'card': layout === 'card'
      }
    )}
    >
      {children}
    </div>
  );
};
Buttons.propTypes = {
  layout: PropTypes.oneOf(['quick-replies', 'inline', 'card']),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

const Button = ({ onClick = () => {}, children }) => {
  return (
    <div className="ui-chat-button" onClick={onClick}>{children}</div>
  );
};
Button.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export { Message, Metadata, MessageDate, MessageUser, UserStatus, Button, Buttons, PhotoContent };