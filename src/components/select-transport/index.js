import React, { useState } from 'react'
import _ from 'lodash';
import PropTypes from 'prop-types';
import { SelectPicker } from 'rsuite';

import useMCContext from '../../hooks/mc-context';
import Transport from '../../../src/components/transport';

const TransportValue = (value, item) => (
  <div className="picker-item-transport">
    {item != null && (
      <>
        <Transport transport={item.transport}/>
        &nbsp;<b>{item.name}</b>
      </>
    )}
    {item == null && <span>Select transport</span>}
  </div>
);

const MenuItem = (label, item) => (
  <div className="picker-item-transport">
    <b>{item.name}</b><br/>
    <Transport transport={item.transport}/>
    &nbsp;<em>(id: {item.nodeId})</em>
  </div>
);

const SelectTransport = ({ transports, ...props }) => {
  const { state: { activeChatbots } } = useMCContext();

  return (
    <SelectPicker
      {...props}
      renderValue={TransportValue}
      renderMenuItem={MenuItem}
      searchable={false}
      cleanable={false}
      data={activeChatbots
        .filter(chatbot => _.isEmpty(transports) || transports.includes(chatbot.transport))
        .map(chatbot => ({ value: chatbot.nodeId, label: chatbot.transport, ...chatbot }))
      }
    />
  );
};
SelectTransport.propTypes = {
  // limit chatbot to a list of transports
  transports: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.string,
  onChange: PropTypes.func
};

export default SelectTransport;