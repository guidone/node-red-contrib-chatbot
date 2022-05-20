import React, { useEffect } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Notification } from 'rsuite';

import Panel from '../../../src/components/grid-panel';

// TODO port to externalized componetns
import {
  Messages,
  ChatWindow,
  MessageComposer
} from '../../../src/components/chat';
import { GenericMessage as Message, EmptyCallToAction, useMCContext } from '../../../src/components';
import { typeActiveChatbot } from '../../../src/types';

import useSimulator from '../hooks/simulator';
import PanelMenu from '../views/panel-menu';
import SimulatorContext from '../context';

const SimulatorWidgetInner = ({ activeChatbots, chatbotId }) => {
  const { state: { simulator }, dispatch, sendMessage } = useSimulator({
    activeChatbots,
    chatbotId,
    onError: error => {
      Notification.error({
        placement: 'topStart',
        title: 'Error',
        description: error.message
      });
    }
  });
  const { messages, transport, nodeId, language, user: impersonatedUser } = simulator;
  const loading = activeChatbots == null;

  const clickHandler = (obj) => {
    if (_.isObject(obj) && (obj.type === 'postback' || obj.type === 'quick-reply')) {
      // don't show on simulator the value sent by the button
      sendMessage(obj.value, { echo: false });
    }
  };

  console.log('actual ',simulator)

  useEffect(() => {


    return () => {
      // clear message list if chatbotId changes
      dispatch({ type: 'clear', transport });
    }
  }, [chatbotId])

  useEffect(() => {
    // TODO check a valid chatbot id exists or set the default one

    return () => {
      console.log('defaulting after change ', !_.isEmpty(activeChatbots) ? activeChatbots[0] : null)
      dispatch({
        type: 'chatBot',
        chatBot: !_.isEmpty(activeChatbots) ? activeChatbots[0] : null
      });
    }
  }, [activeChatbots])

  return (
    <Panel
      title="Chat Simulator"
      className="chat-simulator"
      menu={!loading && <PanelMenu
        user={impersonatedUser}
        language={language}
        nodeId={nodeId}
        transport={transport}
        dispatch={dispatch}
        activeChatbots={activeChatbots}
        onChange={chatBot => dispatch({ type: 'chatBot', chatBot })}
      />}
    >
      {!loading && (
        <SimulatorContext.Provider value={simulator}>
        <ChatWindow>
          <Messages>
            {messages[transport] != null && messages[transport].map(message => {
              if (_.isArray(message)) {
                // multiple messages are always inbound
                return (
                  <Message
                    onClick={clickHandler}
                    key={message.map(message => message.messageId).join()}
                    message={message.map(message => ({ ...message, username: chatbotId }))}
                  />
                );
              } else {
                return (
                  <Message
                    onClick={clickHandler}
                    key={message.messageId}
                    message={!message.inbound ? { ...message, username: chatbotId } : message }
                  />
                );
              }
            })}
          </Messages>
          <MessageComposer
            onSend={message => sendMessage(message)}
            onClear={() => dispatch({ type: 'clear', transport })}
          />
        </ChatWindow>
        </SimulatorContext.Provider>
      )}
    </Panel>
  );
};
SimulatorWidgetInner.propTypes = {
  activeChatbots: PropTypes.arrayOf(typeActiveChatbot),
  chatbotId: PropTypes.string
};

const SimulatorWidget = () => {
  const { state } = useMCContext();
  const { activeChatbots, chatbotId, user } = state;
  const bots = activeChatbots.filter(bot => bot.chatbotId === chatbotId);

  const noAvailableBots = _.isEmpty(bots);

  if (noAvailableBots) {
    return (
      <EmptyCallToAction
        title="No active bot"
        description={`No active bots for this chatbotId "${chatbotId}"`}
      />
    );
  } else {
    return (
      <SimulatorWidgetInner
        user={user}
        chatbotId={chatbotId}
        activeChatbots={bots}
      />
    );
  }
};

export default SimulatorWidget;