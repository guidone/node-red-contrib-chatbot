import { useContext } from 'react';
import AppContext from '../common/app-context';

const useSettings = () => {
  const { state } = useContext(AppContext);

  if (state != null) {
    return state.settings;
  } else if (window.bootstrap?.settings) {
    return window.bootstrap?.settings;
  } else {
    return {};
  }
};

export default useSettings;