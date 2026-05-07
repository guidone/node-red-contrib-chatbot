
const formatContext = context => {
  if (!context) {
    return [];
  }
  return (Array.isArray(context) ? context : [context])
    .map(text => (
      {
        role: 'user',
        content: [{ type: 'input_text', text}]
      }
    ));
};

module.exports = formatContext;
