import React from 'react';

import {
  Message,
  Messages,
  Content,
  Metadata,
  ChatWindow,
  MessageComposer,
  MessageDate,
  MessageUser,
  UserStatus,
  MessageFrame,
  MessageText,
  MessageButtons,
  MessagePhoto,
  MessageGroup,
  MessageQuickReplies
} from '../chat';



const GenericMessage = ({ message = {}, onClick = () => {} }) => {
  // if array messages must be grouped
  if (_.isArray(message)) {
    return (
      <MessageGroup messages={message} onClick={onClick} />
    );
  }

  switch (message.type) {
    case 'message':
      return (
        <MessageFrame message={message} inbound={message.inbound}>
          <MessageText
            message={message}
            inbound={message.inbound}
            markdown={message.params != null && message.params.parseMode === 'Markdown'}
          />
        </MessageFrame>
      );
    case 'photo':
      return (
        <MessageFrame message={message} inbound={message.inbound} className="ui-chat-message-photo">
          <MessagePhoto message={message} inbound={message.inbound} />
        </MessageFrame>
      );
    case 'inline-buttons':
      return (
        <MessageFrame message={message} inbound={message.inbound}>
          <MessageButtons
            message={message}
            inbound={message.inbound}
            onClick={onClick}
          />
        </MessageFrame>
      );
    case 'quick-replies':
      return (
        <MessageFrame message={message} inbound={message.inbound}>
          <MessageQuickReplies
            message={message}
            inbound={message.inbound}
            onClick={onClick}
          />
        </MessageFrame>
      );
    default:
      return <div>Unsupported message type</div>;
  }
};

export default GenericMessage;