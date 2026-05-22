const isAttachment = (obj) => {
  return typeof obj === 'object' && obj.filename != null && obj.content != null;
};

module.exports = isAttachment;
