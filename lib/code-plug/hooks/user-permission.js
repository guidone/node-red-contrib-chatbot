export default function(plugin) {
  const { user, debug } = this.props || {};
  const permission = plugin != null && plugin.prototype != null && plugin.prototype.constructor != null ?
    plugin.prototype.constructor.permission : null;
  if (user != null && user.permissions != null && user.permissions.includes(permission)) {
    return true;
  }
  if (debug) {
    console.log(`Plugin ${plugin != null ? plugin.name : 'unnamed'} not loaded, missing ${permission}!`);
  }
};
