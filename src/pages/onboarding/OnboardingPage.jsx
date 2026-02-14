// gmg-front/src/pages/onboarding/OnboardingPage.jsx

//섹션 4,5 제작중

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingPage.css';

import StudyVideo from '../../assets/icons/category_icon/study.mp4';
import MeetVideo from '../../assets/icons/category_icon/meet.mp4';
import DrinkVideo from '../../assets/icons/category_icon/drink.mp4';
import FoodVideo from '../../assets/icons/category_icon/food.mp4';

import OnboardingLogo from '../../assets/icons/category_icon/onboarding-logo.png';
import Onboarding2 from '../../assets/icons/category_icon/onboarding2.png';
import Onboarding22Icon from '../../assets/icons/category_icon/onboarding2-2.png';

import CalenderIcon from '../../assets/icons/category_icon/onboarding-calender.png';
import HandImg from '../../assets/icons/category_icon/onboarding-hand.png';
import Hand2Img from '../../assets/icons/category_icon/onboarding-hand2.png';
import TimetableImg from '../../assets/icons/category_icon/onboarding-timetable.png';
import LocationIcon from '../../assets/icons/category_icon/onbording-location.png';
import FoodImg from '../../assets/icons/category_icon/onboarding-food.png';
import ChoiceIcon from '../../assets/icons/category_icon/onboarding-choice-icon.png';
import ChoiceImg from '../../assets/icons/category_icon/onboarding-choice.png';

const HERO_VIDEOS = [StudyVideo, MeetVideo, DrinkVideo, FoodVideo];

