import React, { useState, useRef } from 'react';
import { Table, Icon, ButtonGroup, Button, ButtonToolbar } from 'rsuite';
import gql from 'graphql-tag';
import { useLocation } from 'react-router-dom';

const { Column, HeaderCell, Cell } = Table;

import PageContainer from '../../../src/components/page-container';
import Breadcrumbs from '../../../src/components/breadcrumbs';
import SmartDate from '../../../src/components/smart-date';
import CustomTable from '../../../src/components/table';

import SelectQueues from '../../../src/components/select-queues';
import confirm from '../../../src/components/confirm';
import { NodeRedNode } from '../../../src/components/help-elements';

import '../../admins/styles/admins.scss';
import useTasks from '../hooks/tasks';
import ModalTask from '../views/task-modal';

function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}


const TASKS = gql`
query($queue: String!, $limit: Int, $offset: Int) {
  counters {
    rows: tasks {
     count(queue: $queue)
    }
  }
  rows: tasks(queue: $queue, limit: $limit, offset: $offset) {
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
  const [ selection, setSelection ] = useState(null);
  const { saving, error,  deleteTask, deleteTasks, editTask } = useTasks();
  const query = useQuery();

  const disabled = saving;

  return (
    <PageContainer className="page-users">
      <Breadcrumbs pages={['Queues & Tasks']}/>
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
      <div className="page-description">
        <NodeRedNode>MC Queue</NodeRedNode> it&apos;s a node to handle a queue of tasks, persist them and execute sequentially
        at the desired interval.
      </div>
      <CustomTable
        ref={table}
        key={`tabel_${query.get('queue')}`}
        query={TASKS}
        height={600}
        labels={{
          empty: 'The tasks queue is empty'
        }}
        selectable={true}
        onSelect={selection => setSelection(selection)}
        initialSortField="createdAt"
        initialSortDirection="desc"
        toolbar={(
          <div>
            <ButtonToolbar>
              {selection != null && selection.all && (
                <Button
                  appearance="primary"
                  disabled={disabled}
                  onClick={async () => {
                    if (await confirm(
                      <div>Delete all tasks from queue <b>{query.get('queue')}</b>?</div>,
                      { okLabel: 'Yes, delete' }
                    )) {
                      await deleteTasks({
                        variables: { all: true, queue: query.get('queue') }
                      });
                      table.current.refetch();
                    }
                  }}
                >
                  Delete all
                </Button>
              )}
              {selection != null && selection.ids.length !== 0 && !selection.all && (
                <Button
                  appearance="primary"
                  disabled={disabled}
                  onClick={async () => {
                    if (await confirm(
                      <div>Delete <b>{selection.ids.length}</b> tasks from queue <b>{query.get('queue')}</b>?</div>,
                      { okLabel: 'Yes, delete' }
                    )) {
                      await deleteTasks({
                        variables: { ids: selection.ids, queue: query.get('queue') }
                      });
                      table.current.refetch();
                    }
                  }}
                >
                  Delete ({selection.ids.length})
                </Button>
              )}
              <Button
                appearance="primary"
                disabled={disabled}
                onClick={() => table.current.refetch()}
              >
              Reload
            </Button>
            </ButtonToolbar>
          </div>
        )}
        filtersSchema={[
          {
            name: 'queue',
            label: 'queue',
            control: SelectQueues
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

        <Column width={80} align="center">
          <HeaderCell>Priority</HeaderCell>
          <Cell dataKey="priority" />
        </Column>

        <Column width={300} flexGrow={1}>
          <HeaderCell>Task Id</HeaderCell>
          <Cell dataKey="taskId">
            {({ taskId }) => <span className="cell-task-id">{taskId}</span>}
          </Cell>
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
