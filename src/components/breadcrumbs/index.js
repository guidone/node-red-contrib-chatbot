import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Breadcrumb } from 'rsuite';
import { Link } from 'react-router-dom';

import './breadcrumbs.scss';
import { withCodePlug } from 'code-plug';

const NavLink = props => <Breadcrumb.Item componentClass={Link} {...props} />;
const findPage = (pages = [], id) => pages.find(page => page.props != null && page.props.id === id)

const Breadcrumbs = ({ pages = [], codePlug }) => {
  const installedPages = codePlug.getItems('pages');

  const breadcrumbs = pages.map(page => {
    const foundPage = _.isString(page) ? findPage(installedPages, page) : null;
    if (foundPage != null) {
      return <NavLink key={page} to={foundPage.props.url}>{foundPage.props.title}</NavLink>
    } else if (_.isString(page)) {
      return <Breadcrumb.Item key={page} active>{page}</Breadcrumb.Item>
    } else if (_.isObject(page) && page.title != null && page.url != null) {
      return <NavLink to={page.url} key={page.title}>{page.title}</NavLink>
    } else if (_.isObject(page) && page.title != null && page.onClick != null) {
      return (
        <a href="#" key={page.title} onClick={e => {
          e.preventDefault();
          page.onClick();
        }}>{page.title}</a>
      );
    }
  });

  return (
    <Breadcrumb className="ui-breadcrumbs">
      <NavLink to="/">Mission Control</NavLink>
      {breadcrumbs}
    </Breadcrumb>
  );
};
Breadcrumbs.propTypes = {
  pages: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string, // the title of the page or the id of the page
    PropTypes.shape({
      title: PropTypes.string,
      url: PropTypes.string,
      onClick: PropTypes.func
    })
  ]))
};

export default withCodePlug(Breadcrumbs);
