const { Readable } = require('stream');

/**
 * Creates a readable stream from a Buffer.
 * @param {Buffer} buffer - The buffer to stream.
 * @returns {Readable} - The readable stream.
 */
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // Signal end of stream
  return stream;
}

module.exports = bufferToStream;
