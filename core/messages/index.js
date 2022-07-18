import { plug } from 'code-plug';

import MessageLogs from './pages/message-logs';
import GoToMessagesButton from './views/go-to-messages';

plug('sidebar', null, {
  id: 'message-log',
  label: 'Message Logs',
  url: '/messages',
  icon: 'comment',
  permission: 'logs.messages',
  options: [
    { label: 'Messages', url: '/messages', id: 'messages-logs' },
    { label: 'Unhandled', url: '/messages?flag=not_understood', id: 'messages-not-understood' }
  ]
})
plug(
  'pages',
  MessageLogs,
  {
    url: '/messages',
    title: 'Message Logs',
    id: 'message-log',
    permission: 'logs.messages'
  }
);

// register permissions
plug(
  'permissions',
  null,
  {
    permission: 'logs.messages',
    name: 'View Message Logs',
    description: `View messages sent and received by the chatbot users`,
    group: 'General'
  }
);

// register button in the user modal to redirect to survey lists
plug(
  'user-button',
  GoToMessagesButton
);