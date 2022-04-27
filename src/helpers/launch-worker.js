import workway from 'workway'; // https://github.com/WebReflection/workway#workway--

/**
 * @function launchWebWorker
 * Launch a web worker using Workway using a plain text of the code in order to solve problem of importing the worker
 * with WebPack and the cross origin limitation.
 * Import the worker code with
 *
 *   import workerSourceCode from '!!raw-loader!../../csv-exporter.worker.js';
 *   // ..
 *   const { worker, namespace } = await launchWebWorker(workerSourceCode);
 *
 * @param {String} code The web worker code
 * @return {Promise} An object with key { worker, namespace }, namespace contains all shared by the worker
 */
export default async code => {
  // in order to avoid the web-worker loader of WebPack, load a plain file in WebPack and create an object url for that
  // to pass to the Worker constructor, this also solves the cross origin problem
  const blob = new Blob([code], { type: 'application/javascript' });
  const myWorkerUrl = URL.createObjectURL(blob);
  const res = await workway(myWorkerUrl);
  URL.revokeObjectURL(myWorkerUrl);
  return res;
};