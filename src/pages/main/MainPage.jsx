// src/pages/main/MainPage.jsx
import './MainPage.css';
import NextButton from '../components/common/NextButton';
import Logo from '../../assets/icons/logo.png';
import ShareIcon from '../../assets/icons/share.png';
import NoImage from '../../assets/icons/no-image.png';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import JoinModalPage from '../join/JoinModalPage';
import { buildApiUrl } from '../../lib/api';

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

function truncateKorean(name, max = 7) {
  const s = String(name || '').trim();
  const chars = Array.from(s);
  if (chars.length <= max) return s;
  return `${chars.slice(0, max).join('')}...`;
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
        imageUrl: String(p?.imageUrl || '').trim(),
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

function getSlotBgByRank(rank) {
  if (rank === 1) return '#FF5315';
  if (rank === 2) return 'rgba(253, 88, 57, 0.6)';
  if (rank === 3) return 'rgba(255, 83, 21, 0.3)';
  return '';
}

/* =========================
   로컬 UI 확인용 더미 데이터
   ========================= */
const DUMMY_EVENT = {
  title: '다같이 만나요',
  dateRange: { startDate: '2026-02-10', endDate: '2026-02-15' },
  timeRange: { startTime: '10:00', endTime: '20:00' },
  heatmapData: [
    { date: '2026-02-10', timeSlot: '10:00', availableCount: 2 },
    { date: '2026-02-10', timeSlot: '10:30', availableCount: 3 },
    { date: '2026-02-10', timeSlot: '11:00', availableCount: 5 },
    { date: '2026-02-11', timeSlot: '12:00', availableCount: 4 },
    { date: '2026-02-12', timeSlot: '18:00', availableCount: 6 },
    { date: '2026-02-13', timeSlot: '18:30', availableCount: 6 },
    { date: '2026-02-14', timeSlot: '19:00', availableCount: 7 },
    { date: '2026-02-15', timeSlot: '16:00', availableCount: 1 },
  ],
};

const DUMMY_RECO = [
  { id: 'd1', name: '을밀대 평양냉면', imageUrl: '' },
  { id: 'd2', name: '성심당 본점', imageUrl: '' },
  { id: 'd3', name: '스시 오마카세', imageUrl: '' },
  { id: 'd4', name: '동네 파스타집', imageUrl: '' },
  { id: 'd5', name: '카츠 전문점', imageUrl: '' },
  { id: 'd6', name: '샐러드&샌드위치', imageUrl: '' },
];

export default function MainPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hashUrl = (searchParams.get('code') || '').trim();

  const USE_DUMMY_WHEN_NO_CODE = true;

  const gridScrollRef = useRef(null);
  const dateScrollRef = useRef(null);
  const timeScrollRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [eventData, setEventData] = useState(null);

  const [recoLoading, setRecoLoading] = useState(false);
  const [recoPlaces, setRecoPlaces] = useState([]);

  const [isJoinOpen, setIsJoinOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl) {
        if (!alive) return;

        if (USE_DUMMY_WHEN_NO_CODE) {
          setErrorText('');
          setEventData(DUMMY_EVENT);
          setRecoPlaces(DUMMY_RECO);
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
        setErrorText('링크가 올바르지 않습니다. (code 없음)');
        setEventData(null);
        return;
      }

      setIsLoading(true);
      setErrorText('');

      try {
        const res = await fetch(buildApiUrl(`/api/events/${encodeURIComponent(hashUrl)}`), {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });

        const json = await res.json().catch(() => null);
        if (!alive) return;

        if (!res.ok) {
          setEventData(DUMMY_EVENT);
          setRecoPlaces(DUMMY_RECO);
          setErrorText('개발 모드: API 접근 실패로 더미 데이터를 표시합니다.');
          setIsLoading(false);
          return;
        }

        const data = json?.data || null;
        if (!data) {
          setEventData(DUMMY_EVENT);
          setRecoPlaces(DUMMY_RECO);
          setErrorText('개발 모드: 이벤트 데이터가 비어 있어 더미 데이터를 표시합니다.');
          setIsLoading(false);
          return;
        }

        setEventData(data);
        setIsLoading(false);
      } catch {
        if (!alive) return;
        setEventData(DUMMY_EVENT);
        setRecoPlaces(DUMMY_RECO);
        setErrorText('개발 모드: 네트워크 오류로 더미 데이터를 표시합니다.');
        setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hashUrl]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl) return;

      setRecoLoading(true);

      try {
        const res = await fetch(
          buildApiUrl(`/api/events/${encodeURIComponent(hashUrl)}/places/recommendations`),
          {
            headers: { accept: 'application/json' },
            cache: 'no-store',
          },
        );

        const json = await res.json().catch(() => null);
        if (!alive) return;

        if (!res.ok) {
          setRecoLoading(false);
          return;
        }

        const list = normalizeRecommendations(json?.data);
        setRecoPlaces(list);
        setRecoLoading(false);
      } catch {
        if (!alive) return;
        setRecoLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hashUrl]);

  // SSE: 히트맵 실시간 스트림 구독 (/api/events/{hashUrl}/stream)

  useEffect(() => {
    if (!hashUrl) return;

    const streamUrl = buildApiUrl(`/api/events/${encodeURIComponent(hashUrl)}/stream`);
    const es = new EventSource(streamUrl);

    const safeJsonParse = (s) => {
      try {
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    };

    const applyHeatmapPatch = (payload) => {
      const data = payload?.data ?? payload ?? null;

      const nextHeatmap = data?.heatmapData ?? data?.heatmap ?? data?.items ?? data?.values ?? null;

      if (!Array.isArray(nextHeatmap)) return;

      setEventData((prev) => {
        if (!prev) return prev;
        return { ...prev, heatmapData: nextHeatmap };
      });
    };

    es.onmessage = (e) => {
      const payload = safeJsonParse(e?.data);
      if (!payload) return;
      applyHeatmapPatch(payload);
    };

    es.onerror = () => {
      console.warn('SSE stream error:', streamUrl);
    };

    return () => {
      es.close();
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

    const distinctCounts = Array.from(new Set(norm.map((x) => x.count))).sort((a, b) => b - a);
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

  const recoGroups = useMemo(() => {
    const list = Array.isArray(recoPlaces) ? recoPlaces : [];

    const groups = [];
    for (let i = 0; i < list.length; i += 3) {
      const chunk = list.slice(i, i + 3).map((p) => ({
        id: p?.id,
        name: p?.name,
        imageUrl: String(p?.imageUrl || '').trim(),
      }));
      groups.push(chunk);
    }

    return groups;
  }, [recoPlaces]);

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

  const isReady = !isLoading && !!eventData;

  return (
    <div className="main-page">
      <div className="main-page-container">
        <header className="main-header">
          <img src={Logo} alt="GMG 로고" className="main-logo" />

          <div className="main-share-area">
            <button
              type="button"
              className="main-share-bubble"
              onClick={handleShare}
              disabled={!hashUrl}
            >
              <span className="main-share-bubble-text">공유하고 모임을 잡아보세요!</span>
            </button>

            <button
              type="button"
              className="main-share-icon-button"
              onClick={handleShare}
              disabled={!hashUrl}
            >
              <img src={ShareIcon} alt="공유" className="main-share-icon-image" />
            </button>
          </div>
        </header>

        <main className="main-content">
          {isLoading && (
            <p style={{ margin: '8px 0', color: '#666', fontSize: 14 }}>
              모임 정보를 불러오는 중...
            </p>
          )}

          {!!errorText && (
            <p style={{ margin: '8px 0', color: '#666', fontSize: 12 }}>{errorText}</p>
          )}

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
                      <div
                        ref={dateScrollRef}
                        className="schedule-date-rail"
                        onScroll={syncFromDate}
                      >
                        <div className="schedule-date-row">
                          {dates.map((date) => (
                            <div key={date} className="schedule-date-header">
                              {date}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div
                        ref={timeScrollRef}
                        className="schedule-time-rail"
                        onScroll={syncFromTime}
                      >
                        <div className="schedule-time-col">
                          {timeSlots.map((slot, rowIndex) => (
                            <div key={slot} className="schedule-time-label">
                              {timeLabels[rowIndex] ?? ''}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div
                        ref={gridScrollRef}
                        className="schedule-grid-scroll gmg-scrollbar-both"
                        onScroll={syncFromGrid}
                      >
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
                                const cellClass = isTop
                                  ? 'schedule-slot schedule-slot--top'
                                  : 'schedule-slot schedule-slot--bottom';

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
                      <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                        추천 장소를 불러오는 중...
                      </p>
                    </div>
                  ) : recoGroups.length === 0 ? (
                    <div className="restaurant-container">
                      <h2 className="restaurant-container-title">이 음식점 어때요?</h2>
                      <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                        추천 장소가 없습니다.
                      </p>
                    </div>
                  ) : (
                    <>
                      {recoGroups.map((group, groupIdx) => (
                        <div key={`reco-group-${groupIdx}`} className="restaurant-container">
                          <h2 className="restaurant-container-title">이 음식점 어때요?</h2>

                          <div className="restaurant-set">
                            {group.map((place) => (
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
                                  <p className="restaurant-label-text">
                                    {truncateKorean(place.name, 7)}
                                  </p>
                                </div>
                              </article>
                            ))}

                            {Array.from({ length: Math.max(0, 3 - group.length) }).map(
                              (_, emptyIdx) => (
                                <div
                                  key={`reco-${groupIdx}-empty-${emptyIdx}`}
                                  className="restaurant-card restaurant-card--empty"
                                />
                              ),
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        <footer className="main-footer">
          <NextButton disabled={false} onClick={handleParticipate}>
            참여 · 수정하기
          </NextButton>
        </footer>

        <JoinModalPage
          open={isJoinOpen}
          hashUrl={hashUrl}
          onClose={handleCloseJoin}
          onSuccessGoTime={handleJoinedGoTime}
        />
      </div>
    </div>
  );
}
