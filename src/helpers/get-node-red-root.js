import getRoot from './get-root';

export default () => {
  return getRoot().replace(/\/mc$/, '');
};
