import { plug } from 'code-plug';

import Queues from './views/queues';
import './style.scss';

plug(
  'pages',
  Queues,
  {
    url: '/queues',
    title: 'Queues & Tasks',
    id: 'queues',
    permission: 'queue-tokens'
  }
);

plug(
  'sidebar',
  null,
  {
    id: 'queues',
    label: 'Queues & Tasks',
    url: '/queues?queue=tasks',
    icon: 'user-plus',
    permission: 'queue-tokens'
  }
);

plug(
  'permissions',
  null,
  {
    permission: 'queue-tokens',
    name: 'Manage Queues and Tasks',
    description: 'Manage tasks and queues',
    group: 'General'
  }
);
