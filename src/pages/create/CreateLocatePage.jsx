// gmg-front/src/pages/create/CreateLocatePage.jsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CreateLocatePage.css';
import BackButton from '../components/common/BackButton';
import TopBar from '../components/common/TopBar';
import NextButton from '../components/common/NextButton';
import { useLocation, useNavigate } from 'react-router-dom';

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY;

// 기본 중심(전북대 근처)
const DEFAULT_CENTER = { lat: 35.8467, lng: 127.1293 };

// 기본 선택값(전북대학교)
const DEFAULT_PLACE = {
  name: '전북대학교',
  address: '전북특별자치도 전주시 덕진구 백제대로 567',
  lat: 35.8467,
  lng: 127.1293,
};

const DEFAULT_RADIUS_M = 500;

const DUMMY_RESULTS = [
  {
    id: 'jbnu-main',
    name: '전북대학교',
    address: '전북특별자치도 전주시 덕진구 백제대로 567',
    distance: '0m',
    lat: 35.8467,
    lng: 127.1293,
  },
  {
    id: 'jbnu-gate1',
    name: '전북대학교 정문',
    address: '전북특별자치도 전주시 덕진구 덕진동1가',
    distance: '400m',
    lat: 35.8469,
    lng: 127.1269,
  },
  {
    id: 'jbnu-gate2',
    name: '전북대학교 후문',
    address: '전북특별자치도 전주시 덕진구 금암동',
    distance: '700m',
    lat: 35.8489,
    lng: 127.1344,
  },
  {
    id: 'jbnu-gate3',
    name: '전북대학교 구정문',
    address: '전북특별자치도 전주시 덕진구 덕진동',
    distance: '900m',
    lat: 35.8452,
    lng: 127.1228,
  },
];

