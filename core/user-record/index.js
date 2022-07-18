import React from 'react';
import { Tag } from 'rsuite';

import { plug } from 'code-plug';

import UserRecord from './pages/user-record';

plug('pages', UserRecord, {
  url: '/record/:id',
  //title: 'Surveys',
  id: 'user-record',

});