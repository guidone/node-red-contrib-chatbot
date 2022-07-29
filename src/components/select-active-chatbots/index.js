import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';


import { SelectPicker } from 'rsuite';
import _ from 'lodash';

import SmallTag from '../small-tag';
import Transport from '../transport';

import useMCContext from '../../hooks/mc-context';


const rendermenuItem = (label, item) => {
  return (
    <div>
      <b>{label}</b>
      &nbsp;
      <Transport transport={item.transport}/>
    </div>
  );
};

const renderValue = (value, item) => (
  <div className="picker-item-transport">
    {item != null && (
      <>
        <b>{item.name}</b>
        &nbsp;
        <Transport transport={item.transport}/>
      </>
    )}
    {item == null && <span>Select chatbot</span>}
  </div>
);

const SelectActiveChatbots = ({ value, onChange = () => {} }) => {

  //const [chatbots, setChatbots] = useState([]);

  const { state } = useMCContext();
  const { chatbotId, activeChatbots } = state;
  const [currentValue, setCurrentValue] = useState(null);


  /*const options = useMemo(
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
  */

  const handleChange = useCallback(
    value => {
      setCurrentValue(value);
      onChange(
        value,
        activeChatbots.find(chatbot => chatbot.botNode === value)
      );
    },
    []
  );

  return (
    <SelectPicker
      value={currentValue}
      renderValue={renderValue}
      renderMenuItem={rendermenuItem}
      onChange={handleChange}
      placeholder="Select chatbot transport"
      searchable={false}
      cleanable={true}
      data={activeChatbots
        .map(chatbot => ({ value: chatbot.botNode, label: chatbot.name, ...chatbot }))
      }
    />
  );

  /*return (
    <CheckPicker
      value={currentValue}

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
  );*/
};

SelectActiveChatbots.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
};

export default SelectActiveChatbots;
