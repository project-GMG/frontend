// src/pages/join/JoinPlaceCategorySubPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import './JoinPlaceCategorySubPage.css';

import BackButton from '../components/common/BackButton';
import NextButton from '../components/common/NextButton';

import ChickenImg from '../../assets/icons/chicken.png';
import SearchIcon from '../../assets/icons/search.png';

function loadDisliked(hashUrl) {
  try {
    const raw = localStorage.getItem(`gmg_disliked_${hashUrl || 'unknown'}`);
    const obj = raw ? JSON.parse(raw) : {};
    return {
      dislikedCategoryIds: Array.isArray(obj.dislikedCategoryIds) ? obj.dislikedCategoryIds : [],
      dislikedPlaceIds: Array.isArray(obj.dislikedPlaceIds) ? obj.dislikedPlaceIds : [],
    };
  } catch {
    return { dislikedCategoryIds: [], dislikedPlaceIds: [] };
  }
}

function saveDisliked(hashUrl, payload) {
  localStorage.setItem(`gmg_disliked_${hashUrl || 'unknown'}`, JSON.stringify(payload));
}

function truncatePlaceName(name, max = 9) {
  const s = String(name || '');
  const chars = Array.from(s);
  if (chars.length <= max) return ` ${s}`;
  return ` ${chars.slice(0, max).join('')}...`;
}

export default function JoinPlaceCategorySubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const hashUrl = (searchParams.get('code') || '').trim();

  const categoryIdFromQuery = searchParams.get('categoryId');
  const state = location.state || {};
  const categoryIdFromState = state.categoryId ?? state.itemId;

  const normalizedCategoryId = useMemo(() => {
    const v = categoryIdFromQuery ?? categoryIdFromState;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }, [categoryIdFromQuery, categoryIdFromState]);

  const title = useMemo(() => {
    return state.title || '카테고리';
  }, [state.title]);

  const [query, setQuery] = useState('');

  const [places, setPlaces] = useState([]); // [{id:number, name, imageUrl}]
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const pageSize = 16;

  const handleBack = () => navigate(-1);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl || normalizedCategoryId == null) {
        if (!alive) return;
        setIsLoading(false);
        setErrorText('필수 값이 누락되었습니다. (code 또는 categoryId)');
        setPlaces([]);
        setHasNext(false);
        return;
      }

      setIsLoading(true);
      setErrorText('');

      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(hashUrl)}/places?categoryId=${encodeURIComponent(
            normalizedCategoryId,
          )}&page=${encodeURIComponent(page)}&size=${encodeURIComponent(pageSize)}`,
          { headers: { accept: 'application/json' } },
        );

        const json = await res.json().catch(() => null);
        if (!alive) return;

        if (!res.ok) {
          setErrorText(json?.message || '장소 목록을 불러오지 못했습니다.');
          setIsLoading(false);
          setPlaces([]);
          setHasNext(false);
          return;
        }

        const data = json?.data || {};
        const list = Array.isArray(data.places) ? data.places : [];

        setPlaces((prev) => (page === 0 ? list : [...prev, ...list]));
        setHasNext(!!data.hasNext);
        setIsLoading(false);
      } catch {
        if (!alive) return;
        setErrorText('네트워크 오류로 장소 목록을 불러오지 못했습니다.');
        setIsLoading(false);
        setPlaces([]);
        setHasNext(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hashUrl, normalizedCategoryId, page]);

  const filteredPlaces = useMemo(() => {
    const q = query.trim();
    if (!q) return places;
    return places.filter((p) => String(p?.name || '').includes(q));
  }, [places, query]);

  const isApiEmpty = !isLoading && !errorText && places.length === 0;
  const isSearchEmpty =
    !isLoading && !errorText && places.length > 0 && query.trim() && filteredPlaces.length === 0;

  const allVisibleSelected =
    filteredPlaces.length > 0 && filteredPlaces.every((p) => selectedIds.has(Number(p.id)));

  const toggleOne = (id) => {
    const n = Number(id);
    if (!Number.isFinite(n)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const visibleIds = filteredPlaces
        .map((p) => Number(p.id))
        .filter((n) => Number.isFinite(n));

      const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => next.has(id));

      if (isAllSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));

      return next;
    });
  };

  const handleDone = () => {
    console.log('선택된 place ids:', Array.from(selectedIds));

    if (hashUrl && normalizedCategoryId != null) {
      const prev = loadDisliked(hashUrl);

      const nextCategoryIds = Array.from(
        new Set([...(prev.dislikedCategoryIds || []), normalizedCategoryId]),
      );

      const nextPlaceIds = Array.from(
        new Set([...(prev.dislikedPlaceIds || []), ...Array.from(selectedIds)]),
      );

      saveDisliked(hashUrl, {
        dislikedCategoryIds: nextCategoryIds,
        dislikedPlaceIds: nextPlaceIds,
      });
    }

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

          {!!errorText && (
            <p style={{ margin: '8px 0', color: '#d00', fontSize: 14 }}>{errorText}</p>
          )}

          {isApiEmpty && <div className="jpcs-empty">해당 카테고리 장소가 없어요</div>}

          {isSearchEmpty && <div className="jpcs-empty">해당 장소를 찾을 수 없어요</div>}

          {!isApiEmpty && !isSearchEmpty && (
            <section className="jpcs-grid">
              <button
                type="button"
                className={
                  'jpcs-tile jpcs-tile--all' +
                  (allVisibleSelected ? ' jpcs-tile--all-selected' : '')
                }
                onClick={toggleAll}
                aria-label="전체 선택"
                disabled={!!errorText || isLoading || filteredPlaces.length === 0}
              >
                <span className="jpcs-all-text">전체 선택</span>

                {allVisibleSelected && (
                  <div className="jpcs-overlay">
                    <span className="jpcs-x">×</span>
                  </div>
                )}
              </button>

              {filteredPlaces.map((p) => {
                const idNum = Number(p.id);
                const selected = Number.isFinite(idNum) && selectedIds.has(idNum);

                const displayName = truncatePlaceName(p.name, 9);

                return (
                  <button
                    key={p.id}
                    type="button"
                    className="jpcs-tile jpcs-tile--place"
                    onClick={() => toggleOne(p.id)}
                    disabled={!!errorText || isLoading}
                  >
                    <img src={p.imageUrl || ChickenImg} alt={p.name} className="jpcs-thumb" />

                    {selected && (
                      <div className="jpcs-overlay">
                        <span className="jpcs-x">×</span>
                      </div>
                    )}

                    <div className="jpcs-label">
                      <p className="jpcs-label-text">{displayName}</p>
                    </div>
                  </button>
                );
              })}
            </section>
          )}

          {hasNext && !isApiEmpty && !isSearchEmpty && (
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLoading || !!errorText}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,0.12)',
                  background: '#fff',
                  fontSize: 14,
                }}
              >
                더 보기
              </button>
            </div>
          )}
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
