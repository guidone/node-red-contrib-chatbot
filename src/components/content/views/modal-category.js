import React, { useState, useRef } from 'react';
import {
  Modal,
  Button,
  Form,
  FormGroup,
  ControlLabel,
  FormControl
} from 'rsuite';

import { category as categoryModel } from '../models';

import '../styles/modal-content.scss';

const ModalCategory = ({ category, onCancel = () => {}, onSubmit = () => {}, disabled = false }) => {
  const [formValue, setFormValue] = useState(category);
  const [formError, setFormError] = useState(null);
  const form = useRef(null);

  // TODO: flag for edit or new

  return (
    <Modal backdrop show onHide={onCancel} className="modal-content" size="sm">
      <Modal.Header>
        <Modal.Title>Edit Category</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          model={categoryModel}
          ref={form}
          checkTrigger="none"
          formValue={formValue}
          formError={formError}
          onChange={formValue => {
            setFormValue(formValue);
            setFormError(null);
          }}
          onCheck={errors => {
            setFormError(errors);
          }}
          fluid autoComplete="off"
          style={{ marginBottom: '20px' }}
        >
          <FormGroup>
            <ControlLabel>Name</ControlLabel>
            <FormControl name="name"/>
          </FormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          appearance="primary"
          disabled={disabled}
          onClick={() => {
            if (!form.current.check()) {
              return;
            }
            onSubmit(formValue);
          }}
        >
          Save category
        </Button>
        <Button onClick={onCancel} appearance="ghost">
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalCategory;
