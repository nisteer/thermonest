import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Auth0Provider
    domain="nisteer.eu.auth0.com"
    clientId="1IiKDUCbyRWgB7IiUYBEYqluJssyX6Fs"
    authorizationParams={{
      redirect_uri: window.location.origin
    }}
  >
    <App />
  </Auth0Provider>,
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();


