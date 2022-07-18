import React from 'react';
import { ControlLabel as RawControlLabel, Icon, HelpBlock } from 'rsuite';
import _ from 'lodash';

const ControlLabel = ({ children, required = false, tooltip }) => (
  <RawControlLabel>
    {children}
    {!_.isEmpty(tooltip) && <HelpBlock tooltip>{tooltip}</HelpBlock>}
    {required && <span className="asterisk">&nbsp;<Icon style={{ color: '#FF3932' }} icon="asterisk"/></span>}
  </RawControlLabel>
);

export default ControlLabel;