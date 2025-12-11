import React, { useState } from 'react';
import './CreateLocatePage.css';
import BackButton from '../components/common/BackButton';
import TopBar from '../components/common/TopBar';
import NextButton from '../components/common/NextButton';
import { useNavigate } from 'react-router-dom'; 

const DUMMY_RESULTS = [
  { id: 1, name: '롯데리아 전북대점', distance: '120m' },
  { id: 2, name: '롯데리아 전주 송천점', distance: '150m' },
  { id: 3, name: '롯데리아 전주 호성점', distance: '300m' },
  { id: 4, name: '롯데리아 전주 중산점', distance: '400m' },
];

export default function CreateLocatePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const navigate = useNavigate(); // 추가

  const handleBack = () => {
    window.history.back();
  };

  const handleNext = () => {
    console.log('선택된 위치 검색어:', searchQuery);
    
    navigate('/create/info');
  };

  const hasSelection = true; // 추후 실제 위치 선택 여부로 교체

  const openSearch = () => {
    setIsSearchActive(true);
    setSearchQuery('롯데리아'); // 더미 데이터
  };

  const closeSearch = () => {
    setIsSearchActive(false);
    setSearchQuery('');
  };

  return (
    <div className="create-locate-page">
      <div className="create-locate-container">
        <TopBar currentStep={3} totalSteps={4} />

        <header className="create-locate-header">
          <BackButton onClick={handleBack} />
        </header>

        <main className="create-locate-content">
          <h1 className="create-locate-title">어디쯤에서 만날까요?</h1>
          <p className="create-locate-subtitle">
            지도를 움직여 만날 위치를 대략 정해주세요
          </p>

          <section className="create-locate-map-section">
            <div className="create-locate-map-wrapper">
              {/* 1단계: 클릭 전 검색 바 (아이콘 + 더미 주소 텍스트) */}
              {!isSearchActive && (
                <button
                  type="button"
                  className="create-locate-search-collapsed"
                  onClick={openSearch}
                >
                  <span className="create-locate-search-icon-large" />
                  <span className="create-locate-search-collapsed-text">
                    전주시 덕진구 송천동
                  </span>
                </button>
              )}

              {/* 2단계: 클릭 후 검색 패널 (입력 + 결과 리스트) */}
              {isSearchActive && (
                <div className="create-locate-search-panel">
                  <div className="create-locate-search-panel-header">
                    <button
                      type="button"
                      className="create-locate-search-back-button"
                      onClick={closeSearch}
                    >
                      <span className="create-locate-search-back-icon" />
                    </button>

                    <input
                      type="text"
                      className="create-locate-search-panel-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <button
                      type="button"
                      className="create-locate-search-close-button"
                      onClick={closeSearch}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="create-locate-search-panel-divider" />

                  <ul className="create-locate-search-results">
                    {DUMMY_RESULTS.map((item) => (
                      <li
                        key={item.id}
                        className="create-locate-search-result-item"
                      >
                        <div className="create-locate-search-result-icon-wrap">
                          <span className="create-locate-search-result-pin" />
                          <span className="create-locate-search-result-distance">
                            {item.distance}
                          </span>
                        </div>
                        <span className="create-locate-search-result-name">
                          {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 지도 자리 (실제 지도 교체 예정) */}
              <div className="create-locate-map-placeholder">
                <div className="create-locate-map-circle" />
                <div className="create-locate-map-pin" />
              </div>

              {/* 현재 위치 버튼 자리 */}
              <button
                type="button"
                className="create-locate-current-location-button"
              >
                <span className="create-locate-current-location-icon" />
              </button>
            </div>
          </section>
        </main>

        <footer className="create-locate-footer">
          <NextButton disabled={!hasSelection} onClick={handleNext}>
            다음
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
