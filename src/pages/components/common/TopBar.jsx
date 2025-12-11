import React from 'react';
import './TopBar.css';

/**
 * props:
 * - currentStep: 현재 단계 (1부터 시작)
 * - totalSteps: 전체 단계 수 (기본값 4)
 * - progress: 0~1 사이의 진행률 (선택사항, 제공 시 currentStep 대신 사용)
 */
export default function TopBar({ currentStep = 1, totalSteps = 4, progress }) {
  let ratio = 0;

  if (typeof progress === 'number') {
    ratio = Math.max(0, Math.min(1, progress));
  } else {
    const safeTotal = totalSteps > 0 ? totalSteps : 1;
    const safeCurrent = Math.min(Math.max(currentStep, 0), safeTotal);
    ratio = safeCurrent / safeTotal;
  }

  return (
    <div className="topbar">
      <div className="topbar-track">
        <div
          className="topbar-fill"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
