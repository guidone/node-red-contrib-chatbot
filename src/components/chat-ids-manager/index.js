import React from 'react';
import { useMutation } from 'react-apollo';
import PropTypes from 'prop-types';

import ChatIdItem from './chat-id-item';

import { DELETE_CHAT_ID } from './queries';
import './style.scss';

const ChatIdsManager = ({
  value,
  onChange,
  disabled = false
}) => {
  const [
    deleteChatId,
    { loading: deleteLoading },
  ] = useMutation(DELETE_CHAT_ID, {
    onCompleted: ({ user: { chatIds }}) => {
      //console.log('cosa torna??', value)
      onChange(chatIds)
    }
  });

  return (
    <div className="ui-chat-ids-manager">
      {(value || []).map(item => (
        <ChatIdItem
          disabled={disabled || deleteLoading}
          key={item.chatId}
          item={item}
          onRemove={item => deleteChatId({ variables: { id: item.id }})}
        />
      ))}
      {_.isEmpty(value) && (
        <div className="empty">
          No <em>chatIds</em> assigned to this user
        </div>
      )}
    </div>
  );
};
ChatIdsManager.propTypes = {
  value: PropTypes.arrayOf(PropTypes.shape({
    transport: PropTypes.string,
    chatId: PropTypes.string,
    userId: PropTypes.string,
  })),
  onCompleted: PropTypes.func,
  disabled: PropTypes.bool
};

export default ChatIdsManager