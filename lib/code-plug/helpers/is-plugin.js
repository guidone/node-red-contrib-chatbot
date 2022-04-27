export default obj => {
  return obj != null && obj.prototype != null && obj.prototype.register != null;
};
