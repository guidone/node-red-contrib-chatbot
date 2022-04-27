import React from 'react';
import { Tag, Icon } from 'rsuite';

import './style.scss';

const NodeRedNode = ({ children }) => <Tag style={{ backgroundColor: '#ff6633', color: '#ffffff'}}>{children}</Tag>;

const SlugHelp = () => (
  <p>
    Content is selected by a <em>slug</em>, a quick shortcut to identify the same content across different languages.
    Click on the language label to edit the content for a specific language or click on <Icon icon="plus-square"/> to create one.
  </p>
);

const TypeCommand = ({ children }) => (
  <code className="ui-type-command">{children}</code>
);

const ChatbotStatus = ({ children }) => <Tag color="orange" className="ui-chatbot-status">{children}</Tag>;

export { NodeRedNode, SlugHelp, TypeCommand, ChatbotStatus };