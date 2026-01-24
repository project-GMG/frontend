// src/pages/main/MainPage.jsx


import './MainPage.css';
import NextButton from '../components/common/NextButton';
import Logo from '../../assets/icons/logo.png';
import ShareIcon from '../../assets/icons/share.png';
import NoImage from '../../assets/icons/no-image.png';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import JoinModalPage from '../join/JoinModalPage';

function getBaseUrl() {
  const envBase = (import.meta.env.VITE_SHARE_BASE_URL || '').trim();
  return envBase ? envBase.replace(/\/+$/, '') : window.location.origin;
}

function buildMainLink(hashUrl) {
  const base = getBaseUrl();
  return `${base}/main?code=${encodeURIComponent(hashUrl)}`;
}

function parseYmd(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  dt.setHours(0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatDateKorean(date) {
  if (!(date instanceof Date)) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const wd = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${mm}/${dd} ${wd}`;
}

function buildDatesFromRange(startYmd, endYmd, limit = 60) {
  const start = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  if (!start || !end) return [];

  const out = [];
  const cur = new Date(start);
  let count = 0;

  while (cur.getTime() <= end.getTime() && count < limit) {
    out.push(formatDateKorean(cur));
    cur.setDate(cur.getDate() + 1);
    count += 1;
  }
  return out;
}

function buildTimeSlotsFromRange(startHm, endHm) {
  const start = String(startHm || '').slice(0, 5);
  const end = String(endHm || '').slice(0, 5);

  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return { slots: [], labels: [] };
  }

  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  let startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (!(startMin < endMin)) return { slots: [], labels: [] };

  const slots = [];
  const labels = [];

  while (startMin <= endMin) {
    const h = Math.floor(startMin / 60);
    const m = startMin % 60;

    const isPm = h >= 12;
    const hour12 = ((h + 11) % 12) + 1;
    const minuteStr = String(m).padStart(2, '0');
    const ampm = isPm ? 'PM' : 'AM';

    slots.push(`${hour12}:${minuteStr} ${ampm}`);
    labels.push(m === 0 ? `${hour12} ${ampm}` : '');

    startMin += 30;
  }

  return { slots, labels };
}

function slotToHm(slot) {
  const m = String(slot).match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
  if (!m) return '';
  let h = Number(m[1]);
  const mm = m[2];
  const ap = m[3];
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${mm}`;
}

// recommendations 실제 응답(placeId/placeName/score) 대응 -> 평탄화 + score desc
function normalizeRecommendations(data) {
  const recs = data?.recommendations;
  if (!Array.isArray(recs)) return [];

  const flat = recs
    .flatMap((r) => {
      const typeName = String(r?.placeTypeName || '').trim();
      const places = Array.isArray(r?.places) ? r.places : [];
      return places.map((p) => ({
        id: p?.placeId ?? p?.id,
        name: String(p?.placeName ?? p?.name ?? '').trim(),
        score: typeof p?.score === 'number' ? p.score : -Infinity,
        placeTypeName: typeName,
      }));
    })
    .filter((p) => p.id != null && p.name);

  const uniq = new Map();
  for (const p of flat) {
    const key = String(p.id);
    if (!uniq.has(key)) uniq.set(key, p);
    else {
      const prev = uniq.get(key);
      if ((p.score ?? -Infinity) > (prev.score ?? -Infinity)) uniq.set(key, p);
    }
  }

  return Array.from(uniq.values()).sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
}

async function apiFetchJson(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await res.text().catch(() => '');
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.message || `요청 실패 (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json;
}

function getSlotBgByRank(rank) {
  if (rank === 1) return '#FF5315';
  if (rank === 2) return 'rgba(253, 88, 57, 0.6)';
  if (rank === 3) return 'rgba(255, 83, 21, 0.3)';
  return '';
}

export default function MainPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hashUrl = (searchParams.get('code') || '').trim();

  const gridScrollRef = useRef(null);
  const dateScrollRef = useRef(null);
  const timeScrollRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [eventData, setEventData] = useState(null);

  const [recoLoading, setRecoLoading] = useState(false);
  const [recoPlaces, setRecoPlaces] = useState([]);

  // 이미지 매핑: placeId -> imageUrl (A안: categories + places로 채움)
  const [placeImageMap, setPlaceImageMap] = useState({});
  const placeImageRequestedRef = useRef(new Set());

  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // ✅ Event API 연결 (heatmapData 포함)
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl) {
        if (!alive) return;
        setIsLoading(false);
        setErrorText('링크가 올바르지 않습니다. (code 없음)');
        setEventData(null);
        return;
      }

      setIsLoading(true);
      setErrorText('');

      try {
        const res = await fetch(`/api/events/${encodeURIComponent(hashUrl)}`, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });

        const json = await res.json().catch(() => null);
        if (!alive) return;

        if (!res.ok) {
          setErrorText(json?.message || '이벤트 정보를 불러오지 못했습니다.');
          setEventData(null);
          setIsLoading(false);
          return;
        }

        const data = json?.data || null;
        if (!data) {
          setErrorText('이벤트 데이터가 비어 있습니다.');
          setEventData(null);
          setIsLoading(false);
          return;
        }

        setEventData(data);
        setIsLoading(false);
      } catch {
        if (!alive) return;
        setErrorText('네트워크 오류로 이벤트 정보를 불러오지 못했습니다.');
        setEventData(null);
        setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hashUrl]);

  // ✅ recommendations API 연결
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl) return;

      setRecoLoading(true);

      try {
        const res = await fetch(`/api/events/${encodeURIComponent(hashUrl)}/places/recommendations`, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });

        const json = await res.json().catch(() => null);
        if (!alive) return;

        if (!res.ok) {
          setRecoPlaces([]);
          setRecoLoading(false);
          return;
        }

        const list = normalizeRecommendations(json?.data);
        setRecoPlaces(list);
        setRecoLoading(false);
      } catch {
        if (!alive) return;
        setRecoPlaces([]);
        setRecoLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hashUrl]);

  const topRankMap = useMemo(() => {
    const list = Array.isArray(eventData?.heatmapData) ? eventData.heatmapData : [];

    const norm = list
      .map((h) => {
        const dt = parseYmd(h?.date);
        const dateLabel = dt ? formatDateKorean(dt) : '';
        const timeHm = String(h?.timeSlot || '').slice(0, 5);
        if (!dateLabel || !/^\d{2}:\d{2}$/.test(timeHm)) return null;

        const c = Number(h?.availableCount);
        if (!Number.isFinite(c)) return null;

        return { key: `${dateLabel}|${timeHm}`, count: c };
      })
      .filter(Boolean);

    const distinctCounts = Array.from(new Set(norm.map((x) => x.count))).sort((a, b) => a - b);
    const topCounts = distinctCounts.slice(0, 3);

    const out = new Map();
    for (const item of norm) {
      const idx = topCounts.indexOf(item.count);
      if (idx !== -1) out.set(item.key, idx + 1);
    }
    return out;
  }, [eventData]);

  const title = eventData?.title || '';

  const dates = useMemo(() => {
    const startDate = eventData?.dateRange?.startDate;
    const endDate = eventData?.dateRange?.endDate;
    return buildDatesFromRange(startDate, endDate, 60);
  }, [eventData?.dateRange?.startDate, eventData?.dateRange?.endDate]);

  const { slots: timeSlots, labels: timeLabels } = useMemo(() => {
    const startTime = eventData?.timeRange?.startTime;
    const endTime = eventData?.timeRange?.endTime;
    return buildTimeSlotsFromRange(startTime, endTime);
  }, [eventData?.timeRange?.startTime, eventData?.timeRange?.endTime]);

  const canRenderGrid = dates.length > 0 && timeSlots.length > 0;


  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl) return;
      if (!Array.isArray(recoPlaces) || recoPlaces.length === 0) return;

      const top3 = recoPlaces.slice(0, 3);

      const needIds = top3
        .map((p) => p?.id)
        .filter((id) => id != null)
        .map((id) => String(id))
        .filter((id) => !placeImageMap[id])
        .filter((id) => !placeImageRequestedRef.current.has(id));

      if (needIds.length === 0) return;

      needIds.forEach((id) => placeImageRequestedRef.current.add(id));

      // 1) categories 가져오기 (categoryId 수집)
      let categoryIds = [];
      try {
        const catJson = await apiFetchJson(`/api/events/${encodeURIComponent(hashUrl)}/categories`);
        const pts = Array.isArray(catJson?.data?.placeTypes) ? catJson.data.placeTypes : [];

        categoryIds = pts
          .flatMap((pt) => (Array.isArray(pt?.categories) ? pt.categories : []))
          .map((c) => c?.id)
          .filter((id) => Number.isFinite(Number(id)))
          .map((id) => Number(id));
      } catch {
        return;
      }

      if (!alive) return;
      if (categoryIds.length === 0) return;

      const remaining = new Set(needIds);

      const maxCategories = 25;
      const maxPagesPerCategory = 5;
      const size = 16;

      const nextMap = {};

      for (const categoryId of categoryIds.slice(0, maxCategories)) {
        if (!alive) return;
        if (remaining.size === 0) break;

        for (let page = 0; page < maxPagesPerCategory; page += 1) {
          if (!alive) return;
          if (remaining.size === 0) break;

          let placeJson = null;
          try {
            placeJson = await apiFetchJson(
              `/api/events/${encodeURIComponent(hashUrl)}/places?categoryId=${encodeURIComponent(
                categoryId,
              )}&page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`,
            );
          } catch {
            break;
          }

          const data = placeJson?.data || {};
          const places = Array.isArray(data?.places) ? data.places : [];

          for (const p of places) {
            const idStr = p?.id != null ? String(p.id) : '';
            if (!idStr) continue;
            if (!remaining.has(idStr)) continue;

            const url = String(p?.imageUrl || '').trim();
            if (url) {
              nextMap[idStr] = url;
              remaining.delete(idStr);
            }
          }

          const hasNext = !!data?.hasNext;
          if (!hasNext) break;
        }
      }

      if (!alive) return;

      if (Object.keys(nextMap).length > 0) {
        setPlaceImageMap((prev) => ({ ...prev, ...nextMap }));
      }
    })();

    return () => {
      alive = false;
    };
  }, [hashUrl, recoPlaces, placeImageMap]);

  const displayRecoPlaces = useMemo(() => {
    const list = Array.isArray(recoPlaces) ? recoPlaces : [];
    return list.slice(0, 3).map((p) => {
      const idStr = p?.id != null ? String(p.id) : '';
      const apiImg = idStr ? String(placeImageMap[idStr] || '').trim() : '';
      return {
        id: p?.id,
        name: p?.name,
        imageUrl: apiImg || '',
      };
    });
  }, [recoPlaces, placeImageMap]);

  const syncFromGrid = () => {
    const grid = gridScrollRef.current;
    const date = dateScrollRef.current;
    const time = timeScrollRef.current;
    if (!grid || !date || !time) return;
    date.scrollLeft = grid.scrollLeft;
    time.scrollTop = grid.scrollTop;
  };

  const syncFromDate = () => {
    const grid = gridScrollRef.current;
    const date = dateScrollRef.current;
    if (!grid || !date) return;
    grid.scrollLeft = date.scrollLeft;
  };

  const syncFromTime = () => {
    const grid = gridScrollRef.current;
    const time = timeScrollRef.current;
    if (!grid || !time) return;
    grid.scrollTop = time.scrollTop;
  };

  const handleShare = async () => {
    if (!hashUrl) return;
    const url = buildMainLink(hashUrl);

    try {
      if (navigator.share) {
        await navigator.share({ title: 'GMG 모임 링크', text: '모임 일정 페이지', url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('링크를 클립보드에 복사했습니다.');
      }
    } catch (e) {
      console.error('공유 실패 또는 취소:', e);
    }
  };

  const handleParticipate = () => {
    if (!hashUrl) return;
    setIsJoinOpen(true);
  };

  const handleCloseJoin = () => setIsJoinOpen(false);

  const handleJoinedGoTime = () => {
    setIsJoinOpen(false);
    navigate(`/join/time?code=${encodeURIComponent(hashUrl)}`);
  };

  const isReady = !isLoading && !errorText && !!eventData;

  return (
    <div className="main-page">
      <div className="main-page-container">
        <header className="main-header">
          <img src={Logo} alt="GMG 로고" className="main-logo" />

          <div className="main-share-area">
            <button type="button" className="main-share-bubble" onClick={handleShare} disabled={!hashUrl}>
              <span className="main-share-bubble-text">공유하고 모임을 잡아보세요!</span>
            </button>

            <button type="button" className="main-share-icon-button" onClick={handleShare} disabled={!hashUrl}>
              <img src={ShareIcon} alt="공유" className="main-share-icon-image" />
            </button>
          </div>
        </header>

        <main className="main-content">
          {isLoading && <p style={{ margin: '8px 0', color: '#666', fontSize: 14 }}>모임 정보를 불러오는 중...</p>}
          {!!errorText && <p style={{ margin: '8px 0', color: '#d00', fontSize: 14 }}>{errorText}</p>}

          {isReady && (
            <>
              <h1 className="main-title">{title || '제목이 없습니다.'}</h1>

              <section className="main-section">
                <div className="schedule-container">
                  <h2 className="schedule-title">이때 만날까요?</h2>

                  {!canRenderGrid ? (
                    <p style={{ margin: '8px 0', color: '#666', fontSize: 14 }}>
                      날짜/시간 범위가 설정되지 않아 시간표를 표시할 수 없습니다.
                    </p>
                  ) : (
                    <div className="schedule-frame">
                      <div ref={dateScrollRef} className="schedule-date-rail" onScroll={syncFromDate}>
                        <div className="schedule-date-row">
                          {dates.map((date) => (
                            <div key={date} className="schedule-date-header">
                              {date}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div ref={timeScrollRef} className="schedule-time-rail" onScroll={syncFromTime}>
                        <div className="schedule-time-col">
                          {timeSlots.map((slot, rowIndex) => (
                            <div key={slot} className="schedule-time-label">
                              {timeLabels[rowIndex] ?? ''}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div ref={gridScrollRef} className="schedule-grid-scroll gmg-scrollbar-both" onScroll={syncFromGrid}>
                        <div className="schedule-grid-scroll-inner">
                          <div
                            className="schedule-grid-slots"
                            style={{
                              gridTemplateColumns: `repeat(${dates.length}, 87.666664px)`,
                              gridTemplateRows: `repeat(${timeSlots.length}, 20px)`,
                            }}
                          >
                            {timeSlots.map((slot, rowIndex) =>
                              dates.map((date) => {
                                const key = `${date}-${slot}`;
                                const hmKey = slotToHm(slot);

                                const isTop = rowIndex % 2 === 0;
                                const cellClass = isTop ? 'schedule-slot schedule-slot--top' : 'schedule-slot schedule-slot--bottom';

                                const rankKey = hmKey ? `${date}|${hmKey}` : '';
                                const rank = rankKey ? topRankMap.get(rankKey) : null;
                                const bg = getSlotBgByRank(rank);

                                return (
                                  <div
                                    key={key}
                                    className={cellClass}
                                    style={bg ? { backgroundColor: bg } : undefined}
                                  />
                                );
                              }),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="main-section">
                <div className="restaurant-rail restaurant-rail--hidden-scrollbar">
                  {recoLoading ? (
                    <div className="restaurant-container">
                      <h2 className="restaurant-container-title">이 음식점 어때요?</h2>
                      <p style={{ margin: 0, color: '#666', fontSize: 14 }}>추천 장소를 불러오는 중...</p>
                    </div>
                  ) : displayRecoPlaces.length === 0 ? (
                    <div className="restaurant-container">
                      <h2 className="restaurant-container-title">이 음식점 어때요?</h2>
                      <p style={{ margin: 0, color: '#666', fontSize: 14 }}>추천 장소가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="restaurant-container">
                      <h2 className="restaurant-container-title">이 음식점 어때요?</h2>

                      <div className="restaurant-set">
                        {displayRecoPlaces.map((place) => (
                          <article key={place.id ?? place.name} className="restaurant-card">
                            <img
                              src={place.imageUrl || NoImage}
                              alt={place.name}
                              className="restaurant-thumb"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = NoImage;
                              }}
                            />
                            <div className="restaurant-label">
                              <p className="restaurant-label-text">{place.name}</p>
                            </div>
                          </article>
                        ))}

                        {Array.from({ length: Math.max(0, 3 - displayRecoPlaces.length) }).map((_, emptyIdx) => (
                          <div key={`reco-empty-${emptyIdx}`} className="restaurant-card restaurant-card--empty" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        <footer className="main-footer">
          <NextButton disabled={!hashUrl || isLoading || !!errorText} onClick={handleParticipate}>
            참여 · 수정하기
          </NextButton>
        </footer>

        <JoinModalPage open={isJoinOpen} hashUrl={hashUrl} onClose={handleCloseJoin} onSuccessGoTime={handleJoinedGoTime} />
      </div>
    </div>
  );
}
