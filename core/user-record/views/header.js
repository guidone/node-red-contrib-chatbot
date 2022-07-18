import React, { Fragment } from 'react';
import _ from 'lodash';

import SmartDate from '../../../src/components/smart-date';
import Language from '../../../src/components/language';
import Transport from '../../../src/components/transport';

const Header = ({ record }) => {
  return (
    <div className="user-record-header">
      <div className="title">
        <SmartDate date={record.createdAt}/>
        <h3>{record.title}</h3>
      </div>
      {record.user != null && (
        <div className="user">
          <div className="name">
            {record.user.first_name} {record.user.last_name}
          </div>
          {!_.isEmpty(record.user.email) && (
            <div className="email">
              <a href={`mailto:${record.user.email}`}>{record.user.email}</a>
            </div>
          )}
          <div className="meta">
            {!_.isEmpty(record.user.username) && (
              <b>{record.user.username}</b>
            )}
            {!_.isEmpty(record.user.language) && (
              <Fragment>
                &nbsp;<Language>{record.user.language}</Language>
              </Fragment>
            )}
            <div>
              <Transport transport={record.transport} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;