import { plug } from 'code-plug';

import Users from './pages/admins';

plug('sidebar', null, { id: 'admins', label: 'Admins', url: '/admins', icon: 'user-plus', permission: 'admins' });
plug('pages', Users, { url: '/admins', title: 'Admins', id: 'admins', permission: 'admins' });

// register permissions
plug(
  'permissions',
  null,
  {
    permission: 'admins',
    name: 'Manage admins',
    description: `Add, remove and manage permissions of Mission Control users`,
    group: 'General'
  }
);