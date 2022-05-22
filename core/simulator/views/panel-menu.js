import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon, IconButton } from 'rsuite';

import { Language } from '../../../src/components';
import { /*typeActiveChatbot,*/ typeUser } from '../../../src/types';

import SimulatorParamsModal from './simulator-modal';

const PanelMenu = ({ user, language, /*nodeId, activeChatbots,*/ dispatch }) => {
  const [params, setParams] = useState(null);

  return (
    <div className="simulator-transport-menu cancel-drag">
      {params != null && (
        <SimulatorParamsModal
          //activeChatbots={activeChatbots}
          params={params}
          onCancel={() => setParams(null)}
          onSubmit={params => {
            dispatch({ type: 'params', params });
            setParams(null);
          }}
        />
      )}
      <div className="meta">
        {user != null && (
          <div className="user">{user.username} <em>({user.userId})</em></div>
        )}
        {user == null && <div className="user">Test User</div>}
        <Language>{language}</Language>
      </div>
      <IconButton
        appearance="subtle"
        icon={<Icon icon="cog" />}
        onClick={() => setParams({ user: user, language/*, nodeId*/ })}
        style={{ marginTop: '-3px', marginRight: '1px' }}
      />
    </div>
  );
};

PanelMenu.propTypes = {
  user: typeUser,
  language: PropTypes.string,
  //nodeId: PropTypes.string,
  dispatch: PropTypes.func,
  //activeChatbots: PropTypes.arrayOf(typeActiveChatbot)
};

export default PanelMenu;