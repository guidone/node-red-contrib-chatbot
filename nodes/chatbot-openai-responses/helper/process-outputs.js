const tryParse = require("./try-parse");

const findOutputIndex = (json, functionName) => {
  let found;
  (json.tools ?? []).forEach((tool, idx) => {
    if (tool.name === functionName) {
      found = idx;
    }
  });
  return found + 1;
};

const processOutputs = (outputs, gptRequest, msg, response, sessionId) => {
  const outputCount = 2 + (gptRequest.tools ?? []).filter(o => o.type === 'function').length;

  // collect responses and map to outputs
  const output = Array(outputCount);
  outputs.forEach(obj => {
    if (obj.type === 'message' && obj.role === 'assistant') {
      console.log('passa di qua')
      if (!Array.isArray(output[0])) {
        output[0] = [];
      }
      obj.content.forEach(o => {
        if (o.type === 'output_text') {
          output[0].push({ ...msg, payload: { message: o.text } });
        }
      });
    } else if (obj.type === 'function_call') {
      console.log('no func call')
      const outputIdx = findOutputIndex(gptRequest, obj.name);
      if (outputIdx) {
        if (!Array.isArray(output[outputIdx])) {
          output[outputIdx] = [];
        }
        output[outputIdx].push({
          ...msg,
          payload: tryParse(obj.arguments),
          ['chatgpt-function-call']: {
            ...obj,
            previousId: response.id,
            sessionId
          }
        });
      }
    }
  });

  return output;
};

module.exports = processOutputs;
