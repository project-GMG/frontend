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

// ===== marker image (ff5315) =====
function createOrangePinDataUrl(colorHex = '#ff5315') {
  // 간단한 핀 SVG (fill=ff5315, stroke=white)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="44" viewBox="0 0 40 44">
      <path d="M20 43.5C20 43.5 35 29.3 35 16.5C35 7.9 28.3 1 20 1C11.7 1 5 7.9 5 16.5C5 29.3 20 43.5 20 43.5Z"
            fill="${colorHex}" stroke="#FFFFFF" stroke-width="2" />
      <circle cx="20" cy="16.5" r="6" fill="#FFFFFF"/>
    </svg>
  `.trim();

  // Kakao MarkerImage는 URL 필요 → data URL 사용
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');

  return `data:image/svg+xml;charset=UTF-8,${encoded}`;
}

// SDK 로더 (autoload=false면 maps.load() 필수)
const loadKakaoSdk = () => {
  const ensureMapsLoaded = (resolve, reject) => {
    if (!window.kakao || !window.kakao.maps) {
      reject(new Error('카카오 maps 객체가 없습니다.'));
      return;
    }
    window.kakao.maps.load(() => resolve());
  };

  return new Promise((resolve, reject) => {
    if (!KAKAO_APP_KEY) {
      reject(new Error('VITE_KAKAO_MAP_APP_KEY가 설정되어 있지 않습니다.'));
      return;
    }

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

export default function CreateLocatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prev = location.state || {};

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const infowindowRef = useRef(null);
  const placesRef = useRef(null);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedPlace, setSelectedPlace] = useState(DEFAULT_PLACE);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [results, setResults] = useState([]);

  const [isKakaoReady, setIsKakaoReady] = useState(false);
  const [kakaoError, setKakaoError] = useState('');

  const hasSelection = useMemo(() => !!selectedPlace, [selectedPlace]);

  const handleBack = () => window.history.back();

  const handleNext = () => {
    if (!selectedPlace) return;

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

  const openSearch = () => {
    if (!isKakaoReady) return;
    setIsSearchActive(true);
  };

  const closeSearch = () => {
    setIsSearchActive(false);
    setSearchQuery('');
    setResults([]);
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

  // 지도 초기화 (더미 제거: 카카오만)
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setKakaoError('');
        await loadKakaoSdk();
        if (!isMounted) return;

        const { kakao } = window;

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

        // === 커스텀 마커 이미지(#ff5315) 적용 ===
        const markerImageUrl = createOrangePinDataUrl('#ff5315');
        const markerImageSize = new kakao.maps.Size(40, 44);
        const markerImageOption = { offset: new kakao.maps.Point(20, 44) }; // 하단 끝이 좌표에 오도록
        const markerImage = new kakao.maps.MarkerImage(
          markerImageUrl,
          markerImageSize,
          markerImageOption,
        );

        const marker = new kakao.maps.Marker({
          position: map.getCenter(),
          image: markerImage,
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

        // 초기 선택(전북대)
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
        if (!isMounted) return;

        setIsKakaoReady(false);
        setKakaoError(
          e?.message || '카카오 지도를 불러오지 못했습니다. 키/도메인 설정을 확인하세요.',
        );
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!isKakaoReady || !window.kakao?.maps || !placesRef.current) return;

    const keyword = searchQuery.trim();
    if (!keyword) return;

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
  };

  const selectResult = (item) => {
    if (!isKakaoReady || !window.kakao?.maps || !mapRef.current) return;

    const { kakao } = window;
    const map = mapRef.current;

    const moveLatLng = new kakao.maps.LatLng(item.lat, item.lng);
    map.panTo(moveLatLng);

    setSelectionByLatLng(item.lat, item.lng, {
      name: item.name,
      address: item.address,
    });

    setIsSearchActive(false);
  };

  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isKakaoReady || !window.kakao?.maps || !mapRef.current) return;

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const { kakao } = window;
        const map = mapRef.current;

        const ll = new kakao.maps.LatLng(lat, lng);
        map.panTo(ll);

        setSelectionByLatLng(lat, lng, { name: '현재 위치', address: '' });
      },
      () => {
        alert('현재 위치 권한을 허용해야 사용할 수 있습니다.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // 검색바(접힌 상태)에 보여줄 텍스트
  const collapsedText = useMemo(() => {
    if (!isKakaoReady) return '지도를 불러오는 중...';
    if (selectedPlace?.name) return selectedPlace.name;
    return '지명/장소를 검색하세요';
  }, [selectedPlace, isKakaoReady]);

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
                  disabled={!isKakaoReady}
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
                      disabled={!isKakaoReady}
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

              {/* 카카오 지도 컨테이너(더미 UI 삭제) */}
              <div ref={mapContainerRef} className="create-locate-map-placeholder" />

              {/* SDK 로드 실패 안내(더미 대신 에러 안내만) */}
              {!!kakaoError && (
                <div className="create-locate-map-error">
                  {kakaoError}
                </div>
              )}

              <button
                type="button"
                className="create-locate-current-location-button"
                onClick={moveToCurrentLocation}
                aria-label="현재 위치로 이동"
                disabled={!isKakaoReady}
              >
                <span className="create-locate-current-location-icon" />
              </button>
            </div>
          </section>
        </main>

        <footer className="create-locate-footer">
          <NextButton disabled={!hasSelection || !isKakaoReady} onClick={handleNext}>
            다음
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
