import React from 'react';
import { Form } from 'rsuite';

import './form.scss';

const WidgetForm = ({ children, ...props }) => <Form {...props} className="ui-widget-form">{children}</Form>
const Content = ({ children }) => <div className="ui-widget-form-content">{children}</div>
const Footer = ({ children }) => <div style={{ flex: '0 0 auto', paddingTop: '10px', paddingBottom: '10px' }}>{children}</div>;

export { WidgetForm, Content, Footer };