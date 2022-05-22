import _ from 'lodash';
import moment from 'moment';

const handleMessages = (state, action) => {

  //switch(action.type) {
  if (action.type === 'message') {
    // add message to the right queue
    const { payload, topic } = action;
    // exit if not from simulator
    if (topic !== 'simulator') {
      return state;
    }

    const current = _.isArray(state.simulator.messages[action.chatbotId]) ? state.simulator.messages[action.chatbotId] : [];

    let toAdd;
    if (!_.isArray(payload.payload)) {
      toAdd = { ...payload, ts: moment() }
    } else {
      toAdd = payload.payload.map(current => ({ ...payload, ...current, payload: undefined, ts: moment() }))
    }

    const messages = {
      ...state.messages,
      // multiple messages can be enqueued
      [action.chatbotId]: [
        ...current,
        toAdd
      ]
    }
    return {
      ...state,
      simulator: {
        ...state.simulator,
        messages
      }
    };
  } else if (action.type === 'clear') {
    return {
      ...state,
      simulator: {
        ...state.simulator,
        messages: {
          ...state.messages,
          [action.chatbotId]: []
        }
      }
    };
  } else if (action.type === 'globals') {
    // set globals
    return {
      ...state,
      simulator: {
        ...state.simulator,
        globals: action.globals
      }
    };
  } else if (action.type === 'params') {
    const { params } = action;
    return {
      ...state,
      simulator: {
        ...state.simulator,
        //transport: params.chatBot.transport,
        //nodeId: params.chatBot.nodeId,
        language: params.language,
        user: params.user
      }
    };
  }
  return state;
};

export default handleMessages;