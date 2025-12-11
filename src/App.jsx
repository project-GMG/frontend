// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import CreatePlacePage from './pages/create/CreatePlacePage';
import CreateDatePage from './pages/create/CreateDatePage';
import CreateLocatePage from './pages/create/CreateLocatePage';
import CreateInfoPage from './pages/create/CreateInfoPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/create/place" replace />} />

      <Route path="/create/place" element={<CreatePlacePage />} />
      <Route path="/create/date" element={<CreateDatePage />} />
      <Route path="/create/locate" element={<CreateLocatePage />} />
      <Route path="/create/info" element={<CreateInfoPage />} />

      <Route path="*" element={<Navigate to="/create/place" replace />} />
    </Routes>
  );
}

export default App;
