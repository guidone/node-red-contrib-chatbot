import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'rsuite';
import _ from 'lodash';
import classNames from 'classnames';

import ShowErrors from '../show-error';

import './style.scss';


const ModalWrapper = ({
  view: InnerView,
  initialValue,
  updateValue,
  disabled = false,
  title,
  onSubmit = () => {},
  onCancel = () => {},
  labelSubmit = 'Save',
  labelCancel = 'Cancel',
  className,
  size = 'md',
  error,
  validation: validationProp,
  enableSubmit = () => true,
  align = 'right',
  custom
}) => {
  const [value, setValue] = useState(initialValue);
  const [validation, setValidation] = useState(validationProp);
  useEffect(() => {
    setValidation(validationProp);
  }, [validationProp]);
  useEffect(() => {
    // set the status in case of update
    if (updateValue != null) {
      setValue(updateValue);
    }
  }, [updateValue]);

  return (
    <Modal
      backdrop
      show
      onHide={() => onCancel()}
      size={size}
      overflow={false}
      className={classNames('ui-modal-wrapper', className, { [align]: true   })}
    >
      {(!_.isEmpty(title) || _.isFunction(title)) && (
        <Modal.Header>
          <Modal.Title>{_.isFunction(title) ? title(value) : title}</Modal.Title>
        </Modal.Header>
      )}
      <Modal.Body>
        {error != null && <ShowErrors error={error}/>}
        <InnerView
          disabled={disabled}
          value={value}
          validation={validation}
          error={error}
          onChange={value => {
            setValue(value);
            setValidation(null)
          }}
          onSubmit={() => onSubmit(value)}
        />
      </Modal.Body>
      <Modal.Footer>
        {_.isFunction(custom) ? custom(value) : custom}
        {!_.isEmpty(labelCancel) && (
          <Button onClick={() => onCancel()} appearance="subtle">
            {labelCancel}
          </Button>
        )}
        {!_.isEmpty(labelSubmit) && (
          <Button
            disabled={disabled || !enableSubmit(value)}
            appearance="primary"
            onClick={() => onSubmit(value)}
          >
            {labelSubmit}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ModalWrapper;