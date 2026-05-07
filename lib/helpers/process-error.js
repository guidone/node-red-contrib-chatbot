const processError = (error, gptRequest, msg, sessionId) => {
  const outputCount = 2 + (gptRequest.tools ?? []).filter(o => o.type === 'function').length;

  // send only throught the error pin
  const output = Array(outputCount);
  output[output.length - 1] = {
    ...msg,
    payload: error,
    sessionId
  };

  return output;
};

module.exports = processError;
