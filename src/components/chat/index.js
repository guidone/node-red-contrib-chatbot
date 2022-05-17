import React, { useEffect, useRef, Fragment } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import Showdown from 'showdown';

import { typeMessage } from '../../types';

import { Message, PhotoContent, Metadata, MessageDate, MessageUser, UserStatus } from './views/generic';
import Content from './views/content';
import MessageComposer from './views/message-composer';
import './chat.scss';

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
Messages.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

const ChatWindow = ({ children, width = '100%', style }) => {
  return (
    <div className="ui-chat-window chat" style={{ width: _.isNumber(width) ? `${width}px` : width, ...style }}>{children}</div>
  );
};
ChatWindow.propTypes = {
  width: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};



const MessageFrame = ({ children, ...props }) => {
  const { message, inbound } = props;
  return (
    <Message {...props}>
      <Metadata>
        {inbound && (
          <Fragment>
            <MessageDate date={message.ts}/>
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
            <MessageDate date={message.ts}/>
          </Fragment>
        )}
      </Metadata>
      {children}
    </Message>
  );
};
MessageFrame.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  message: typeMessage,
  inbound: PropTypes.bool
};

const MessageText = props => {
  const { message, markdown = false, position, beak } = props;

  let html = message.content;
  if (markdown) {
    const converter = new Showdown.Converter({ openLinksInNewWindow: true });
    html = converter.makeHtml(message.content);
  }

  return (
    <Content text={html} position={position} beak={beak}/>
  );
};
MessageText.propTypes = {
  message: typeMessage,
  markdown: PropTypes.bool,
  position: PropTypes.oneOf(['first', 'middle', 'last']),
  beak: PropTypes.bool
};










class MessagePhoto extends React.Component {
  // TODO username
  // use func and state
  // inbound msg too
  render() {
    const { message, position, beak } = this.props;
    const arrayBufferView = new Uint8Array(message.content.data);
    const blob = new Blob([arrayBufferView], { type: 'image/jpeg' });
    const urlCreator = window.URL || window.webkitURL;
    const imageUrl = urlCreator.createObjectURL(blob);

    return (
      <PhotoContent position={position} beak={beak} url={imageUrl} />
    );
  }
}
MessagePhoto.propTypes = {
  message: typeMessage,
  position: PropTypes.oneOf(['first', 'middle', 'last']),
  beak: PropTypes.bool
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
  UserStatus,
  MessageText,
  MessageButtons,
  MessagePhoto,
  MessageQuickReplies
};
