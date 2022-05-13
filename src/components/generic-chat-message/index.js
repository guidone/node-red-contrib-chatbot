import React from 'react';
import PropTypes from 'prop-types';

import {
  MessageFrame,
  MessageText,
  MessageButtons,
  MessagePhoto,
  MessageGroup,
  MessageQuickReplies
} from '../chat';



const GenericMessage = ({
  message = {},
  onClick = () => {},
  useFrame = true
}) => {
  // if array messages must be grouped
  if (_.isArray(message)) {
    return (
      <MessageGroup messages={message} onClick={onClick} />
    );
  }
  let inner;
  let className;
  switch (message.type) {
    case 'message':
      inner = (
        <MessageText
          message={message}
          inbound={message.inbound}
          markdown={message.params != null && message.params.parseMode === 'Markdown'}
        />
      );
      break;
    case 'photo':
      className = 'ui-chat-message-photo';
      inner = (
        <MessagePhoto message={message} inbound={message.inbound} />
      );
      break;
    case 'inline-buttons':
      inner = (
        <MessageButtons
          message={message}
          inbound={message.inbound}
          onClick={onClick}
        />
      );
      break;
    case 'quick-replies':
      inner = (
        <MessageQuickReplies
          message={message}
          inbound={message.inbound}
          onClick={onClick}
        />
      );
      break;
    default:
      inner = (
        <MessageText
          message={{ ...message, content: `Unsupported message type "${message.type}"` }}
          inbound={message.inbound}
        />
      );
      break;
  }

  if (useFrame) {
    return (
      <MessageFrame message={message} inbound={message.inbound} className={className}>{inner}</MessageFrame>
    )
  } else {
    return inner;
  }
};
GenericMessage.propTypes = {
  useFrame: PropTypes.bool
};


export default GenericMessage;