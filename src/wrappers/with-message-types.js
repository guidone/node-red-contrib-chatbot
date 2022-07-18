import React from 'react';

import AppContext from '../common/app-context';

export default (Component) => {
  return (props) => (
    <AppContext.Consumer>
      {({ messageTypes }) => {
        return <Component {...props} messageTypes={messageTypes}>{props.children}</Component>;
      }}
    </AppContext.Consumer>
  );
};