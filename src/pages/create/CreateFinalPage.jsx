// gmg-front/src/pages/create/CreateFinalPage.jsx

import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CreateFinalPage.css';
import BackButton from '../components/common/BackButton';

import EndIcon from '../../assets/icons/End_ico.png';
import CopyIcon from '../../assets/icons/copy.png';
import ShareIcon from '../../assets/icons/share.png';
import logoIcon from '../../assets/icons/logo.png';

import { trackEvent, trackEventOnce } from '../../lib/analytics';

const SHARE_BASE_URL = (import.meta.env.VITE_SHARE_BASE_URL || '').trim() || window.location.origin;

function buildMainLink(hash) {
  if (!hash) return '';
  const base = SHARE_BASE_URL.replace(/\/+$/, '');
  const raw = String(hash).trim();
  const onlyHash = raw.replace(/^https?:\/\/[^/]+\/?/, '').replace(/^\/+/, '');
  return `${base}/main?code=${encodeURIComponent(onlyHash)}`;
}

export default function CreateFinalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const createdEvent = state.createdEvent || {};

  const hashUrl = createdEvent.hashUrl || '';

  const mainLink = useMemo(() => buildMainLink(hashUrl), [hashUrl]);

  useEffect(() => {
    trackEventOnce('create_flow_complete', 'create_flow_complete', {
      has_link: Boolean(mainLink),
    });
  }, [mainLink]);

  const handleBack = () => window.history.back();

  const handleCopyLink = async () => {
    if (!mainLink) return;
    trackEvent('create_link_copy', { has_link: true });
    await navigator.clipboard.writeText(mainLink);
    alert('링크가 복사되었습니다.');
  };

  const handleShare = async () => {
    if (!mainLink) return;

    trackEvent('create_link_share', {
      share_api_supported: Boolean(navigator.share),
      has_link: true,
    });

    if (navigator.share) {
      await navigator.share({
        title: '모임 링크',
        text: '모임에 바로 참여할 수 있는 링크입니다.',
        url: mainLink,
      });
    } else {
      await navigator.clipboard.writeText(mainLink);
      alert('링크가 복사되었습니다.');
    }
  };

  const handleRegister = () => {
    trackEvent('create_register_click', { has_link: Boolean(mainLink) });
    navigate(
      `/main?code=${encodeURIComponent(
        String(hashUrl)
          .replace(/^https?:\/\/[^/]+\/?/, '')
          .replace(/^\/+/, ''),
      )}`,
      { replace: true },
    );
  };

  return (
    <div className="create-final-page">
      <div className="create-final-desktop-shell">
        <aside className="create-final-brand-panel" aria-hidden="true">
          <img src={logoIcon} alt="" className="create-final-brand-logo" />
          <div className="create-final-brand-copy">
            <p className="create-final-brand-text">
              싫어하는 것을
              <br />
              존중해주니까
            </p>
            <div className="create-final-brand-divider" />
            <p className="create-final-brand-text">
              이제는 <span className="create-final-brand-text-strong">가면가</span>
            </p>
          </div>
        </aside>
        <div className="create-final-container">
          <header className="create-final-nav">
            <div className="create-final-back">
              <BackButton onClick={handleBack} />
            </div>
          </header>

          <main className="create-final-content">
            <h1 className="create-final-title">모임이 생성됐어요</h1>
            <p className="create-final-subtitle">
              친구들에게 링크를 공유하면
              <br />
              모임에 바로 참여할 수 있어요!
            </p>

            <div className="create-final-link-box">
              <span className="create-final-link-text">
                {mainLink || '링크를 생성할 수 없습니다.'}
              </span>

              <button
                type="button"
                className="create-final-copy-button"
                onClick={handleCopyLink}
                disabled={!mainLink}
              >
                <img src={CopyIcon} alt="" className="create-final-copy-icon" />
                <span className="create-final-copy-label">복사</span>
              </button>
            </div>

            <img src={EndIcon} alt="" className="create-final-image" />
          </main>

          <footer className="create-final-footer">
            <button
              type="button"
              className="create-final-share-button"
              onClick={handleShare}
              disabled={!mainLink}
              aria-label="공유하기"
            >
              <img src={ShareIcon} alt="" className="create-final-share-icon" />
              <span className="create-final-share-text">공유하기</span>
            </button>

            <button
              type="button"
              className="create-final-register-button"
              onClick={handleRegister}
              disabled={!mainLink}
            >
              등록하기
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
