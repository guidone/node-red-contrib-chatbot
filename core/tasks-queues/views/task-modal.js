import React, { useState } from 'react';
import { Modal, Button, Form, FormGroup, ControlLabel, FormControl } from 'rsuite';
import ReactJson from 'react-json-view';
import PropTypes from 'prop-types';

import useCanCloseModal from '../../../src/hooks/modal-can-close';
import { CopyAndPasteButton, InputInteger } from '../../../src/components';

const TaskModal = ({
  task,
  onSubmit = () => {},
  onCancel = () => {},
  disabled = false
}) => {
  const [json, setJson] = useState(task.task);
  const [formValue, setFormValue] = useState(task);
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
        <Form
          onChange={formValue => {
            setIsChanged(true);
            setFormValue(formValue);
          }}
          formValue={formValue}
        >
          <div style={{ paddingBottom: '15px' }}>
            Edit the payload of the task ID <span className="cell-task-id">{task.taskId}</span>
            <CopyAndPasteButton
              notification="Task ID copied to clipboard!"
              style="icon"
              text={task.taskId}
            />
          </div>
          <FormGroup>
            <ControlLabel>Priority</ControlLabel>
            <FormControl
              disabled={disabled}
              accepter={InputInteger}
              min={1}
              max={100}
              style={{ width: '100px' }}
              name="priority" />
          </FormGroup>
        </Form>
        <FormGroup style={{ paddingTop: '15px' }}>
          <ControlLabel>Task payload</ControlLabel>
          <ReactJson
            src={task.task}
            onEdit={!disabled ? handleChange : undefined}
            onAdd={!disabled ? handleChange : undefined}
            onDelete={!disabled ? handleChange : undefined}
          />
        </FormGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => handleCancel()} appearance="subtle">
          Cancel
        </Button>
        <Button
          appearance="primary"
          disabled={disabled || !isChanged}
          onClick={() => {
            onSubmit({ ...formValue, task: json });
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
