import React, { useState, useEffect, useRef, Fragment } from 'react';
import momentPropTypes from 'react-moment-proptypes';
import classNames from 'classnames';
import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import { IconButton, Icon } from 'rsuite';

import './chat.scss';

import { Message, Content, Metadata, MessageDate, MessageUser, UserStatus } from './views/generic';
import MessageComposer from './views/message-composer';
import MessageGroup from './views/message-group';

const Messages = ({ children }) => {
  const messagesEndRef = useRef(null);
  useEffect(() => {
    const el = messagesEndRef.current;
    el.scrollTo(0, el.scrollHeight);
  }, [children]);

  return (
    <div className="ui-chat-messages chat-history" ref={messagesEndRef}>
      <ul>
        {children}
      </ul>
    </div>
  );
};




const ChatWindow = ({ children, width = '100%', style }) => {

  return (
    <div className="ui-chat-window chat" style={{ width: _.isNumber(width) ? `${width}px` : width, ...style }}>{children}</div>
  );

}







import Showdown from 'showdown';

const MessageFrame = ({ children, ...props }) => {
  const { message, inbound } = props;
  return (
    <Message {...props}>
      <Metadata>
        {inbound && (
          <Fragment>
            <MessageDate date={message.createdAt}/>
            &nbsp;
            <MessageUser>{message.username}</MessageUser>
            &nbsp;
            <UserStatus />
          </Fragment>
        )}
        {!inbound && (
          <Fragment>
            <UserStatus />
            &nbsp;
            <MessageUser>{message.username}</MessageUser>
            <MessageDate date={message.createdAt}/>
          </Fragment>
        )}
      </Metadata>
      {children}
    </Message>
  );
};



const MessageText = props => {
  const { message, markdown = false } = props;

  let html = message.content;
  if (markdown) {
    const converter = new Showdown.Converter({ openLinksInNewWindow: true });
    html = converter.makeHtml(message.content);
  }

  return (
    <Content text={html}/>
  );
};
MessageText.propTypes = {
  message: PropTypes.shape({
    content: PropTypes.string,
    userId: PropTypes.string,
    username: PropTypes.string,
    ts: PropTypes.momentPropTypes
  })
};










class MessagePhoto extends React.Component {
  // TODO username
  // use func and state
  // inbound msg too
  render() {
    const { message } = this.props;

    const arrayBufferView = new Uint8Array(message.content.data);
    const blob = new Blob([arrayBufferView], { type: 'image/jpeg' });
    const urlCreator = window.URL || window.webkitURL;
    const imageUrl = urlCreator.createObjectURL(blob);

    return (
      <Content>
        <img src={imageUrl}/>
      </Content>
    );
  }
};



import MessageButtons from './views/message-buttons';
import MessageQuickReplies from './views/message-quick-replies';



export {
  Message,
  Messages,
  Content,
  Metadata,
  ChatWindow,
  MessageFrame,
  MessageComposer,
  MessageDate,
  MessageUser,
  MessageGroup,
  UserStatus,
  MessageText,
  MessageButtons,
  MessagePhoto,
  MessageQuickReplies
};
