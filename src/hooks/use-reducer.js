import { useContext, useEffect } from 'react';

import AppContext from '../common/app-context';

const useReducer = initialState => {
  const { state, dispatch } = useContext(AppContext);

  const fields = Object.keys(initialState);
  useEffect(() => {
    fields.forEach(field => {
      if (state[field] === undefined) {
        dispatch({ type: 'default', key: field, value: initialState[field] });
      }
    })
  }, []);

  // return immediately the default, if the view breaks the use effect will never be called
  const filteredState = fields.reduce((accumulator, field) => {
    accumulator[field] = state[field] !== undefined ? state[field] : initialState[field];
    return accumulator;
  }, {});

  return {
    state: filteredState,
    dispatch
  };
};

export default useReducer;