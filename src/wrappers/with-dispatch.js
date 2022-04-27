import React from 'react';

import AppContext from '../common/app-context';

export default (Component) => {
  return (props) => (
    <AppContext.Consumer>
      {({ dispatch }) => {
        return <Component {...props} dispatch={dispatch}>{props.children}</Component>;
      }}
    </AppContext.Consumer>
  );
};