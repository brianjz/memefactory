import React from 'react';
import ReactDOM from 'react-dom/client';
import router from './router';
import { RouterProvider } from 'react-router';

const version = process.env.npm_package_version; // Only works if defined in build/env
// Or more reliably in CRA:
const appVersion = require('../package.json').version;

document.title = process.env.NODE_ENV === 'development' 
  ? `DEV - Meme Factory v${appVersion}` 
  : `Meme Factory v${appVersion}`;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <RouterProvider router={router} fallbackElement={<p>Loading Content...</p>} />
  // </React.StrictMode>
);
