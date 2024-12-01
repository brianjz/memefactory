import React from 'react';
import ReactDOM from 'react-dom/client';
// import App from './App';
import router from './router';
import { RouterProvider } from 'react-router';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <RouterProvider router={router} fallbackElement={<p>Loading Content...</p>} />
  // </React.StrictMode>
);
