import React, { useEffect, useState } from 'react';
import { Button, Notification, IconButton, Icon } from 'rsuite';
import ClipboardJS from 'clipboard';
import PropTypes from 'prop-types';
import _ from 'lodash';

const CopyAndPasteButton = ({
  text,
  disabled = false,
  style = 'button',
  label = 'Copy to Clipboard',
  notification = 'Text succesfully copied to clipboard'
}) => {
  const [uniqueId] = useState(_.uniqueId('clipboard-'));
  useEffect(() => {
    const clipboard = new ClipboardJS(`.ui-clipboard-button-${uniqueId}`, {
      text: () => text
    });
    return () => clipboard.destroy();
  }, [text]);

  if (style === 'icon') {
    return (
      <IconButton
        size="xs"
        icon={<Icon icon="paste" />}
        disabled={disabled}
        onClick={() => {
          Notification.success({ title: 'Copied!', description: notification });
        }}
        className={`ui-clipboard-button-${uniqueId}`}
      />
    );
  } else {
    return (
      <Button
        disabled={disabled}
        onClick={() => {
          Notification.success({ title: 'Copied!', description: notification });
        }}
        className={`ui-clipboard-button-${uniqueId}`}
        appearance="ghost"
      >
        {label}
      </Button>
    );
  }
};
CopyAndPasteButton.propTypes = {
  text: PropTypes.string,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  notification: PropTypes.string,
  style: PropTypes.oneOf(['button', 'icon'])
};

export default CopyAndPasteButton;