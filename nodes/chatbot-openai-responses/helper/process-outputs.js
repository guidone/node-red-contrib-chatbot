const tryParse = require("./try-parse");

const findFunctionIndex = (effectiveTools, functionName) => {
  const idx = (effectiveTools ?? []).findIndex(t => t.type === 'function' && t.name === functionName);
  return idx === -1 ? -1 : idx + 1;
};

const processOutputs = (outputs, effectiveTools, msg, response, sessionId) => {
  const functionCount = (effectiveTools ?? []).filter(t => t.type === 'function').length;
  const errorIdx = 1 + functionCount;
  const outputCount = errorIdx + 1;

  const output = Array(outputCount);
  outputs.forEach(obj => {
    if (obj.type === 'message' && obj.role === 'assistant') {
      if (!Array.isArray(output[0])) {
        output[0] = [];
      }
      obj.content.forEach(o => {
        if (o.type === 'output_text') {
          output[0].push({ ...msg, payload: { message: o.text } });
        }
      });
    } else if (obj.type === 'function_call') {
      const outputIdx = findFunctionIndex(effectiveTools, obj.name);
      if (outputIdx > 0) {
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
      } else {
        if (!Array.isArray(output[errorIdx])) {
          output[errorIdx] = [];
        }
        output[errorIdx].push({
          ...msg,
          payload: {
            error: `Function "${obj.name}" not found in node tools list. Refresh tools in the node editor.`,
            functionCall: obj
          }
        });
      }
    }
  });

  return output;
};

module.exports = processOutputs;
