import { useContext } from 'react';
import AppContext from '../common/app-context';


const useCurrentUser = () => {
  const { state } = useContext(AppContext);
  return {
    user: state.user,
    permissions: state.user.permissions,
    permissionQuery: { permission: { '$intersect': state.user.permissions } },
    can: permission => state.user.permissions.includes(permission) || state.user.permissions.includes('*')
  };
};

export default useCurrentUser;