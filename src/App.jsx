// src/App.jsx
import { Routes, Route } from 'react-router-dom';

import OnboardingPage from './pages/onboarding/OnboardingPage';
import CreatePlacePage from './pages/create/CreatePlacePage';
import CreateDatePage from './pages/create/CreateDatePage';
import CreateLocatePage from './pages/create/CreateLocatePage';
import CreateInfoPage from './pages/create/CreateInfoPage';

import MainPage from './pages/main/MainPage';

import JoinModalPage from './pages/join/JoinModalPage';
import JoinTimePage from './pages/join/JoinTimePage';
import JoinPlaceCategoryPage from './pages/join/JoinPlaceCategoryPage';
import JoinPlaceCategorySubPage from './pages/join/JoinPlaceCategorySubPage';
import JoinPlaceCategorySubDonePage from './pages/join/JoinPlaceCategorySubDonePage';

import AdminTimePage from './pages/admin/AdminTimePage';
import AdminPlacePage from './pages/admin/AdminPlacePage';

import ResultPage from './pages/result/ResultPage';

function App() {
  return (
    <Routes>
      {/* 온보딩 / 메인 */}
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/main" element={<MainPage />} />

      {/* 생성 플로우 */}
      <Route path="/create/place" element={<CreatePlacePage />} />
      <Route path="/create/date" element={<CreateDatePage />} />
      <Route path="/create/locate" element={<CreateLocatePage />} />
      <Route path="/create/info" element={<CreateInfoPage />} />

      {/* 참여 플로우 */}
      <Route path="/join/modal" element={<JoinModalPage />} />
      <Route path="/join/time" element={<JoinTimePage />} />
      <Route path="/join/place-category" element={<JoinPlaceCategoryPage />} />
      <Route path="/join/place-category/sub" element={<JoinPlaceCategorySubPage />} />
      <Route path="/join/place-category/sub/done" element={<JoinPlaceCategorySubDonePage />} />

      {/* 관리자 */}
      <Route path="/admin/time" element={<AdminTimePage />} />
      <Route path="/admin/place" element={<AdminPlacePage />} />

      {/* 결과 */}
      <Route path="/result" element={<ResultPage />} />
    </Routes>
  );
}

export default App;
