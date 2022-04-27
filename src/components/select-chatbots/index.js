import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from 'react-apollo';
import gql from 'graphql-tag';
import { CheckPicker, Icon } from 'rsuite';
import _ from 'lodash';

import SmallTag from '../small-tag';

const GET_CHATBOTS = gql`
query {
  chatbots {
    id,
    name,
    chatbotId
  }
}`;

const DEFAULT_OPTION = { value: '*', label: 'All chatbots' };
const rendermenuItem = (label, item) => {
  return (
    <div>
      {label}
      {item.value !== '*' && (
        <>
          &nbsp;<SmallTag color="#666666" capitalize={false}>{item.value}</SmallTag>
        </>
      )}
    </div>
  );
};

const SelectChatbots = ({ value, onChange = () => {} }) => {
  const [currentValue, setCurrentValue] = useState(_.isString(value) ? value.split(',') : []);
  const [chatbots, setChatbots] = useState([]);
  const { loading } = useQuery(GET_CHATBOTS, {
    fetchPolicy: 'network-only',
    onCompleted: data => setChatbots(data.chatbots)
  })

  const options = useMemo(
    () => {
      if (!currentValue.includes('*')) {
        return [
          DEFAULT_OPTION,
          ...chatbots
            .filter(({ chatbotId }) => !_.isEmpty(chatbotId))
            .map(({ chatbotId, name }) => ({ value: chatbotId, label: name }))
        ]
      } else {
        return [DEFAULT_OPTION];
      }
    },
    [chatbots, currentValue]
  );
  const handleChange = useCallback(
    value => {
      if (value.includes('*')) {
        setCurrentValue(['*']);
        onChange('*');
      } else {
        setCurrentValue(value);
        onChange(value.join(','));
      }
    },
    []
  );

  return (
    <CheckPicker
      value={currentValue}
      disabled={loading}
      data={options}
      appearance="default"
      block
      placeholder="Select chatbot"
      cleanable={false}
      searchable={false}
      menuStyle={{ zIndex: 100000000 }}
      onChange={handleChange}
      renderMenuItem={rendermenuItem}
    />
  );
};

SelectChatbots.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
};

export default SelectChatbots;
