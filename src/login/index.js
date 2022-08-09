import React, { useState, Fragment } from 'react';

import {
  Content,
  Container,
  FlexboxGrid,
  Form,
  Button,
  Panel,
  ButtonToolbar,
  FormGroup,
  FormControl,
  InputGroup,
  Icon
} from 'rsuite';

import { LogoFull } from '../components/logo';

const LoginPanel = () => {
  const [errorMessage, setErrorMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [formValue, setFormValue] = useState({
    username: '',
    password: ''
  })

  const root = window.bootstrap != null
    && window.bootstrap.settings != null
    && window.bootstrap.settings.root != null ? window.bootstrap.settings.root : '/mc';

  // it's pointless to useCallback
  const loginButton = async () => {
    setLoading(true);
    const response = await fetch(`${root}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      body: `username=${encodeURIComponent(formValue.username)}&password=${encodeURIComponent(formValue.password)}`
    });

    if (response.redirected) {
      if (response.url.includes('/login')) {
        setErrorMessage('Wrong username or password');
        setLoading(false);
      } else {
        window.location = response.url;
      }
    } else {
      setLoading(false);
    }
  }
  const header = (
    <Fragment>
      <h3>Mission Control</h3>
      <div className="login-hint">User your credentials to log in the chatbot admin panel</div>
      {bootstrap?.settings?.isDefaultUser && (
        <div className="info-message">
          Mission Control default user is <em>&quot;admin&quot;</em> with password <em>&quot;admin&quot;</em>.
          Please change password after login.
        </div>
      )}
    </Fragment>
  );

  return (
    <div className='container-login'>
      <Container>
        <Content>
          <FlexboxGrid justify="center">
            <FlexboxGrid.Item colspan={8} className="login-panel">
              <div className="logo"><LogoFull /></div>
              <Panel header={header} bordered>
                <Form fluid formValue={formValue} onChange={formValue => setFormValue(formValue)}>
                  <FormGroup>
                    <InputGroup inside>
                      <InputGroup.Addon>
                        <Icon icon="avatar" size="lg" />
                      </InputGroup.Addon>
                      <FormControl
                        name="username"
                        onChange={() => setErrorMessage(null)}
                        size="lg"
                        placeholder="Username or email"
                      />
                    </InputGroup>
                  </FormGroup>
                  <FormGroup>
                    <InputGroup inside>
                      <InputGroup.Addon>
                        <Icon icon="unlock-alt" size="lg" />
                      </InputGroup.Addon>
                      <FormControl
                        name="password"
                        type="password"
                        autoComplete="off"
                        placeholder="Password"
                        size="lg"
                        onChange={() => setErrorMessage(null)}
                        onKeyUp={(e) => {
                          // auto login
                          if (e.keyCode === 13) {
                            loginButton();
                          }
                        }}
                      />
                    </InputGroup>
                  </FormGroup>
                  {errorMessage && (
                    <div className="error-message">
                      {errorMessage}
                    </div>
                  )}
                  <FormGroup className="last">
                    <ButtonToolbar>
                      <Button
                        className="login-button"
                        appearance="primary"
                        disabled={loading}
                        onClick={loginButton}
                      >Login</Button>
                    </ButtonToolbar>
                  </FormGroup>
                </Form>
              </Panel>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Content>
      </Container>
      <div className="version">v{bootstrap.settings.version}</div>
    </div>
  );
};

export default LoginPanel;
