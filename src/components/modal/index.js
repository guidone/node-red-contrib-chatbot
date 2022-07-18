import React, { useState, Fragment, useContext, useReducer, useCallback } from 'react';
import _ from 'lodash';

import reducer from './reducer';
import ModalWrapper from './model-wrapper';

const isValid = validation => Object.values(validation).every(item => !item.hasError);

const ModalContext = React.createContext({});

/**
 * useModal
 * @param {Object} props
 * @param {React.View} props.view
 * @param {String} props.align Alignment of the buttons: left, center, right
 * @param {String} props.title Title of the modal
 * @param {String} props.labelSubmit Submit button
 * @param {String} props.labelCancel Cancel button
 * @param {String} props.className
 * @param {String} props.size Size of the modal
 * @param {React} props.custom Custom view, additional button in the footer
 * @param {String} props.enableSummit Enable or disable the submit button, takes as argument the current value of the form
 * @return {Object}
 * @return {Function} return.open Open the modal setting the initial state of the modal
 * * @return {Function} return.update Update the internal state of the modal and wait
 * @return {Function} return.validate Set the validation info for the form
 * @return {Function} return.error Set the server side error for the form
 */
const useModal = props => {
  const context = useContext(ModalContext);
  const { dispatch } = context;

  const [id] = useState(_.uniqueId('modal_'));

  const open = useCallback((modalProps, params) => {
    return new Promise(resolve => dispatch({ type: 'appendView', id, resolve, initialValue: modalProps, ...props, ...params }))
  });
  const validate = useCallback(validation => dispatch({ type: 'mergeModalProps', id, props: { validation } }));
  const close = useCallback(() => dispatch({ type: 'removeView', id }));
  const disable = useCallback(() => dispatch({ type: 'mergeModalProps', id, props: { disabled: true } }));
  const enable = useCallback(() => dispatch({ type: 'mergeModalProps', id, props: { disabled: false } }));
  const error = useCallback(error => dispatch({ type: 'mergeModalProps', id, props: { error } }));
  const update = useCallback(value => {
    return new Promise(resolve => dispatch({ type: 'appendView', id, resolve, updateValue: value }))
  });
  const openWith = useCallback(async (modalProps, enableSubmit) => {
    let result = await open(modalProps, { enableSubmit });
    close();
    return result;
  });
  const openWithModel = useCallback(async (modalProps, model) => {
    let validation = null;
    let value = { ...modalProps };
    do {
      value = await open(value);
      if (value != null) {
        validation = model.check(value);
        if (!isValid(validation)) {
          // translate validation object
          const errors = {};
          Object.keys(validation)
            .forEach(field => {
              if (validation[field].hasError) {
                errors[field] = validation[field].errorMessage;
              }
            })
          validate(errors);
        } else {
          validate(null);
        }
      }
    } while (value != null && !isValid(validation));
    close();
    return value;
  });

  return {
    open,
    close,
    error,
    validate,
    disable,
    enable,
    openWith,
    openWithModel,
    update
  };
};

const ModalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { modals: [] });
  const { modals } = state;

  return (
    <ModalContext.Provider value={{
      dispatch,
    }}>
      {!_.isEmpty(modals) && (
        <Fragment>
          {modals.map(({ id, view, props }) => <ModalWrapper view={view} key={id} {...props} />)}
        </Fragment>
      )}
      {children}
    </ModalContext.Provider>
  );
};

export { ModalProvider, useModal };