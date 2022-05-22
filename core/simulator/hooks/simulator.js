//import _ from 'lodash';

import { useNodeRedSocket } from '../../../src/hooks/socket';
import useReducer from '../../../src/hooks/use-reducer';

const useSimulator = ({
  /*activeChatbots,*/
  chatbotId,
  onError = () => {}
}) => {

  const { state, dispatch } = useReducer({
    simulator: {
      messages: {},
      //transport: !_.isEmpty(activeChatbots) ? activeChatbots[0].transport : null,
      //nodeId: !_.isEmpty(activeChatbots) ? activeChatbots[0].nodeId : null,
      globals: null,
      language: 'en',
      user: null
    }
  });

  const { sendMessage } = useNodeRedSocket({
    onReceive: (topic, payload) => {
      if (topic === 'simulator') {
        dispatch({ type: 'message', payload, topic, chatbotId });
      } else if (topic === 'simulator_error') {
        onError(payload);
      }
    }
  });

  return {
    state,
    dispatch,
    sendMessage: (text, { echo = true } = {}) => {
      const { /*transport,*/ language, user: impersonatedUser } = state.simulator;
      sendMessage('simulator', {
        //transport,
        chatbotId,
        language,
        userId: impersonatedUser != null ? impersonatedUser.userId : 'simulator',
        username: impersonatedUser != null ? impersonatedUser.username : 'testUser',
        firstName: impersonatedUser != null ? impersonatedUser.first_name : null,
        lastName: impersonatedUser != null ? impersonatedUser.last_name : null,
        payload: {
          content: text,
          type: 'message'
        },
        simulatorOptions: {
          echo
        }
      });
    }
  };
};

export default useSimulator;