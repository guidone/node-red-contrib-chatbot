import React from 'react';

import AppContext from '../common/app-context';

export default (Component) => {
  return (props) => (
    <AppContext.Consumer>
      {({ activeChatbots }) => {
        return <Component {...props} activeChatbots={activeChatbots}>{props.children}</Component>;
      }}
    </AppContext.Consumer>
  );
};