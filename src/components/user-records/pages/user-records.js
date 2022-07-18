import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import _ from 'lodash';
import { Table, Icon, SelectPicker, ButtonGroup, Button, FlexboxGrid } from 'rsuite';
import { Link } from 'react-router-dom';

const { Column, HeaderCell, Cell } = Table;

import { useCodePlug } from 'code-plug';
import PageContainer from '../../../../src/components/page-container';
import Breadcrumbs from '../../../../src/components/breadcrumbs';
import SmartDate from '../../../../src/components/smart-date';
import CustomTable from '../../../../src/components/table';
import { UserAutocomplete } from '../../../../src/components/table-filters';
import confirm from '../../../../src/components/confirm';
import ShowError from '../../../../src/components/show-error';

import useUserRecords from '../hooks/records';


const USER_RECORDS = gql`
query($offset: Int, $limit: Int, $order: String, $type: String, $userId: String, $status: String) {
  counters {
    rows: records {
     count(type: $type, userId: $userId, status: $status)
    }
  }
  rows: records(offset: $offset, limit: $limit, order: $order, type: $type, userId: $userId, status: $status) {
    id,
    createdAt,
    title,
    payload,
    type,
    status,
    userId,
    longitude,
    latitude
  }
}
`;

const LABELS = {
  title: 'Title',
  record: 'record'
};

const UserRecords = ({
  type,
  title,
  breadcrumbs,
  labels: userLabels,
  columns
 }) => {
  const table = useRef();
  const { props: userRecordTypes } = useCodePlug('user-record-types');

  const {
    error,
    saving,
    deleteRecord
  } = useUserRecords();

  const labels = { ...LABELS, ...userLabels };
  const userRecordType = userRecordTypes.find(userRecordType => userRecordType.type === type);

  const hasStatus = _.isArray(userRecordType.status) && !_.isEmpty(userRecordType.status);
  const filterSchema = [
    {
      name: 'userId',
      label: 'User',
      control: UserAutocomplete,
      width: 350
    }
  ];
  if (hasStatus) {
    filterSchema.push({
      name: 'status',
      label: 'Status',
      control: SelectPicker,
      data: userRecordType.status,
      searchable: false
    });
  }


  return (
    <PageContainer className="page-contents">
      <Breadcrumbs pages={breadcrumbs != null ? breadcrumbs : [title]}/>
      {error != null && <ShowError error={error}/>}
      <CustomTable
        ref={table}
        query={USER_RECORDS}
        variables={{ type }}
        initialSortField="createdAt"
        initialSortDirection="desc"
        toolbar={(
          <Button
            appearance="primary"
            onClick={() => table.current.refetch()}
          >Refetch
          </Button>
        )}
        filtersSchema={filterSchema}
        height={600}
        labels={{
          empty: `No ${userRecordType.list.toLowerCase()}`
        }}
        autoHeight
      >
        <Column width={60} align="center">
          <HeaderCell>Id</HeaderCell>
          <Cell dataKey="id" />
        </Column>

        <Column width={160} resizable sortable>
          <HeaderCell>Date</HeaderCell>
          <Cell dataKey="createdAt">
            {({ createdAt }) => <SmartDate date={createdAt} />}
          </Cell>
        </Column>

        <Column width={100} resizable>
          <HeaderCell>userId</HeaderCell>
          <Cell>{({ userId }) => <span className="cell-type-id">{userId}</span>}</Cell>
        </Column>

        {hasStatus && (
          <Column width={100} resizable>
            <HeaderCell>Status</HeaderCell>
            <Cell>{({ status }) => <span>{status}</span>}</Cell>
          </Column>
        )}

        {!_.isEmpty(columns) && (
          columns
            .filter(({ id }) => !['body', 'date', 'status', 'title', 'createdAt'].includes(id))
            .map(({ label, id, width = undefined, flex = undefined, cell }) => (
              <Column
                key={id}
                width={width}
                flexGrow={flex}
              >
                <HeaderCell>{label}</HeaderCell>
                <Cell dataKey={id}>
                  {record => cell(record)}
                </Cell>
              </Column>
            ))
        )}

        <Column flexGrow={1} align="left" sortable resizable>
          <HeaderCell>{labels.title}</HeaderCell>
          <Cell>
            {({ title, id }) => (
              <Link to={`/record/${id}`}>{title}</Link>
            )}
          </Cell>
        </Column>

        <Column width={80}>
          <HeaderCell>Action</HeaderCell>
          <Cell>
            {record => (
              <ButtonGroup>
                <Button
                  disabled={saving}
                  size="xs"
                  onClick={async () => {
                    if (await confirm(<div>Delete {labels.record} <em>"{record.title}"</em>?</div>, { okLabel: 'Yes, delete'})) {
                      await deleteRecord({ variables: { id: record.id }})
                      table.current.refetch();
                    }
                  }}
                >
                  <Icon icon="trash" />
                </Button>
            </ButtonGroup>
            )}
          </Cell>
        </Column>
      </CustomTable>
    </PageContainer>
  );
};
UserRecords.propTypes = {
  type: PropTypes.string,
  title: PropTypes.string,
  labels: PropTypes.shape({

  }),
  breadcrumbs: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string, // the title of the page or the id of the page
    PropTypes.shape({
      title: PropTypes.string,
      url: PropTypes.string
    })
  ]))
};

export default UserRecords;
