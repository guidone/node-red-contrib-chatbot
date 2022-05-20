import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import {
  MessageFrame,
  MessageText,
  MessageButtons,
  MessagePhoto,
  MessageQuickReplies
} from '../chat';
import GenericMessageGroup from '../generic-message-group';
import { typeMessage } from '../../types';


const GenericMessage = ({
  message = {},
  onClick = () => {},
  useFrame = true,
  beak = true,
  position
}) => {
  // if array messages must be grouped
  if (_.isArray(message)) {
    return (
      <GenericMessageGroup
        messages={message}
        onClick={onClick}
      />
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
          beak={beak}
          position={position}
          markdown={message.params != null && message.params.parseMode === 'Markdown'}
        />
      );
      break;
    case 'photo':
      className = 'ui-chat-message-photo';
      inner = (
        <MessagePhoto
          beak={beak}
          position={position}
          message={message}
          inbound={message.inbound} />
      );
      break;
    case 'inline-buttons':
      inner = (
        <MessageButtons
          message={message}
          inbound={message.inbound}
          beak={beak}
          position={position}
          onClick={onClick}
        />
      );
      break;
    case 'quick-replies':
      inner = (
        <MessageQuickReplies
          message={message}
          inbound={message.inbound}
          beak={beak}
          position={position}
          onClick={onClick}
        />
      );
      break;
    default:
      inner = (
        <MessageText
          message={{ ...message, content: `Unsupported message type "${message.type}"` }}
          inbound={message.inbound}
          position={position}
          beak={beak}
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
  useFrame: PropTypes.bool,
  position: PropTypes.oneOf(['first', 'middle', 'last']),
  beak: PropTypes.bool,
  message: PropTypes.oneOfType([
    typeMessage,
    PropTypes.arrayOf(typeMessage)
  ]),
  onClick: PropTypes.func
};

export default GenericMessage;