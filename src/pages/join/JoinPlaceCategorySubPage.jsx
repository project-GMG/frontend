// src/pages/join/JoinPlaceCategorySubPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import './JoinPlaceCategorySubPage.css';

import BackButton from '../components/common/BackButton';
import NextButton from '../components/common/NextButton';

import SearchIcon from '../../assets/icons/search.png';
import NoImage from '../../assets/icons/no-image.png';
import { buildApiUrl } from '../../lib/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text().catch(() => '');
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      (typeof json === 'string' ? json : null) ||
      `요청 실패 (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json;
}

function loadDisliked(hashUrl) {
  try {
    const raw = sessionStorage.getItem(`gmg_disliked_${hashUrl || 'unknown'}`);
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
  sessionStorage.setItem(`gmg_disliked_${hashUrl || 'unknown'}`, JSON.stringify(payload));
}

function truncatePlaceName(name, max = 9) {
  const s = String(name || '');
  const chars = Array.from(s);
  if (chars.length <= max) return ` ${s}`;
  return ` ${chars.slice(0, max).join('')}...`;
}

function getParticipantId(hashUrl) {
  const raw = sessionStorage.getItem(`gmg_participant_${hashUrl}`);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

async function postDisliked(hashUrl, participantId, dislikedCategoryIds, dislikedPlaceIds) {
  return apiFetch(
    `/api/event/${encodeURIComponent(hashUrl)}/participants/${encodeURIComponent(participantId)}/disliked`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dislikedCategoryIds, dislikedPlaceIds }),
    },
  );
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

  const [places, setPlaces] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorText, setErrorText] = useState('');

  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const pageSize = 16;

  const handleBack = () => navigate(-1);

  const scrollRef = useRef(null);
  const lastLoadedPageRef = useRef(-1);
  const pendingRef = useRef(false);

  const fetchPage = async (nextPage) => {
    if (!hashUrl || normalizedCategoryId == null) return;

    if (pendingRef.current) return;
    if (lastLoadedPageRef.current === nextPage) return;

    pendingRef.current = true;
    if (nextPage === 0) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const json = await apiFetch(
        `/api/events/${encodeURIComponent(
          hashUrl,
        )}/places?categoryId=${encodeURIComponent(normalizedCategoryId)}&page=${encodeURIComponent(
          nextPage,
        )}&size=${encodeURIComponent(pageSize)}`,
      );

      const data = json?.data || {};
      const list = Array.isArray(data.places) ? data.places : [];

      setPlaces((prev) => (nextPage === 0 ? list : [...prev, ...list]));
      setHasNext(!!data.hasNext);

      lastLoadedPageRef.current = nextPage;
      setPage(nextPage);
      setErrorText('');
    } catch (e) {
      setErrorText(e?.message || '장소 목록을 불러오지 못했습니다.');
      setPlaces([]);
      setHasNext(false);
      lastLoadedPageRef.current = -1;
      setPage(0);
    } finally {
      pendingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!hashUrl || normalizedCategoryId == null) {
      setIsLoading(false);
      setErrorText('필수 값이 누락되었습니다. (code 또는 categoryId)');
      setPlaces([]);
      setHasNext(false);
      setPage(0);
      lastLoadedPageRef.current = -1;
      pendingRef.current = false;
      return;
    }

    setPlaces([]);
    setHasNext(false);
    setPage(0);
    setErrorText('');
    setSubmitError('');
    lastLoadedPageRef.current = -1;
    pendingRef.current = false;

    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashUrl, normalizedCategoryId]);

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
      const visibleIds = filteredPlaces.map((p) => Number(p.id)).filter((n) => Number.isFinite(n));

      const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => next.has(id));

      if (isAllSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));

      return next;
    });
  };

  const handleDone = async () => {
    if (!hashUrl || normalizedCategoryId == null) return;

    setSubmitError('');
    setIsSubmitting(true);

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

    const participantId = getParticipantId(hashUrl);
    if (!participantId) {
      setIsSubmitting(false);
      setSubmitError('참여자 정보가 없습니다. 먼저 이름 등록을 다시 진행해주세요.');
      return;
    }

    try {
      await postDisliked(hashUrl, participantId, nextCategoryIds, nextPlaceIds);
      navigate(-1);
    } catch (e) {
      setSubmitError(e?.message || '비선호 장소 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onScrollContent = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (isLoading || isLoadingMore) return;
    if (errorText) return;
    if (!hasNext) return;
    if (query.trim()) return;

    const threshold = 160;
    const remain = el.scrollHeight - (el.scrollTop + el.clientHeight);
    if (remain <= threshold) fetchPage(page + 1);
  };

  return (
    <div className="jpcs-page">
      <div className="jpcs-container">
        <header className="jpcs-header">
          <BackButton onClick={handleBack} />
          <h1 className="jpcs-header-title">{title}</h1>
          <div className="jpcs-header-spacer" />
        </header>

        <main ref={scrollRef} className="jpcs-content" onScroll={onScrollContent}>
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
          {!!submitError && (
            <p style={{ margin: '8px 0', color: '#d00', fontSize: 14 }}>{submitError}</p>
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
                disabled={!!errorText || isLoading || isSubmitting || filteredPlaces.length === 0}
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
                const displayName = truncatePlaceName(p.name, 7);

                return (
                  <button
                    key={p.id}
                    type="button"
                    className="jpcs-tile jpcs-tile--place"
                    onClick={() => toggleOne(p.id)}
                    disabled={!!errorText || isLoading || isSubmitting}
                  >
                    <img
                      src={p.imageUrl || NoImage}
                      alt={p.name}
                      className="jpcs-thumb"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = NoImage;
                      }}
                    />

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

          {isLoadingMore && !query.trim() && (
            <p style={{ margin: '12px 0 0', color: '#666', fontSize: 14, textAlign: 'center' }}>
              불러오는 중...
            </p>
          )}
        </main>

        <footer className="jpcs-footer">
          <NextButton disabled={!!errorText || isLoading || isSubmitting} onClick={handleDone}>
            {isSubmitting ? '등록 중...' : '완료'}
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
