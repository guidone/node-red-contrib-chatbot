import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import './index.scss';

const EmptyCallToAction = ({ title, description }) => {

  return (
    <div className="ui-empty-call-to-action">
      <div className="panel">
        <div className="title">{title}</div>
        {!_.isEmpty(description) && <div className="description">{description}</div>}
      </div>
    </div>
  );
};
EmptyCallToAction.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string
};

export default EmptyCallToAction;