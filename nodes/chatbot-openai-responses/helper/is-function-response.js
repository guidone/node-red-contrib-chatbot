const isFunctionResponse = msg => {
  return msg?.['chatgpt-function-call']?.call_id != null;
};

module.exports = isFunctionResponse;