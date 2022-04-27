import React from 'react';
import { Icon, IconButton } from 'rsuite';
import PropTypes from 'prop-types';

import Transport from '../../../src/components/transport';

const ChatIdItem = ({ item, onRemove = () => {}, disabled }) => {
  return (
    <div className="chat-id-item">
      <div className="transport">
        <Transport transport={item.transport}/>
      </div>
      <div className="icon">
        <Icon icon="long-arrow-right" size="2x"/>
      </div>
      <div className="chat-id">
        {item.chatId}
      </div>
      <div className="buttons">
        <IconButton
          appearance="subtle"
          disabled={disabled}
          onClick={() => {
            if (confirm('Remove permanently this chatId?')) {
              onRemove(item);
            }
          }}
          icon={<Icon icon="trash"/>}
          size="sm"
        />
      </div>
    </div>
  );
};
ChatIdItem.propTypes = {
  item: PropTypes.shape({
    transport: PropTypes.string,
    chatId: PropTypes.string,
    userId: PropTypes.string,
  }),
  onRemove: PropTypes.func,
  disabled: PropTypes.bool
}

export default ChatIdItem;