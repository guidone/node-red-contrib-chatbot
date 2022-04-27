import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Button } from 'rsuite';


import WarningBox from '../warning-box';

import './index.scss';

const ShowError = ({
  error = 'Something went wrong on the server, please try again.',
  title = 'Server error',
  subtitle,
  onClear
}) => {
  let message;
  console.log('ERROR', typeof error === 'error')
  console.log(error)

  if (_.isString(error)) {
    message = <span>{error}</span>;
  } else if (error.networkError != null && error.networkError.result != null && error.networkError.result.errors != null) {
    const errors = error.networkError.result.errors;
    message = (
      <span>
        {errors.map(item => <span key={item.message}>{item.message}. </span>)}
      </span>
    );
  } else if (error instanceof Error) {
    message = String(error);
  } else if (error != null) {

    message = error;
  }

  return (
    <WarningBox
      className="ui-show-error"
      icon="exclamation-triangle"
      title={title}
    >
      {!_.isEmpty(subtitle) && <span>{subtitle}<br/></span>}
      {message}
      {_.isFunction(onClear) && (
        <div style={{ marginTop: '25px'}}>
          <Button color="red" onClick={onClear}>Ok, clear error &amp; retry</Button>
        </div>
      )}
    </WarningBox>
  );
};
ShowError.propTypes = {
  error: PropTypes.object,
  // the title of the box, generelly server error
  title: PropTypes.string,
  // something that explains better the error, it's above the automatic render of the server
  subtitle: PropTypes.string,
  // show the clear error button which should reset the error state
  onClear: PropTypes.func
};

export default ShowError;