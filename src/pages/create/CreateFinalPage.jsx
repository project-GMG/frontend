import React from 'react';
import './CreateFinalPage.css';
import BackButton from '../components/common/BackButton';
import NextButton from '../components/common/NextButton';

const DUMMY_LINK = 'https://meet.jbnu.ac.kr/fhcfspup';

export default function CreateFinalPage() {
  const handleBack = () => {
    window.history.back();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(DUMMY_LINK);
      alert('링크가 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      alert('복사에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: '모임 링크',
          text: '모임에 바로 참여할 수 있는 링크입니다.',
          url: DUMMY_LINK,
        });
      } else {
        await navigator.clipboard.writeText(DUMMY_LINK);
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
            <span className="create-final-link-text">{DUMMY_LINK}</span>
            <button
              type="button"
              className="create-final-copy-button"
              onClick={handleCopyLink}
            >
              <span className="create-final-copy-icon" />
              <span className="create-final-copy-label">복사</span>
            </button>
          </div>

          <div className="create-final-image-wrapper">
            {/* 이후 실제 이미지로 교체 예정 */}
            <div className="create-final-image-placeholder" />
          </div>
        </main>

        <footer className="create-final-footer">
          <NextButton disabled={false} onClick={handleShare}>
            공유하기
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
