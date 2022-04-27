import React, { Fragment } from 'react';
import _ from 'lodash';

import { plug } from 'code-plug';

import { Contents, Categories } from '../../src/components/content';

plug(
  'sidebar',
  null,
  {
    id: 'content',
    label: 'Content',
    url: '/content',
    icon: 'file-text',
    options: [
      { label: 'Posts', url: '/content', id: 'posts' },
      { label: 'Categories', url: '/categories', id: 'categories' }
    ]
  }
);
plug('pages', Contents, {
  url: '/content',
  title: 'Contents',
  id: 'contents',
  namespace: 'content'
});
plug('pages', Categories, {
  url: '/categories',
  title: 'Categories',
  id: 'categories',
  namespace: 'content'
});