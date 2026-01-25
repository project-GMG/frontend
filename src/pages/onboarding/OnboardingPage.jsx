// gmg-front/src/pages/onboarding/OnboardingPage.jsx

//만드는중!!!


import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingPage.css';

import StudyVideo from '../../assets/icons/category_icon/study.mp4';
import MeetVideo from '../../assets/icons/category_icon/meet.mp4';
import DrinkVideo from '../../assets/icons/category_icon/drink.mp4';
import FoodVideo from '../../assets/icons/category_icon/food.mp4';
import CafeVideo from '../../assets/icons/category_icon/cafe.mov';

import OnboardingLogo from '../../assets/icons/category_icon/onboarding-logo.png';
import Onboarding2 from '../../assets/icons/category_icon/onboarding2.png';

import CalenderIcon from '../../assets/icons/category_icon/onboarding-calender.png';
import HandImg from '../../assets/icons/category_icon/onboarding-hand.png';
import TimetableImg from '../../assets/icons/category_icon/onboarding-timetable.png';

const HERO_VIDEOS = [StudyVideo, MeetVideo, DrinkVideo, FoodVideo, CafeVideo];

export default function OnboardingPage() {
  const navigate = useNavigate();

  const heroVideoSrc = useMemo(() => {
    const idx = Math.floor(Math.random() * HERO_VIDEOS.length);
    return HERO_VIDEOS[idx];
  }, []);

  const goCreatePlace = () => {
    navigate('/create/place');
  };

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
          <div className="ob-black-box" />
        </section>

        {/* 3) F6F6F6 Section */}
        <section className="ob-section ob-info">
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
              <div className="ob-bubble-anim">
                <div className="ob-bubble">다들 2시 괜찮아</div>
                <img className="ob-hand" src={HandImg} alt="손" draggable={false} />
              </div>
            </div>

            <img
              className="ob-timetable"
              src={TimetableImg}
              alt="시간표 예시"
              draggable={false}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
