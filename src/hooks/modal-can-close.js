import { useState, useCallback } from 'react';
import confirm from '../components/confirm';

export default ({ onCancel }) => {
  const [isChanged, setIsChanged] = useState(false);

  const handleCancel = useCallback(async () => {
    if (!isChanged || await confirm('Close and lose all the changes?', { okLabel: 'Yes, close' })) {
      onCancel();
    };
  }, [onCancel, isChanged]);

  return {
    handleCancel,
    isChanged,
    setIsChanged
  };
};