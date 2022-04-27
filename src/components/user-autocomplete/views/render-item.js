import React from 'react';
import _ from 'lodash';

const renderItem = ({ id, username, userId, first_name, last_name }) => {
  if (!_.isEmpty(first_name) || !_.isEmpty(last_name)) {
    return (
      <div className="ui-autocomplete-render-item">
        <b>{[first_name, last_name].filter(s => !_.isEmpty(s)).join(' ')}</b>
        {!_.isEmpty(username) && <span>&nbsp;-&nbsp;{username}</span>}
        &nbsp;
        <span className="id">(id: {id})</span>
      </div>
    );
  } else if (!_.isEmpty(username)) {
    return (
      <div className="ui-autocomplete-render-item">
        <b>{username}</b>
        &nbsp;
        <span className="id">(id: {id})</span>
      </div>
    );
  } else {
    return (
      <div className="ui-autocomplete-render-item">
        <b>Anonymous</b>
        &nbsp;
        <span className="id">(id: {id})</span>
      </div>
    );
  };
};

export default renderItem;