import { plug } from 'code-plug';

// Generic permissions valid for all platform

plug(
  'permissions',
  null,
  {
    permission: '*',
    name: 'All',
    description: 'All permissions',
    group: 'General'
  }
);

plug(
  'permissions',
  null,
  {
    permission: 'configure',
    name: 'Configure',
    description: `Configure plugins and Mission Control, will access to all configuration pages.`,
    group: 'General'
  }
);