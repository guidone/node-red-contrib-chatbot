import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import _ from 'lodash';
import moment from 'moment';
import { IconButton, Icon } from 'rsuite';


const Message = ({ children, inbound = true, className }) => {
  return (
    <li className={classNames('ui-chat-message', className, { clearfix: inbound, inbound, outbound: !inbound })}>
      {children}
    </li>
  );

};

const Content = ({
  children,
  firstOfGroup = false,
  position,
  text = null
}) => {
  if (!_.isEmpty(text)) {
    return (
      <div
        className={classNames("ui-chat-content message", { 'first-of-group': firstOfGroup, [position]: true })}
        dangerouslySetInnerHTML={{
          __html: text.replace(/\n/g, '<br/>')
        }}
      />
    );
  }
  return (
    <div className={classNames("ui-chat-content message", { 'first-of-group': firstOfGroup, [position]: true })}>{children}</div>
  );
};
Content.propTypes = {
  text: PropTypes.string,
  position: PropTypes.oneOf(['first',  'middle', 'last'])
};

const Metadata = ({ children }) => {
  return (
    <div className="ui-chat-metadata">
      {children}
    </div>
  );
}

const MessageDate = ({ children, date }) => {

  return (
    <span className="ui-chat-message-date">
      {moment.isMoment(date) && date.format('HH:mm')}
      {_.isString(date) && moment(date).isValid() && moment(date).format('HH:mm')}
      {children}
    </span>
  );
}

const MessageUser = ({ children }) => {
  return (
    <div className="ui-chat-message-user">{children}</div>
  );
}

const UserStatus = ({ online = true }) => {
  return (
    <Icon icon="circle" className={classNames('ui-chat-status', { online, offline: !online })} />
  )
}

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

const Button = ({ value, onClick = () => {}, children }) => {

  return (
    <div className="ui-chat-button" onClick={onClick}>{children}</div>
  );

};


export { Message, Content, Metadata, MessageDate, MessageUser, UserStatus, Button, Buttons };