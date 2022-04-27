import React, { useState } from 'react';
import { CheckPicker, Button, IconButton, Icon } from 'rsuite';
import _ from 'lodash';
import PropTypes from 'prop-types';

import { useCodePlug } from 'code-plug';
import confirm from '../confirm';

import './style.scss';

const Permission = ({ permission, onRemove = () => {} }) => {
  return (
    <div className="permission">
      <div className="meta">
        <strong>{permission.name}</strong>
        <span className="description">{permission.description}</span>
      </div>
      <div className="button">
        <IconButton
          size="xs"
          appearance="primary"
          icon={<Icon icon="trash"/>}
          onClick={() => onRemove(permission)}
        />
      </div>
    </div>
  );
}
Permission.propTypes = {
  permission: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
  }),
  onRemove: PropTypes.func
};

const Permissions = ({ value, onChange = () => {} }) => {
  const [permission, setPermission] = useState();
  const { props: permissions } = useCodePlug('permissions');

  const current = _.isString(value) && !_.isEmpty(value) ? value.split(',') : [];
  const hasAll = current.includes('*');
  const data = permissions
    .filter(item => !current.includes(item.permission))
    .map(item => ({
      value: item.permission,
      label: item.name,
      ...item
  }));

  const permissionsGroups = _(current)
    .map(permission => permissions.find(item => item.permission === permission))
    .compact()
    .sortBy(permission => permission.name)
    .groupBy(permission => permission.group)
    .value();

  return (
    <div className="ui-permissions">
      <div className="selector">
        <div className="picker">
          <CheckPicker
            value={permission}
            size="medium  "
            placement="auto"
            placeholder="Select permission..."
            groupBy="group"
            disabled={_.isEmpty(data) || hasAll}
            data={data}
            onSelect={value => setPermission(value)}
            preventOverflow={true}
            renderMenuItem={(label, item) => (
              <div className="check-picker-item-permission">
                <span className="name">{label}</span>
                &nbsp;
                <span className="description">{item.description}</span>
              </div>
            )}
            block
            />
        </div>
        <div className="button">
          <Button
            disabled={permission == null}
            appearance="primary"
            onClick={async () => {
              const includeAll = permission.includes('*');
              if (includeAll) {
                // include all is selected, then ask and remove all other permissions
                // non necessary
                const msg = (
                  <div>Add <b>all</b> permission and remove all other permissions?'</div>
                );
                if (await confirm(msg, { okLabel: 'Ok, add "*" permission'})) {
                  onChange('*');
                  setPermission(null);
                }
              } else {
                // array of new permissions
                let currentPermissions = _.isString(value) && !_.isEmpty(value) ? value.split(',') : [];
                // scan all permission to add
                let dependencies = [];
                permission.forEach(toAdd => {
                  // find the permission definition and check if there are related permissions
                  const definition = permissions.find(item => item.permission === toAdd);
                  if (definition.dependsOn != null) {
                    dependencies = _.uniq([...dependencies, ...definition.dependsOn]);
                  }
                });
                // finally merge all
                onChange(_.uniq([...currentPermissions, ...permission, ...dependencies]).join(','));
                setPermission(null);
              }
            }}
          >
            Add permission{!_.isEmpty(permission) && permission.length > 1 ? 's' : ''}
          </Button>
        </div>
      </div>
      <div className="permissions">
        {Object.keys(permissionsGroups).sort().map(group => (
          <div key={group} className="group">
            <div className="group-name">{group}</div>
            {permissionsGroups[group]
              .sort(permission => permission.name)
              .map(permission => (
                <Permission
                  key={permission.name}
                  permission={permission}
                  onRemove={item => {
                    const newValue = value.split(',').filter(permission => permission !== item.permission);
                    onChange(newValue.join(','));
                  }}
                />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
Permissions.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
};

export default Permissions;