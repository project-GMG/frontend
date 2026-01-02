import React from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinFinalPage.css';
import NextButton from '../components/common/NextButton';

import EndIcon from '../../assets/icons/End_ico.png';

export default function JoinFinalPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/main');
  };

  return (
    <div className="join-final-page">
      <div className="join-final-container">
        <main className="join-final-content">
          <h1 className="join-final-title">정보가 반영됐어요</h1>

          <p className="join-final-subtitle">
            이제 싫은 시간과 장소는 빼고,
            <br />
            불편한 없는 만남을 만들어 드릴게요!
          </p>

          {/* 중앙 일러스트 */}
          <div className="join-final-illustration">
            <img src={EndIcon} alt="" className="join-final-image" aria-hidden="true" />
          </div>
        </main>

        <footer className="join-final-footer">
          <NextButton disabled={false} onClick={handleGoBack}>
            돌아가기
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
