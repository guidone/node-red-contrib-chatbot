import React from 'react';
import _ from 'lodash';
import classNames from 'classnames';

import { Tag, Icon, Whisper, Tooltip } from 'rsuite';

const KeyTag = ({ keyTag, onClick = () => {}, disabled = false }) => {



  return (
    <div className={classNames('key-tag', { disabled })}>
      <a
        href="#"
        onClick={e => {
          e.preventDefault();
          if (!disabled) {
            onClick(keyTag);
          }
        }}>
        <Tag color={keyTag.color}>{keyTag.key}</Tag>
        {!_.isEmpty(keyTag.description) && (
          <Whisper trigger="hover" speaker={<Tooltip placement="top">{keyTag.description}</Tooltip>}>
            <Icon icon="help-o"/>
          </Whisper>
        )}
      </a>
    </div>
  )

};

export default KeyTag;