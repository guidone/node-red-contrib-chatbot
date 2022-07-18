import { useContext } from 'react';
import AppContext from '../common/app-context';

const useSettings = () => {
  const { state } = useContext(AppContext);

  return state.settings
};

export default useSettings;