export default function CreateLocatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prev = location.state || {}; // CreateDatePage에서 넘어온 placeTypeCodes/dateRange/timeRange

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const infowindowRef = useRef(null);
  const placesRef = useRef(null);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 사용자가 "선택"한 위치(지도 클릭/검색 결과 클릭/현재위치/더미 클릭)
  const [selectedPlace, setSelectedPlace] = useState(DEFAULT_PLACE);

  // 지도 중심(화면 중심)
  const [center, setCenter] = useState(DEFAULT_CENTER);

  const [results, setResults] = useState([]);

  // 카카오 SDK 사용 가능 여부
  const [isKakaoReady, setIsKakaoReady] = useState(false);

  const hasSelection = useMemo(() => !!selectedPlace, [selectedPlace]);

  const handleBack = () => window.history.back();

  const handleNext = () => {
    if (!selectedPlace) return;

    // API request body에 맞는 location 객체
    const payloadLocation = {
      centerLatitude: selectedPlace.lat,
      centerLongitude: selectedPlace.lng,
      locationName: selectedPlace.name || '',
    };

    navigate('/create/info', {
      state: {
        ...prev,
        location: payloadLocation,
        selectedPlace,
        mapCenter: center,
        radiusM: DEFAULT_RADIUS_M,
      },
    });
  };

  const openSearch = () => setIsSearchActive(true);

  const closeSearch = () => {
    setIsSearchActive(false);
    setSearchQuery('');
    setResults([]);
  };

  // SDK 로더 (핵심: autoload=false면 maps.load()가 반드시 끝나야 LatLng 등이 생성됨)
  const loadKakaoSdk = () => {
    const ensureMapsLoaded = (resolve, reject) => {
      if (!window.kakao || !window.kakao.maps) {
        reject(new Error('카카오 maps 객체가 없습니다.'));
        return;
      }

      // autoload=false: 반드시 load 콜백을 거쳐야 코어 클래스(LatLng 등)가 준비됨
      window.kakao.maps.load(() => resolve());
    };

    return new Promise((resolve, reject) => {
      if (!KAKAO_APP_KEY) {
        reject(new Error('VITE_KAKAO_MAP_APP_KEY가 설정되어 있지 않습니다.'));
        return;
      }

      // 이미 window.kakao.maps가 있으면 load만 보장
      if (window.kakao && window.kakao.maps) {
        ensureMapsLoaded(resolve, reject);
        return;
      }

      const existing = document.querySelector('script[data-kakao-sdk="true"]');
      if (existing) {
        existing.addEventListener('load', () => ensureMapsLoaded(resolve, reject));
        existing.addEventListener('error', () => reject(new Error('카카오 SDK 로드 실패')));
        return;
      }

      const script = document.createElement('script');
      script.setAttribute('data-kakao-sdk', 'true');
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false&libraries=services`;
      script.onload = () => ensureMapsLoaded(resolve, reject);
      script.onerror = () => reject(new Error('카카오 SDK 로드 실패'));
      document.head.appendChild(script);
    });
  };

  // 카카오 지도에서 "선택" 처리
  const setSelectionByLatLng = (lat, lng, info) => {
    const { kakao } = window;
    const map = mapRef.current;
    const marker = markerRef.current;
    const circle = circleRef.current;

    if (!kakao || !kakao.maps || !map || !marker || !circle) return;

    const latLng = new kakao.maps.LatLng(lat, lng);

    marker.setPosition(latLng);
    circle.setPosition(latLng);

    const name = info?.name || '선택한 위치';
    const address = info?.address || '';

    setSelectedPlace({ name, address, lat, lng });

    if (infowindowRef.current) {
      const safeTitle = String(name).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeAddr = String(address).replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const content = `
        <div style="padding:8px 10px;font-size:12px;line-height:1.2;">
          <div style="font-weight:600;margin-bottom:4px;">${safeTitle}</div>
          ${safeAddr ? `<div style="color:#666;">${safeAddr}</div>` : ''}
        </div>
      `;
      infowindowRef.current.setContent(content);
      infowindowRef.current.open(map, marker);
    }
  };

  // SDK가 안 될 때도 선택값/중심값을 바꿀 수 있게 하는 더미 클릭 처리
  const setSelectionDummy = (lat, lng, info) => {
    const name = info?.name || '선택한 위치';
    const address = info?.address || '';
    setSelectedPlace({ name, address, lat, lng });
    setCenter({ lat, lng });
  };

  // 지도 초기화(가능하면 카카오, 아니면 더미 UI만)
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        await loadKakaoSdk();
        if (!isMounted) return;

        const { kakao } = window;

        // 방어: maps는 있어도 LatLng가 준비 안 된 상태면 여기서 잡아냄
        if (!kakao?.maps?.LatLng) {
          throw new Error('kakao.maps.LatLng가 로드되지 않았습니다.');
        }

        const container = mapContainerRef.current;
        if (!container) return;

        const map = new kakao.maps.Map(container, {
          center: new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: 4,
        });
        mapRef.current = map;

        const marker = new kakao.maps.Marker({
          position: map.getCenter(),
        });
        marker.setMap(map);
        markerRef.current = marker;

        const circle = new kakao.maps.Circle({
          center: map.getCenter(),
          radius: DEFAULT_RADIUS_M,
          strokeWeight: 0,
          fillColor: '#ff5315',
          fillOpacity: 0.18,
        });
        circle.setMap(map);
        circleRef.current = circle;

        infowindowRef.current = new kakao.maps.InfoWindow({ zIndex: 10 });
        placesRef.current = new kakao.maps.services.Places();

        // 초기 선택(전북대)도 지도에 반영
        setSelectionByLatLng(DEFAULT_PLACE.lat, DEFAULT_PLACE.lng, {
          name: DEFAULT_PLACE.name,
          address: DEFAULT_PLACE.address,
        });

        kakao.maps.event.addListener(map, 'center_changed', () => {
          const c = map.getCenter();
          setCenter({ lat: c.getLat(), lng: c.getLng() });
        });

        kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
          const latlng = mouseEvent.latLng;
          setSelectionByLatLng(latlng.getLat(), latlng.getLng(), {
            name: '선택한 위치',
            address: '',
          });
        });

        setIsKakaoReady(true);
      } catch (e) {
        console.error(e);
        setIsKakaoReady(false);

        setSelectionDummy(DEFAULT_PLACE.lat, DEFAULT_PLACE.lng, {
          name: DEFAULT_PLACE.name,
          address: DEFAULT_PLACE.address,
        });
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const keyword = searchQuery.trim();
    if (!keyword) return;

    // 카카오가 되면 실제 검색
    if (isKakaoReady && window.kakao && window.kakao.maps && placesRef.current) {
      const { kakao } = window;
      const places = placesRef.current;

      places.keywordSearch(keyword, (data, status) => {
        if (status !== kakao.maps.services.Status.OK) {
          setResults([]);
          return;
        }

        const mapped = (data || []).map((d, idx) => ({
          id: `${d.id || idx}`,
          name: d.place_name,
          address: d.road_address_name || d.address_name || '',
          distance: d.distance ? `${d.distance}m` : '',
          lat: Number(d.y),
          lng: Number(d.x),
        }));

        setResults(mapped);
      });

      return;
    }

    // 카카오가 안되면 더미 검색
    const q = keyword.toLowerCase();
    const filtered = DUMMY_RESULTS.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        (item.address || '').toLowerCase().includes(q)
      );
    });
    setResults(filtered);
  };

  const selectResult = (item) => {
    // 카카오가 되면 지도 이동 + 인포윈도우
    if (isKakaoReady && window.kakao && window.kakao.maps && mapRef.current) {
      const { kakao } = window;
      const map = mapRef.current;

      const moveLatLng = new kakao.maps.LatLng(item.lat, item.lng);
      map.panTo(moveLatLng);

      setSelectionByLatLng(item.lat, item.lng, {
        name: item.name,
        address: item.address,
      });

      setIsSearchActive(false);
      return;
    }

    // 더미 모드면 선택만 변경
    setSelectionDummy(item.lat, item.lng, {
      name: item.name,
      address: item.address,
    });
    setIsSearchActive(false);
  };

  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // 카카오가 되면 지도 이동
        if (isKakaoReady && window.kakao && window.kakao.maps && mapRef.current) {
          const { kakao } = window;
          const map = mapRef.current;

          const ll = new kakao.maps.LatLng(lat, lng);
          map.panTo(ll);

          setSelectionByLatLng(lat, lng, { name: '현재 위치', address: '' });
          return;
        }

        // 더미 모드면 선택만 변경
        setSelectionDummy(lat, lng, { name: '현재 위치', address: '' });
      },
      () => {
        alert('현재 위치 권한을 허용해야 사용할 수 있습니다.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // 검색바(접힌 상태)에 보여줄 텍스트
  const collapsedText = useMemo(() => {
    if (selectedPlace?.name) return selectedPlace.name;
    return '지명/장소를 검색하세요';
  }, [selectedPlace]);

  // 더미 지도 클릭 시: 컨테이너 좌표를 위경도로 “그럴듯하게” 변환(대략)
  const handleDummyMapClick = (e) => {
    if (isKakaoReady) return; // 카카오 지도면 클릭 이벤트는 SDK가 처리

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; // 0..w
    const y = e.clientY - rect.top; // 0..h

    const w = rect.width || 1;
    const h = rect.height || 1;

    // 전북대 중심을 기준으로 +- 약간 흔들리는 범위(대략)
    const latRange = 0.008; // 위도 약 0.008도
    const lngRange = 0.01; // 경도 약 0.010도

    const lat = DEFAULT_CENTER.lat + (0.5 - y / h) * latRange;
    const lng = DEFAULT_CENTER.lng + (x / w - 0.5) * lngRange;

    setSelectionDummy(lat, lng, { name: '선택한 위치', address: '' });
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
          <p className="create-locate-subtitle">지도를 움직여 만날 위치를 대략 정해주세요</p>

          <section className="create-locate-map-section">
            <div className="create-locate-map-wrapper">
              {!isSearchActive && (
                <button
                  type="button"
                  className="create-locate-search-collapsed"
                  onClick={openSearch}
                >
                  <span className="create-locate-search-icon-large" />
                  <span className="create-locate-search-collapsed-text">{collapsedText}</span>
                </button>
              )}

              {isSearchActive && (
                <div className="create-locate-search-panel">
                  <form
                    className="create-locate-search-panel-header"
                    onSubmit={handleSearchSubmit}
                  >
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
                      placeholder="장소 검색"
                    />

                    <button
                      type="button"
                      className="create-locate-search-close-button"
                      onClick={closeSearch}
                      aria-label="닫기"
                    >
                      ✕
                    </button>
                  </form>

                  <div className="create-locate-search-panel-divider" />

                  <ul className="create-locate-search-results">
                    {results.map((item) => (
                      <li
                        key={item.id}
                        className="create-locate-search-result-item"
                        role="button"
                        tabIndex={0}
                        onClick={() => selectResult(item)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter') selectResult(item);
                        }}
                      >
                        <div className="create-locate-search-result-icon-wrap">
                          <span className="create-locate-search-result-pin" />
                          <span className="create-locate-search-result-distance">
                            {item.distance || ''}
                          </span>
                        </div>
                        <span className="create-locate-search-result-name">{item.name}</span>
                      </li>
                    ))}

                    {results.length === 0 && (
                      <li className="create-locate-search-result-item">
                        <span className="create-locate-search-result-name">검색 결과가 없습니다</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* 지도 영역: 카카오가 되면 실제 지도, 안되면 더미 지도 클릭으로 선택 */}
              <div
                ref={mapContainerRef}
                className="create-locate-map-placeholder"
                onClick={handleDummyMapClick}
                role={!isKakaoReady ? 'button' : undefined}
                tabIndex={!isKakaoReady ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!isKakaoReady && e.key === 'Enter') {
                    // Enter는 가운데 선택 처리
                    setSelectionDummy(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, {
                      name: '선택한 위치',
                      address: '',
                    });
                  }
                }}
              >
                {/* 카카오가 없을 때만 “가짜 핀/원”을 DOM으로 보여줌 */}
                {!isKakaoReady && (
                  <>
                    <div className="create-locate-map-circle" />
                    <div className="create-locate-map-pin" />
                    <div className="create-locate-dummy-hint">
                      지도 로딩 불가: 임시로 클릭 위치를 선택합니다
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                className="create-locate-current-location-button"
                onClick={moveToCurrentLocation}
                aria-label="현재 위치로 이동"
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
