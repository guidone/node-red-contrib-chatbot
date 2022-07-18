import React from 'react';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import { Dropdown, Nav, Icon, Sidebar, Sidenav } from 'rsuite';

import { LogoFull } from '../components/logo';
import { useCodePlug } from 'code-plug';
import useCurrentUser from '../hooks/current-user';
import useSettings from '../hooks/settings';

const NavLink = props => <Dropdown.Item componentClass={Link} {...props} />;


const AppSidebar = () => {
  const { version } = useSettings();
  const { permissionQuery } = useCurrentUser();
  const { props } = useCodePlug('sidebar', permissionQuery);

  // collect items and merge options with the same id
  const items = props
    // eslint-disable-next-line react/prop-types
    .reduce((acc, item) => {
      // search the same id in order to merge submenus with the same parent
      // based on the id
      const found = acc.find(current => current.id === item.id);
      if (found == null) {
        // just add to the end if not exists
        return [...acc, item];
      } else {
        return acc
          .map(current => {
            if (current.id !== item.id) {
              return current;
            } else {
              let options = current.options || [];
              options = options.concat(item.options)
              // merge the current item with the new suboptions, takes care of the sort order
              // get the first order or whoever has defined it
              return {
                ...current,
                order: current.order != null ? current.order : item.order,
                options
              };
            }
          }
          );
      }
    }, []);

  return (
    <Sidebar
      className="mc-sidebar"
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', 'position': 'fixed' }}
      width={260}
      collapsible
    >
      <Sidenav
        expanded={true}
        defaultOpenKeys={['3']}
        appearance="subtle"
      >
        <Sidenav.Header>
          <div className="mc-sidebar-header">
            <LogoFull width={200} style={{ marginTop: '-20px' }}/>
          </div>
        </Sidenav.Header>
        <Sidenav.Body className="mc-sidebar-body">
          <Nav>
            {items
              .sort((a, b) => {
                if (a.order == null && b.order == null) {
                  return 0;
                } else if (b.order == null) {
                  return -1;
                } else if (a.order == null) {
                  return 1;
                } else if (a.order < b.order) {
                  return -1;
                } else if (a.order > b.order) {
                  return 1;
                }
                return 0;
              })
              .map(({ label, onClick = () => {}, url, icon, options, id }) => {
                if (_.isArray(options)) {
                  return (
                    <Dropdown
                      eventKey={id}
                      trigger="hover"
                      title={label}
                      key={id}
                      icon={icon != null ? <Icon icon={icon} /> : null}
                      placement="rightStart"
                    >
                      {options.map(option => (
                        <NavLink
                          eventKey="3-1"
                          to={option.url}
                          key={option.id}
                        >{option.label}</NavLink>
                      ))}
                    </Dropdown>
                  );
                } else {
                  return (
                    <Nav.Item
                      eventKey="1"
                      key={id}
                      onSelect={onClick}
                      href={url}
                      renderItem={() => (
                        <Link className="rs-nav-item-content" to={url}>{icon != null ? <Icon icon={icon} /> : null}{label}</Link>
                      )}
                    >
                      {label}
                    </Nav.Item>
                  );
                }
              })
            }
          </Nav>

        </Sidenav.Body>
        <div className="bottom">
          <div className="name">
            <strong>RedBot</strong> <span className="version">v{version}</span>
            &nbsp;&nbsp;
            <a href="https://github.com/guidone/node-red-contrib-chatbot" target="_blank" rel="noreferrer"><Icon icon="github"/></a>
            &nbsp;
            <a href="http://red-bot.io/" target="_blank" rel="noreferrer"><Icon icon="globe2"/></a>
          </div>
          <div className="tag-line">
            Coded with ❤️ in 🇮🇹
          </div>
        </div>
      </Sidenav>
    </Sidebar>
  );
};

export default AppSidebar;