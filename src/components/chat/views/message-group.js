import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

import { Message, Content, Metadata, MessageDate, MessageUser, UserStatus } from './generic';

import GenericMessage from '../../generic-chat-message';

const MessageGroup = ({ messages, ...props }) => {
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
        // TODO extract the position property



        return (
          <GenericMessage
            key={message.messageId}
            message={message}
            useFrame={false}
          />
        );

        /*
        switch (message.type) {
          case 'message':
            return (
              <Content key={message.messageId} position={position} text={message.content} />
            );
          case 'photo':
            return <MessagePhoto message={message} inbound={message.inbound} />;
          case 'inline-buttons':
            return <MessageButtons message={message} inbound={message.inbound} />;
          default:
            return (
              <Content
                key={message.messageId}
                position={position}
                text={`Unsupported message type "${message.type}"`}
              />
            );

        }*/

      })}
    </Message>
  );
};
MessageGroup.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      content: PropTypes.string,
      userId: PropTypes.string,
      username: PropTypes.string,
      ts: PropTypes.momentPropTypes
    })
  )
};

export default MessageGroup;