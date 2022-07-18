/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import useFetch from 'use-http';

import { TypePlugin } from '../types';
import ShowError from '../../../src/components/show-error';
import LoaderModal from '../../../src/components/loader-modal';
import JSONEditor from '../../../src/components/json-editor';

const FlowSource = ({ value: plugin }) => {
  const { loading, error, data = [] } = useFetch(plugin.flow, {}, []);

  return (
    <div className="ui-flow-source">
      {loading && <LoaderModal />}
      {error && <ShowError error={error} />}
      {!loading && !error && (
        <div>
          <div style={{ paddingBottom: '10px' }}>
            This plugin requires a subflow in <strong>Node-RED</strong> in order to work.<br />
            To import this the subflow: click on the top right icon and then <em>"Import"</em>, copy and past the
            code below.
          </div>
          <JSONEditor
            showPrintMargin={false}
            height="55vh"
            readOnly={true}
            value={JSON.stringify(data, null, 2)}
          />
        </div>
      )}
    </div>
  );
};
FlowSource.propTypes = {
  value: TypePlugin
};

export default FlowSource;