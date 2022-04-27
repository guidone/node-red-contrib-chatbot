import React, { useState, useRef } from 'react';
import { Table, Icon, ButtonGroup, Button, ButtonToolbar } from 'rsuite';
import gql from 'graphql-tag';

const { Column, HeaderCell, Cell } = Table;

import PageContainer from '../../../src/components/page-container';
import Breadcrumbs from '../../../src/components/breadcrumbs';
import Language from '../../../src/components/language';
import SmartDate from '../../../src/components/smart-date';
import CustomTable from '../../../src/components/table';
import { Input } from '../../../src/components/table-filters';
import ContextModal from '../../../src/components/context-modal';
import useCurrentUser from '../../../src/hooks/current-user';
import useMCContext from '../../../src/hooks/mc-context';
import ExportButton from '../../../src/components/export-button';

import '../styles/users.scss';
import useUsers from '../hooks/users';
import useMergeUser from '../hooks/merge-user';
import ModalUser from '../views/modal-user';

const USERS = gql`
query ($limit: Int, $offset: Int, $order: String, $username: String, $userId: String, $chatbotId: String) {
  counters {
    rows: users {
     count(username: $username, userId: $userId, chatbotId: $chatbotId)
    }
  }
  rows: users(limit: $limit, offset: $offset, order: $order, username: $username, userId: $userId, chatbotId: $chatbotId) {
    id,
    username,
    userId,
    first_name,
    last_name,
    username,
    language,
    payload,
    createdAt,
    email,
    chatIds {
      id,
      transport,
      chatId
    }
  }
}
`;


const Users = () => {
  const table = useRef();
  const [ user, setUser ] = useState(null);
  const [ context, setContext ] = useState(null);
  const { saving, error,  deleteUser, editUser } = useUsers();
  const { can } = useCurrentUser();
  const { state } = useMCContext();
  const { mergeModal, mergeUser } = useMergeUser({
    onComplete: () => table.current.refetch()
  });
  const disabled = saving;

  return (
    <PageContainer className="page-users">
      <Breadcrumbs pages={['Users']}/>
      {user != null && (
        <ModalUser
          user={user}
          error={error}
          disabled={disabled}
          onCancel={() => setUser(null)}
          onSubmit={async user => {
            await editUser({ variables: { id: user.id, user }})
            setUser(null);
            table.current.refetch();
          }}
        />)}
      {context != null && (
        <ContextModal
          user={context}
          onSubmit={() => setContext(null)}
          onCancel={() => setContext(null)}
        />

      )}
      {mergeModal}
      <CustomTable
        ref={table}
        query={USERS}
        height={600}
        labels={{
          empty: 'No users yet'
        }}
        initialSortField="createdAt"
        initialSortDirection="desc"
        variables={{ chatbotId: state.chatbotId }}
        toolbar={(
          <ButtonToolbar>
            <ExportButton
              table="users"
              disabled={disabled}
            />
            <Button appearance="primary" onClick={() => table.current.refetch()}>Refresh</Button>
          </ButtonToolbar>
        )}
        filtersSchema={[
          {
            name: 'userId',
            label: 'userId',
            control: Input
          },
          {
            name: 'username',
            label: 'Username',
            control: Input
          }
        ]}
        autoHeight
      >
        <Column width={60} align="center">
          <HeaderCell>Id</HeaderCell>
          <Cell dataKey="id" />
        </Column>

        <Column width={100} resizable>
          <HeaderCell>userId</HeaderCell>
          <Cell>{({ userId }) => <span className="cell-type-id">{userId}</span>}</Cell>
        </Column>

        <Column width={140} resizable>
          <HeaderCell>Subscribed</HeaderCell>
          <Cell>
            {({ createdAt }) => <SmartDate date={createdAt} />}
          </Cell>
        </Column>

        <Column width={150} resizable>
          <HeaderCell>Username</HeaderCell>
          <Cell dataKey="username"/>
        </Column>

        <Column width={200} resizable>
          <HeaderCell>First Name</HeaderCell>
          <Cell dataKey="first_name"/>
        </Column>

        <Column width={200} resizable>
          <HeaderCell>Last Name</HeaderCell>
          <Cell dataKey="last_name"/>
        </Column>

        <Column width={50} resizable>
          <HeaderCell>Language</HeaderCell>
          <Cell>
            {({ language }) => <Language>{language}</Language>}
          </Cell>
        </Column>

        <Column width={300} flexGrow={1}>
          <HeaderCell>Email</HeaderCell>
          <Cell dataKey="email"/>
        </Column>

        <Column width={160}>
          <HeaderCell>Action</HeaderCell>
          <Cell>
            {user => (
              <ButtonGroup>
                {can('users.context.edit') && (
                  <Button
                    size="xs"
                    onClick={() => setContext(user)}
                  >
                    <Icon icon="database" />
                  </Button>
                )}
                {can('users.edit') && (
                  <Button
                    size="xs"
                    onClick={() => setUser(user)}
                  >
                    <Icon icon="edit2" />
                  </Button>
                )}
                {user.chatIds.length !== 0 && can('users.merge') && (
                  <Button
                    size="xs"
                    onClick={() => mergeUser(user)}
                  >
                    <Icon icon="user-plus"/>
                  </Button>
                )}
                {can('users.edit') && (
                  <Button
                    size="xs"
                    onClick={() => {
                      const name = [user.first_name, user.last_name].join(' ');
                      if (confirm(`Delete user${!_.isEmpty(name.trim()) ? ` "${name}"` : ''} (${user.userId})?`)) {
                        deleteUser({ variables: { id: user.id }})
                          .then(table.current.refetch);
                      }
                    }}
                  >
                    <Icon icon="trash" />
                  </Button>
                )}
            </ButtonGroup>
            )}
          </Cell>
        </Column>
      </CustomTable>
    </PageContainer>
  );
};

export default Users;
