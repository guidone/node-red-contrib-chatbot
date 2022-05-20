import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

import { Message, Metadata, MessageDate, MessageUser, UserStatus } from '../chat/views/generic';

import GenericMessage from '../generic-chat-message';
import { typeMessage } from '../../types';

const GenericMessageGroup = ({ messages, onClick, ...props }) => {
  if (_.isEmpty(messages)) {
    return;
  }
  const message = messages[0];
  return (
    <Message {...props} inbound={false}>
      <Metadata>
        <MessageDate date={message.ts}/> &nbsp; &nbsp;
        <MessageUser>{message.username}</MessageUser> <UserStatus />
      </Metadata>
      {messages.map((message, idx) => {
        let position = 'middle';
        if (idx === 0) {
          position = 'first';
        } else if (idx === (messages.length - 1)) {
          position = 'last';
        }

        return (
          <GenericMessage
            key={message.messageId}
            message={message}
            useFrame={false}
            beak={position === 'first'}
            position={position}
            onClick={onClick}
          />
        );
      })}
    </Message>
  );
};
GenericMessageGroup.propTypes = {
  messages: PropTypes.arrayOf(typeMessage),
  onClick: PropTypes.func
};

export default GenericMessageGroup;