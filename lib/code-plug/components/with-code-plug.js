/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import React from 'react';
import PlugItContext from '../context';

export default Component => {
  return ({ children, ...rest }) => (
    <PlugItContext.Consumer>
      {({ codePlug }) => <Component {...rest} codePlug={codePlug}>{children}</Component>}
    </PlugItContext.Consumer>
  );
};