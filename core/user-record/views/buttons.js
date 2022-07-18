import React from 'react';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';
import { Button, ButtonToolbar, SelectPicker } from 'rsuite';

import confirm from '../../../src/components/confirm';

import { useCodePlug, Views } from 'code-plug';

const Buttons = ({ edit, remove, userRecordType, disabled = false, record, dispatch = () => {} }) => {
  const history = useHistory();
  const { items } = useCodePlug('user-record-buttons');

  console.log('items',items);

  return (
    <div className="user-record-buttons">
      <div className="left">
      <ButtonToolbar>
        {_.isArray(userRecordType.status) && !_.isEmpty(userRecordType.status) && (
          <SelectPicker
            placeholder="Status"
            data={userRecordType.status}
            value={record.status}
            cleanable
            searchable={false}
            onChange={async status => {
              dispatch({ type: 'status', status: 'saving' });
              await edit({ variables: { id: record.id, record: { status } } });
              dispatch({ type: 'status', status: null });
            }}
          />
        )}
        <Button
          disabled={disabled}
          onClick={() => dispatch({ type: 'payload.show', payload: record.payload })}
        >
          Edit payload
        </Button>
        {items
          .filter(({ props }) => _.isEmpty(props.type) || props.type === record.type)
          .map(({ view: View, props }) => <View {...props} record={record}/>)
        }
      </ButtonToolbar>
      </div>
      <div className="right">
        <ButtonToolbar>
          <Button onClick={() => history.goBack()}>Back to {userRecordType.list}</Button>
          <Button
            disabled={disabled}
            color="red"
            onClick={async () => {
              if (await confirm(
                <div>Delete {userRecordType.name.toLowerCase()} <em>"{record.title}" ?</em></div>,
                { okLabel: 'Yes, delete' }
              )) {
                await remove({ variables: { id: record.id }});
                history.goBack();
              }
            }}
          >
            Delete
          </Button>
        </ButtonToolbar>
      </div>
    </div>
  );
};

export default Buttons;