import React, { Fragment } from 'react'
import _ from 'lodash';
import PropTypes from 'prop-types';
import { SelectPicker } from 'rsuite';

import useMCContext from '../../hooks/mc-context';
import Transport from '../../../src/components/transport';
import { typeActiveChatbot  } from '../../types';

const TransportValue = (value, item) => (
  <div className="picker-item-transport">
    {item != null && (
      <Fragment>
        <Transport transport={item.transport}/>
        &nbsp;<b>{item.name}</b>
      </Fragment>
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

const SelectTransport = ({ transports, activeChatbots, ...props }) => {
  const { state } = useMCContext();
  const bots = !_.isEmpty(activeChatbots) ? activeChatbots : state.activeChatbots;

  return (
    <SelectPicker
      {...props}
      renderValue={TransportValue}
      renderMenuItem={MenuItem}
      searchable={false}
      cleanable={false}
      data={bots
        .filter(bot => bot.chatbotId === state.chatbotId)
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
  onChange: PropTypes.func,
  activeChatbots: PropTypes.arrayOf(typeActiveChatbot)
};

export default SelectTransport;