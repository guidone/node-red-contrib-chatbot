import { plug } from 'code-plug';

import './style.scss';
import PluginsList from './pages/plugins';


plug('pages', PluginsList, { url: '/plugins', title: 'Plugins', id: 'plugins', permission: 'plugins' });

// register permissions
plug(
  'permissions',
  null,
  {
    permission: 'plugins',
    name: 'Manage plugings',
    description: 'Add, remove and manage plugins in Mission Control',
    group: 'General'
  }
);

plug('reducers', (state, action) => {
  if (action.type === 'updateChatbot') {
    return { ...state, chatbot: action.chatbot, needRestart: true };
  }
  return state;
});

plug(
  'menu',
  null,
  {
    id: 'plugin-manager',
    label: 'Plugins',
    url: '/plugins',
    //permission: 'admins'
  }
);
