import React, { useState, useRef } from 'react';
import { Table, Icon, ButtonGroup, Button } from 'rsuite';
import gql from 'graphql-tag';

const { Column, HeaderCell, Cell } = Table;

import PageContainer from '../../../src/components/page-container';
import Breadcrumbs from '../../../src/components/breadcrumbs';
import SmartDate from '../../../src/components/smart-date';
import CustomTable from '../../../src/components/table';
import { Input } from '../../../src/components/table-filters';
import confirm from '../../../src/components/confirm';

import '../styles/admins.scss';
import useAdmins from '../hooks/admins';
import ModalAdmin from '../views/modal-admin';

const ADMINS = gql`
query (
  $limit: Int,
  $offset: Int,
  $order: String,
  $username: String
) {
  counters {
    rows: admins {
     count(username: $username)
    }
  }
  rows: admins(
    limit: $limit,
    offset: $offset,
    order: $order,
    username: $username
  ) {
    id,
    username,
    first_name,
    last_name,
    payload,
    createdAt,
    email,
    permissions,
    chatbotIds
  }
}
`;


const Admins = () => {
  const table = useRef();
  const [ admin, setAdmin ] = useState(null);
  const { saving, error,  deleteAdmin, editAdmin, createAdmin } = useAdmins();

  return (
    <PageContainer className="page-users">
      <Breadcrumbs pages={['Admins']}/>
      {admin != null && (
        <ModalAdmin
          admin={admin}
          error={error}
          disabled={saving}
          onCancel={() => setAdmin(null)}
          onSubmit={async admin => {
            if (admin.id != null) {
              await editAdmin({ variables: { id: admin.id, admin }});
            } else {
              await createAdmin({ variables: { admin }});
            }
            setAdmin(null);
            table.current.refetch();
          }}
        />)}
      <CustomTable
        ref={table}
        query={ADMINS}
        height={600}
        labels={{
          empty: 'No admins'
        }}
        initialSortField="createdAt"
        initialSortDirection="desc"
        toolbar={(
          <div>
            <Button appearance="primary" onClick={() => {
              setAdmin({});
            }}>Create admin</Button>
          </div>
        )}
        filtersSchema={[
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

        <Column width={300} flexGrow={1}>
          <HeaderCell>Email</HeaderCell>
          <Cell dataKey="email"/>
        </Column>

        <Column width={80}>
          <HeaderCell>Action</HeaderCell>
          <Cell>
            {admin => (
              <ButtonGroup>
                <Button
                  size="xs"
                  onClick={async () => {
                    const name = [admin.first_name, admin.last_name].join(' ');
                    if (await confirm(
                      <div>Delete admin <strong>{name}</strong> (id: {admin.id})?</div>,
                      { okLabel: 'Yes, delete' }
                    )) {
                      deleteAdmin({ variables: { id: admin.id }})
                        .then(table.current.refetch);
                    }
                  }}
                >
                  <Icon icon="trash" />
                </Button>
                <Button
                  size="xs"
                  onClick={() => setAdmin(admin)}
                >
                  <Icon icon="edit2" />
                </Button>
            </ButtonGroup>
            )}
          </Cell>
        </Column>
      </CustomTable>
    </PageContainer>
  );
};

export default Admins;
