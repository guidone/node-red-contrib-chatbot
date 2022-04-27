import React from 'react';
import _ from 'lodash';

import AppContext from '../common/app-context';

export default (Component, fields = []) => {
  return (props) => (
    <AppContext.Consumer>
      {({ state }) => {
        let stateProps = {};
        fields = _.isString(fields) ? [fields] : fields;
        if (fields.length === 0) {
          stateProps = { ...state };
        } else {
          fields.forEach(field => stateProps[field] = state[field]);
        }
        return <Component {...props} {...stateProps}>{props.children}</Component>;
      }}
    </AppContext.Consumer>
  );
};