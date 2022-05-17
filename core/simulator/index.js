

import { plug } from 'code-plug';

import SimulatorWidget from './views/simulator-widget';
import './simulator.scss';
import handleMessages from './reducer';

plug(
  'widgets',
  SimulatorWidget,
  { x: 0, y: 0, w: 2, h: 8, isResizable: true, id: 'simulator-widget', permission: 'simulator' }
);

// TODO move from here
plug('reducers', (state, action) => {
  if (action.type === 'default') {
    return { ...state, [action.key]: action.value };
  }
  return state;
});

plug('reducers', handleMessages);

plug(
  'permissions',
  null,
  {
    permission: 'simulator',
    name: 'Chat Simulator',
    description: 'Access to chat simulator',
    group: 'General'
  }
);
