import React, { Fragment } from 'react';
import _ from 'lodash';

const ErrorBlock = ({ error }) => {

  if (error == null) {
    return <Fragment/>;
  }
  let msg;
  if (!_.isEmpty(error.error)) {
    msg = error.error;
  } else if (_.isArray(error.errors) && !_.isEmpty(error.errors)) {
    msg = error.errors[0].error;
  }

  return (
    <div className="error-msg">{msg}</div>
  );
};

export default ErrorBlock;