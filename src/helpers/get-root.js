export default () => {
  return window.bootstrap != null
    && window.bootstrap.settings != null
    && window.bootstrap.settings.root != null ? window.bootstrap.settings.root : '/mc';
};
