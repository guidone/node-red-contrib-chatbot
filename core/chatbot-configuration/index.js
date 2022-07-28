import { plug } from 'code-plug';

import ConfigureChatbot from './pages/configure-chatbot';

plug('sidebar', null, {
  id: 'configuration',
  label: 'Configuration',
  permission: 'configure',
  icon: 'cog',
  options: [
    {
      id: 'configuration-chatbot',
      label: 'Chatbot',
      url: '/configuration-chatbot',
    }
  ]
});
plug(
  'pages',
  ConfigureChatbot,
  {
    url: '/configuration-chatbot',
    title: 'Chatbot',
    id: 'configuration-chatbot',
    permission: 'configure'
  }
);
