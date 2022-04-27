import React, { useMemo } from 'react';
import { SelectPicker, Icon } from 'rsuite';
import _ from 'lodash';

import useCurrentUser from '../hooks/current-user';

import SmallTag from '../components/small-tag';

const renderValue = (value, item) => {
  return (
    <span>
      <Icon icon="commenting" style={{ color: '#999999', marginRight: '6px' }}/>
      {item?.label}
    </span>
  );
};

const ChatbotsSelector = ({ chatbots, value, onChange }) => {
  const { user } = useCurrentUser();

  const listedChatbots = useMemo(
    () => {
      const allowedChatbotIds = (user.chatbotIds ?? '').split(',');
      return chatbots
        .filter(({ chatbotId }) => !_.isEmpty(chatbotId))
        .filter(({ chatbotId }) => allowedChatbotIds.includes('*') || allowedChatbotIds.includes(chatbotId))
        .map(({ chatbotId, name }) => ({ value: chatbotId, label: name ?? chatbotId }));
    },
    [user, chatbots]
  );

  if (listedChatbots.length > 0) {
    return (
      <SelectPicker
        style={{ marginTop: '11px', marginRight: '15px' }}
        value={value}
        data={listedChatbots}
        appearance="subtle"
        placeholder="Select chatbot"
        cleanable={false}
        searchable={false}
        menuStyle={{ zIndex: 100000000 }}
        onChange={onChange}
        renderMenuItem={(label, item) => {
          return (
            <div>
              {label} <SmallTag color="#666666" capitalize={false}>{item.value}</SmallTag>
            </div>
          );
        }}
        renderValue={renderValue}
      />
    );
  } else {
    return <span></span>;
  }
};

export default ChatbotsSelector;
