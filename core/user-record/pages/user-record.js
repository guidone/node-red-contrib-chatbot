import React, { useState, useReducer } from 'react';
import { useQuery, useMutation } from 'react-apollo';
import { Button } from 'rsuite';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory,
  useParams
} from 'react-router-dom';

import gql from 'graphql-tag';

import { useCodePlug } from 'code-plug';
import PageContainer from '../../../src/components/page-container';
import Breadcrumbs from '../../../src/components/breadcrumbs';

import Header from '../views/header';
import Buttons from '../views/buttons';
import PayloadModal from '../views/modal-payload';
import '../style.scss';

const USER_RECORD = gql`
query($id: Int!) {
  record(id: $id) {
    id,
    title,
    type,
    createdAt,
    payload,
    userId,
    status,
    transport,
    latitude,
    longitude,
    user {
      id,
      username,
      first_name,
      last_name,
      language,
      email,
      chatIds {
        chatId,
        transport
      }
    }
  }
}
`;

const SAVE_USER_RECORD = gql`
mutation($id: Int!, $record: InputRecord!) {
  editRecord(id: $id, record: $record) {
    id,
    title,
    type,
    createdAt,
    payload,
    userId,
    status
  }
}
`;

const DELETE_USER_RECORD = gql`
mutation($id: Int!) {
  deleteRecord(id: $id) {
    id
  }
}
`;

const reducer = (state, action) => {
  switch(action.type) {
    case 'status':
      return { ...state, status: action.status };
    case 'payload.show':
      return { ...state, payload: action.payload };
    case 'payload.hide':
      return { ...state, payload: null };

  }
  return state;

};



const UserRecord = () => {
  const { id } = useParams();
  const history = useHistory();
  //const [payload, setPayload] = useState();

  const [state, dispatch] = useReducer(reducer, {});
  const { payload, status } = state;
  const { props: userRecordTypes } = useCodePlug('user-record-types');




  const { data: { record } = {}, loading, error } = useQuery(USER_RECORD, {
    fetchPolicy: 'network-only',
    variables: { id: parseInt(id, 10) },
    onCompleted: (data) => {
      console.log('data', data);
    }
  });
  const [ edit, { loading: saving }] = useMutation(SAVE_USER_RECORD, {
    onCompleted: () => {
      console.log('saved')
      //setUser(null);
      //onComplete();
    }
  });
  const [ remove, { loading: removing }] = useMutation(DELETE_USER_RECORD, {
    onCompleted: () => {
      console.log('saved')
      //setUser(null);
      //onComplete();
    }
  });

  if (loading) {
    return (
      <PageContainer className="page-user-record">
        {loading && <div>loading</div>}
      </PageContainer>
    );
  }


  const userRecordType = userRecordTypes.find(userRecordType => userRecordType.type === record.type);
  const UserRecordForm = userRecordType.form;

  const breadcrumbs = [
    {
      title: userRecordType.list,
      onClick: () => history.goBack()
    }
  ];

  const disabled = loading || status === 'saving';

  return (
    <PageContainer className="page-user-record">


      {payload != null && (
        <PayloadModal
          payload={payload}
          onCancel={() => dispatch({ type: 'payload.hide' })}
          onSubmit={async payload => {
            dispatch({ type: 'status', status: 'saving' });
            await edit({ variables: { id: record.id, record: { payload } } });
            dispatch({ type: 'status', status: null });
            dispatch({ type: 'payload.hide' });
          }}
        />
      )}
      {!loading && (
        <div>
          <Breadcrumbs pages={[...breadcrumbs, !loading ? record.title : null]} />
          <Header record={record} />
          <Buttons
            userRecordType={userRecordType}
            disabled={disabled}
            record={record}
            dispatch={dispatch}
            edit={edit}
            remove={remove}
          />
          <div className="user-record-form">
            <UserRecordForm
              record={record}

            />
          </div>
        </div>
      )}
    </PageContainer>

  );
}

export default UserRecord;