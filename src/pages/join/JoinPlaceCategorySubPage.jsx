// src/pages/join/JoinPlaceCategorySubPage.jsx
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './JoinPlaceCategorySubPage.css';

import BackButton from '../components/common/BackButton';
import NextButton from '../components/common/NextButton';

import ChickenImg from '../../assets/icons/chicken.png';
import SearchIcon from '../../assets/icons/search.png';

const LABEL_MAP = {
  restaurant: {
    korean: '한식',
    chinese: '중식',
    japanese: '일식',
    western: '양식',
    'late-night': '분식·야식',
  },
  pub: {
    beer: '소주·맥주',
    izakaya: '이자카야',
    makgeolli: '막걸리',
    cocktail: '펍·칵테일',
    wine: '와인',
  },
  study: {
    library: '도서관',
    'study-cafe': '스터디카페',
    'study-room': '스터디룸',
    'reading-room': '독서실',
    etc: '기타',
  },
};

function makeDummyPlaces() {
  return Array.from({ length: 12 }, (_, i) => ({
    id: `place-${i + 1}`,
    name: '충만치킨',
    imageUrl: ChickenImg,
  }));
}

export default function JoinPlaceCategorySubPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { groupId, itemId } = location.state ?? {};
  const title = useMemo(() => {
    if (!groupId || !itemId) return '카테고리';
    return LABEL_MAP[groupId]?.[itemId] ?? '카테고리';
  }, [groupId, itemId]);

  const allPlaces = useMemo(() => makeDummyPlaces(), []);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const filteredPlaces = useMemo(() => {
    const q = query.trim();
    if (!q) return allPlaces;
    return allPlaces.filter((p) => p.name.includes(q));
  }, [allPlaces, query]);

  const allVisibleSelected =
    filteredPlaces.length > 0 && filteredPlaces.every((p) => selectedIds.has(p.id));

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const visibleIds = filteredPlaces.map((p) => p.id);
      const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => next.has(id));

      if (isAllSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBack = () => navigate(-1);

  const handleDone = () => {
    console.log('선택된 place ids:', Array.from(selectedIds));
    navigate(-1);
  };

  return (
    <div className="jpcs-page">
      <div className="jpcs-container">
        <header className="jpcs-header">
          <BackButton onClick={handleBack} />
          <h1 className="jpcs-header-title">{title}</h1>
          <div className="jpcs-header-spacer" />
        </header>

        <main className="jpcs-content">
          <div className="jpcs-search">
            <img src={SearchIcon} alt="검색" className="jpcs-search-icon" />
            <input
              className="jpcs-search-input"
              placeholder="검색어를 입력해주세요"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <section className="jpcs-grid">
            {/* ✅ 전체 선택 타일 */}
            <button
              type="button"
              className={
                'jpcs-tile jpcs-tile--all' + (allVisibleSelected ? ' jpcs-tile--all-selected' : '')
              }
              onClick={toggleAll}
              aria-label="전체 선택"
            >
              <span className="jpcs-all-text">전체 선택</span>

              {/* 전체 선택이 켜져있을 때도 동일한 오버레이/ X 표시 */}
              {allVisibleSelected && (
                <div className="jpcs-overlay">
                  <span className="jpcs-x">×</span>
                </div>
              )}
            </button>

            {filteredPlaces.map((p) => {
              const selected = selectedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  className="jpcs-tile jpcs-tile--place"
                  onClick={() => toggleOne(p.id)}
                >
                  <img src={p.imageUrl} alt={p.name} className="jpcs-thumb" />

                  {selected && (
                    <div className="jpcs-overlay">
                      <span className="jpcs-x">×</span>
                    </div>
                  )}

                  <div className="jpcs-label">
                    <p className="jpcs-label-text">{p.name}</p>
                  </div>
                </button>
              );
            })}
          </section>
        </main>

        <footer className="jpcs-footer">
          <NextButton disabled={false} onClick={handleDone}>
            완료
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
