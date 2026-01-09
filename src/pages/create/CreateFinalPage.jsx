// gmg-front/src/pages/create/CreateFinalPage.jsx

import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import './CreateFinalPage.css';
import BackButton from '../components/common/BackButton';
import NextButton from '../components/common/NextButton';
import EndIcon from '../../assets/icons/End_ico.png';
import CopyIcon from '../../assets/icons/copy.png';

// 공유 링크 베이스(배포/로컬 모두 대응)
// 1) VITE_SHARE_BASE_URL 있으면 그걸 사용 (예: https://meet.jbnu.ac.kr)
// 2) 없으면 현재 접속 origin 사용 (예: http://localhost:5173)
const SHARE_BASE_URL =
  (import.meta.env.VITE_SHARE_BASE_URL || '').trim() || window.location.origin;

// hash -> /join?code=hash 형태로 최종 링크 만들기
function buildJoinLink(hash) {
  if (!hash) return '';
  const base = SHARE_BASE_URL.replace(/\/+$/, '');

  // 혹시 백엔드가 hashUrl을 완전한 URL로 주는 경우에도
  // 요구사항이 "join?code=..." 고정이므로 해시만 뽑아서 다시 조합
  const raw = String(hash).trim();
  const onlyHash = raw.replace(/^https?:\/\/[^/]+\/?/, '').replace(/^\/+/, '');

  return `${base}/join?code=${encodeURIComponent(onlyHash)}`;
}

export default function CreateFinalPage() {
  const location = useLocation();
  const state = location.state || {};
  const createdEvent = state.createdEvent || {};

  const hashUrl = createdEvent.hashUrl || '';

  const shareLink = useMemo(() => {
    return buildJoinLink(hashUrl);
  }, [hashUrl]);

  const handleBack = () => window.history.back();

  const handleCopyLink = async () => {
    if (!shareLink) {
      alert('공유할 링크가 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      alert('링크가 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      alert('복사에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const handleShare = async () => {
    if (!shareLink) {
      alert('공유할 링크가 없습니다.');
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: '모임 링크',
          text: '모임에 바로 참여할 수 있는 링크입니다.',
          url: shareLink,
        });
      } else {
        await navigator.clipboard.writeText(shareLink);
        alert('링크가 복사되었습니다. 원하는 곳에 붙여넣기 해서 공유해 주세요.');
      }
    } catch (err) {
      console.error('공유 실패 또는 취소:', err);
    }
  };

  return (
    <div className="create-final-page">
      <div className="create-final-container">
        <header className="create-final-header">
          <BackButton onClick={handleBack} />
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
              {shareLink || '링크를 생성할 수 없습니다.'}
            </span>

            <button
              type="button"
              className="create-final-copy-button"
              onClick={handleCopyLink}
              disabled={!shareLink}
            >
              <img src={CopyIcon} alt="복사 아이콘" className="create-final-copy-icon" />
              <span className="create-final-copy-label">복사</span>
            </button>
          </div>

          <img src={EndIcon} alt="모임 생성 완료 아이콘" className="create-final-image" />
          <div className="create-final-image-placeholder" />
        </main>

        <footer className="create-final-footer">
          <NextButton disabled={!shareLink} onClick={handleShare}>
            공유하기
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
