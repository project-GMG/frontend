// src/components/common/TopBar.jsx
import React from 'react';
import './TopBar.css';
import BackButton from './BackButton';

export default function TopBar({
  currentStep = 1,
  totalSteps = 2,
  showProgress = true,
  onBack,
}) {
  const ratio = Math.max(0, Math.min(currentStep / totalSteps, 1)) * 100;

  return (
    <header className="topbar">
      <BackButton onClick={onBack} />

      {showProgress && (
        <div className="topbar-progress-wrapper">
          <div className="topbar-progress-track">
            <div
              className="topbar-progress-bar"
              style={{ width: `${ratio}%` }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
