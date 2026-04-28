import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { WalletSessionProvider } from '../wallet/useWalletSession.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletSessionProvider>
      <App />
    </WalletSessionProvider>
  </React.StrictMode>,
);
