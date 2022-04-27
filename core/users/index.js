import { plug } from 'code-plug';

import Users from './pages/users';

plug('sidebar', null, { id: 'users', label: 'Users', url: '/users', icon: 'group', permission: 'users.list' })
plug('pages', Users, { url: '/users', title: 'Users', id: 'users', permission: 'users.list' });

plug(
  'permissions',
  null,
  {
    permission: 'users.list',
    name: 'List users',
    description: 'View the list of users',
    group: 'Users'
  }
);
plug(
  'permissions',
  null,
  {
    permission: 'users.edit',
    name: 'Edit users',
    description: 'Edit or delete a user',
    group: 'Users',
    dependsOn: ['users.list']
  }
);
plug(
  'permissions',
  null,
  {
    permission: 'users.context.edit',
    name: 'Edit context',
    description: 'Edit persisted user context',
    group: 'Users',
    dependsOn: ['users.list']
  }
);
plug(
  'permissions',
  null,
  {
    permission: 'users.merge',
    name: 'Merge user',
    description: 'Merge a user into another (mergings chatIds and contexts)',
    group: 'Users',
    dependsOn: ['users.list']
  }
);