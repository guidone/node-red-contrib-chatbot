import React, { useState, useEffect, useRef } from 'react';
import momentPropTypes from 'react-moment-proptypes';
import classNames from 'classnames';
import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import { IconButton, Icon } from 'rsuite';


const MessageComposer = ({ onSend = () => {}, onClear = () => {} }) => {
  const [message, setMessage] = useState('');
  const sendMessage = () => {
    if (_.isEmpty(message)) {
      return;
    }
    // remove trailing cr
    onSend(message.replace(/\n$/, ''));
    setMessage('');
  };

  return (
    <div className="ui-chat-message-composer">
      <div className="editor">
        <textarea
          name="message-to-send"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyUp={event => {
            if (event.shiftKey && event.keyCode === 13) {
              sendMessage();
            }
          }}
          id="message-to-send" placeholder ="Type your message" rows="3"></textarea>
      </div>
      <div className="buttons">
        <IconButton
          icon={<Icon icon="send" />}
          appearance="primary"
          size="sm"
          onClick={sendMessage}
        />
        <IconButton
          icon={<Icon icon="trash" />}
          size="sm"
          onClick={onClear}
        />
      </div>
    </div>
  );
};
MessageComposer.propTypes = {
  onSend: PropTypes.func,
  onClear: PropTypes.func
};

export default MessageComposer;