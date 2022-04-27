import React from 'react';

import AppContext from '../common/app-context';

export default (Component) => {
  return (props) => (
    <AppContext.Consumer>
      {({ platforms }) => {
        return <Component {...props} platforms={platforms}>{props.children}</Component>;
      }}
    </AppContext.Consumer>
  );
};