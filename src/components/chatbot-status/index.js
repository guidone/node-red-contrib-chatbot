import React from 'react';
import { Tag } from 'rsuite';

import './chatbot-status.scss';

export default ({ children }) => <Tag color="orange" className="ui-chatbot-status">{children}</Tag>;