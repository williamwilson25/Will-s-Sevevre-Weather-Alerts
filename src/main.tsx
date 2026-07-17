import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
    // notifications will fall back to the plain Notification() constructor
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
