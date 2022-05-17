import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import { typeMessage } from '../../../types';

import Content from './content';
import { Button, Buttons } from './generic';

const MessageButtons = ({
  message,
  onClick = () => {},
  position,
  beak
}) => {

  // TODO how to show position
  console.log('position', position);

  return (
    <Fragment>
      <Content position="first" beak={beak}>
        {message.content}
      </Content>
      {message.buttons != null && message.buttons.length !== 0 && (
        <Buttons layout="card">
          {message.buttons
            .filter(button => button.type !== 'newline')
            .map(button => (
              <Button
                {...button}
                onClick={() => onClick(button)}
                key={`${button.value}-${button.label}`}
              >{button.label}</Button>
            ))
          }
        </Buttons>
      )}
    </Fragment>
  );
};
MessageButtons.propTypes = {
  onClick: PropTypes.func,
  position: PropTypes.oneOf(['first', 'middle', 'last']),
  beak: PropTypes.bool,
  //layout: PropTypes.oneOf(['quick-replies', 'inline',  'card']),
  message: typeMessage,
};

export default MessageButtons;