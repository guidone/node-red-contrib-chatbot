import React from 'react';
import { Tag } from 'rsuite';

import { plug } from 'code-plug';

import Devices from './pages/devices';
import Device from './pages/device';

import './style.scss';

plug('sidebar', null, {
  id: 'devices',
  label: 'Devices',
  icon: 'logo-survey',
  url: '/devices'
});
// register a page to configure the survey
plug(
  'pages',
  Device,
  {
    url: '/devices/:id',
    title: 'Devices',
    id: 'devices'
  }
);
plug(
  'pages',
  Devices,
  {
    url: '/devices',
    title: 'Devices',
    id: 'devices'
  }
);
