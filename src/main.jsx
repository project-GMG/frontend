// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import './styles/global.css';

import { persistUtmFromUrl } from './lib/analytics';

// 최초 유입 UTM을 저장해두면, 이후 전환 이벤트에도 같이 붙여서 분석하기 쉬워집니다.
persistUtmFromUrl(window.location.href);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
