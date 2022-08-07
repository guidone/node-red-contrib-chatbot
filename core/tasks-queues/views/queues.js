import React, { useState, useRef } from 'react';
import { Table, Icon, ButtonGroup, Button } from 'rsuite';
import gql from 'graphql-tag';
import { useLocation } from 'react-router-dom';

const { Column, HeaderCell, Cell } = Table;

import PageContainer from '../../../src/components/page-container';
import Breadcrumbs from '../../../src/components/breadcrumbs';
import SmartDate from '../../../src/components/smart-date';
import CustomTable from '../../../src/components/table';
import { Input } from '../../../src/components/table-filters';
import confirm from '../../../src/components/confirm';

import '../../admins/styles/admins.scss';
import useTasks from '../hooks/tasks';
import ModalTask from '../views/task-modal';

function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}


const TASKS = gql`
query($queue: String!) {
  counters {
    rows: tasks {
     count(queue: $queue)
    }
  }
  rows: tasks(queue: $queue) {
		id,
    taskId,
    task,
    createdAt,
    priority
  }
}
`;


const QueuesTasks = () => {
  const table = useRef();
  const [ task, setTask ] = useState(null);
  const { saving, error,  deleteTask, editTask } = useTasks();
  const query = useQuery();

  console.log('la quu queue', query.get('queue'))

  return (
    <PageContainer className="page-users">
      <Breadcrumbs pages={['Tasks']}/>
      {task != null && (
        <ModalTask
          task={task}
          error={error}
          disabled={saving}
          onCancel={() => setTask(null)}
          onSubmit={async task => {
            await editTask({ variables: { id: task.id, task, queue: query.get('queue') }});
            setTask(null);
            table.current.refetch();
          }}
        />)}
      <CustomTable
        ref={table}
        query={TASKS}
        height={600}
        labels={{
          empty: 'The tasks queue is empty'
        }}
        onFilters={filters => {
          // TODO remove
          console.log('received filters', filters)
        }}
        initialSortField="createdAt"
        initialSortDirection="desc"
        toolbar={(
          <div>
            set toolbar
          </div>
        )}
        filtersSchema={[
          {
            name: 'queue',
            label: 'queue',
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
          <HeaderCell>Created</HeaderCell>
          <Cell>
            {({ createdAt }) => <SmartDate date={createdAt} />}
          </Cell>
        </Column>

        <Column width={300} resizable>
          <HeaderCell>Task Id</HeaderCell>
          <Cell dataKey="taskId"/>
        </Column>

        <Column width={80}>
          <HeaderCell>Action</HeaderCell>
          <Cell>
            {task => (
              <ButtonGroup>
                <Button
                  size="xs"
                  onClick={async () => {

                    if (await confirm(
                      <div>Delete task <strong>{task.id}</strong> ?</div>,
                      { okLabel: 'Yes, delete' }
                    )) {
                      await deleteTask({ variables: { id: task.id, queue: query.get('queue') }});
                      table.current.refetch();
                    }
                  }}
                >
                  <Icon icon="trash" />
                </Button>
                <Button
                  size="xs"
                  onClick={() => setTask(task)}
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

export default QueuesTasks;