export default function OnboardingPage() {
  const navigate = useNavigate();

  const [heroVideoSrc] = useState(() => {
    const idx = Math.floor(Math.random() * HERO_VIDEOS.length);
    return HERO_VIDEOS[idx];
  });

  const goCreatePlace = () => {
    navigate('/create/place');
  };

  const infoRef = useRef(null);
  const [infoInView, setInfoInView] = useState(false);

  const section4Ref = useRef(null);
  const [section4InView, setSection4InView] = useState(false);

  const section5Ref = useRef(null);
  const [section5InView, setSection5InView] = useState(false);

  const section6Ref = useRef(null);
  const [section6InView, setSection6InView] = useState(false);

  useEffect(() => {
    const el = infoRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInfoInView(true);
        else setInfoInView(false);
      },
      { threshold: 0.35 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = section4Ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSection4InView(true);
        else setSection4InView(false);
      },
      { threshold: 0.35 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = section5Ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSection5InView(true);
        else setSection5InView(false);
      },
      { threshold: 0.35 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = section6Ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSection6InView(true);
        else setSection6InView(false);
      },
      { threshold: 0.35 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="ob-page">
      <div className="ob-container">
        {/* 1) Hero (Video) */}
        <section className="ob-section ob-hero">
          <video
            className="ob-hero-video"
            src={heroVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />

          <div className="ob-hero-overlay">
            <p className="ob-hero-subtitle">
              비선호 기반으로
              <br />
              쉽게 약속잡자
            </p>

            <div className="ob-hero-line" />

            <img
              className="ob-hero-logo"
              src={OnboardingLogo}
              alt="GMG Onboarding Logo"
              draggable={false}
            />

            <h1 className="ob-hero-title">
              <span className="ob-hero-title-light">이제는</span>{' '}
              <span className="ob-hero-title-bold">가면가</span>
            </h1>

            <button type="button" className="ob-hero-cta" onClick={goCreatePlace}>
              회원가입 없이 바로 시작
            </button>
          </div>
        </section>

        {/* 2) Orange image + Black box */}
        <section className="ob-section ob-image-block">
          <img className="ob-image" src={Onboarding2} alt="온보딩 이미지 2" draggable={false} />

          <div className="ob-black-box">
            <div className="ob-black-inner">
              <div className="ob-black-cta">
                <img
                  src={Onboarding22Icon}
                  alt=""
                  className="ob-black-cta-icon"
                  draggable={false}
                />
                <span>이제 간편하게 정해요</span>
              </div>

              <p className="ob-black-desc">
                모두의 불가능한 시간과 비선호 장소를 모아
                <br />
                최적의 시간과 장소를 추천해 드릴게요
              </p>
            </div>
          </div>
        </section>

        {/* 3) F6F6F6 Section */}
        <section ref={infoRef} className="ob-section ob-info">
          <div className="ob-info-inner">
            <img
              className="ob-calender-icon"
              src={CalenderIcon}
              alt="캘린더 아이콘"
              draggable={false}
            />

            <h2 className="ob-info-title">계속 물어보지 않아도 돼요</h2>

            <p className="ob-info-desc">
              참여자 모두의 불가능한 시간을 모아
              <br />
              겹치지 않는 시간대를 바로 확인할 수 있어요.
            </p>

            <div className="ob-bubble-stage" aria-label="말풍선 애니메이션">
              <div className={`ob-bubble-anim ${infoInView ? 'is-inview' : ''}`}>
                <div className="ob-bubble">다들 2시 괜찮아?</div>
                <img className="ob-hand" src={HandImg} alt="손" draggable={false} />
              </div>
            </div>

            <img className="ob-timetable" src={TimetableImg} alt="시간표 예시" draggable={false} />
          </div>
        </section>

        {/* 4) Section 4 - Left side animation */}
        <section ref={section4Ref} className="ob-section ob-info">
          <div className="ob-info-inner">
            <img className="ob-food-icon" src={LocationIcon} alt="위치 아이콘" draggable={false} />

            <h2 className="ob-info-title">참여자들의 비선호를 고려해요</h2>

            <p className="ob-info-desc">
              한식·카페·술집 등 카테고리별로
              <br />
              선호하지 않는 장소를 선택하면 추천에서 제외돼요.
            </p>

            <div className="ob-bubble-stage is-left" aria-label="말풍선 애니메이션">
              <div className={`ob-bubble-anim is-left ${section4InView ? 'is-inview' : ''}`}>
                <img className="ob-hand" src={HandImg} alt="손" draggable={false} />
                <div className="ob-bubble">나 어제 치킨 먹어서 안땡겨</div>
              </div>
            </div>

            <img className="ob-timetable" src={FoodImg} alt="음식 선택 예시" draggable={false} />
          </div>
        </section>

        {/* 5) Section 5 - Right side animation with choice */}
        <section ref={section5Ref} className="ob-section ob-info">
          <div className="ob-info-inner">
            <img className="ob-choice-icon" src={ChoiceIcon} alt="선택 아이콘" draggable={false} />

            <h2 className="ob-info-title">어디갈지 골라드릴게요</h2>

            <p className="ob-info-desc">
              선택장애는 이제 그만, 입력정보를 바탕으로
              <br />
              만나기 좋은 장소를 자동으로 선별해드려요.
            </p>

            <div className="ob-bubble-stage" aria-label="말풍선 애니메이션">
              <div className={`ob-bubble-anim ${section5InView ? 'is-inview' : ''}`}>
                <div className="ob-bubble">그럼 어디로 갈까?</div>
                <img className="ob-hand" src={HandImg} alt="손" draggable={false} />
              </div>
            </div>

            <img className="ob-timetable" src={ChoiceImg} alt="장소 추천 예시" draggable={false} />
          </div>
        </section>

        {/* 6) Section 6 - Final closing section */}
        <section ref={section6Ref} className="ob-section ob-final">
          <div className="ob-final-inner">
            <h2 className="ob-final-title">
              쉽고 간편하게
              <br />
              모임 약속을 잡아보세요!
            </h2>

            <div className={`ob-final-hand-container ${section6InView ? 'is-inview' : ''}`}>
              <img className="ob-final-hand" src={Hand2Img} alt="손가락" draggable={false} />
            </div>

            <button type="button" className="ob-final-cta" onClick={goCreatePlace}>
              시작하기
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
