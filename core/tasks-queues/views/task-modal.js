import React, { useState } from 'react';
import { Modal, Button } from 'rsuite';
import ReactJson from 'react-json-view';
import PropTypes from 'prop-types';

import useCanCloseModal from '../../../src/hooks/modal-can-close';
import { CopyAndPasteButton } from '../../../src/components';

const TaskModal = ({
  task,
  onSubmit = () => {},
  onCancel = () => {},
  disabled = false
}) => {
  const [json, setJson] = useState(task.task);
  const { handleCancel, isChanged, setIsChanged } = useCanCloseModal({ onCancel });

  const handleChange = ({ updated_src: json }) => {
    setJson(json);
    setIsChanged(true);
  }

  return (
    <Modal backdrop show onHide={() => handleCancel()} size="md" overflow={false} className="modal-context">
      <Modal.Header>
        <Modal.Title>Task <em>(id: {task.id})</em></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ paddingBottom: '15px' }}>
          Edit the payload of the task ID <span className="cell-task-id">{task.taskId}</span>
          <CopyAndPasteButton
            notification="Task ID copied to clipboard!"
            style="icon"
            text={task.taskId}
          />
        </div>
        <ReactJson
          src={task.task}
          onEdit={!disabled ? handleChange : undefined}
          onAdd={!disabled ? handleChange : undefined}
          onDelete={!disabled ? handleChange : undefined}
        />

      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => handleCancel()} appearance="subtle">
          Cancel
        </Button>
        <Button
          appearance="primary"
          disabled={disabled || !isChanged}
          onClick={() => {
            onSubmit({ ...task, task: json });
          }}
        >
          Save task
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
TaskModal.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.number,
    taskId: PropTypes.string,
    task: PropTypes.object
  }),
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  disabled: PropTypes.bool
};

export default TaskModal;
