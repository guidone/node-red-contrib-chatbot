const processError = (error, effectiveTools, msg, sessionId) => {
  const functionCount = (effectiveTools ?? []).filter(t => t.type === 'function').length;
  const outputCount = 2 + functionCount;

  // send only through the error pin
  const output = Array(outputCount);
  output[output.length - 1] = {
    ...msg,
    payload: error,
    sessionId
  };

  return output;
};

module.exports = processError;
