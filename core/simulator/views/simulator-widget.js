import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Notification } from 'rsuite';

import Panel from '../../../src/components/grid-panel';

import { GenericMessage as Message, EmptyCallToAction, useMCContext, Chat } from '../../../src/components';
import { typeActiveChatbot } from '../../../src/types';

const { Messages, ChatWindow, MessageComposer } = Chat;

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
  const { messages, transport, /*nodeId,*/ language, user: impersonatedUser } = simulator;
  const loading = activeChatbots == null;

  const clickHandler = (obj) => {
    if (_.isObject(obj) && (obj.type === 'postback' || obj.type === 'quick-reply')) {
      // don't show on simulator the value sent by the button
      sendMessage(obj.value, { echo: false });
    }
  };

  /*
  useEffect(() => {
    return () => {
      // clear message list if chatbotId changes
      dispatch({ type: 'clear', transport });
    }
  }, [chatbotId])*/

  return (
    <Panel
      title="Chat Simulator"
      className="chat-simulator"
      menu={!loading && <PanelMenu
        user={impersonatedUser}
        language={language}
        dispatch={dispatch}
        onChange={chatBot => dispatch({ type: 'chatBot', chatBot })}
      />}
    >
      {!loading && (
        <SimulatorContext.Provider value={simulator}>
        <ChatWindow>
          <Messages>
            {messages[chatbotId] != null && messages[chatbotId].map(message => {
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
  const { activeChatbots, chatbotId, user, simulatorChatbotIds } = state;
  const bots = activeChatbots.filter(bot => bot.chatbotId === chatbotId);

  if (simulatorChatbotIds.includes(chatbotId)) {
    return (
      <SimulatorWidgetInner
        user={user}
        chatbotId={chatbotId}
        activeChatbots={bots}
      />
    );
  } else {
    return (
      <EmptyCallToAction
        title="Missing simulator"
        description={`There is not simulator node for chatbotId "${chatbotId}"`}
      />
    );
  }
};

export default SimulatorWidget;