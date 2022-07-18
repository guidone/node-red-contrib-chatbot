import React from 'react';
import PropTypes from 'prop-types';
import { Tag } from 'rsuite';

import withPlatforms from '../../wrappers/with-platforms';

import colorType from './helpers/color-type';
import './transport.scss';

const Transport = ({ transport, platforms = []}) => {
  const platform = platforms.find(platform => platform.id === transport);
  return (
    <Tag style={{backgroundColor: platform != null ? platform.color : null}} className="ui-transport">{transport}</Tag>
  );
}
Transport.propTypes = {
  transport: PropTypes.string
};

export default withPlatforms(Transport);