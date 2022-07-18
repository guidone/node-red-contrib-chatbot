import React, { useEffect } from 'react';
import { Button, Notification } from 'rsuite';
import ClipboardJS from 'clipboard';
import PropTypes from 'prop-types';

const CopyAndPasteButton = ({
  text,
  disabled = false,
  label = 'Copy to Clipboard',
  notification = 'Text succesfully copied to clipboard'
}) => {
  useEffect(() => {
    const clipboard = new ClipboardJS('.ui-clipboard-button', {
      text: () => text
    });
    return () => clipboard.destroy();
  }, [text]);

  return (
    <Button
      disabled={disabled}
      onClick={() => {
        Notification.success({ title: 'Copied!', description: notification });
      }}
      className="ui-clipboard-button"
      appearance="ghost"
    >
      {label}
    </Button>
  );
};
CopyAndPasteButton.propTypes = {
  text: PropTypes.string,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  notification: PropTypes.string
};

export default CopyAndPasteButton;