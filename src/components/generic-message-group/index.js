import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

// TODO componentize
import { Message, Content, Metadata, MessageDate, MessageUser, UserStatus } from '../chat/views/generic';

import GenericMessage from '../generic-chat-message';

const GenericMessageGroup = ({ messages, ...props }) => {
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

        // TODO add onClick

        return (
          <GenericMessage
            key={message.messageId}
            message={message}
            useFrame={false}
            beak={position === 'first'}
            position={position}
          />
        );
      })}
    </Message>
  );
};
GenericMessageGroup.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      content: PropTypes.string,
      userId: PropTypes.string,
      username: PropTypes.string,
      ts: PropTypes.momentPropTypes
    })
  )
};

export default GenericMessageGroup;