import React from 'react';
import { Button } from 'rsuite';
import { Link } from 'react-router-dom';

const GoToMessagesButton = ({ user }) => {
  return (
    <Link to={`/messages?userId=${user.userId}`}>
      <Button appearance="ghost">View Messages</Button>
    </Link>
  );
};

export default GoToMessagesButton;