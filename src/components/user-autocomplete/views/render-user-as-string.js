import React from 'react';
import _ from 'lodash';

const renderUserAsString = ({ id, username, userId, first_name, last_name }) => {
  if (!_.isEmpty(first_name) || !_.isEmpty(last_name)) {
    return (
      [first_name, last_name].filter(s => !_.isEmpty(s)).join(' ')
      + (!_.isEmpty(username) ? ` - ${username}` : '')
      + ` (id: ${id})`
    );
  } else if (!_.isEmpty(username)) {
    return `${username} (id: ${id})`;
  } else {
    return `Anonymous (id: ${id})`;
  }
};

export default renderUserAsString;