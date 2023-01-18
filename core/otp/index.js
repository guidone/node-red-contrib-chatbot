import React from 'react';
import moment from 'moment';
import { plug } from 'code-plug';

import { Content, CopyAndPasteButton } from '../../src/components';

const { Contents } = Content;

import OtpEditor from './views/otp-editor';

if (window.bootstrap?.settings?.enableOTP) {
  plug('sidebar', null, {
    id: 'configuration',
    label: 'Configuration',
    permission: 'configure',
    icon: 'cog',
    options: [
      {
        id: 'otps',
        permission: 'otp.edit',
        label: 'One Time Passwords',
        url: '/otp',
        icon: 'clock-o'
      }
    ]
  });
  plug(
    'content-body',
    OtpEditor,
    {
      id: 'token-editor',
      label: 'Token',
      namespace: 'otp'
    }
  );
  plug('pages', Contents, {
    url: '/otp',
    title: 'One Time Passwords',
    id: 'otp',
    namespace: 'otp',
    permission: 'otp.edit',
    breadcrumbs: ['One Time Passwords'],
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
      customFields: 'OTP',
      title: 'Name',
      content: 'OTP',
      createContent: 'Create OTP',
      editContent: 'Edit OTP',
      emptyContent: 'No OTPs'
    },
    columns: [
      {
        id: 'otp',
        flex: 3,
        label: 'OTP',
        cell: content => {
          if (content.payload != null ? content.payload.otp : '') {
            return (
              <div className="cell-token">
                <div className="token">
                  {content.payload.otp}
                </div>
                <div className="copy-button">
                  <CopyAndPasteButton
                    notification="OTP copied to clipboard!"
                    style="icon"
                    text={content.payload.otp}
                  />
                </div>
              </div>
            );
          } else {
            return <span>invalid otp</span>;
          }
        }
      }
    ],
    defaultContent: token => {
      return {
        ...token,
        title: `Otp created ${moment().format('DD/MM/YYYY')}`,
        payload: {
          otp: Math.random().toString().substr(2,6),
          expire_at: moment().add(1, 'y').toISOString()
        }
      };
    }
  });
  // permissions
  plug(
    'permissions',
    null,
    {
      permission: 'otp.edit',
      name: 'Edit One Time Passwords',
      description: '',
      group: 'OTP'
    }
  );
}
