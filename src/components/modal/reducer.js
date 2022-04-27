export default (state, action) => {
  if (action.type === 'appendView') {
    const { id, resolve, type, view, ...rest } = action;
    let newModals;
    if (state.modals.some(modal => modal.id === id)) {
      // if already exists, just refresh the promise
      newModals = state.modals
        .map(modal => {
          if (modal.id === id) {
            return {
              ...modal,
              props: {
                ...modal.props,
                ...rest,
                onSubmit: value => resolve(value),
                onCancel: () => resolve()
              }
            };
          }
          return modal;
        });
    } else {
      newModals = [
        ...state.modals,
        {
          id,
          view,
          props: {
            ...rest,
            onSubmit: value => resolve(value),
            onCancel: () => resolve()
          }
        }
      ];
    }
    return { ...state, modals: newModals };
  } else if (action.type === 'mergeModalProps') {
    const newModals = state.modals.map(modal => {
      if (modal.id === action.id) {
        return {
          ...modal,
          props: {
            ...modal.props,
            ...action.props
          }
        };
      }
      return modal;
    });
    return { ...state, modals: newModals };
  } else if (action.type === 'setError') {
    const { id, view, props, resolve, error } = action;
    const newModals = state.modals.map(modal => {
      if (modal.id === id) {
        return {
          ...modal,
          props: {
            ...modal.props,
            error,
            onSubmit: value => resolve(value),
            onCancel: () => resolve()
          }
        };
      }
      return modal;
    });
    return { ...state, modals: newModals };
  } else if (action.type === 'removeView') {
    return {
      ...state,
      modals: state.modals.filter(modal => modal.id !== action.id)
    };
  }
};