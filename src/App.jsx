// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import CreatePlacePage from './pages/create/CreatePlacePage';
import CreateDatePage from './pages/create/CreateDatePage';
import CreateLocatePage from './pages/create/CreateLocatePage';
import CreateInfoPage from './pages/create/CreateInfoPage';
import CreateFinalPage from './pages/create/CreateFinalPage';

import MainPage from './pages/main/MainPage';
import JoinModalPage from './pages/join/JoinModalPage';
import JoinTimePage from './pages/join/JoinTimePage';
import JoinPlaceCategoryPage from './pages/join/JoinPlaceCategoryPage';
import JoinPlaceCategorySubPage from './pages/join/JoinPlaceCategorySubPage';
import JoinFinalPage from './pages/join/JoinFinalPage';

import OnboardingPage from './pages/onboarding/OnboardingPage';

function DebugLocation() {
  const loc = useLocation();
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[ROUTE]', loc.pathname + loc.search);
    }
  }, [loc.pathname, loc.search]);
  return null;
}

function AnalyticsPageViews() {
  const loc = useLocation();
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  useEffect(() => {
    if (!measurementId) return;
    if (typeof window === 'undefined') return;
    if (typeof window.gtag !== 'function') return;

    window.gtag('config', measurementId, {
      page_path: loc.pathname + loc.search,
    });
  }, [measurementId, loc.pathname, loc.search]);

  return null;
}

function App() {
  return (
    <>
      <DebugLocation />
      <AnalyticsPageViews />

      <Routes>
        {/* <Route path="/" element={<Navigate to="/onboarding" replace />} /> */}
        <Route path="/" element={<OnboardingPage />} />

        <Route path="/join" element={<JoinModalPage />} />
        <Route path="/join/time" element={<JoinTimePage />} />
        <Route path="/join/Category" element={<JoinPlaceCategoryPage />} />
        <Route path="/join/category/sub" element={<JoinPlaceCategorySubPage />} />
        <Route path="/join/final" element={<JoinFinalPage />} />

        <Route path="/create/place" element={<CreatePlacePage />} />
        <Route path="/create/date" element={<CreateDatePage />} />
        <Route path="/create/locate" element={<CreateLocatePage />} />
        <Route path="/create/info" element={<CreateInfoPage />} />
        <Route path="/create/final" element={<CreateFinalPage />} />

        <Route path="/main" element={<MainPage />} />
        <Route path="*" element={<Navigate to="/create/place" replace />} />

        <Route path="/onboarding" element={<OnboardingPage />} />
      </Routes>
    </>
  );
}

export default App;
