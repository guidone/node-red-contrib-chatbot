import React, { Fragment } from 'react';
import isFunction from '../helpers/is-function';
import PlugItContext from '../context';

export default Component => {
  return ({ children, ...rest }) => (
    <PlugItContext.Consumer>
      {({ codePlug }) => <Component {...rest} codePlug={codePlug}>{children}</Component>}
    </PlugItContext.Consumer>
  );
}