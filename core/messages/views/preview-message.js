import React from 'react';

import {
  Messages,
  ChatWindow
} from '../../../src/components/chat';
import Message from '../../../src/components/generic-chat-message';
import LoaderModal from '../../../src/components/loader-modal';

const PreviewMessage = ({ value: message }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      {message != null && (
        <ChatWindow>
        <Messages>
          <Message message={message} />
        </Messages>
      </ChatWindow>
      )}
      {message == null && (
        <LoaderModal size="sm"/>
      )}
    </div>
  );
};

export default PreviewMessage;