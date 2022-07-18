import React from 'react';
import { Icon, Tooltip, Whisper } from 'rsuite';
import PropTypes from 'prop-types';
import _ from 'lodash';
import classNames from 'classnames';

import Balloon from './balloon';

class PinPoint extends React.Component {

  static propTypes = {
    point: PropTypes.shape({
      topic: PropTypes.string,
      text: PropTypes.string,
      ts: PropTypes.string
    }).isRequired,
    icon: PropTypes.string,
    size: PropTypes.string,
    color: PropTypes.string,
    text: PropTypes.string,
    popover: PropTypes.string,
    thumb: PropTypes.string,
    image: PropTypes.string,
    showPopover: PropTypes.bool,
    type: PropTypes.oneOf(['icon', 'tooltip']),
    inkColor: PropTypes.string,
    maxHeight: PropTypes.number
  };

  static defaultProps = {
    icon: 'map-marker',
    color: '#FF3300',
    text: null,
    size: '2x',
    popover: null,
    thumb: null,
    image: null,
    type: 'icon',
    showPopover: false,
    inkColor: '#ffffff',
    maxHeight: 480
  };

  constructor(props) {
    super(props);

    this.handleLoaded = this.handleLoaded.bind(this);
    this.handleClick = this.handleClick.bind(this);

    const { thumb } = props;

    this.state = {
      needPreload: !_.isEmpty(thumb),
      preload: false,
      width: null,
      height: null
    };
  }

  componentDidMount() {
    const { type, color} = this.props;

    if (this.tooltip != null && type === 'tooltip') {
      this.tooltip.querySelector('.rs-tooltip-inner').style.backgroundColor = color;
      this.tooltip.querySelector('.rs-tooltip-arrow').style.backgroundColor = color;
    }
  }

  handleLoaded(e) {
    this.setState({
      preload: false,
      width: e.target.width,
      height: e.target.height
    }, () => this.trigger.show());
  }

  handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const { thumb } = this.props;

    if (!_.isEmpty(thumb)) {
      this.setState({ preload: true })
    } else {
      this.trigger.show();
    }
  }

  render() {
    const { point, text, type, popover, showPopover, thumb, image, inkColor, maxHeight, onDeletePoint, onShowImage } = this.props;
    let { icon, color, size } = this.props;

    const { height, width, preload, needPreload } = this.state;

    if (_.isEmpty(icon)) {
      icon = 'map-marker';
    }
    if (_.isEmpty(size)) {
      size = 'lg';
    }
    if (_.isEmpty(color)) {
      color = '#FF3300';
    }
    if (_.isEmpty(inkColor)) {
      color = '#000000';
    }
    const ts = new Date(parseInt(point.ts, 10));

    let content;
    switch(type) {
      case 'icon':
        content = (
          <a
            href="#"
            className={classNames('wrapper-map-marker', { preload })}
            onClick={this.handleClick}>
            {preload && <img src={thumb} style={{display: 'none'}} onLoad={this.handleLoaded} alt=""/>}
            <Icon
              className={classNames('map-marker', { 'pointer': showPopover })}
              icon={icon}
              size={size}
              style={{ color }}
            />
          </a>
        );
        break;
      case 'tooltip':
        content = (
          <div ref={ref => this.tooltip = ref} style={{ height: 20, backgroundColor: '#ff0000' }}>
            <Tooltip visible><span style={{ color: inkColor }}>{text}</span></Tooltip>
          </div>
        );
        break;
      default:
        content = null;
        break;
    }

    // if show popover, then add whisper wrapper
    if (showPopover) {
      // if need preload and is preloading, then just show the marker and not the whisperer
      if (needPreload && preload) {
        return content;
      }
      const speaker = (
        <Balloon
          onDelete={() => onDeletePoint(point)}
          onZoom={({ image, content }) => onShowImage({ image, content })}
          thumb={thumb}
          image={image}
          content={popover}
          topic={point.topic}
          ts={ts}
          width={width}
          height={height}
          maxHeight={maxHeight}
        />
      );
      return (
        <Whisper trigger="click" placement="top" speaker={speaker} triggerRef={ref => this.trigger = ref}>
          {content}
        </Whisper>
      );
    }
    return content;
  }
}

export default PinPoint;
