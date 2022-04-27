import React from 'react';
import PropTypes from 'prop-types';

class Image extends React.Component {

  static propTypes = {
    thumb: PropTypes.string,
    height: PropTypes.number,
    width: PropTypes.number,
    maxWidth: PropTypes.number,
    maxHeight: PropTypes.number,
    onClick: PropTypes.func
  };

  static defaultProps = {
    thumb: null,
    height: null,
    width: null,
    maxWidth: 200,
    maxHeight: 400,
    onClick: () => {}
  };

  render() {
    const { thumb, height, width, maxWidth, maxHeight } = this.props;

    const ratio = height / width;
    let imageHeight = Math.floor(ratio * maxWidth);
    if (imageHeight > maxHeight) {
      imageHeight = maxHeight;
    }

    const style = {
      backgroundImage: `url(${thumb})`,
      backgroundPosition: 'center',
      width: `${maxWidth}px`,
      height: `${imageHeight}px`
    };

    return (
      <div style={style} />
    );
  }
}

export default Image;
