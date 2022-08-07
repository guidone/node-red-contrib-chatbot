import React, { useState } from 'react';
import { Modal, Button } from 'rsuite';
import ReactJson from 'react-json-view'


import useCanCloseModal from '../../../src/hooks/modal-can-close';


//import './style.scss';



const TaskModal = ({
  task,
  onSubmit = () => {},
  onCancel = () => {},
  disabled = false
}) => {
  const [json, setJson] = useState(task.task);
  const { handleCancel, isChanged, setIsChanged } = useCanCloseModal({ onCancel });
  const [context, setContext] = useState();


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
}

export default TaskModal;
