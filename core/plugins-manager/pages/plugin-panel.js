import _ from 'lodash';
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { ButtonToolbar, Icon, Tag, TagGroup } from 'rsuite';
import useFetch from 'use-http';
import Showdown from 'showdown';

import SmallTag from '../../../src/components/small-tag';
import Button from '../../../src/components/button';
import { useModal } from '../../../src/components/modal';
import AppContext from '../../../src/common/app-context';
import useSettings from '../../../src/hooks/settings';

import FlowSource from './flow-source';
import ModalMarkdown from '../views/modal-markdown';
import versionCompare from '../helpers/version-compare';
import CopyAndPasteButton from '../views/copy-and-paste';
import { TypePlugin } from '../types';


//const isisInstalled = (current, plugins) => plugins.some(plugin => plugin.plugin === current.id);

/*const needUpdate = (current, plugins) => {
  const isInstalled = plugins.find(plugin => plugin.plugin === current.id);
  return versionCompare(isInstalled.version, current.version) === -1;
};*/

const nameHelper = (author) => {
  if (author != null)
  if (author != null && !_.isEmpty(author.nickname)) {
    return author.nickname;
  } else if (!_.isEmpty(author.first_name) && !_.isEmpty(author.last_name)) {
    return author.first_name + ' ' + author.last_name;
  } else if (!_.isEmpty(author.first_name)) {
    return author.first_name;
  } else if (!_.isEmpty(author.last_name)) {
    return author.last_name;
  }
  return '';
}


const CopyAndPasteFlow = ({ plugin }) => {
  const { loading, data = [] } = useFetch(plugin.flow, {}, []);
  return (
    <CopyAndPasteButton
      disabled={loading}
      text={JSON.stringify(data)}
      notification="The Node-RED flow was copied to the clipboard"
    />
  );
};
CopyAndPasteFlow.propTypes = {
  plugin: TypePlugin
};


const PluginPanel = ({
  plugin,
  onInstall = () => {},
  onUninstall = () => {},
  onUpdate = () => {},
  disabled = false
}) => {
  const { version: redBotVersion } = useSettings();
  const { state: { chatbot } } = useContext(AppContext);
  const { open, close } = useModal({
    view: FlowSource,
    title: `Node-RED flow for ${plugin.name}`,
    size: 'lg',
    labelSubmit: 'Close',
    labelCancel: null,
    align: 'center',
    custom: value => (
      <CopyAndPasteFlow plugin={value} />
    )
  });

  const { open: openReadMe, close: closeReadMe } = useModal({
    view: ModalMarkdown,
    title: plugin.name,
    size: 'md',
    labelSubmit: 'Close',
    labelCancel: null,
    align: 'center'
  });

  const installedPlugin = chatbot.plugins.find(installed => installed.plugin === plugin.name);
  const isInstalled = installedPlugin != null;
  const upgrade = isInstalled && versionCompare(installedPlugin.version, plugin.version) === -1;
  const converter = new Showdown.Converter({ openLinksInNewWindow: true });
  const version = isInstalled ? installedPlugin.version : plugin.version;

  let installDisabled = disabled;
  if (!_.isEmpty(plugin.redbot_version) && versionCompare(plugin.redbot_version, redBotVersion) === 1) {
    installDisabled = `This plugins requires RedBot version ${plugin.redbot_version}`;
  }

  return (
    <div className="plugin">
      <div className="meta">
        <h5>
          {plugin.title}
        </h5>
        <div
          className="description"
          dangerouslySetInnerHTML={{ __html: converter.makeHtml(plugin.description?.split('---')[0])}}
        />
        {plugin.description?.split('---').length > 1 && (
          <div>
            <a
              href="#"
              onClick={async e => {
                e.preventDefault();
                await openReadMe({ markdown: plugin.description });
                closeReadMe();
              }}
            >
              more...
            </a>
          </div>
        )}
        <div className="info">
          <SmallTag color="#0579DB" className="version"><span className="label">v</span>{version}</SmallTag>
          <div className="icons">
            {plugin.repository != null && (
              <a className="github" href={plugin.repository}  target="_blank" rel="noreferrer">
                <Icon icon="github" />
              </a>
            )}
            {plugin.user_created != null && (
              <span className="author">
                <Icon icon="user"/>
                &nbsp;
                {plugin.user_created.url != null && (
                  <a href={plugin.user_created.url} target="_blank" rel="noreferrer">{nameHelper(plugin.user_created)}</a>
                )}
                {plugin.user_created.url == null && <span>{nameHelper(plugin.user_created)}</span>}
              </span>
            )}
          </div>
          {plugin.tags != null && (
            <TagGroup>
              {plugin.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
            </TagGroup>
          )}
        </div>
      </div>
      <div className="buttons">
        <ButtonToolbar size="sm">
          {!isInstalled && (
            <Button
              disabled={installDisabled}
              size="sm"
              block
              color="blue"
              onClick={() => onInstall(plugin)}
            >Install</Button>
          )}
          {upgrade && (
            <Button
              disabled={installDisabled}
              block
              size="sm"
              color="orange"
              onClick={() => onUpdate(plugin)}
            >Update</Button>
          )}
          {isInstalled && plugin.flow != null && (
            <Button
              disabled={disabled}
              size="sm"
              block
              appearance="ghost"
              onClick={async () => {
                await open(plugin);
                close();
              }}
            >Import flow</Button>
          )}
          {isInstalled && (
            <Button
              disabled={disabled}
              block
              size="sm"
              color="red"
              onClick={() => onUninstall(plugin)}
            >Uninstall</Button>
          )}
        </ButtonToolbar>
      </div>
    </div>
  );
};

PluginPanel.propTypes = {
  plugin: TypePlugin,
  plugins: PropTypes.arrayOf(TypePlugin),
  onInstall: PropTypes.func,
  onUninstall: PropTypes.func,
  onUpdate: PropTypes.func,
  disabled: PropTypes.bool
};

export default PluginPanel;