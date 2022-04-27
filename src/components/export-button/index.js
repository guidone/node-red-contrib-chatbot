import React, { useState, Fragment } from 'react';
import { Button, Modal, Progress } from 'rsuite';

const { Circle } = Progress;

import workerSourceCode from '!!raw-loader!../../csv-exporter.worker.js';
import launchWebWorker from '../../helpers/launch-worker';
import useMCContext from '../../hooks/mc-context';

const ExportButton = ({ disabled, namespace, table }) => {
  const [currentWorker, setCurrentWorker] = useState(null);
  const { state } = useMCContext();
  const [status, setStatus] = useState(null);
  const [url, setUrl] = useState(null);

  const token = localStorage.getItem('token');

  const urlGraphQL = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/graphql`

  return (
    <Fragment>
      {(currentWorker != null || url != null) && status != null && (
        <Modal show>
          <Modal.Header closeButton={false}>
            <Modal.Title
              style={{ fontSize: '26px', textAlign: 'center' }}
            >Exporting {table}</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ textAlign: 'center' }}>
            <div style={{ width: '120px', display: 'inline-block' }}>
              <Circle
                status={status.current === status.pages ? 'success' : undefined}
                percent={Math.round((status.current / status.pages) * 100)}
                strokeColor={status.current === status.pages ? null : '#ffc107'}
              />
            </div>
          </Modal.Body>
          <Modal.Footer style={{ textAlign: 'center' }}>
            {url != null && (
              <Button
                appearance="primary"
                href={url}
              >
                Download
              </Button>
            )}
            <Button
              appearance="primary"
              onClick={() => {
                if (currentWorker != null) {
                  currentWorker.terminate();
                }
                setUrl(null);
              }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      <Button
        appearance="primary"
        disabled={disabled || currentWorker != null}
        onClick={async () => {
          if (currentWorker != null) {
            return; // do nothing, running
          }
          setStatus(null);
          const { worker, namespace: ns } = await launchWebWorker(workerSourceCode);
          worker.addEventListener('message', event => setStatus(event.data));
          setCurrentWorker(worker);
          let url;
          if (table === 'users') {
            url = await ns.exportUsersCSV({ token, urlGraphQL, chatbotId: state.chatbotId });
          } else if (table === 'contents') {
            url = await ns.exportContentCSV({ namespace, token, urlGraphQL, chatbotId: state.chatbotId });
          } else {
            throw 'Table not specified in Export Button';
          }
          setUrl(url);
          setCurrentWorker(null);
        }}>Export CSV
      </Button>
    </Fragment>
  );
};

export default ExportButton;