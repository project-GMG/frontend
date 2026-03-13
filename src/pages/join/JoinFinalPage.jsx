// gmg-front/src/pages/join/JoinFinalPage.jsx

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './JoinFinalPage.css';
import NextButton from '../components/common/NextButton';

import EndIcon from '../../assets/icons/End_ico.png';
import logoIcon from '../../assets/icons/logo.png';

import { trackEvent, trackEventOnce } from '../../lib/analytics';

export default function JoinFinalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hashUrl = (searchParams.get('code') || '').trim();

  useEffect(() => {
    trackEventOnce('join_flow_complete', 'join_flow_complete', {
      has_code: Boolean(hashUrl),
    });
  }, [hashUrl]);

  const handleGoBack = () => {
    trackEvent('join_go_back_click', { has_code: Boolean(hashUrl) });
    if (hashUrl) navigate(`/main?code=${encodeURIComponent(hashUrl)}`);
    else navigate('/main');
  };

  return (
    <div className="join-final-page">
      <div className="join-final-desktop-shell">
        <aside className="join-final-brand-panel" aria-hidden="true">
          <img src={logoIcon} alt="" className="join-final-brand-logo" />
          <div className="join-final-brand-copy">
            <p className="join-final-brand-text">
              싫어하는 것을
              <br />
              존중해주니까
            </p>
            <div className="join-final-brand-divider" />
            <p className="join-final-brand-text">
              이제는 <span className="join-final-brand-text-strong">가면가</span>
            </p>
          </div>
        </aside>
        <div className="join-final-container">
          <main className="join-final-content">
            <h1 className="join-final-title">정보가 반영됐어요</h1>

            <p className="join-final-subtitle">
              이제 싫은 시간과 장소는 빼고,
              <br />
              불편한 없는 만남을 만들어 드릴게요!
            </p>

            <div className="join-final-illustration" aria-hidden="true">
              <img src={EndIcon} alt="" className="join-final-image" />
            </div>
          </main>

          <footer className="join-final-footer">
            <NextButton disabled={false} onClick={handleGoBack}>
              돌아가기
            </NextButton>
          </footer>
        </div>
      </div>
    </div>
  );
}
