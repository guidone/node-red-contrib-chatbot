import { useContext } from 'react';

import AppContext from '../common/app-context';

export default () => {
  return useContext(AppContext);
};
