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

/*function PromptModal({ message, defaultResult = '', onOk, ...props }) {

  const [result, setResult] = useState(defaultResult);

  const handleOk = useCallback(() => {
    onOk(result);
  }, [onOk, result]);

  return (
    <InteractionModal {...props} onOk={handleOk}>
      {message}
      <Input
        autoFocus
        value={result}
        onChange={value => setResult(value)}
        style={{ marginTop: 10 }}
      />
    </InteractionModal>
  );
}*/

const confirm = (message, { okLabel = 'Ok', cancelLabel = 'Cancel' } = { }) => {
  return new Promise(resolve => {
    ReactDOM.render(
      <InteractionModal
        okButtonText={okLabel}
        cancelButtonText={cancelLabel}
        key={Date.now()}
        onOk={() => resolve(true)}
        onCancel={() => resolve(false)}
      >
        {message}
      </InteractionModal>,
      getContainerDOM()
    );
  });
}



export default confirm;