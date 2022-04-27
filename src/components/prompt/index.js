import ReactDOM from 'react-dom';
import React, { useState, useCallback } from 'react';
import { Button, Modal } from 'rsuite';

let dom = null;

function getContainerDOM() {
  if (!dom) {
    dom = document.createElement('div');
    document.body.appendChild(dom);
  }

  return dom;
}

function InteractionModal({
  okButtonText = 'Ok',
  onOk,
  showCancelButton = true,
  cancelButtonText = 'Cancel',
  onCancel,
  children
}) {
  const [shouldShowModal, setShouldShowModal] = useState(true);

  const handleOk = useCallback(() => {
      setShouldShowModal(false);
      onOk && onOk();
  }, [onOk]);

  const handleCancel = useCallback(() => {
      setShouldShowModal(false);
      onCancel && onCancel();
  }, [onCancel]);

  return (
    <Modal size="sm" show={shouldShowModal}>
      <Modal.Body>
        {children}
      </Modal.Body>
      <Modal.Footer>
        {showCancelButton && (
          <Button onClick={handleCancel}>
            {cancelButtonText}
          </Button>
        )}
        <Button onClick={handleOk} appearance="primary">
          {okButtonText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

const prompt = (Form, value, { okLabel = 'Ok', cancelLabel = 'Cancel' } = { }) => {
  let currentValue = { ...value }

  return new Promise(resolve => {
    ReactDOM.render(
      <InteractionModal
        okButtonText={okLabel}
        cancelButtonText={cancelLabel}
        key={Date.now()}
        onOk={() => resolve(currentValue)}
        onCancel={() => resolve(null)}
      >
        <Form
          formValue={currentValue}
          onChange={formValue => currentValue = formValue}
        />
      </InteractionModal>,
      getContainerDOM()
    );
  });
}



export default prompt;