import React from 'react';

import Language from '../../../components/language';

const ContentIcon = ({ language, disabled = false, title, onClick = () => {} }) => {
  return (
    <a 
      style={{ display: 'inline-block', marginLeft: '3px', opacity: disabled ? '0.2' : '1' }}
      href="#" 
      onClick={e => {
        e.preventDefault();
        onClick();
      }}
    >
      <Language tooltip={title}>{language}</Language>
    </a>
  );
};

export default ContentIcon;