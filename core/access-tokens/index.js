import React from 'react';
import { plug } from 'code-plug';

import { Content, SmartDate, CopyAndPasteButton } from '../../src/components';


import TokenEditor from './views/token-editor';
import moment from 'moment';

const { Contents } = Content;

import createToken from './helpers/create-token';
import './style.scss';

plug('pages', Contents, {
  url: '/tokens',
  title: 'Access Tokens',
  id: 'tokens',
  namespace: 'tokens',
  permission: 'access-tokens',
  breadcrumbs: ['Access Tokens'],
  fields: {
    slug: false,
    categoryId: false,
    language: false,
    payload: true,
    body: false,
    custom_fields: false
  },
  labels: {
    saveContent: 'Save',
    customFields: 'Access Token',
    title: 'Name',
    content: 'Token',
    createContent: 'Create token',
    editContent: 'Edit token',
    emptyContent: 'No tokens'
  },
  columns: [
    {
      id: 'token',
      flex: 3,
      label: 'Token',
      cell: content => {
        if (content.payload != null ? content.payload.token : '') {
          return (
            <div className="cell-token">
              <div className="token">
                {content.payload.token}
              </div>
              <div className="copy-button">
                <CopyAndPasteButton
                  notification="Token copied to clipboard!"
                  style="icon"
                  text={content.payload.token}
                />
              </div>
            </div>
          );
        } else {
          return <span>invalid token</span>;
        }
      }
    },
    {
      id: 'expire_at',
      label: 'Expiration',
      width: 200,
      cell: content => {
        if (content.payload != null && content.payload.expire_at != null) {

          return <SmartDate date={content.payload.expire_at} />;
        } else {
          return <span>invalid date</span>
        }
      }
    }

  ],
  defaultContent: token => {
    return {
      ...token,
      title: `Token created ${moment().format('DD/MM/YYYY')}`,
      payload: {
        token: createToken(),
        expire_at: moment().add(1, 'y').toISOString()
      }
    };
  }
});


plug(
  'content-body',
  TokenEditor,
  {
    id: 'token-editor',
    label: 'Token',
    namespace: 'tokens'
  }
);

plug('sidebar', null, {
  id: 'configuration',
  label: 'Configuration',
  permission: 'configure',
  icon: 'cog',
  options: [
    {
      id: 'tokens',
      permission: 'access-tokens',
      label: 'Access Tokens',
      url: '/tokens',
      icon: 'clock-o'
    }
  ]
});

plug(
  'permissions',
  null,
  {
    permission: 'access-tokens',
    name: 'Manage access tokens',
    description: 'Add, remove and manage access tokens for GraphQL and authenticated calls',
    group: 'General'
  }
);